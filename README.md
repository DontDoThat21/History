# Custom Browser History System

A privacy-focused browser history replacement that stores all data locally on your machine, providing a better alternative to Google's browser history.

## Features

- **🔒 Privacy-First**: All data stored locally using IndexedDB - no external servers
- **⌨️ Keyboard Shortcut**: Intercepts Ctrl+H to open custom history page
- **🔍 Advanced Search**: Search through titles, URLs, and domains
- **📊 Statistics**: View browsing statistics and top domains
- **📤 Export/Import**: Backup and restore your history data
- **🎨 Modern UI**: Clean, responsive interface with dark mode support

## Installation

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select this directory
4. The extension will be installed and ready to use

## Usage

### Keyboard Shortcut
- Press **Ctrl+H** (or **Cmd+H** on Mac) to open the custom history page
- This replaces the default browser history shortcut

### Main Features
- **Search**: Type in the search box to filter history entries
- **Sort**: Sort by date, title, or domain
- **Delete**: Remove individual entries or clear all history
- **Export**: Download your history as JSON
- **Import**: Restore history from exported JSON file

### Extension Popup
- Click the extension icon to see recent visits and quick actions
- Access export, import, and clear functions directly from the popup

## File Structure

```
/
├── manifest.json              # Extension manifest
├── background.js             # Background service worker
├── content.js               # Content script for keyboard capture
├── database/
│   └── db.js               # IndexedDB utilities
├── history/
│   ├── index.html          # Main history page
│   ├── style.css           # History page styles
│   └── script.js           # History page functionality
├── popup/
│   ├── index.html          # Extension popup
│   ├── style.css           # Popup styles
│   └── script.js           # Popup functionality
├── icons/
│   └── README.md           # Icon placeholder documentation
└── README.md               # This file
```

## Technical Details

### Database Storage
- Uses IndexedDB for local storage
- Stores URL, title, timestamp, domain, and visit count
- Indexes on URL, title, timestamp, and domain for efficient searching

### Browser Extension
- Manifest V3 compatible
- Captures tab updates automatically
- Intercepts Ctrl+H keyboard shortcut
- Provides background service for data management

### Privacy & Security
- No external network requests
- All data remains on your local machine
- No tracking or analytics
- Open source and auditable

## Browser Compatibility

- **Chrome**: Full support (recommended)
- **Firefox**: Compatible with minor modifications
- **Edge**: Compatible (Chromium-based)

## Development

To modify or extend this extension:

1. Make your changes to the relevant files
2. Reload the extension in `chrome://extensions/`
3. Test functionality in the browser

### Key Components
- **background.js**: Handles tab monitoring and data capture
- **content.js**: Intercepts keyboard shortcuts
- **database/db.js**: Manages IndexedDB operations
- **history/**: Main history interface
- **popup/**: Extension popup interface

## Troubleshooting

### Extension Not Loading
- Ensure all files are present in the directory
- Check for syntax errors in the console
- Verify manifest.json is valid

### Keyboard Shortcut Not Working
- Check if the extension has proper permissions
- Ensure content script is loading on pages
- Verify no other extensions are conflicting

### Data Not Saving
- Check browser permissions for storage
- Ensure IndexedDB is supported and enabled
- Look for errors in the extension console

## License

This project is open source and available under the MIT License.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## Changelog

### v1.0.0
- Initial release
- Core history capture and display functionality
- Keyboard shortcut interception
- Export/import capabilities
- Statistics and search features
