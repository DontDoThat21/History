/**
 * Content script for capturing keyboard shortcuts
 * Intercepts Ctrl+H and redirects to custom history page
 */

class HistoryKeyCapture {
  constructor() {
    this.init();
  }

  init() {
    // Listen for keyboard events
    document.addEventListener('keydown', (event) => {
      this.handleKeydown(event);
    }, true); // Use capture phase to intercept before other handlers

    console.log('Custom History: Content script loaded');
  }

  /**
   * Handle keydown events
   */
  handleKeydown(event) {
    // Check for Ctrl+H (or Cmd+H on Mac)
    if ((event.ctrlKey || event.metaKey) && event.key === 'h') {
      // Prevent default browser history behavior
      event.preventDefault();
      event.stopPropagation();
      
      console.log('Custom History: Ctrl+H intercepted');
      
      // Send message to background script to open custom history
      chrome.runtime.sendMessage({
        action: 'openHistory'
      }).catch(error => {
        console.error('Custom History: Failed to send message to background:', error);
      });
    }
  }
}

// Initialize only if we're in the main frame (not in iframes)
if (window === window.top) {
  new HistoryKeyCapture();
}