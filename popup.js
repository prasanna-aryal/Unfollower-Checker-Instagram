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


    // --- Scanner Logic ---
    if (scanBtn) { 
        scanBtn.addEventListener('click', () => {
            chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
                const tab = tabs[0];
                if (!tab.url.includes("instagram.com")) {
                    statusMsg.textContent = "Error: Please go to Instagram.com";
                    return;
                }

                statusMsg.textContent = "Checking connection...";
                scanBtn.disabled = true;

                // 1. Execute script to ensure content script context is alive
                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => { 
                        console.log("Content script environment confirmed.");
                    }
                }, () => {
                    // 2. Add a short delay to let the messaging channel stabilize (Fixes intermittent connection error)
                    setTimeout(() => {
                        // 3. Send the main scanning message
                        statusMsg.textContent = "Scanning... (Do not close popup)";
                        chrome.tabs.sendMessage(tab.id, { action: "startScan" }, (response) => {
                            if (chrome.runtime.lastError) {
                                console.error("Messaging failed:", chrome.runtime.lastError.message);
                                statusMsg.textContent = "Connection error. Refresh the Instagram page and try again.";
                                scanBtn.disabled = false;
                            }
                        });
                    }, 500);
                });
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
