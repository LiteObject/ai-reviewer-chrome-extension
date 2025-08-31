// Background script to handle side panel setup
chrome.runtime.onInstalled.addListener(() => {
    console.log('Extension installed, side panel available');

    // Set the side panel to open on action click
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
        .catch((error) => console.error('Error setting panel behavior:', error));
});

// Handle action click to open side panel
chrome.action.onClicked.addListener(async (tab) => {
    try {
        await chrome.sidePanel.open({ windowId: tab.windowId });
        console.log('Side panel opened from action click');
    } catch (error) {
        console.error('Error opening side panel from action click:', error);
    }
});

// Listen for messages from popup to open side panel (backup method)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSidePanel') {
        chrome.sidePanel.open({ windowId: message.windowId })
            .then(() => {
                sendResponse({ success: true });
            })
            .catch((error) => {
                console.error('Error opening side panel:', error);
                sendResponse({ success: false, error: error.message });
            });
        return true; // Keep message channel open for async response
    }
});
