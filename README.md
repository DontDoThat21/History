# Custom Browser History Extension

A privacy-focused browser history replacement system that stores data locally and provides better search capabilities than the default browser history.

## Features

🔒 **Privacy-Focused**: All data stored locally on your machine using IndexedDB  
⌨️ **Keyboard Shortcut**: Replaces Ctrl+H with custom history interface  
🔍 **Advanced Search**: Search through titles and URLs with real-time filtering  
📊 **Statistics**: View detailed statistics about your browsing history  
📤 **Export/Import**: Backup and restore your history data  
🎨 **Modern UI**: Clean, responsive interface with dark mode support  
🚀 **Fast Performance**: Efficient local database with pagination  

## Installation

### From Source (Developer Mode)

1. Clone or download this repository
2. Open Chrome/Firefox and navigate to extensions page:
   - Chrome: `chrome://extensions/`
   - Firefox: `about:addons`
3. Enable "Developer mode" (Chrome) or "Debug Add-ons" (Firefox)
4. Click "Load unpacked" and select the extension directory
5. The extension will be installed and ready to use

### Permissions Required

- **Storage**: Store history data locally using IndexedDB
- **Tabs**: Access tab information for history tracking
- **History**: Read browser history events
- **ActiveTab**: Interact with active tab for data storage

## Usage

### Opening Custom History

- **Keyboard Shortcut**: Press `Ctrl+H` (or `Cmd+H` on Mac)
- **Extension Popup**: Click the extension icon and select "Open History"
- **Direct Access**: Navigate to the history page via extension

### Search and Filter

- **Search Bar**: Type to search through titles and URLs
- **Time Filters**: Filter by Today, Yesterday, This Week, This Month, This Year
- **Sort Options**: Sort by Newest, Oldest, Most Visited, or Alphabetical

### Data Management

- **Export**: Download your history as a JSON file
- **Import**: Upload a previously exported JSON file
- **Clear All**: Remove all history entries (with confirmation)
- **Delete Individual**: Remove specific entries by clicking the delete button

## File Structure

```
/
├── manifest.json           # Extension manifest (Chrome/Firefox compatible)
├── background.js          # Extension background service worker
├── content.js            # Content script for keyboard capture and data handling
├── popup/               # Extension popup interface
│   ├── popup.html      # Popup UI
│   └── popup.js        # Popup functionality
├── history/            # Main history page
│   ├── index.html     # History interface
│   ├── style.css      # Styling and responsive design
│   └── script.js      # History page functionality
├── database/          # Database utilities
│   └── db.js         # IndexedDB wrapper and utilities
└── README.md         # This documentation
```

## Technical Details

### Database Schema

The extension uses IndexedDB with the following structure:

```javascript
// History entries
{
  id: unique_identifier,
  url: "https://example.com",
  title: "Page Title",
  visitTime: timestamp,
  visitCount: number,
  timestamp: timestamp
}

// Settings (for future use)
{
  key: "setting_name",
  value: setting_value
}
```

### Storage Information

- **Database Name**: CustomHistoryDB
- **Storage Type**: IndexedDB (persistent local storage)
- **Data Location**: Browser's local storage (not synchronized)
- **Cleanup**: Automatic cleanup of entries older than 30 days

### Browser Compatibility

- **Chrome**: Version 88+ (Manifest V3)
- **Firefox**: Version 109+ (Manifest V3 support)
- **Edge**: Version 88+ (Chromium-based)

## Privacy & Security

- ✅ All data stored locally on your device
- ✅ No external servers or data transmission
- ✅ No tracking or analytics
- ✅ No permissions for sensitive data
- ✅ Open source and auditable

## Development

### Building from Source

No build process required - this is a pure HTML/CSS/JavaScript extension.

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

### Testing

1. Load the extension in developer mode
2. Visit various websites to populate history
3. Test keyboard shortcut (Ctrl+H)
4. Verify search and filter functionality
5. Test export/import features

## Troubleshooting

### Common Issues

**Ctrl+H doesn't work**
- Ensure the extension is enabled
- Check that content scripts are loading
- Try reloading the current page

**History not appearing**
- Check browser console for errors
- Verify IndexedDB is enabled in browser
- Ensure extension has required permissions

**Search not working**
- Clear browser cache and reload
- Check for JavaScript errors in console
- Try restarting the browser

### Debug Mode

Enable debug logging by opening browser console and setting:
```javascript
localStorage.setItem('debug', 'true');
```

## Changelog

### Version 1.0.0
- Initial release
- Basic history storage and retrieval
- Search and filter functionality
- Export/import capabilities
- Keyboard shortcut override
- Modern responsive UI

## License

This project is open source and available under the [MIT License](LICENSE).

## Support

For bug reports and feature requests, please use the GitHub issues page.

---

**Note**: This extension replaces the default browser history interface. Your original browser history remains unchanged and accessible through browser settings.
