// Background script for tracking bookmark usage

// Track when tabs are created or updated
browser.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    await checkAndRecordBookmarkAccess(tab.url);
  }
});

browser.tabs.onCreated.addListener(async (tab) => {
  if (tab.url) {
    await checkAndRecordBookmarkAccess(tab.url);
  }
});

/**
 * Check if the URL matches any bookmark and record access
 */
async function checkAndRecordBookmarkAccess(url) {
  try {
    // Search for bookmarks with this URL
    const bookmarks = await browser.bookmarks.search({ url: url });

    if (bookmarks.length > 0) {
      // Record access for all matching bookmarks
      for (const bookmark of bookmarks) {
        await recordBookmarkAccess(bookmark.id);
      }
    }
  } catch (error) {
    console.error('Error checking bookmark access:', error);
  }
}

/**
 * Record bookmark access in storage
 */
async function recordBookmarkAccess(bookmarkId) {
  try {
    const result = await browser.storage.local.get('bookmarkMetadata');
    const metadata = result.bookmarkMetadata || {};

    if (!metadata[bookmarkId]) {
      metadata[bookmarkId] = {
        tags: [],
        lastAccessed: null,
        accessCount: 0,
        dateAdded: Date.now(),
        lastReviewed: null,
        reviewCount: 0,
        archived: false,
        archivedDate: null,
        originalParentId: null
      };
    }

    metadata[bookmarkId].lastAccessed = Date.now();
    metadata[bookmarkId].accessCount = (metadata[bookmarkId].accessCount || 0) + 1;

    await browser.storage.local.set({ bookmarkMetadata: metadata });
  } catch (error) {
    console.error('Error recording bookmark access:', error);
  }
}

/**
 * Initialize metadata for existing bookmarks
 */
async function initializeBookmarkMetadata() {
  try {
    const tree = await browser.bookmarks.getTree();
    const result = await browser.storage.local.get('bookmarkMetadata');
    const metadata = result.bookmarkMetadata || {};

    function traverse(nodes) {
      for (const node of nodes) {
        if (node.url && !metadata[node.id]) {
          // Initialize metadata for bookmarks that don't have it yet
          metadata[node.id] = {
            tags: [],
            lastAccessed: null,
            accessCount: 0,
            dateAdded: node.dateAdded || Date.now(),
            lastReviewed: null,
            reviewCount: 0,
            archived: false,
            archivedDate: null,
            originalParentId: null
          };
        }

        if (node.children) {
          traverse(node.children);
        }
      }
    }

    traverse(tree);
    await browser.storage.local.set({ bookmarkMetadata: metadata });
  } catch (error) {
    console.error('Error initializing bookmark metadata:', error);
  }
}

/**
 * Clean up metadata for deleted bookmarks
 */
async function cleanupDeletedBookmarks() {
  try {
    const tree = await browser.bookmarks.getTree();
    const existingIds = new Set();

    function traverse(nodes) {
      for (const node of nodes) {
        if (node.url) {
          existingIds.add(node.id);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }

    traverse(tree);

    const result = await browser.storage.local.get('bookmarkMetadata');
    const metadata = result.bookmarkMetadata || {};
    const cleanedMetadata = {};

    for (const id of existingIds) {
      if (metadata[id]) {
        cleanedMetadata[id] = metadata[id];
      }
    }

    await browser.storage.local.set({ bookmarkMetadata: cleanedMetadata });
  } catch (error) {
    console.error('Error cleaning up metadata:', error);
  }
}

// Listen for bookmark removal
browser.bookmarks.onRemoved.addListener(async (bookmarkId, removeInfo) => {
  try {
    const result = await browser.storage.local.get('bookmarkMetadata');
    const metadata = result.bookmarkMetadata || {};

    if (metadata[bookmarkId]) {
      delete metadata[bookmarkId];
      await browser.storage.local.set({ bookmarkMetadata: metadata });
    }
  } catch (error) {
    console.error('Error removing bookmark metadata:', error);
  }
});

// Listen for new bookmarks
browser.bookmarks.onCreated.addListener(async (bookmarkId, bookmark) => {
  if (bookmark.url) {
    try {
      const result = await browser.storage.local.get('bookmarkMetadata');
      const metadata = result.bookmarkMetadata || {};

      metadata[bookmarkId] = {
        tags: [],
        lastAccessed: null,
        accessCount: 0,
        dateAdded: bookmark.dateAdded || Date.now(),
        lastReviewed: null,
        reviewCount: 0,
        archived: false,
        archivedDate: null,
        originalParentId: null
      };

      await browser.storage.local.set({ bookmarkMetadata: metadata });
    } catch (error) {
      console.error('Error creating bookmark metadata:', error);
    }
  }
});

/**
 * Clean up expired archived bookmarks
 */
async function cleanupExpiredArchives() {
  try {
    const result = await browser.storage.local.get('settings');
    const settings = result.settings || {
      archiveRetentionDays: 90,
      autoDeleteArchived: true
    };

    if (!settings.autoDeleteArchived) {
      return; // Auto-delete is disabled
    }

    // Get metadata
    const metadataResult = await browser.storage.local.get('bookmarkMetadata');
    const allMetadata = metadataResult.bookmarkMetadata || {};

    const threshold = Date.now() - (settings.archiveRetentionDays * 24 * 60 * 60 * 1000);
    let deletedCount = 0;

    for (const bookmarkId in allMetadata) {
      const metadata = allMetadata[bookmarkId];

      if (metadata.archived && metadata.archivedDate && metadata.archivedDate < threshold) {
        try {
          await browser.bookmarks.remove(bookmarkId);
          deletedCount++;
          console.log(`Deleted expired archived bookmark: ${bookmarkId}`);
        } catch (error) {
          console.error(`Error deleting archived bookmark ${bookmarkId}:`, error);
        }
      }
    }

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} expired archived bookmark(s)`);
    }
  } catch (error) {
    console.error('Error cleaning up expired archives:', error);
  }
}

// Initialize on startup
browser.runtime.onStartup.addListener(async () => {
  await initializeBookmarkMetadata();

  // Check if auto-scan is enabled
  const result = await browser.storage.local.get('settings');
  const settings = result.settings || {};

  if (settings.autoScanOnStartup) {
    await cleanupDeletedBookmarks();
  }

  // Clean up expired archives
  await cleanupExpiredArchives();
});

// Also initialize on install
browser.runtime.onInstalled.addListener(async () => {
  await initializeBookmarkMetadata();
});

console.log('Barbo\'s Better Bookmark Organizer background script loaded');
