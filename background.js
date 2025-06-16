// Background script for Custom Browser History extension

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('Custom Browser History extension installed');
});

// Listen for keyboard command (Ctrl+H)
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-history') {
    openCustomHistory();
  }
});

// Listen for browser history events
chrome.history.onVisited.addListener((historyItem) => {
  storeHistoryItem(historyItem);
});

// Open custom history page
function openCustomHistory() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('history/index.html')
  });
}

// Store history item in IndexedDB
async function storeHistoryItem(historyItem) {
  try {
    // Send message to content script to store in IndexedDB
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'storeHistory',
        data: {
          id: historyItem.id,
          url: historyItem.url,
          title: historyItem.title,
          visitTime: historyItem.lastVisitTime,
          visitCount: historyItem.visitCount,
          timestamp: Date.now()
        }
      }).catch(() => {
        // Silently handle cases where content script isn't loaded
      });
    }
  } catch (error) {
    console.error('Error storing history item:', error);
  }
}

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openHistory') {
    openCustomHistory();
    sendResponse({success: true});
  }
  return true;
});

// Cleanup old history entries (keep last 30 days by default)
function cleanupOldHistory() {
  const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
  
  chrome.tabs.query({}, (tabs) => {
    if (tabs.length > 0) {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: 'cleanupHistory',
        cutoffTime: thirtyDaysAgo
      }).catch(() => {
        // Silently handle cases where content script isn't loaded
      });
    }
  });
}

// Run cleanup daily
chrome.alarms.create('cleanupHistory', {
  delayInMinutes: 1440, // 24 hours
  periodInMinutes: 1440
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'cleanupHistory') {
    cleanupOldHistory();
  }
});