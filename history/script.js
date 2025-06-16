// Custom Browser History - Main Script

import { HistoryDB } from '../database/db.js';

class HistoryManager {
  constructor() {
    this.db = null;
    this.currentPage = 1;
    this.itemsPerPage = 50;
    this.currentFilter = 'all';
    this.currentSort = 'newest';
    this.searchQuery = '';
    this.allEntries = [];
    this.filteredEntries = [];
    
    this.init();
  }

  async init() {
    try {
      // Initialize database
      this.db = new HistoryDB();
      await this.db.init();
      
      // Set up event listeners
      this.setupEventListeners();
      
      // Load initial data
      await this.loadData();
      
    } catch (error) {
      console.error('Failed to initialize History Manager:', error);
      this.showToast('Failed to initialize history database', 'error');
    }
  }

  setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchInput.addEventListener('input', (e) => {
      this.searchQuery = e.target.value;
      this.debounceSearch();
    });
    
    searchBtn.addEventListener('click', () => {
      this.performSearch();
    });
    
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Filter functionality
    document.getElementById('timeFilter').addEventListener('change', (e) => {
      this.currentFilter = e.target.value;
      this.applyFilters();
    });
    
    document.getElementById('sortFilter').addEventListener('change', (e) => {
      this.currentSort = e.target.value;
      this.applyFilters();
    });

    // Header actions
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportHistory();
    });
    
    document.getElementById('importBtn').addEventListener('click', () => {
      this.showImportModal();
    });
    
    document.getElementById('clearBtn').addEventListener('click', () => {
      this.showConfirmModal(
        'Clear All History',
        'Are you sure you want to delete all history entries? This action cannot be undone.',
        () => this.clearAllHistory()
      );
    });

    // Modal event listeners
    this.setupModalListeners();
    
    // Pagination
    document.getElementById('prevBtn').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.displayEntries();
      }
    });
    
    document.getElementById('nextBtn').addEventListener('click', () => {
      const totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.displayEntries();
      }
    });
  }

  setupModalListeners() {
    // Import modal
    document.getElementById('closeImportModal').addEventListener('click', () => {
      this.hideImportModal();
    });
    
    document.getElementById('cancelImport').addEventListener('click', () => {
      this.hideImportModal();
    });
    
    document.getElementById('confirmImport').addEventListener('click', () => {
      this.handleImport();
    });

    // Confirm modal
    document.getElementById('closeConfirmModal').addEventListener('click', () => {
      this.hideConfirmModal();
    });
    
    document.getElementById('cancelConfirm').addEventListener('click', () => {
      this.hideConfirmModal();
    });

    // Click outside modal to close
    document.getElementById('importModal').addEventListener('click', (e) => {
      if (e.target.id === 'importModal') {
        this.hideImportModal();
      }
    });
    
    document.getElementById('confirmModal').addEventListener('click', (e) => {
      if (e.target.id === 'confirmModal') {
        this.hideConfirmModal();
      }
    });
  }

  // Debounced search function
  debounceSearch() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  async performSearch() {
    try {
      if (this.searchQuery.trim() === '') {
        this.filteredEntries = [...this.allEntries];
      } else {
        this.filteredEntries = this.allEntries.filter(entry => {
          const titleMatch = entry.title.toLowerCase().includes(this.searchQuery.toLowerCase());
          const urlMatch = entry.url.toLowerCase().includes(this.searchQuery.toLowerCase());
          return titleMatch || urlMatch;
        });
      }
      
      this.applyFilters();
      
    } catch (error) {
      console.error('Search error:', error);
      this.showToast('Search failed', 'error');
    }
  }

  async loadData() {
    try {
      // Show loading spinner
      this.showLoading(true);
      
      // Load all entries
      this.allEntries = await this.db.getAllEntries();
      this.filteredEntries = [...this.allEntries];
      
      // Update statistics
      await this.updateStatistics();
      
      // Apply initial filters and display
      this.applyFilters();
      
    } catch (error) {
      console.error('Failed to load data:', error);
      this.showToast('Failed to load history data', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async updateStatistics() {
    try {
      const stats = await this.db.getStats();
      
      document.getElementById('totalEntries').textContent = stats.totalEntries;
      document.getElementById('totalVisits').textContent = stats.totalVisits;
      document.getElementById('avgVisits').textContent = stats.averageVisitsPerEntry;
      
      if (stats.oldestDate && stats.newestDate) {
        const oldestDate = new Date(stats.oldestDate);
        const newestDate = new Date(stats.newestDate);
        const dateRange = `${this.formatDate(oldestDate)} - ${this.formatDate(newestDate)}`;
        document.getElementById('dateRange').textContent = dateRange;
      } else {
        document.getElementById('dateRange').textContent = '-';
      }
      
    } catch (error) {
      console.error('Failed to update statistics:', error);
    }
  }

  applyFilters() {
    let filtered = [...this.filteredEntries];
    
    // Apply time filter
    if (this.currentFilter !== 'all') {
      const now = new Date();
      let cutoffTime;
      
      switch (this.currentFilter) {
        case 'today':
          cutoffTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'yesterday':
          cutoffTime = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          break;
        case 'week':
          cutoffTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffTime = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          cutoffTime = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (cutoffTime) {
        filtered = filtered.filter(entry => 
          new Date(entry.timestamp) >= cutoffTime
        );
      }
    }
    
    // Apply sorting
    switch (this.currentSort) {
      case 'newest':
        filtered.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.timestamp - b.timestamp);
        break;
      case 'visits':
        filtered.sort((a, b) => (b.visitCount || 1) - (a.visitCount || 1));
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
    }
    
    this.filteredEntries = filtered;
    this.currentPage = 1;
    this.displayEntries();
  }

  displayEntries() {
    const historyList = document.getElementById('historyList');
    const displayedCount = document.getElementById('displayedCount');
    
    // Calculate pagination
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const entriesToShow = this.filteredEntries.slice(startIndex, endIndex);
    
    // Update displayed count
    displayedCount.textContent = this.filteredEntries.length;
    
    // Clear current list
    historyList.innerHTML = '';
    
    if (entriesToShow.length === 0) {
      this.showEmptyState();
      return;
    }
    
    // Create history items
    entriesToShow.forEach(entry => {
      const historyItem = this.createHistoryItem(entry);
      historyList.appendChild(historyItem);
    });
    
    // Update pagination
    this.updatePagination();
  }

  createHistoryItem(entry) {
    const item = document.createElement('div');
    item.className = 'history-item';
    item.dataset.id = entry.id;
    
    const title = entry.title || 'Untitled';
    const url = entry.url || '';
    const visitTime = new Date(entry.timestamp || entry.visitTime);
    const visitCount = entry.visitCount || 1;
    
    item.innerHTML = `
      <div class="item-header">
        <div class="item-info">
          <div class="item-title">${this.escapeHtml(title)}</div>
          <a href="${this.escapeHtml(url)}" class="item-url" target="_blank" rel="noopener noreferrer">
            ${this.escapeHtml(url)}
          </a>
        </div>
        <div class="item-actions">
          <button class="delete-btn" data-id="${entry.id}">Delete</button>
        </div>
      </div>
      <div class="item-meta">
        <span class="visit-time">${this.formatDateTime(visitTime)}</span>
        <span class="visit-count">${visitCount} visit${visitCount !== 1 ? 's' : ''}</span>
      </div>
    `;
    
    // Add event listeners
    item.querySelector('.delete-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      this.deleteEntry(entry.id);
    });
    
    // Add click to visit
    item.addEventListener('click', () => {
      window.open(url, '_blank', 'noopener,noreferrer');
    });
    
    return item;
  }

  showEmptyState() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📭</div>
        <h3>No history entries found</h3>
        <p>
          ${this.searchQuery ? 'Try adjusting your search terms or filters.' : 'Start browsing to see your history here.'}
        </p>
      </div>
    `;
  }

  updatePagination() {
    const totalPages = Math.ceil(this.filteredEntries.length / this.itemsPerPage);
    const pagination = document.getElementById('pagination');
    
    if (totalPages <= 1) {
      pagination.style.display = 'none';
      return;
    }
    
    pagination.style.display = 'flex';
    
    document.getElementById('currentPage').textContent = this.currentPage;
    document.getElementById('totalPages').textContent = totalPages;
    
    document.getElementById('prevBtn').disabled = this.currentPage === 1;
    document.getElementById('nextBtn').disabled = this.currentPage === totalPages;
  }

  async deleteEntry(id) {
    try {
      await this.db.deleteEntry(id);
      
      // Remove from local arrays
      this.allEntries = this.allEntries.filter(entry => entry.id !== id);
      this.filteredEntries = this.filteredEntries.filter(entry => entry.id !== id);
      
      // Refresh display
      this.displayEntries();
      await this.updateStatistics();
      
      this.showToast('Entry deleted successfully', 'success');
      
    } catch (error) {
      console.error('Failed to delete entry:', error);
      this.showToast('Failed to delete entry', 'error');
    }
  }

  async clearAllHistory() {
    try {
      await this.db.clearAllHistory();
      
      this.allEntries = [];
      this.filteredEntries = [];
      
      this.displayEntries();
      await this.updateStatistics();
      
      this.showToast('All history cleared', 'success');
      
    } catch (error) {
      console.error('Failed to clear history:', error);
      this.showToast('Failed to clear history', 'error');
    }
  }

  async exportHistory() {
    try {
      const data = await this.db.exportHistory();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json'
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `history-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      this.showToast('History exported successfully', 'success');
      
    } catch (error) {
      console.error('Failed to export history:', error);
      this.showToast('Failed to export history', 'error');
    }
  }

  showImportModal() {
    document.getElementById('importModal').classList.add('show');
  }

  hideImportModal() {
    document.getElementById('importModal').classList.remove('show');
    document.getElementById('importFile').value = '';
  }

  async handleImport() {
    const fileInput = document.getElementById('importFile');
    const file = fileInput.files[0];
    
    if (!file) {
      this.showToast('Please select a file to import', 'warning');
      return;
    }
    
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      
      const importedCount = await this.db.importHistory(data);
      
      // Reload data
      await this.loadData();
      
      this.hideImportModal();
      this.showToast(`Successfully imported ${importedCount} entries`, 'success');
      
    } catch (error) {
      console.error('Failed to import history:', error);
      this.showToast('Failed to import history. Please check the file format.', 'error');
    }
  }

  showConfirmModal(title, message, callback) {
    document.getElementById('confirmTitle').textContent = title;
    document.getElementById('confirmMessage').textContent = message;
    
    const confirmBtn = document.getElementById('confirmAction');
    const newConfirmBtn = confirmBtn.cloneNode(true);
    confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
    
    newConfirmBtn.addEventListener('click', () => {
      callback();
      this.hideConfirmModal();
    });
    
    document.getElementById('confirmModal').classList.add('show');
  }

  hideConfirmModal() {
    document.getElementById('confirmModal').classList.remove('show');
  }

  showLoading(show) {
    const loadingSpinner = document.getElementById('loadingSpinner');
    if (show) {
      loadingSpinner.style.display = 'flex';
    } else {
      loadingSpinner.style.display = 'none';
    }
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    const title = type.charAt(0).toUpperCase() + type.slice(1);
    toast.innerHTML = `
      <div class="toast-title">${title}</div>
      <div class="toast-message">${message}</div>
    `;
    
    toastContainer.appendChild(toast);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 5000);
  }

  // Utility functions
  formatDate(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
      return 'Today';
    } else if (diffDays === 2) {
      return 'Yesterday';
    } else if (diffDays <= 7) {
      return `${diffDays - 1} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  }

  formatDateTime(date) {
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffHours = diffTime / (1000 * 60 * 60);
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleString();
    }
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new HistoryManager();
});