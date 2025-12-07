console.log("InstaManager Loaded");

// --- FEED BLOCKER ---
// We inject a style tag to handle hiding elements. This is more robust than deleting nodes.
const styleID = "insta-manager-styles";
let styleTag = document.getElementById(styleID);
if (!styleTag) {
  styleTag = document.createElement('style');
  styleTag.id = styleID;
  document.head.appendChild(styleTag);
}

// Selectors for blocking
// Note: Selectors like a[href="/reels/"] are safer than random classes.
const CSS_BLOCK_REELS = `
  a[href^="/reels/"], 
  a[href*="/reels/"], 
  div[role="button"][aria-label="Reels"] { 
    display: none !important; 
  }
`;

const CSS_BLOCK_EXPLORE = `
  a[href^="/explore/"], 
  a[href*="/explore/"],
  div[role="button"][aria-label="Explore"] { 
    display: none !important; 
  }
`;

// Apply settings from storage immediately on load
chrome.storage.local.get(['blockReels', 'blockExplore'], (res) => {
  applyStyles(res.blockReels, res.blockExplore);
});

// Update styles when popup toggles
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "updateFeed") {
    applyStyles(msg.settings.blockReels, msg.settings.blockExplore);
  }
  if (msg.action === "startScan") {
    runScanner();
    sendResponse({status: "started"});
  }
});

function applyStyles(blockReels, blockExplore) {
  let css = "";
  if (blockReels) css += CSS_BLOCK_REELS;
  if (blockExplore) css += CSS_BLOCK_EXPLORE;
  styleTag.innerHTML = css;
}

// --- SCANNER LOGIC ---

async function runScanner() {
  try {
    // Check if we are on a profile page
    // (Simplification: We assume user is on their OWN profile page for this to work perfectly)
    // We need to click "Following" and "Followers" links.
    
    // 1. Find the "Following" link anchor
    const links = Array.from(document.querySelectorAll('a'));
    const followingLink = links.find(a => a.innerText.includes("following"));
    const followersLink = links.find(a => a.innerText.includes("followers"));

    if (!followingLink || !followersLink) {
      chrome.runtime.sendMessage({action: "statusUpdate", status: "Go to your profile page first!"});
      return;
    }

    // Helper: Scrape a list
    async function scrapeList(linkElement, listName) {
        chrome.runtime.sendMessage({action: "statusUpdate", status: `Opening ${listName}...`});
        linkElement.click();
        
        // Wait for modal
        await new Promise(r => setTimeout(r, 2000));
        
        const modalRole = document.querySelector('div[role="dialog"]');
        if(!modalRole) throw new Error("Modal not found");
        
        // The list container is usually a specific scrollable div inside the dialog
        // We look for a div with overflow-y: auto or similar.
        // For Insta 2024, it's often the direct child of the dialog or close to it.
        const scrollableDiv = modalRole.querySelector('div[style*="overflow-y: auto"]') || modalRole.querySelector('div[style*="overflow: hidden auto"]');
        
        if(!scrollableDiv) throw new Error("Scroll area not found");

        chrome.runtime.sendMessage({action: "statusUpdate", status: `Scanning ${listName}...`});
        
        // Scroll logic
        let previousHeight = 0;
        let sameHeightCount = 0;
        
        while(sameHeightCount < 3) { // Stop if height doesn't change for 3 tries
            scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
            await new Promise(r => setTimeout(r, 1500)); // Wait for load
            
            let currentHeight = scrollableDiv.scrollHeight;
            if (currentHeight === previousHeight) {
                sameHeightCount++;
            } else {
                sameHeightCount = 0;
            }
            previousHeight = currentHeight;
        }

        // Extract Data
        const items = Array.from(modalRole.querySelectorAll('div[role="listitem"]')); // Often listitem, or just div structures
        // Fallback if listitem role isn't used: search for spans with font-weight bold
        
        const users = items.map(item => {
            const anchor = item.querySelector('a'); // Profile link
            const username = anchor ? anchor.getAttribute('href').replace(/\//g, '') : "unknown";
            
            // Check Verified (SVG usually)
            const isVerified = !!item.querySelector('svg[aria-label="Verified"]');
            
            // Check Private is harder inside the list, usually not visible until you visit profile.
            // HOWEVER, we can flag it if we can see a specific icon, but usually we can't.
            // For the sake of this tool, we might need to visit profiles later, 
            // but to keep it simple/safe, we will mark 'isPrivate' as false here 
            // OR check if there is a "Requested" button instead of "Following" (if looking at others).
            
            return { username, isVerified };
        });

        // Close Modal
        const closeBtn = document.querySelector('svg[aria-label="Close"]')?.parentElement;
        if(closeBtn) closeBtn.click();
        
        return users;
    }

    // 2. Scrape Following
    const following = await scrapeList(followingLink, "Following");
    
    // 3. Scrape Followers
    const followers = await scrapeList(followersLink, "Followers");

    // 4. Compare
    // Unfollowers = Users in "Following" who are NOT in "Followers"
    const followerUsernames = new Set(followers.map(u => u.username));
    
    let unfollowers = following.filter(u => !followerUsernames.has(u.username));

    // 5. Enrichment (Check Private status)
    // Note: To accurately check if they are private, we usually need to fetch their profile data.
    // Doing this for 100s of users will hit rate limits. 
    // Optimization: We will mark them as "Unknown" or skip this in the MVP to prevent bans.
    // OR: We only check the top 10 for demonstration.
    // For this code, I will set isPrivate to false by default to ensure safety.
    
    unfollowers = unfollowers.map(u => ({...u, isPrivate: false})); // Placeholder for safety

    chrome.runtime.sendMessage({
      action: "scanComplete",
      data: unfollowers
    });

  } catch (err) {
    console.error(err);
    chrome.runtime.sendMessage({action: "statusUpdate", status: "Error: " + err.message});
  }
}
