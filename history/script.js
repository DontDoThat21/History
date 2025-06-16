/**
 * Custom Browser History Page Script
 * Handles UI interactions and communication with background script
 */

class HistoryPage {
  constructor() {
    this.currentPage = 1;
    this.itemsPerPage = 50;
    this.currentSearch = '';
    this.currentSort = 'timestamp-desc';
    this.currentLimit = 100;
    this.totalItems = 0;
    
    this.init();
  }

  async init() {
    this.setupEventListeners();
    await this.loadHistory();
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    
    searchBtn.addEventListener('click', () => this.performSearch());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') this.performSearch();
    });
    
    // Search input debouncing
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => this.performSearch(), 500);
    });

    // Filters
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.currentPage = 1;
      this.loadHistory();
    });

    document.getElementById('limit-input').addEventListener('change', (e) => {
      this.currentLimit = parseInt(e.target.value) || 100;
      this.currentPage = 1;
      this.loadHistory();
    });

    // Header actions
    document.getElementById('stats-btn').addEventListener('click', () => this.showStats());
    document.getElementById('export-btn').addEventListener('click', () => this.exportHistory());
    document.getElementById('import-btn').addEventListener('click', () => this.showImportModal());
    document.getElementById('clear-btn').addEventListener('click', () => this.clearHistory());

    // Pagination
    document.getElementById('prev-btn').addEventListener('click', () => this.previousPage());
    document.getElementById('next-btn').addEventListener('click', () => this.nextPage());

    // Modal controls
    document.getElementById('close-stats').addEventListener('click', () => this.hideModal('stats-modal'));
    document.getElementById('close-import').addEventListener('click', () => this.hideModal('import-modal'));
    document.getElementById('import-confirm').addEventListener('click', () => this.importHistory());
    document.getElementById('import-cancel').addEventListener('click', () => this.hideModal('import-modal'));

    // Click outside modal to close
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('modal')) {
        this.hideModal(e.target.id);
      }
    });

    // File input for import
    document.getElementById('file-input').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('import-data').value = event.target.result;
        };
        reader.readAsText(file);
      }
    });
  }

  async performSearch() {
    this.currentSearch = document.getElementById('search-input').value.trim();
    this.currentPage = 1;
    await this.loadHistory();
  }

  async loadHistory() {
    this.showLoading();

    try {
      const [sortBy, sortOrder] = this.currentSort.split('-');
      
      const options = {
        search: this.currentSearch,
        limit: this.currentLimit,
        offset: (this.currentPage - 1) * this.itemsPerPage,
        sortBy,
        sortOrder
      };

      const response = await this.sendMessage({ action: 'getEntries', options });
      
      if (response.success) {
        this.displayHistory(response.data);
        this.updatePagination(response.data.length);
      } else {
        this.showError('Failed to load history: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to load history: ' + error.message);
    }

    this.hideLoading();
  }

  displayHistory(entries) {
    const historyList = document.getElementById('history-list');
    const noResults = document.getElementById('no-results');

    if (entries.length === 0) {
      historyList.style.display = 'none';
      noResults.style.display = 'block';
      return;
    }

    noResults.style.display = 'none';
    historyList.style.display = 'block';
    historyList.innerHTML = '';

    entries.forEach(entry => {
      const item = this.createHistoryItem(entry);
      historyList.appendChild(item);
    });
  }

  createHistoryItem(entry) {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const date = new Date(entry.timestamp);
    const timeString = this.formatDate(date);
    
    item.innerHTML = `
      <div class="history-item-header">
        <a href="${entry.url}" class="history-item-title" target="_blank" rel="noopener noreferrer">
          ${this.escapeHtml(entry.title || 'Untitled')}
        </a>
        <div class="history-item-actions">
          <button class="history-item-delete" title="Delete this entry" data-id="${entry.id}">
            🗑️
          </button>
        </div>
      </div>
      <div class="history-item-url">${this.escapeHtml(entry.url)}</div>
      <div class="history-item-meta">
        <span class="history-item-domain">${this.escapeHtml(entry.domain)}</span>
        <span class="history-item-time">${timeString}</span>
      </div>
    `;

    // Add delete functionality
    const deleteBtn = item.querySelector('.history-item-delete');
    deleteBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      if (confirm('Are you sure you want to delete this history entry?')) {
        await this.deleteEntry(entry.id);
      }
    });

    return item;
  }

  async deleteEntry(id) {
    try {
      const response = await this.sendMessage({ action: 'deleteEntry', id });
      if (response.success) {
        await this.loadHistory(); // Reload the list
      } else {
        this.showError('Failed to delete entry: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to delete entry: ' + error.message);
    }
  }

  async clearHistory() {
    if (!confirm('Are you sure you want to clear all history? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'clearHistory' });
      if (response.success) {
        await this.loadHistory();
        alert('History cleared successfully!');
      } else {
        this.showError('Failed to clear history: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to clear history: ' + error.message);
    }
  }

  async exportHistory() {
    try {
      const response = await this.sendMessage({ action: 'exportData' });
      if (response.success) {
        this.downloadFile('history-export.json', response.data);
      } else {
        this.showError('Failed to export history: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to export history: ' + error.message);
    }
  }

  showImportModal() {
    document.getElementById('import-modal').style.display = 'flex';
  }

  async importHistory() {
    const data = document.getElementById('import-data').value.trim();
    
    if (!data) {
      alert('Please paste JSON data to import.');
      return;
    }

    try {
      const response = await this.sendMessage({ action: 'importData', data });
      if (response.success) {
        this.hideModal('import-modal');
        document.getElementById('import-data').value = '';
        await this.loadHistory();
        alert('History imported successfully!');
      } else {
        this.showError('Failed to import history: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to import history: ' + error.message);
    }
  }

  async showStats() {
    try {
      const response = await this.sendMessage({ action: 'getStats' });
      if (response.success) {
        this.displayStats(response.data);
        document.getElementById('stats-modal').style.display = 'flex';
      } else {
        this.showError('Failed to load statistics: ' + response.error);
      }
    } catch (error) {
      this.showError('Failed to load statistics: ' + error.message);
    }
  }

  displayStats(stats) {
    document.getElementById('total-entries').textContent = stats.totalEntries.toLocaleString();
    
    const topDomainsContainer = document.getElementById('top-domains');
    topDomainsContainer.innerHTML = '';
    
    stats.topDomains.forEach(domain => {
      const domainItem = document.createElement('div');
      domainItem.className = 'domain-item';
      domainItem.innerHTML = `
        <span class="domain-name">${this.escapeHtml(domain.domain)}</span>
        <span class="domain-count">${domain.count}</span>
      `;
      topDomainsContainer.appendChild(domainItem);
    });
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadHistory();
    }
  }

  nextPage() {
    this.currentPage++;
    this.loadHistory();
  }

  updatePagination(itemCount) {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const pageInfo = document.getElementById('page-info');

    prevBtn.disabled = this.currentPage <= 1;
    nextBtn.disabled = itemCount < this.itemsPerPage;
    
    pageInfo.textContent = `Page ${this.currentPage}`;
  }

  showLoading() {
    document.getElementById('loading').style.display = 'flex';
    document.getElementById('history-list').style.display = 'none';
    document.getElementById('no-results').style.display = 'none';
  }

  hideLoading() {
    document.getElementById('loading').style.display = 'none';
  }

  hideModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
  }

  showError(message) {
    alert(message); // Simple alert for now, could be enhanced with toast notifications
    console.error('History Page Error:', message);
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

  formatDate(date) {
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

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }
}

// Initialize the history page when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HistoryPage();
});