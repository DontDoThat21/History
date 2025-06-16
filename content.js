// Content script for Custom Browser History extension

// Import database utilities
import('./database/db.js').then(module => {
  window.HistoryDB = module.HistoryDB;
}).catch(() => {
  // Handle import error - create a basic database interface
  console.warn('Database module not loaded, using fallback');
});

// Initialize database connection
let db = null;

// Initialize the database when content script loads
(async function initializeDatabase() {
  try {
    if (window.HistoryDB) {
      db = new window.HistoryDB();
      await db.init();
    } else {
      // Fallback database initialization
      db = await initFallbackDB();
    }
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
})();

// Fallback database implementation
async function initFallbackDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('CustomHistoryDB', 1);
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = () => {
      const database = request.result;
      resolve({
        database,
        addEntry: (entry) => addHistoryEntry(database, entry),
        getAllEntries: () => getAllHistoryEntries(database),
        searchEntries: (query) => searchHistoryEntries(database, query),
        deleteEntry: (id) => deleteHistoryEntry(database, id),
        cleanup: (cutoffTime) => cleanupHistoryEntries(database, cutoffTime)
      });
    };
    
    request.onupgradeneeded = (event) => {
      const database = event.target.result;
      
      if (!database.objectStoreNames.contains('history')) {
        const store = database.createObjectStore('history', { keyPath: 'id' });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('title', 'title', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

// Database helper functions
function addHistoryEntry(database, entry) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.put(entry);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function getAllHistoryEntries(database) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function searchHistoryEntries(database, query) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readonly');
    const store = transaction.objectStore('history');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const results = request.result.filter(entry => 
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        entry.url.toLowerCase().includes(query.toLowerCase())
      );
      resolve(results);
    };
    request.onerror = () => reject(request.error);
  });
}

function deleteHistoryEntry(database, id) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

function cleanupHistoryEntries(database, cutoffTime) {
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoffTime);
    const request = index.openCursor(range);
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// Listen for keyboard events
document.addEventListener('keydown', (event) => {
  // Check for Ctrl+H (or Cmd+H on Mac)
  if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
    event.preventDefault();
    event.stopPropagation();
    
    // Send message to background script to open custom history
    chrome.runtime.sendMessage({
      action: 'openHistory'
    });
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'storeHistory') {
    storeHistoryEntry(request.data)
      .then(() => sendResponse({success: true}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Indicates we will respond asynchronously
  }
  
  if (request.action === 'cleanupHistory') {
    cleanupHistory(request.cutoffTime)
      .then(() => sendResponse({success: true}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true;
  }
  
  if (request.action === 'getStats') {
    getHistoryStats()
      .then(stats => sendResponse({success: true, stats: stats}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true;
  }
  
  if (request.action === 'clearHistory') {
    clearAllHistory()
      .then(() => sendResponse({success: true}))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true;
  }
});

// Store history entry in IndexedDB
async function storeHistoryEntry(entry) {
  try {
    if (db && db.addEntry) {
      await db.addEntry(entry);
    } else {
      console.warn('Database not available for storing history entry');
    }
  } catch (error) {
    console.error('Error storing history entry:', error);
    throw error;
  }
}

// Cleanup old history entries
async function cleanupHistory(cutoffTime) {
  try {
    if (db && db.cleanup) {
      await db.cleanup(cutoffTime);
    }
  } catch (error) {
    console.error('Error cleaning up history:', error);
    throw error;
  }
}

// Store current page visit
function storeCurrentPageVisit() {
  const entry = {
    id: Date.now() + Math.random(), // Simple ID generation
    url: window.location.href,
    title: document.title,
    visitTime: Date.now(),
    visitCount: 1,
    timestamp: Date.now()
  };
  
  storeHistoryEntry(entry).catch(error => {
    console.error('Failed to store current page visit:', error);
  });
}

// Get history statistics
async function getHistoryStats() {
  try {
    if (db && db.database) {
      // Use fallback database
      const entries = await getAllHistoryEntries(db.database);
      return calculateStats(entries);
    } else if (db && db.getStats) {
      // Use full database interface
      return await db.getStats();
    } else {
      return {
        totalEntries: 0,
        totalVisits: 0,
        averageVisitsPerEntry: 0,
        oldestDate: null,
        newestDate: null
      };
    }
  } catch (error) {
    console.error('Error getting history stats:', error);
    throw error;
  }
}

// Calculate statistics from entries array
function calculateStats(entries) {
  const totalEntries = entries.length;
  let totalVisits = 0;
  let oldestDate = null;
  let newestDate = null;
  
  entries.forEach(entry => {
    const date = new Date(entry.timestamp);
    if (!oldestDate || date < oldestDate) oldestDate = date;
    if (!newestDate || date > newestDate) newestDate = date;
    totalVisits += entry.visitCount || 1;
  });
  
  return {
    totalEntries,
    totalVisits,
    averageVisitsPerEntry: totalEntries > 0 ? Math.round(totalVisits / totalEntries * 100) / 100 : 0,
    oldestDate: oldestDate ? oldestDate.toISOString() : null,
    newestDate: newestDate ? newestDate.toISOString() : null
  };
}

// Clear all history
async function clearAllHistory() {
  try {
    if (db && db.database) {
      // Use fallback database
      const transaction = db.database.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      await new Promise((resolve, reject) => {
        const request = store.clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } else if (db && db.clearAllHistory) {
      // Use full database interface
      await db.clearAllHistory();
    }
  } catch (error) {
    console.error('Error clearing all history:', error);
    throw error;
  }
}

// Store the current page when the content script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', storeCurrentPageVisit);
} else {
  storeCurrentPageVisit();
}