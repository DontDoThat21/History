// Popup script for Custom Browser History extension

document.addEventListener('DOMContentLoaded', async () => {
  // Load statistics
  await loadStats();
  
  // Set up event listeners
  document.getElementById('openHistory').addEventListener('click', openHistory);
  document.getElementById('clearHistory').addEventListener('click', clearHistory);
});

// Open the custom history page
function openHistory() {
  chrome.tabs.create({
    url: chrome.runtime.getURL('history/index.html')
  });
  window.close();
}

// Clear all history with confirmation
async function clearHistory() {
  const confirmed = confirm('Are you sure you want to clear all history? This action cannot be undone.');
  
  if (confirmed) {
    try {
      // Send message to content script to clear history
      const tabs = await chrome.tabs.query({active: true, currentWindow: true});
      if (tabs[0]) {
        await chrome.tabs.sendMessage(tabs[0].id, {
          action: 'clearHistory'
        });
      }
      
      // Reload stats
      await loadStats();
      
      // Show success message
      showMessage('History cleared successfully', 'success');
    } catch (error) {
      console.error('Error clearing history:', error);
      showMessage('Failed to clear history', 'error');
    }
  }
}

// Load and display statistics
async function loadStats() {
  const statsContainer = document.getElementById('stats');
  
  try {
    // Try to get stats from active tab's content script
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    
    if (tabs[0]) {
      const response = await chrome.tabs.sendMessage(tabs[0].id, {
        action: 'getStats'
      });
      
      if (response && response.success) {
        displayStats(response.stats);
      } else {
        throw new Error('Failed to get stats from content script');
      }
    } else {
      throw new Error('No active tab found');
    }
  } catch (error) {
    console.error('Error loading stats:', error);
    displayFallbackStats();
  }
}

// Display statistics in the popup
function displayStats(stats) {
  const statsContainer = document.getElementById('stats');
  
  statsContainer.innerHTML = `
    <h3>Statistics</h3>
    <div class="stat-item">
      <span class="stat-label">Total Entries:</span>
      <span class="stat-value">${stats.totalEntries || 0}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Total Visits:</span>
      <span class="stat-value">${stats.totalVisits || 0}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Avg Visits/Entry:</span>
      <span class="stat-value">${stats.averageVisitsPerEntry || 0}</span>
    </div>
    ${stats.oldestDate ? `
    <div class="stat-item">
      <span class="stat-label">Oldest Entry:</span>
      <span class="stat-value">${formatDate(stats.oldestDate)}</span>
    </div>
    ` : ''}
    ${stats.newestDate ? `
    <div class="stat-item">
      <span class="stat-label">Newest Entry:</span>
      <span class="stat-value">${formatDate(stats.newestDate)}</span>
    </div>
    ` : ''}
  `;
}

// Display fallback stats when data is not available
function displayFallbackStats() {
  const statsContainer = document.getElementById('stats');
  
  statsContainer.innerHTML = `
    <h3>Statistics</h3>
    <div class="stat-item">
      <span class="stat-label">Status:</span>
      <span class="stat-value">Initializing...</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Note:</span>
      <span class="stat-value">Visit some pages first</span>
    </div>
  `;
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
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

// Show success/error messages
function showMessage(message, type) {
  const existingMessage = document.querySelector('.message');
  if (existingMessage) {
    existingMessage.remove();
  }
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${type}`;
  messageDiv.textContent = message;
  
  if (type === 'success') {
    messageDiv.style.background = '#d4edda';
    messageDiv.style.color = '#155724';
  } else {
    messageDiv.style.background = '#f8d7da';
    messageDiv.style.color = '#721c24';
  }
  
  messageDiv.style.padding = '10px';
  messageDiv.style.borderRadius = '4px';
  messageDiv.style.fontSize = '12px';
  messageDiv.style.marginTop = '10px';
  
  document.body.appendChild(messageDiv);
  
  // Remove message after 3 seconds
  setTimeout(() => {
    messageDiv.remove();
  }, 3000);
}

// Handle extension commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'open-history') {
    openHistory();
  }
});