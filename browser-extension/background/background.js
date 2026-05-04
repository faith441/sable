// Sable Closet Companion - Background Service Worker

// Listen for product detection messages
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PRODUCT_DETECTED') {
    console.log('Product detected:', message.product);

    // Update badge to show product is detected
    chrome.action.setBadgeText({
      text: '1',
      tabId: sender.tab.id
    });

    chrome.action.setBadgeBackgroundColor({
      color: '#FF6B35',
      tabId: sender.tab.id
    });

    // Store product info
    chrome.storage.local.set({ currentProduct: message.product });
  }

  return true;
});

// Clear badge when tab is updated
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Clear badge when page loads
    chrome.action.setBadgeText({ text: '', tabId: tabId });
  }
});

// Handle installation
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Open welcome page
    chrome.tabs.create({ url: 'https://getsable.ai/welcome' });
  }
});
