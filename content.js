console.log("InstaManager Loaded");

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
    chrome.runtime.sendMessage({action: "statusUpdate
