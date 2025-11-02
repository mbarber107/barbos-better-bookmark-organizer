// Storage utility functions for tags and metadata

const StorageUtils = {
  /**
   * Get all bookmark metadata (tags, last accessed, etc.)
   */
  async getAllMetadata() {
    const result = await browser.storage.local.get('bookmarkMetadata');
    return result.bookmarkMetadata || {};
  },

  /**
   * Get metadata for a specific bookmark
   */
  async getBookmarkMetadata(bookmarkId) {
    const allMetadata = await this.getAllMetadata();
    return allMetadata[bookmarkId] || {
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
  },

  /**
   * Set metadata for a bookmark
   */
  async setBookmarkMetadata(bookmarkId, metadata) {
    const allMetadata = await this.getAllMetadata();
    allMetadata[bookmarkId] = {
      ...allMetadata[bookmarkId],
      ...metadata
    };

    await browser.storage.local.set({ bookmarkMetadata: allMetadata });
  },

  /**
   * Add tags to a bookmark
   */
  async addTags(bookmarkId, tags) {
    const metadata = await this.getBookmarkMetadata(bookmarkId);
    const currentTags = metadata.tags || [];
    const newTags = [...new Set([...currentTags, ...tags])]; // Remove duplicates

    await this.setBookmarkMetadata(bookmarkId, {
      ...metadata,
      tags: newTags
    });
  },

  /**
   * Remove tags from a bookmark
   */
  async removeTags(bookmarkId, tagsToRemove) {
    const metadata = await this.getBookmarkMetadata(bookmarkId);
    const currentTags = metadata.tags || [];
    const newTags = currentTags.filter(tag => !tagsToRemove.includes(tag));

    await this.setBookmarkMetadata(bookmarkId, {
      ...metadata,
      tags: newTags
    });
  },

  /**
   * Get all unique tags across all bookmarks
   */
  async getAllTags() {
    const allMetadata = await this.getAllMetadata();
    const tagsSet = new Set();

    for (const bookmarkId in allMetadata) {
      const tags = allMetadata[bookmarkId].tags || [];
      tags.forEach(tag => tagsSet.add(tag));
    }

    return Array.from(tagsSet).sort();
  },

  /**
   * Find bookmarks by tag
   */
  async findBookmarksByTag(tag) {
    const allMetadata = await this.getAllMetadata();
    const bookmarkIds = [];

    for (const bookmarkId in allMetadata) {
      const tags = allMetadata[bookmarkId].tags || [];
      if (tags.includes(tag)) {
        bookmarkIds.push(bookmarkId);
      }
    }

    return bookmarkIds;
  },

  /**
   * Record bookmark access
   */
  async recordAccess(bookmarkId) {
    const metadata = await this.getBookmarkMetadata(bookmarkId);

    await this.setBookmarkMetadata(bookmarkId, {
      ...metadata,
      lastAccessed: Date.now(),
      accessCount: (metadata.accessCount || 0) + 1
    });
  },

  /**
   * Get settings from storage
   */
  async getSettings() {
    const result = await browser.storage.local.get('settings');
    return result.settings || {
      oldBookmarkThreshold: 365, // days
      autoScanOnStartup: false,
      confirmBeforeDelete: true,
      theme: 'light',
      reviewCount: 5, // number of random bookmarks to review
      reviewInterval: 180, // days between reviews (6 months default)
      archiveRetentionDays: 90, // days to keep archived bookmarks before deletion (3 months default)
      autoDeleteArchived: true // automatically delete archived bookmarks after retention period
    };
  },

  /**
   * Save settings to storage
   */
  async saveSettings(settings) {
    await browser.storage.local.set({ settings: settings });
  },

  /**
   * Find old/unused bookmarks based on last accessed date
   */
  async findOldBookmarks(thresholdDays) {
    const allMetadata = await this.getAllMetadata();
    const threshold = Date.now() - (thresholdDays * 24 * 60 * 60 * 1000);
    const oldBookmarks = [];

    for (const bookmarkId in allMetadata) {
      const metadata = allMetadata[bookmarkId];
      const lastAccessed = metadata.lastAccessed || metadata.dateAdded || 0;

      if (lastAccessed < threshold) {
        oldBookmarks.push({
          id: bookmarkId,
          lastAccessed: lastAccessed,
          accessCount: metadata.accessCount || 0,
          daysSinceAccess: Math.floor((Date.now() - lastAccessed) / (24 * 60 * 60 * 1000))
        });
      }
    }

    return oldBookmarks;
  },

  /**
   * Clean up metadata for deleted bookmarks
   */
  async cleanupMetadata(existingBookmarkIds) {
    const allMetadata = await this.getAllMetadata();
    const cleanedMetadata = {};

    for (const id of existingBookmarkIds) {
      if (allMetadata[id]) {
        cleanedMetadata[id] = allMetadata[id];
      }
    }

    await browser.storage.local.set({ bookmarkMetadata: cleanedMetadata });
  },

  /**
   * Export all data (bookmarks + metadata)
   */
  async exportData() {
    const allMetadata = await this.getAllMetadata();
    const settings = await this.getSettings();

    return {
      version: '1.0.0',
      exportDate: Date.now(),
      metadata: allMetadata,
      settings: settings
    };
  },

  /**
   * Import data
   */
  async importData(data) {
    if (data.metadata) {
      await browser.storage.local.set({ bookmarkMetadata: data.metadata });
    }
    if (data.settings) {
      await this.saveSettings(data.settings);
    }
  },

  /**
   * Mark a bookmark as reviewed
   */
  async markAsReviewed(bookmarkId) {
    const metadata = await this.getBookmarkMetadata(bookmarkId);

    await this.setBookmarkMetadata(bookmarkId, {
      ...metadata,
      lastReviewed: Date.now(),
      reviewCount: (metadata.reviewCount || 0) + 1
    });
  },

  /**
   * Get random bookmarks for review
   * Excludes bookmarks reviewed within the review interval and archived bookmarks
   */
  async getBookmarksForReview(count, reviewIntervalDays) {
    const allBookmarks = await browser.bookmarks.getTree();
    const allMetadata = await this.getAllMetadata();
    const reviewThreshold = Date.now() - (reviewIntervalDays * 24 * 60 * 60 * 1000);

    // Flatten bookmark tree
    const flatBookmarks = [];
    function traverse(nodes) {
      for (const node of nodes) {
        if (node.url) {
          flatBookmarks.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }
    traverse(allBookmarks);

    // Filter out recently reviewed bookmarks and archived bookmarks
    const eligibleBookmarks = flatBookmarks.filter(bookmark => {
      const metadata = allMetadata[bookmark.id];

      // Exclude archived bookmarks
      if (metadata && metadata.archived) {
        return false;
      }

      if (!metadata || !metadata.lastReviewed) {
        return true; // Never reviewed, eligible
      }
      return metadata.lastReviewed < reviewThreshold; // Last reviewed before threshold
    });

    // Shuffle and select random bookmarks
    const shuffled = eligibleBookmarks.sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, shuffled.length));
  },

  /**
   * Get all archived bookmarks
   */
  async getArchivedBookmarks() {
    const allMetadata = await this.getAllMetadata();
    const archivedBookmarks = [];

    for (const bookmarkId in allMetadata) {
      const metadata = allMetadata[bookmarkId];
      if (metadata.archived) {
        try {
          const bookmarks = await browser.bookmarks.get(bookmarkId);
          if (bookmarks.length > 0) {
            archivedBookmarks.push({
              ...bookmarks[0],
              archivedDate: metadata.archivedDate,
              originalParentId: metadata.originalParentId,
              daysSinceArchived: Math.floor((Date.now() - metadata.archivedDate) / (24 * 60 * 60 * 1000))
            });
          }
        } catch (error) {
          // Bookmark might have been deleted
          console.error('Error getting archived bookmark:', error);
        }
      }
    }

    return archivedBookmarks;
  },

  /**
   * Find archived bookmarks that should be deleted
   */
  async findExpiredArchivedBookmarks(retentionDays) {
    const allMetadata = await this.getAllMetadata();
    const threshold = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
    const expiredBookmarks = [];

    for (const bookmarkId in allMetadata) {
      const metadata = allMetadata[bookmarkId];
      if (metadata.archived && metadata.archivedDate < threshold) {
        expiredBookmarks.push({
          id: bookmarkId,
          archivedDate: metadata.archivedDate,
          daysSinceArchived: Math.floor((Date.now() - metadata.archivedDate) / (24 * 60 * 60 * 1000))
        });
      }
    }

    return expiredBookmarks;
  },

  /**
   * Get all dismissed similar bookmark groups
   */
  async getDismissedSimilarGroups() {
    const result = await browser.storage.local.get('dismissedSimilarGroups');
    return result.dismissedSimilarGroups || [];
  },

  /**
   * Dismiss a similar bookmark group
   * Groups are identified by a sorted array of bookmark IDs
   */
  async dismissSimilarGroup(bookmarkIds) {
    const dismissedGroups = await this.getDismissedSimilarGroups();

    // Sort the IDs to create a consistent identifier
    const groupKey = [...bookmarkIds].sort().join(',');

    // Check if this exact group is already dismissed
    if (!dismissedGroups.includes(groupKey)) {
      dismissedGroups.push(groupKey);
      await browser.storage.local.set({ dismissedSimilarGroups: dismissedGroups });
    }
  },

  /**
   * Check if a similar bookmark group is dismissed
   */
  async isSimilarGroupDismissed(bookmarkIds) {
    const dismissedGroups = await this.getDismissedSimilarGroups();
    const groupKey = [...bookmarkIds].sort().join(',');
    return dismissedGroups.includes(groupKey);
  },

  /**
   * Clear all dismissed similar bookmark groups
   */
  async clearDismissedSimilarGroups() {
    await browser.storage.local.set({ dismissedSimilarGroups: [] });
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.StorageUtils = StorageUtils;
}
