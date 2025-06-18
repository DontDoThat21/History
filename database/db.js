// IndexedDB utilities for Custom Browser History

export class HistoryDB {
  constructor() {
    this.dbName = 'CustomHistoryDB';
    this.version = 1;
    this.db = null;
  }

  // Initialize the database
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        console.error('Database failed to open');
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('Database opened successfully');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        console.log('Database upgrade needed');

        // Create object store for history entries
        if (!this.db.objectStoreNames.contains('history')) {
          const historyStore = this.db.createObjectStore('history', { keyPath: 'id' });
          
          // Create indexes for efficient searching
          historyStore.createIndex('url', 'url', { unique: false });
          historyStore.createIndex('title', 'title', { unique: false });
          historyStore.createIndex('timestamp', 'timestamp', { unique: false });
          historyStore.createIndex('visitTime', 'visitTime', { unique: false });
          
          console.log('History object store created');
        }

        // Create object store for settings
        if (!this.db.objectStoreNames.contains('settings')) {
          const settingsStore = this.db.createObjectStore('settings', { keyPath: 'key' });
          console.log('Settings object store created');
        }
      };
    });
  }

  // Add a new history entry
  async addEntry(entry) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      
      // Check if entry already exists and update visit count
      const getRequest = store.get(entry.id);
      
      getRequest.onsuccess = () => {
        const existingEntry = getRequest.result;
        if (existingEntry) {
          // Update existing entry
          entry.visitCount = (existingEntry.visitCount || 0) + 1;
        }
        
        const putRequest = store.put(entry);
        putRequest.onsuccess = () => resolve(putRequest.result);
        putRequest.onerror = () => reject(putRequest.error);
      };
      
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  // Get all history entries
  async getAllEntries(limit = 1000) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readonly');
      const store = transaction.objectStore('history');
      const index = store.index('timestamp');
      
      const entries = [];
      let count = 0;
      
      const request = index.openCursor(null, 'prev'); // Latest first
      
      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor && count < limit) {
          entries.push(cursor.value);
          count++;
          cursor.continue();
        } else {
          resolve(entries);
        }
      };
      
      request.onerror = () => reject(request.error);
    });
  }

  // Search history entries
  async searchEntries(query, limit = 100) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    const allEntries = await this.getAllEntries();
    const searchTerm = query.toLowerCase();
    
    const results = allEntries.filter(entry => {
      return (
        entry.title.toLowerCase().includes(searchTerm) ||
        entry.url.toLowerCase().includes(searchTerm)
      );
    });

    return results.slice(0, limit);
  }

  // Delete a history entry
  async deleteEntry(id) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Clear all history
  async clearAllHistory() {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
      const store = transaction.objectStore('history');
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Cleanup old history entries
  async cleanup(cutoffTime) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['history'], 'readwrite');
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

  // Export history data
  async exportHistory() {
    const entries = await this.getAllEntries(10000); // Export all
    return {
      version: this.version,
      exportDate: new Date().toISOString(),
      entries: entries
    };
  }

  // Import history data
  async importHistory(data) {
    if (!data.entries || !Array.isArray(data.entries)) {
      throw new Error('Invalid import data format');
    }

    const transaction = this.db.transaction(['history'], 'readwrite');
    const store = transaction.objectStore('history');

    for (const entry of data.entries) {
      // Ensure entry has required fields
      if (entry.id && entry.url && entry.title) {
        await new Promise((resolve, reject) => {
          const request = store.put(entry);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }
    }

    return data.entries.length;
  }

  // Get statistics
  async getStats() {
    const entries = await this.getAllEntries();
    const totalEntries = entries.length;
    
    // Calculate date range
    let oldestDate = null;
    let newestDate = null;
    let totalVisits = 0;
    
    entries.forEach(entry => {
      const date = new Date(entry.timestamp);
      if (!oldestDate || date < oldestDate) oldestDate = date;
      if (!newestDate || date > newestDate) newestDate = date;
      totalVisits += entry.visitCount || 1;
    });

    return {
      totalEntries,
      totalVisits,
      oldestDate: oldestDate ? oldestDate.toISOString() : null,
      newestDate: newestDate ? newestDate.toISOString() : null,
      averageVisitsPerEntry: totalEntries > 0 ? Math.round(totalVisits / totalEntries * 100) / 100 : 0
    };
  }

  // Settings methods
  async getSetting(key) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      const request = store.get(key);
      
      request.onsuccess = () => {
        const result = request.result;
        resolve(result ? result.value : null);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async setSetting(key, value) {
    if (!this.db) {
      throw new Error('Database not initialized');
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      const request = store.put({ key, value });
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Close database connection
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}

// Export for use in other modules
if (typeof window !== 'undefined') {
  window.HistoryDB = HistoryDB;
}