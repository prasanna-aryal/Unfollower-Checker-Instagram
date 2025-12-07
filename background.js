// Background service worker for Instagram Unfollower Checker

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Unfollower Checker installed');
  
  // Initialize default settings
  chrome.storage.sync.get(['blockReels', 'blockExplore'], (result) => {
    if (result.blockReels === undefined) {
      chrome.storage.sync.set({ blockReels: false });
    }
    if (result.blockExplore === undefined) {
      chrome.storage.sync.set({ blockExplore: false });
    }
  });
});

// Listen for messages from content script or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // Handle any background tasks if needed
  if (request.action === 'log') {
    console.log(request.message);
  }
  
  return true;
});
