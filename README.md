# Custom Emojis for Google Meet

A Chrome extension that allows you to add and use custom emojis as reactions in Google Meet. Custom emoji reactions are broadcast to all participants who have the extension installed!

## Features

- ✅ Add custom text emojis (Unicode characters)
- ✅ Upload custom emoji images
- ✅ Easy-to-use popup interface for managing emojis
- ✅ Custom emojis appear in Google Meet's native reactions bar
- ✅ **Real-time broadcast** - Custom reactions visible to all participants with the extension
- ✅ Floating reaction animations
- ✅ Persistent storage across sessions
- ✅ Auto-reconnection if server connection drops

## Installation

### Step 1: Start the Relay Server

For custom emojis to be visible to other participants, you need to run the relay server:

```bash
cd server
npm install
npm start
```

The server will run on `http://localhost:8080`. See `server/README.md` for production deployment options.

**Note**: The relay server is required for cross-participant reactions. Without it, reactions only show on your screen.

### Step 2: Generate Icons

Before installing the extension, you need to generate the icon files:

#### Option A: Using Node.js (Recommended)
```bash
npm install
npm run generate-icons
```

#### Option B: Manual Creation
If you don't want to use Node.js, create three PNG files manually:
- `icons/icon16.png` (16x16 pixels)
- `icons/icon48.png` (48x48 pixels)
- `icons/icon128.png` (128x128 pixels)

You can:
1. Convert the provided `icons/icon.svg` to PNG using an online converter
2. Use any emoji image you like
3. Create simple colored squares as placeholders

### Step 3: Load the Extension

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in the top right)
3. Click "Load unpacked"
4. Select the `gmeet-custom-emojis` folder
5. The extension should now appear in your extensions list

## Usage

### Adding Custom Emojis

1. Click the extension icon in your Chrome toolbar
2. In the popup:
   - **For text emojis**: Enter an emoji character and a shortcode (e.g., `:custom:`)
   - **For image emojis**: Enter a shortcode, then click "Or upload image" to upload an image file
3. Click "Add Emoji"
4. Your emoji will appear in the grid below

### Using Custom Emojis in Google Meet

1. **Make sure the relay server is running** (`npm start` in the `server` directory)
2. Join a Google Meet call
3. Your custom emojis will appear in the reactions bar at the bottom
4. Click any custom emoji - it will show a floating animation
5. **All participants with the extension will see your reaction!**

### Managing Custom Emojis

- **Copy to clipboard**: Click any emoji in the popup to copy it
- **Delete emoji**: Hover over an emoji and click the × button
- **View shortcodes**: Shortcodes are displayed under each emoji

## File Structure

```
gmeet-custom-emojis/
├── manifest.json          # Extension configuration
├── popup.html            # Popup UI structure
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── content.js            # Google Meet integration
├── content.css           # Custom styles for Meet
├── background.js         # Background service worker
├── icons/                # Extension icons
│   ├── icon.svg         # SVG source
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md            # This file
```

## How It Works

1. **Popup Interface**: Manages your custom emoji library with add/delete functionality
2. **Chrome Storage**: Stores emojis persistently using `chrome.storage.sync`
3. **Content Script**: Injects an emoji picker button into Google Meet's chat interface
4. **Background Worker**: Handles storage initialization and cross-component communication

## Limitations

- Custom image emojis are inserted as shortcodes (e.g., `:custom:`) in the current version
- The extension only works on Google Meet (`meet.google.com`)
- Maximum storage limit is subject to Chrome's sync storage quota (~100KB)

## Future Enhancements

- Render custom images directly in chat
- Import/export emoji collections
- Emoji categories and search
- Keyboard shortcuts for quick access
- Support for other video conferencing platforms

## Troubleshooting

**Extension doesn't appear in Google Meet:**
- Make sure you're on `meet.google.com`
- Refresh the Meet page after installing the extension
- Check that the extension is enabled in `chrome://extensions/`

**Emoji button not showing:**
- The button appears near the chat input box
- Try waiting a few seconds after the page loads
- Check the browser console for errors

**Custom emojis not saving:**
- Check your Chrome sync storage isn't full
- Try disabling and re-enabling the extension

## Development

To modify the extension:

1. Make your changes to the source files
2. Go to `chrome://extensions/`
3. Click the refresh icon on the extension card
4. Reload any Google Meet tabs

## License

MIT License - Feel free to use and modify as needed!
