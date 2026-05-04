# Sable Closet Companion - Browser Extension

A Chrome browser extension that allows users to add clothing items from any website directly to their Sable digital closet.

## Features

- **Automatic Product Detection**: Detects fashion items on popular retailer websites
- **One-Click Add to Closet**: Quickly add items to your Sable wardrobe
- **Multi-Retailer Support**: Works with Amazon, ASOS, Zara, H&M, Nordstrom, and more
- **Smart Categorization**: Automatically categorizes clothing types
- **Offline Storage**: Saves items locally until synced with your Sable account

## Installation

### For Development

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `browser-extension` folder
5. The Sable icon should appear in your extensions toolbar

### For Users

1. Visit the Chrome Web Store (link TBD)
2. Click "Add to Chrome"
3. Grant necessary permissions
4. Start adding items to your closet!

## How to Use

1. **Browse Fashion Websites**: Navigate to any clothing product page on supported retailers
2. **Click the Extension Icon**: The Sable icon will show a badge when a product is detected
3. **Review Product Details**: The popup will display the detected product information
4. **Select Category**: Choose the appropriate clothing type
5. **Add Notes & Tags**: (Optional) Add custom tags and notes
6. **Add to Closet**: Click the button to save the item
7. **Sync**: Items will sync to your Sable account when you're logged in

## Supported Retailers

- Amazon
- ASOS
- Zara
- H&M
- Nordstrom
- And many more! (Generic detection works on most fashion sites)

## Permissions

The extension requires the following permissions:

- **activeTab**: To read product information from the current page
- **storage**: To save items locally before syncing
- **host_permissions**: To detect products across all websites

## Privacy

- We only collect product information from fashion/clothing pages
- No personal browsing data is stored or transmitted
- Items are saved locally until you choose to sync with your Sable account

## Troubleshooting

### Product Not Detected
- Make sure you're on a product detail page (not a category or search page)
- Try refreshing the page
- The site might use non-standard product markup

### Items Not Syncing
- Check that you're logged into your Sable account
- Check your internet connection
- Items are saved locally until sync succeeds

### Extension Icon Not Showing Badge
- The page might not contain fashion/clothing items
- Try navigating to a product page

## Development

### File Structure

```
browser-extension/
├── manifest.json           # Extension configuration
├── popup/
│   ├── popup.html         # Extension popup UI
│   ├── popup.css          # Popup styles
│   └── popup.js           # Popup logic
├── content/
│   └── content.js         # Content script for product detection
├── background/
│   └── background.js      # Background service worker
└── assets/
    └── icons/             # Extension icons (add your icons here)
```

### Building for Production

1. Update version in `manifest.json`
2. Test thoroughly on multiple retailer sites
3. Create icons for the extension:
   - icon-16.png (16x16)
   - icon-48.png (48x48)
   - icon-128.png (128x128)
4. Zip the `browser-extension` folder
5. Upload to Chrome Web Store

### Adding New Retailer Support

Edit `content/content.js` and add a new entry to `RETAILER_PATTERNS`:

```javascript
newretailer: {
  domain: 'newretailer.com',
  selectors: {
    title: '.product-title',
    price: '.product-price',
    image: '.product-image img',
    brand: '.product-brand',
    category: '.breadcrumbs'
  }
}
```

## Contributing

Contributions are welcome! Please submit pull requests or open issues on our GitHub repository.

## License

Copyright © 2026 Sable. All rights reserved.

## Support

For support, please contact support@getsable.ai or visit https://getsable.ai/help
