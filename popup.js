document.addEventListener('DOMContentLoaded', () => {
    // --- Element Declarations ---
    const scanBtn = document.getElementById('scanBtn');
    const resultsList = document.getElementById('resultsList');
    const statusMsg = document.getElementById('statusMsg');
    const filterSection = document.getElementById('filterSection');
    const filterPrivate = document.getElementById('filterPrivate');
    
    // Toggle Elements
    const blockReels = document.getElementById('blockReels');
    const blockExplore = document.getElementById('blockExplore');

    let allUnfollowers = [];

    // --- Load Saved Settings ---
    chrome.storage.local.get(['blockReels', 'blockExplore'], (result) => {
        if (blockReels) blockReels.checked = result.blockReels || false;
        if (blockExplore) blockExplore.checked = result.blockExplore || false;
    });

    // --- Feed Block Logic ---
    const updateFeedSettings = () => {
        const settings = {
            blockReels: blockReels ? blockReels.checked : false,
            blockExplore: blockExplore ? blockExplore.checked : false
        };
        chrome.storage.local.set(settings);
        
        chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
            if(tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                    action: "updateFeed", 
                    settings: settings
                });
            }
        });
    };

    if (blockReels) blockReels.addEventListener('change', updateFeedSettings);
    if (blockExplore) blockExplore.addEventListener('change', updateFeedSettings);


    // --- Scanner Logic (with Recursive Connection Fix) ---
    if (scanBtn) { 
        const MAX_RETRIES = 5;
        let retryCount = 0;

        // Function to handle recursive connection attempts
        const establishConnectionAndScan = (tabId) => {
            statusMsg.textContent = `Checking connection... Attempt ${retryCount + 1}/${MAX_RETRIES}`;
            
            chrome.scripting.executeScript({
                target: { tabId: tabId },
                func: () => { 
                    // This function runs inside the content script's context
                    return true; 
                }
            }, (results) => {
                if (chrome.runtime.lastError || !results || results.length === 0) {
                    // Connection failed or script execution failed
                    if (retryCount < MAX_RETRIES) {
                        retryCount++;
                        // Wait longer before retrying (1.5s, 3s, 4.5s, etc.)
                        setTimeout(() => establishConnectionAndScan(tabId), 1500 * retryCount);
                    } else {
                        // Max retries reached, fail gracefully
                        console.error("Messaging failed after maximum retries:", chrome.runtime.lastError ? chrome.runtime.lastError.message : "No result returned.");
                        statusMsg.textContent = "Fatal Connection Error. Please refresh Instagram and reopen the popup.";
                        scanBtn.disabled = false;
                    }
                } else {
                    // Connection successful! Proceed with the scan message.
                    statusMsg.textContent = "Connection established. Scanning... (Do not close popup)";
                    
                    // Add a final, small delay before sending the message for absolute stability
                    setTimeout(() => {
                        chrome.tabs.sendMessage(tabId, { action: "startScan" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Scan message failed:", chrome.runtime.lastError.message);
                                statusMsg.textContent = "Scan error after connect. Try again.";
                                scanBtn.disabled = false;
                            }
                        });
                    }, 500);
                }
            });
        };

        scanBtn.addEventListener('click', () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const tab = tabs[0];
                if (!tab.url.includes("instagram.com")) {
                    statusMsg.textContent = "Error: Please go to Instagram.com";
                    return;
                }

                scanBtn.disabled = true;
                retryCount = 0; 
                establishConnectionAndScan(tab.id); // Start the recursive process
            });
        });
    }


    // Listen for data back from content script
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === "scanComplete") {
            allUnfollowers = message.data;
            renderList(allUnfollowers);
            if (filterSection) filterSection.style.display = 'flex';
            if (statusMsg) statusMsg.textContent = `Found ${allUnfollowers.length} unfollowers.`;
            if (scanBtn) scanBtn.disabled = false;
        } else if (message.action === "statusUpdate") {
            if (statusMsg) statusMsg.textContent = message.status;
        }
    });

    // --- Filtering Logic ---
    if (filterPrivate) { 
        filterPrivate.addEventListener('change', () => {
            if (filterPrivate.checked) {
                const privateOnly = allUnfollowers.filter(u => u.isPrivate);
                renderList(privateOnly);
            } else {
                renderList(allUnfollowers);
            }
        });
    }

    function renderList(users) {
        if (!resultsList) return; 
        
        resultsList.innerHTML = '';
        if (users.length === 0) {
            resultsList.innerHTML = '<div class="placeholder">No users found.</div>';
            return;
        }

        users.forEach(user => {
            const isPrivateHTML = user.isPrivate ? '<span class="badge private">Private</span>' : '';
            const isVerifiedHTML = user.isVerified ? '<span class="badge verified">Verified</span>' : '';
            
            const item = document.createElement('div');
            item.className = 'user-item';
            item.innerHTML = `
                <div class="user-info">
                <span class="username">@${user.username}</span>
                <div class="badges">${isPrivateHTML}${isVerifiedHTML}</div>
                </div>
                <a href="https://instagram.com/${user.username}" target="_blank" style="text-decoration:none; color:#0095f6; font-size:12px;">View</a>
            `;
            resultsList.appendChild(item);
        });
    }
});
