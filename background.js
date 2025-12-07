// Background service worker for Instagram Unfollower Checker

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Instagram Unfollower Checker installed');
  
  // Initialize default settings (using local storage for toggles)
  chrome.storage.local.get(['blockReels', 'blockExplore'], (result) => {
    if (result.blockReels === undefined) {
      chrome.storage.local.set({ blockReels: false });
    }
    if (result.blockExplore === undefined) {
      chrome.storage.local.set({ blockExplore: false });
    }
  });
});

// Listen for general messages (Critical for fixing "Receiving end does not exist" error)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'log') {
    console.log(request.message);
  }
  
  // Returning true indicates that the response may be sent asynchronously.
  return true;
});
