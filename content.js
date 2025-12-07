console.log("InstaManager Loaded");

// Wait for the entire DOM to be parsed and loaded before initializing listeners and variables.
document.addEventListener('DOMContentLoaded', () => {

    // --- FEED BLOCKER ---
    const styleID = "insta-manager-styles";
    let styleTag = document.getElementById(styleID);
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleID;
      document.head.appendChild(styleTag);
    }

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

    chrome.storage.local.get(['blockReels', 'blockExplore'], (res) => {
      applyStyles(res.blockReels, res.blockExplore);
    });

    // --- MESSAGE LISTENER ---
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      let handled = false;
        
      if (msg.action === "updateFeed") {
        applyStyles(msg.settings.blockReels, msg.settings.blockExplore);
        sendResponse({ status: "styles applied" });
        handled = true;
      }
        
      if (msg.action === "startScan") {
        runScanner();
        // Return true to indicate the response (scanComplete) will be sent asynchronously.
        handled = true;
      }
        
      return handled;
    });

    function applyStyles(blockReels, blockExplore) {
      let css = "";
      if (blockReels) css += CSS_BLOCK_REELS;
      if (blockExplore) css += CSS_BLOCK_EXPLORE;
      styleTag.innerHTML = css;
    }

    // --- SCANNER LOGIC ---

    function waitForElement(selector, timeout = 5000) {
        return new Promise((resolve, reject) => {
            const check = () => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                } else if (timeout <= 0) {
                    reject(new Error(`Timeout: Element ${selector} not found.`));
                } else {
                    timeout -= 100;
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    async function runScanner() {
      try {
        chrome.runtime.sendMessage({action: "statusUpdate", status: "Finding profile links..."});
        
        const links = Array.from(document.querySelectorAll('a'));
        const followingLink = links.find(a => a.innerText.toLowerCase().includes("following"));
        const followersLink = links.find(a => a.innerText.toLowerCase().includes("followers"));

        if (!followingLink || !followersLink) {
          chrome.runtime.sendMessage({action: "statusUpdate", status: "Error: Go to your profile page first!"});
          return;
        }

        async function scrapeList(linkElement, listName) {
            chrome.runtime.sendMessage({action: "statusUpdate", status: `Opening ${listName}...`});
            linkElement.click();
            
            const modalRole = await waitForElement('div[role="dialog"]');
            
            const scrollableDiv = modalRole.querySelector('div[style*="overflow-y:"]') || modalRole.querySelector('div[style*="overflow: hidden auto"]') || modalRole.firstChild.querySelector('div');
            
            if(!scrollableDiv) throw new Error("Scroll area not found. Instagram structure likely changed.");

            chrome.runtime.sendMessage({action: "statusUpdate", status: `Scrolling and scraping ${listName}...`});
            
            let previousHeight = 0;
            let sameHeightCount = 0;
            
            while(sameHeightCount < 5) {
                scrollableDiv.scrollTop = scrollableDiv.scrollHeight;
                await new Promise(r => setTimeout(r, 2000));
                
                let currentHeight = scrollableDiv.scrollHeight;
                if (currentHeight === previousHeight) {
                    sameHeightCount++;
                } else {
                    sameHeightCount = 0;
                }
                previousHeight = currentHeight;
            }

            // CRITICAL FIX: Enhanced selector to find user list items reliably
            const items = Array.from(modalRole.querySelectorAll('div[role="listitem"], li, a[role="link"][tabindex="0"]').flatMap(el => {
                // If it's the anchor itself, return its parent, otherwise return the element.
                return el.tagName === 'A' ? el.closest('div[style], li, div[role="listitem"]') : el;
            })).filter((v, i, a) => a.indexOf(v) === i && v !== null); 
            
            if (items.length === 0) {
                chrome.runtime.sendMessage({action: "statusUpdate", status: `${listName} list is empty or selector failed.`});
            }
            
            const users = items.map(item => {
                const anchor = item.querySelector('a[role="link"]');
                const username = anchor ? anchor.getAttribute('href').replace(/\//g, '') : "unknown";
                
                const isVerified = !!item.querySelector('svg[aria-label="Verified"]');
                
                return { username, isVerified };
            });

            // --- CLOSE MODAL (The critical fix for channel closing) ---
            chrome.runtime.sendMessage({action: "statusUpdate", status: `Closing ${listName} modal...`});
            
            const closeBtn = modalRole.querySelector('svg[aria-label="Close"]')?.closest('div[role="button"]') ||
                             modalRole.querySelector('svg[aria-label="Close"]')?.parentElement?.parentElement?.closest('div[role="button"]');

            if(closeBtn) {
                closeBtn.click();
            } else {
                console.error("Attempting fallback close...");
                // 💡 CRITICAL FIX: Use the body's last child as a more reliable backdrop target
                const backdrop = document.body.lastElementChild; 
                
                if (backdrop && backdrop.getAttribute('role') !== 'dialog' && backdrop.tagName === 'DIV') {
                    backdrop.click();
                } else {
                    // Fallback 2: Send ESC keypress event
                    document.dispatchEvent(new KeyboardEvent('keydown', {'key': 'Escape'}));
                }
            }
            
            await new Promise(r => setTimeout(r, 1500));
            
            return users.filter(u => u.username !== 'unknown' && u.username !== '');
        }

        const following = await scrapeList(followingLink, "Following");
        
        const followers = await scrapeList(followersLink, "Followers");

        const followerUsernames = new Set(followers.map(u => u.username));
        
        let unfollowers = following.filter(u => !followerUsernames.has(u.username));

        unfollowers = unfollowers.map(u => ({...u, isPrivate: false})); 

        chrome.runtime.sendMessage({
          action: "scanComplete",
          data: unfollowers
        });

      } catch (err) {
        console.error("Scanner error:", err);
        chrome.runtime.sendMessage({action: "statusUpdate", status: "Fatal Error: " + err.message});
      }
    }
});
