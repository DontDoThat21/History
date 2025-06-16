/**
 * Database utilities for local history storage using IndexedDB
 */

class HistoryDB {
  constructor() {
    this.dbName = 'CustomHistoryDB';
    this.version = 1;
    this.storeName = 'history';
    this.db = null;
  }

  /**
   * Initialize the database
   */
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        // Create history store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          
          // Create indexes for efficient searching
          store.createIndex('url', 'url', { unique: false });
          store.createIndex('title', 'title', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('domain', 'domain', { unique: false });
        }
      };
    });
  }

  /**
   * Add a new history entry
   */
  async addEntry(url, title, timestamp = Date.now()) {
    if (!this.db) await this.init();

    const entry = {
      url,
      title,
      timestamp,
      domain: new URL(url).hostname,
      visitCount: 1
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      // Check if URL already exists
      const urlIndex = store.index('url');
      const getRequest = urlIndex.get(url);
      
      getRequest.onsuccess = () => {
        if (getRequest.result) {
          // Update existing entry
          const existingEntry = getRequest.result;
          existingEntry.visitCount++;
          existingEntry.timestamp = timestamp;
          existingEntry.title = title; // Update title in case it changed
          
          const updateRequest = store.put(existingEntry);
          updateRequest.onsuccess = () => resolve(existingEntry);
          updateRequest.onerror = () => reject(updateRequest.error);
        } else {
          // Add new entry
          const addRequest = store.add(entry);
          addRequest.onsuccess = () => resolve({ ...entry, id: addRequest.result });
          addRequest.onerror = () => reject(addRequest.error);
        }
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  /**
   * Get all history entries with optional filtering
   */
  async getEntries(options = {}) {
    if (!this.db) await this.init();

    const { 
      search = '', 
      limit = 1000, 
      offset = 0,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = options;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const entries = [];

      let cursor;
      if (sortBy === 'timestamp') {
        const index = store.index('timestamp');
        cursor = index.openCursor(null, sortOrder === 'desc' ? 'prev' : 'next');
      } else {
        cursor = store.openCursor();
      }

      let skipped = 0;
      let added = 0;

      cursor.onsuccess = (event) => {
        const result = event.target.result;
        
        if (result && added < limit) {
          const entry = result.value;
          
          // Apply search filter
          if (!search || 
              entry.title.toLowerCase().includes(search.toLowerCase()) ||
              entry.url.toLowerCase().includes(search.toLowerCase()) ||
              entry.domain.toLowerCase().includes(search.toLowerCase())) {
            
            if (skipped >= offset) {
              entries.push(entry);
              added++;
            } else {
              skipped++;
            }
          }
          
          result.continue();
        } else {
          resolve(entries);
        }
      };

      cursor.onerror = () => reject(cursor.error);
    });
  }

  /**
   * Delete a history entry by ID
   */
  async deleteEntry(id) {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all history entries
   */
  async clearHistory() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();

      request.onsuccess = () => resolve(true);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Export history data as JSON
   */
  async exportData() {
    const entries = await this.getEntries({ limit: Infinity });
    return JSON.stringify(entries, null, 2);
  }

  /**
   * Import history data from JSON
   */
  async importData(jsonData) {
    if (!this.db) await this.init();

    try {
      const entries = JSON.parse(jsonData);
      const transaction = this.db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);

      for (const entry of entries) {
        // Remove ID to let it auto-increment
        const { id, ...entryData } = entry;
        store.add(entryData);
      }

      return new Promise((resolve, reject) => {
        transaction.oncomplete = () => resolve(true);
        transaction.onerror = () => reject(transaction.error);
      });
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }

  /**
   * Get history statistics
   */
  async getStats() {
    if (!this.db) await this.init();

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const countRequest = store.count();

      countRequest.onsuccess = () => {
        const totalEntries = countRequest.result;
        
        // Get domain statistics
        const domainStats = {};
        const cursor = store.openCursor();
        
        cursor.onsuccess = (event) => {
          const result = event.target.result;
          
          if (result) {
            const entry = result.value;
            domainStats[entry.domain] = (domainStats[entry.domain] || 0) + 1;
            result.continue();
          } else {
            resolve({
              totalEntries,
              topDomains: Object.entries(domainStats)
                .sort(([,a], [,b]) => b - a)
                .slice(0, 10)
                .map(([domain, count]) => ({ domain, count }))
            });
          }
        };
        
        cursor.onerror = () => reject(cursor.error);
      };

      countRequest.onerror = () => reject(countRequest.error);
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = HistoryDB;
} else {
  window.HistoryDB = HistoryDB;
}