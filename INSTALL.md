# Installation Guide

## Quick Start

1. **Open Chrome Extensions Page**
   - Navigate to `chrome://extensions/` in your Chrome browser
   - Or go to Chrome menu → More Tools → Extensions

2. **Enable Developer Mode**
   - Toggle "Developer mode" switch in the top right corner

3. **Load the Extension**
   - Click "Load unpacked" button
   - Select the History folder (the one containing manifest.json)
   - The extension should appear in your extensions list

4. **Test the Extension**
   - Visit a few web pages to generate some history
   - Press **Ctrl+H** - it should open the custom history page instead of Chrome's default
   - Click the extension icon in the toolbar to see the popup

## Features to Test

### Keyboard Shortcut
- Press `Ctrl+H` (or `Cmd+H` on Mac) on any webpage
- Should redirect to the custom history page

### History Capture
- Browse to different websites
- Check if they appear in the custom history page
- Note: chrome:// and extension URLs are excluded

### Search & Filter
- Use the search box to find specific pages
- Try different sort options
- Test pagination with the Previous/Next buttons

### Export/Import
- Click "Export" to download your history as JSON
- Test importing the data back
- Verify data integrity

### Statistics
- Click "Statistics" to view browsing stats
- Check top domains and total entries

## Troubleshooting

### Extension Won't Load
- Ensure all files are present in the directory
- Check the Chrome Extensions page for error messages
- Verify manifest.json syntax

### Ctrl+H Not Working
- Make sure the extension is enabled
- Check if other extensions might be conflicting
- Reload the page and try again

### No History Showing
- Visit some regular websites (not chrome:// pages)
- Check browser console for errors
- Ensure storage permissions are granted

## Firefox Installation

To use with Firefox:
1. Go to `about:debugging`
2. Click "This Firefox"
3. Click "Load Temporary Add-on"
4. Select manifest.json from the directory

Note: Some features may need adjustment for Firefox compatibility.

## Development

To modify the extension:
1. Make changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon for your extension
4. Test your changes