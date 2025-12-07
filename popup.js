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

                chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    func: () => { 
                        console.log("Content script environment confirmed.");
                    }
                }, () => {
                    // After confirmation, send the main scanning message
                    statusMsg.textContent = "Scanning... (Do not close popup)";
                    chrome.tabs.sendMessage(tab.id, { action: "startScan" }, (response) => {
                        if (chrome.runtime.lastError) {
                            // This catches the error if the user closes the tab immediately
                            console.error("Messaging failed:", chrome.runtime.lastError.message);
                            statusMsg.textContent = "Connection error. Refresh the Instagram page and try again.";
                            scanBtn.disabled = false;
                        }
                    });
                });
            });
        });
    }
