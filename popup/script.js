/**
 * Popup Script for Custom Browser History Extension
 */

class PopupController {
  constructor() {
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadStats();
    await this.loadRecentHistory();
  }

  setupEventListeners() {
    // Quick action buttons
    document.getElementById('open-history').addEventListener('click', () => {
      this.openHistory();
    });

    document.getElementById('export-data').addEventListener('click', () => {
      this.exportData();
    });

    document.getElementById('clear-data').addEventListener('click', () => {
      this.clearData();
    });
  }

  async loadStats() {
    try {
      const response = await this.sendMessage({ action: 'getStats' });
      if (response.success) {
        document.getElementById('total-entries').textContent = 
          response.data.totalEntries.toLocaleString();
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
      document.getElementById('total-entries').textContent = 'Error';
    }
  }

  async loadRecentHistory() {
    try {
      const response = await this.sendMessage({
        action: 'getEntries',
        options: {
          limit: 5,
          sortBy: 'timestamp',
          sortOrder: 'desc'
        }
      });

      if (response.success) {
        this.displayRecentHistory(response.data);
      } else {
        this.showError('Failed to load recent history');
      }
    } catch (error) {
      console.error('Failed to load recent history:', error);
      this.showError('Failed to load recent history');
    }
  }

  displayRecentHistory(entries) {
    const recentList = document.getElementById('recent-list');
    
    if (entries.length === 0) {
      recentList.innerHTML = '<div class="loading-small">No history found</div>';
      return;
    }

    recentList.innerHTML = '';
    
    entries.forEach(entry => {
      const item = document.createElement('div');
      item.className = 'recent-item';
      
      const date = new Date(entry.timestamp);
      const timeString = this.formatTime(date);
      
      item.innerHTML = `
        <div class="recent-item-title">${this.escapeHtml(entry.title || 'Untitled')}</div>
        <div class="recent-item-url">${this.escapeHtml(entry.url)}</div>
        <div class="recent-item-time">${timeString}</div>
      `;
      
      item.addEventListener('click', () => {
        chrome.tabs.create({ url: entry.url });
        window.close();
      });
      
      recentList.appendChild(item);
    });
  }

  async openHistory() {
    try {
      await this.sendMessage({ action: 'openHistory' });
      window.close();
    } catch (error) {
      console.error('Failed to open history:', error);
    }
  }

  async exportData() {
    try {
      const response = await this.sendMessage({ action: 'exportData' });
      if (response.success) {
        this.downloadFile('history-export.json', response.data);
      } else {
        this.showError('Failed to export data');
      }
    } catch (error) {
      console.error('Failed to export data:', error);
      this.showError('Failed to export data');
    }
  }

  async clearData() {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'clearHistory' });
      if (response.success) {
        await this.loadStats();
        await this.loadRecentHistory();
        alert('History cleared successfully!');
      } else {
        this.showError('Failed to clear history');
      }
    } catch (error) {
      console.error('Failed to clear history:', error);
      this.showError('Failed to clear history');
    }
  }

  downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  formatTime(date) {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    
    return date.toLocaleDateString();
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  showError(message) {
    const recentList = document.getElementById('recent-list');
    recentList.innerHTML = `<div class="loading-small" style="color: #ff3b30;">${message}</div>`;
  }

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new PopupController();
});