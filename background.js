// Background service worker for the custom emojis extension

// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('Custom Emojis extension installed');

  // Initialize with empty array if no emojis exist
  chrome.storage.sync.get(['customEmojis'], (result) => {
    if (!result.customEmojis) {
      chrome.storage.sync.set({ customEmojis: [] }, () => {
        console.log('Initialized custom emojis storage');
      });
    }
  });
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getEmojis') {
    chrome.storage.sync.get(['customEmojis'], (result) => {
      sendResponse({ emojis: result.customEmojis || [] });
    });
    return true; // Keep the message channel open for async response
  }

  if (request.action === 'addEmoji') {
    chrome.storage.sync.get(['customEmojis'], (result) => {
      const emojis = result.customEmojis || [];
      emojis.push(request.emoji);

      chrome.storage.sync.set({ customEmojis: emojis }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }

  if (request.action === 'deleteEmoji') {
    chrome.storage.sync.get(['customEmojis'], (result) => {
      const emojis = result.customEmojis || [];
      const filtered = emojis.filter(e => e.id !== request.id);

      chrome.storage.sync.set({ customEmojis: filtered }, () => {
        sendResponse({ success: true });
      });
    });
    return true;
  }
});

// Monitor storage changes and log them
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (changes.customEmojis) {
    console.log('Custom emojis updated:', changes.customEmojis.newValue);
  }
});
