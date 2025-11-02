# Barbo's Better Bookmark Organizer

A powerful Firefox extension to help you organize, tag, and maintain your bookmarks efficiently.

## Features

### Core Functionality
- **🤖 Smart Auto-Tagging** (NEW in v1.1.0): Automatically suggest and apply tags based on URL analysis, domain patterns, and learned user preferences
- **Review Queue**: Randomly select bookmarks for periodic review to keep your collection organized
- **Bookmark Organization**: View and manage all your bookmarks in a clean, hierarchical interface
- **Duplicate Detection**: Find and remove duplicate bookmarks with smart URL normalization
- **Similar Bookmarks**: Find bookmarks with similar URLs using Levenshtein distance algorithm
- **Archive System**: Temporarily archive bookmarks with auto-deletion after configurable retention period
- **Old/Unused Bookmark Detection**: Identify bookmarks you haven't visited in a while
- **Tagging System**: Add custom tags to bookmarks for better organization
- **Usage Tracking**: Automatically track when you visit bookmarks

### User Interface
- **Quick Stats Popup**: See bookmark statistics at a glance
- **Full Management Page**: Comprehensive interface for managing all bookmarks
- **Search Functionality**: Quickly find bookmarks by title or URL
- **Bulk Operations**: Select and manage multiple bookmarks at once

### Data Management
- **Export/Import**: Backup and restore your bookmark metadata and settings
- **Cleanup Tools**: Remove metadata for deleted bookmarks
- **Customizable Settings**: Configure thresholds and preferences

## Installation

### From Source

1. Clone or download this repository
2. Open Firefox and navigate to `about:debugging`
3. Click "This Firefox" in the left sidebar
4. Click "Load Temporary Add-on"
5. Navigate to the extension directory and select the `manifest.json` file

### Creating a Permanent Installation

1. Package the extension as a `.xpi` file
2. Sign it through [addons.mozilla.org](https://addons.mozilla.org/developers/)
3. Install the signed `.xpi` file in Firefox

## Usage

### Getting Started

1. Click the Barbo's Better Bookmark Organizer icon in your Firefox toolbar
2. View quick statistics about your bookmarks
3. Click "Open Full Manager" to access all features

### Reviewing Bookmarks

The Review Queue feature helps you regularly maintain your bookmark collection:

1. Open the full manager - the Review Queue is the default home page
2. A configurable number of random bookmarks will be shown (default: 5)
3. For each bookmark, you can:
   - **Visit**: Open the bookmark in a new tab to check if it's still useful
   - **Skip for Now**: Remove from the current queue without marking as reviewed (will appear in future sessions)
   - **Archive**: Move to archive folder (auto-deleted after retention period, default: 90 days)
   - **Keep & Mark Reviewed**: Keep the bookmark and mark it as reviewed (won't appear again for 6 months by default)
   - **Delete**: Remove the bookmark if it's no longer needed
4. Once reviewed, bookmarks won't appear in the queue again until the review interval expires
5. Want more? Click "Load More Bookmarks to Review" to get additional random bookmarks
6. Configure the number of bookmarks and review interval in Settings

This feature helps you:
- Regularly audit your bookmarks
- Remove outdated or unnecessary bookmarks
- Ensure your collection stays relevant and useful
- Review bookmarks at your own pace with skip and load more options

### Using Auto-Tag 🤖 (NEW in v1.1.0)

The Auto-Tag feature uses intelligent analysis to suggest relevant tags for your bookmarks:

1. Navigate to the "Auto-Tag" view in the manager
2. View statistics: total bookmarks, already tagged, untagged, and how many can be auto-tagged
3. Click "Scan Untagged Bookmarks" to analyze only bookmarks without tags
4. Or click "Scan All Bookmarks" to get suggestions for all bookmarks
5. Review each suggestion card showing:
   - Bookmark details and favicon
   - Current tags (if any)
   - Suggested new tags with checkboxes
   - Folder suggestions based on tags
6. Select/deselect tags you want to apply
7. Click "Apply Selected Tags" for individual bookmarks
8. Or click "Apply All Suggestions" to tag all bookmarks at once

**How Auto-Tag Works:**
- **Curated Database**: Recognizes 70+ popular domains (GitHub, YouTube, Stack Overflow, etc.)
- **URL Pattern Detection**: Identifies paths like /blog, /docs, /wiki, /products
- **Subdomain Analysis**: Recognizes docs.*, blog.*, shop.* patterns
- **TLD Categorization**: Categorizes .edu, .gov, .org, .io domains
- **Title Keywords**: Extracts relevant keywords from bookmark titles
- **Learning**: Adapts to your tagging patterns over time

All processing is done locally - your data never leaves your browser!

### Finding Similar Bookmarks

1. Navigate to the "Similar" view in the manager
2. View groups of bookmarks with similar URLs (70%+ similarity threshold)
3. Sort by similarity percentage, group size, title, or URL
4. Review each group and delete redundant bookmarks
5. Click "Dismiss Group" to hide groups you've already reviewed
6. Note: New bookmarks matching the pattern will still appear (only the exact group is dismissed)

### Archiving Bookmarks

1. Archive bookmarks from the Review Queue or use the Archive action on any bookmark
2. View all archived bookmarks in the "Archive" section
3. See how many days remain until auto-deletion
4. Unarchive bookmarks to restore them to their original location
5. Configure retention period in Settings (default: 90 days)
6. Enable/disable auto-deletion of expired archives in Settings

### Finding Duplicates

1. Click "Find Duplicates" in the popup or navigate to the Duplicates view in the manager
2. Review grouped duplicate bookmarks
3. Select duplicates you want to remove
4. Click "Delete Selected" to clean up

### Managing Old Bookmarks

1. Navigate to the "Old/Unused" view
2. Review bookmarks that haven't been accessed recently
3. Select bookmarks to archive or delete
4. Use the Settings page to adjust the "old bookmark" threshold

### Tagging Bookmarks

1. Select one or more bookmarks in the manager
2. Click "Add Tags"
3. Enter tags separated by commas
4. Click existing tags for quick insertion
5. Save tags

### Customizing Settings

1. Click the settings icon in the popup or manager
2. Adjust the old bookmark threshold (default: 365 days)
3. Configure bookmark review settings:
   - Number of bookmarks to review (1-20, default: 5)
   - Review interval in days (1-730, default: 180 days / 6 months)
4. Configure archive settings:
   - Archive retention period in days (1-365, default: 90 days)
   - Enable/disable auto-deletion of expired archives
5. Enable/disable auto-scan on startup
6. Configure confirmation dialogs
7. Choose your preferred theme

## Project Structure

```
barbos-better-bookmark-organizer/
├── manifest.json              # Extension manifest
├── background/
│   └── background.js          # Background script for tracking
├── popup/
│   ├── popup.html            # Popup interface
│   ├── popup.css             # Popup styles
│   └── popup.js              # Popup logic
├── manager/
│   ├── manager.html          # Full manager interface
│   ├── manager.css           # Manager styles
│   └── manager.js            # Manager logic
├── options/
│   ├── options.html          # Settings page
│   ├── options.css           # Settings styles
│   └── options.js            # Settings logic
├── utils/
│   ├── bookmark-utils.js     # Bookmark utility functions
│   └── storage-utils.js      # Storage utility functions
├── icons/
│   ├── icon-48.png           # 48x48 icon
│   └── icon-96.png           # 96x96 icon
└── README.md                 # This file
```

## Technical Details

### Permissions

The extension requires the following permissions:

- `bookmarks`: Read and modify bookmarks
- `storage`: Store metadata and settings
- `tabs`: Track bookmark usage
- `history`: Access visit history for tracking

### Storage

Bookmark metadata is stored in `browser.storage.local` with the following structure:

```javascript
{
  bookmarkMetadata: {
    [bookmarkId]: {
      tags: [],
      lastAccessed: timestamp,
      accessCount: number,
      dateAdded: timestamp,
      lastReviewed: timestamp,
      reviewCount: number,
      archived: boolean,
      archivedDate: timestamp,
      originalParentId: string
    }
  },
  settings: {
    oldBookmarkThreshold: 365,
    autoScanOnStartup: false,
    confirmBeforeDelete: true,
    reviewCount: 5,
    reviewInterval: 180,
    archiveRetentionDays: 90,
    autoDeleteArchived: true,
    theme: 'light'
  },
  dismissedSimilarGroups: [
    "bookmarkId1,bookmarkId2,bookmarkId3"  // Sorted comma-separated bookmark IDs
  ]
}
```

### Algorithms

**Duplicate Detection**: Smart URL normalization to detect duplicates:
- Removes protocol variations (http/https)
- Removes www prefix
- Removes trailing slashes
- Removes common tracking parameters (UTM parameters)

**Similar Bookmarks**: Levenshtein distance algorithm:
- Calculates edit distance between normalized URLs
- Groups bookmarks with 70%+ similarity
- Sorts by average similarity percentage
- Allows dismissal of specific bookmark groups (by ID set, not pattern)

## Development

### Prerequisites

- Firefox 57 or later
- Basic knowledge of JavaScript and WebExtensions API

### Building

No build step is required. The extension runs directly from source.

### Testing

1. Load the extension as a temporary add-on
2. Test all features in the manager interface
3. Check the browser console for errors
4. Test bookmark tracking by visiting bookmarked URLs

## Known Limitations

- Bookmark usage tracking only works for bookmarks visited while the extension is active
- Icon files are placeholder images - replace with custom icons for production
- Theme setting currently only stores preference (dark mode not fully implemented)

## Future Enhancements

- Broken link detection (check for 404s)
- Drag-and-drop bookmark reorganization
- Keyboard shortcuts
- Undo/redo functionality
- Cloud sync support
- Statistics dashboard
- Import from other browsers

## License

This project is open source. Feel free to use and modify as needed.

## Contributing

Contributions are welcome! Please feel free to submit issues and pull requests.

## About the Name

"Barbo's Better Bookmark Organizer" - Because your bookmarks deserve the best organization!

## Support

For issues, questions, or suggestions, please open an issue in the repository.
