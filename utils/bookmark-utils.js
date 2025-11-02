// Bookmark utility functions

const BookmarkUtils = {
  /**
   * Get all bookmarks as a flat array
   */
  async getAllBookmarks() {
    const tree = await browser.bookmarks.getTree();
    const bookmarks = [];

    function traverse(nodes) {
      for (const node of nodes) {
        if (node.url) {
          bookmarks.push(node);
        }
        if (node.children) {
          traverse(node.children);
        }
      }
    }

    traverse(tree);
    return bookmarks;
  },

  /**
   * Get bookmark tree structure
   */
  async getBookmarkTree() {
    return await browser.bookmarks.getTree();
  },

  /**
   * Normalize URL for comparison (remove protocol variations, trailing slashes, www)
   */
  normalizeUrl(url) {
    if (!url) return '';

    let normalized = url.toLowerCase().trim();

    // Remove protocol
    normalized = normalized.replace(/^https?:\/\//, '');

    // Remove www
    normalized = normalized.replace(/^www\./, '');

    // Remove trailing slash
    normalized = normalized.replace(/\/$/, '');

    // Remove common query parameters that don't affect content
    normalized = normalized.replace(/[?&](utm_source|utm_medium|utm_campaign|utm_content|utm_term)=[^&]*/g, '');
    normalized = normalized.replace(/\?$/, '');

    return normalized;
  },

  /**
   * Find duplicate bookmarks
   */
  async findDuplicates() {
    const allBookmarks = await this.getAllBookmarks();
    const urlMap = new Map();
    const duplicates = [];

    for (const bookmark of allBookmarks) {
      const normalizedUrl = this.normalizeUrl(bookmark.url);

      if (!urlMap.has(normalizedUrl)) {
        urlMap.set(normalizedUrl, []);
      }

      urlMap.get(normalizedUrl).push(bookmark);
    }

    // Find URLs that appear more than once
    for (const [url, bookmarks] of urlMap.entries()) {
      if (bookmarks.length > 1) {
        duplicates.push({
          url: url,
          originalUrl: bookmarks[0].url,
          count: bookmarks.length,
          bookmarks: bookmarks
        });
      }
    }

    return duplicates;
  },

  /**
   * Calculate similarity between two strings using Levenshtein distance
   */
  calculateSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    if (str1 === str2) return 100;

    const len1 = str1.length;
    const len2 = str2.length;

    // Create matrix
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(0));

    // Initialize first row and column
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;

    // Fill matrix
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,      // deletion
          matrix[i][j - 1] + 1,      // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    const distance = matrix[len1][len2];
    const maxLen = Math.max(len1, len2);
    const similarity = ((maxLen - distance) / maxLen) * 100;

    return Math.round(similarity * 100) / 100; // Round to 2 decimal places
  },

  /**
   * Find similar bookmarks based on URL similarity
   * Filters out dismissed groups
   */
  async findSimilarBookmarks(threshold = 70) {
    const allBookmarks = await this.getAllBookmarks();
    const similarGroups = [];
    const processed = new Set();

    for (let i = 0; i < allBookmarks.length; i++) {
      if (processed.has(allBookmarks[i].id)) continue;

      const bookmark1 = allBookmarks[i];
      const url1 = this.normalizeUrl(bookmark1.url);
      const similarBookmarks = [bookmark1];

      for (let j = i + 1; j < allBookmarks.length; j++) {
        if (processed.has(allBookmarks[j].id)) continue;

        const bookmark2 = allBookmarks[j];
        const url2 = this.normalizeUrl(bookmark2.url);

        // Skip exact duplicates (they're handled by findDuplicates)
        if (url1 === url2) continue;

        const similarity = this.calculateSimilarity(url1, url2);

        if (similarity >= threshold) {
          similarBookmarks.push({
            ...bookmark2,
            similarity: similarity
          });
          processed.add(bookmark2.id);
        }
      }

      if (similarBookmarks.length > 1) {
        // Add similarity to first bookmark as well
        similarBookmarks[0] = {
          ...similarBookmarks[0],
          similarity: 100 // The base bookmark is 100% similar to itself
        };

        // Sort by similarity (highest first)
        similarBookmarks.sort((a, b) => b.similarity - a.similarity);

        // Get bookmark IDs for this group
        const bookmarkIds = similarBookmarks.map(b => b.id);

        // Check if this group has been dismissed
        const isDismissed = await window.StorageUtils.isSimilarGroupDismissed(bookmarkIds);

        if (!isDismissed) {
          similarGroups.push({
            baseUrl: url1,
            baseBookmark: bookmark1,
            count: similarBookmarks.length,
            bookmarks: similarBookmarks,
            bookmarkIds: bookmarkIds, // Store IDs for dismissal tracking
            averageSimilarity: Math.round(
              similarBookmarks.reduce((sum, b) => sum + b.similarity, 0) / similarBookmarks.length
            )
          });
        }

        processed.add(bookmark1.id);
      }
    }

    // Sort groups by average similarity (highest first)
    similarGroups.sort((a, b) => b.averageSimilarity - a.averageSimilarity);

    return similarGroups;
  },

  /**
   * Remove a bookmark by ID
   */
  async removeBookmark(bookmarkId) {
    try {
      await browser.bookmarks.remove(bookmarkId);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Remove multiple bookmarks
   */
  async removeBookmarks(bookmarkIds) {
    const results = [];

    for (const id of bookmarkIds) {
      const result = await this.removeBookmark(id);
      results.push({ id, ...result });
    }

    return results;
  },

  /**
   * Get folder path for a bookmark
   */
  async getBookmarkPath(bookmarkId) {
    const path = [];
    let currentId = bookmarkId;

    try {
      while (currentId) {
        const nodes = await browser.bookmarks.get(currentId);
        if (nodes.length === 0) break;

        const node = nodes[0];
        if (node.title) {
          path.unshift(node.title);
        }

        currentId = node.parentId;
      }

      return path.join(' > ');
    } catch (error) {
      return 'Unknown';
    }
  },

  /**
   * Search bookmarks by title or URL
   */
  async searchBookmarks(query) {
    return await browser.bookmarks.search(query);
  },

  /**
   * Create a new folder
   */
  async createFolder(title, parentId) {
    return await browser.bookmarks.create({
      title: title,
      type: 'folder',
      parentId: parentId
    });
  },

  /**
   * Move bookmark to a different folder
   */
  async moveBookmark(bookmarkId, newParentId) {
    try {
      await browser.bookmarks.move(bookmarkId, { parentId: newParentId });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Get or create the archive folder
   */
  async getOrCreateArchiveFolder() {
    const ARCHIVE_FOLDER_NAME = '📁 Bookmark Archive';

    try {
      // Search for existing archive folder
      const results = await browser.bookmarks.search({ title: ARCHIVE_FOLDER_NAME });

      // Find a folder (not a bookmark) with this title
      const archiveFolder = results.find(item => !item.url);

      if (archiveFolder) {
        return archiveFolder;
      }

      // Create archive folder in the root "Other Bookmarks" location
      const tree = await browser.bookmarks.getTree();
      const otherBookmarks = tree[0].children.find(node => node.title === 'Other Bookmarks' || node.id === 'unfiled_____');

      const newFolder = await browser.bookmarks.create({
        parentId: otherBookmarks ? otherBookmarks.id : tree[0].id,
        title: ARCHIVE_FOLDER_NAME,
        type: 'folder'
      });

      return newFolder;
    } catch (error) {
      console.error('Error creating archive folder:', error);
      throw error;
    }
  },

  /**
   * Archive a bookmark (move to archive folder and mark as archived)
   */
  async archiveBookmark(bookmarkId) {
    try {
      // Get current bookmark info
      const bookmarks = await browser.bookmarks.get(bookmarkId);
      if (bookmarks.length === 0) {
        return { success: false, error: 'Bookmark not found' };
      }

      const bookmark = bookmarks[0];
      const originalParentId = bookmark.parentId;

      // Get or create archive folder
      const archiveFolder = await this.getOrCreateArchiveFolder();

      // Move bookmark to archive folder
      await browser.bookmarks.move(bookmarkId, { parentId: archiveFolder.id });

      // Update metadata
      const metadata = await window.StorageUtils.getBookmarkMetadata(bookmarkId);
      await window.StorageUtils.setBookmarkMetadata(bookmarkId, {
        ...metadata,
        archived: true,
        archivedDate: Date.now(),
        originalParentId: originalParentId
      });

      return { success: true, archiveFolderId: archiveFolder.id };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * Unarchive a bookmark (move back to original location)
   */
  async unarchiveBookmark(bookmarkId) {
    try {
      // Get metadata
      const metadata = await window.StorageUtils.getBookmarkMetadata(bookmarkId);

      if (!metadata.archived || !metadata.originalParentId) {
        return { success: false, error: 'Bookmark is not archived or original location unknown' };
      }

      // Try to move back to original location
      try {
        await browser.bookmarks.move(bookmarkId, { parentId: metadata.originalParentId });
      } catch (error) {
        // Original folder might not exist, move to root instead
        const tree = await browser.bookmarks.getTree();
        const otherBookmarks = tree[0].children.find(node => node.title === 'Other Bookmarks' || node.id === 'unfiled_____');
        await browser.bookmarks.move(bookmarkId, { parentId: otherBookmarks ? otherBookmarks.id : tree[0].id });
      }

      // Update metadata
      await window.StorageUtils.setBookmarkMetadata(bookmarkId, {
        ...metadata,
        archived: false,
        archivedDate: null,
        originalParentId: null
      });

      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.BookmarkUtils = BookmarkUtils;
}
