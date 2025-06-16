/**
 * Background script for Custom Browser History extension
 * Handles tab monitoring, history capture, and keyboard commands
 */

// Import database utilities
importScripts('database/db.js');

class BackgroundService {
  constructor() {
    this.historyDB = new HistoryDB();
    this.init();
  }

  async init() {
    try {
      await this.historyDB.init();
      console.log('Custom History: Database initialized');
    } catch (error) {
      console.error('Custom History: Failed to initialize database:', error);
    }

    this.setupEventListeners();
  }

  setupEventListeners() {
    // Listen for tab updates to capture history
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && tab.title) {
        this.captureHistory(tab.url, tab.title);
      }
    });

    // Listen for keyboard commands
    chrome.commands.onCommand.addListener((command) => {
      if (command === 'open-history') {
        this.openCustomHistory();
      }
    });

    // Listen for messages from content scripts
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      this.handleMessage(request, sender, sendResponse);
      return true; // Keep message channel open for async response
    });

    // Listen for extension installation/startup
    chrome.runtime.onStartup.addListener(() => {
      console.log('Custom History: Extension started');
    });

    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === 'install') {
        console.log('Custom History: Extension installed');
        this.openCustomHistory();
      }
    });
  }

  /**
   * Capture browser history entry
   */
  async captureHistory(url, title) {
    try {
      // Skip chrome:// and extension URLs
      if (url.startsWith('chrome://') || 
          url.startsWith('chrome-extension://') ||
          url.startsWith('moz-extension://') ||
          url.startsWith('about:')) {
        return;
      }

      await this.historyDB.addEntry(url, title);
      console.log('Custom History: Captured:', title, url);
    } catch (error) {
      console.error('Custom History: Failed to capture history:', error);
    }
  }

  /**
   * Open custom history page
   */
  async openCustomHistory() {
    try {
      const historyUrl = chrome.runtime.getURL('history/index.html');
      
      // Check if history tab is already open
      const tabs = await chrome.tabs.query({ url: historyUrl });
      
      if (tabs.length > 0) {
        // Focus existing tab
        await chrome.tabs.update(tabs[0].id, { active: true });
        await chrome.windows.update(tabs[0].windowId, { focused: true });
      } else {
        // Create new tab
        await chrome.tabs.create({ url: historyUrl });
      }
    } catch (error) {
      console.error('Custom History: Failed to open history page:', error);
    }
  }

  /**
   * Handle messages from content scripts and popup
   */
  async handleMessage(request, sender, sendResponse) {
    try {
      switch (request.action) {
        case 'getEntries':
          const entries = await this.historyDB.getEntries(request.options);
          sendResponse({ success: true, data: entries });
          break;

        case 'deleteEntry':
          await this.historyDB.deleteEntry(request.id);
          sendResponse({ success: true });
          break;

        case 'clearHistory':
          await this.historyDB.clearHistory();
          sendResponse({ success: true });
          break;

        case 'exportData':
          const exportData = await this.historyDB.exportData();
          sendResponse({ success: true, data: exportData });
          break;

        case 'importData':
          await this.historyDB.importData(request.data);
          sendResponse({ success: true });
          break;

        case 'getStats':
          const stats = await this.historyDB.getStats();
          sendResponse({ success: true, data: stats });
          break;

        case 'openHistory':
          await this.openCustomHistory();
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown action' });
      }
    } catch (error) {
      console.error('Custom History: Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }
}

// Initialize background service
const backgroundService = new BackgroundService();