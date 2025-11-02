// Auto-tagging utility for bookmarks
// Uses domain knowledge and pattern analysis to suggest tags

const AutoTagger = {
  /**
   * Suggest tags for a single bookmark
   */
  async suggestTagsForBookmark(bookmark) {
    const suggestedTags = DomainKnowledge.suggestTags(bookmark);
    const existingMetadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
    const existingTags = existingMetadata.tags || [];

    return {
      bookmarkId: bookmark.id,
      bookmark: bookmark,
      suggestedTags: suggestedTags,
      existingTags: existingTags,
      newTags: suggestedTags.filter(tag => !existingTags.includes(tag)),
      folderSuggestion: DomainKnowledge.suggestFolder(suggestedTags)
    };
  },

  /**
   * Suggest tags for multiple bookmarks
   */
  async suggestTagsForBookmarks(bookmarks) {
    const suggestions = [];

    for (const bookmark of bookmarks) {
      const suggestion = await this.suggestTagsForBookmark(bookmark);
      if (suggestion.newTags.length > 0) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  },

  /**
   * Apply suggested tags to a bookmark
   */
  async applyTags(bookmarkId, tags) {
    await StorageUtils.addTags(bookmarkId, tags);
  },

  /**
   * Apply tags to multiple bookmarks
   */
  async applyTagsToBookmarks(bookmarkTagMap) {
    for (const [bookmarkId, tags] of Object.entries(bookmarkTagMap)) {
      await this.applyTags(bookmarkId, tags);
    }
  },

  /**
   * Auto-tag all bookmarks that don't have tags
   */
  async autoTagUntaggedBookmarks() {
    const allBookmarks = await BookmarkUtils.getAllBookmarks();
    const allMetadata = await StorageUtils.getAllMetadata();

    const untaggedBookmarks = allBookmarks.filter(bookmark => {
      const metadata = allMetadata[bookmark.id];
      return !metadata || !metadata.tags || metadata.tags.length === 0;
    });

    return await this.suggestTagsForBookmarks(untaggedBookmarks);
  },

  /**
   * Auto-tag all bookmarks (including already tagged ones)
   */
  async autoTagAllBookmarks() {
    const allBookmarks = await BookmarkUtils.getAllBookmarks();
    return await this.suggestTagsForBookmarks(allBookmarks);
  },

  /**
   * Get statistics about auto-tagging potential
   */
  async getAutoTagStats() {
    const allBookmarks = await BookmarkUtils.getAllBookmarks();
    const allMetadata = await StorageUtils.getAllMetadata();

    let totalBookmarks = allBookmarks.length;
    let taggedBookmarks = 0;
    let untaggedBookmarks = 0;
    let canSuggestTags = 0;

    for (const bookmark of allBookmarks) {
      const metadata = allMetadata[bookmark.id];
      const hasExistingTags = metadata && metadata.tags && metadata.tags.length > 0;

      if (hasExistingTags) {
        taggedBookmarks++;
      } else {
        untaggedBookmarks++;
      }

      // Check if we can suggest tags
      const suggestions = DomainKnowledge.suggestTags(bookmark);
      if (suggestions.length > 0) {
        canSuggestTags++;
      }
    }

    return {
      totalBookmarks,
      taggedBookmarks,
      untaggedBookmarks,
      canSuggestTags,
      potentialNewTags: canSuggestTags - taggedBookmarks
    };
  },

  /**
   * Get domain statistics - most common domains in bookmarks
   */
  async getDomainStats() {
    const allBookmarks = await BookmarkUtils.getAllBookmarks();
    const domainCounts = {};

    for (const bookmark of allBookmarks) {
      const domain = DomainKnowledge.extractDomain(bookmark.url);
      if (domain) {
        domainCounts[domain] = (domainCounts[domain] || 0) + 1;
      }
    }

    // Convert to array and sort by count
    const sortedDomains = Object.entries(domainCounts)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count);

    return sortedDomains;
  },

  /**
   * Learn from user's existing tags
   * Returns common patterns in user's tagging behavior
   */
  async analyzeUserTaggingPatterns() {
    const allMetadata = await StorageUtils.getAllMetadata();
    const allBookmarks = await BookmarkUtils.getAllBookmarks();
    const bookmarksById = {};

    allBookmarks.forEach(bookmark => {
      bookmarksById[bookmark.id] = bookmark;
    });

    const domainTagMap = {}; // domain -> tags used by user

    for (const [bookmarkId, metadata] of Object.entries(allMetadata)) {
      if (metadata.tags && metadata.tags.length > 0) {
        const bookmark = bookmarksById[bookmarkId];
        if (bookmark) {
          const domain = DomainKnowledge.extractDomain(bookmark.url);
          if (domain) {
            if (!domainTagMap[domain]) {
              domainTagMap[domain] = {};
            }
            metadata.tags.forEach(tag => {
              domainTagMap[domain][tag] = (domainTagMap[domain][tag] || 0) + 1;
            });
          }
        }
      }
    }

    return domainTagMap;
  },

  /**
   * Suggest tags based on user's historical tagging patterns
   */
  async suggestBasedOnUserPatterns(bookmark) {
    const domain = DomainKnowledge.extractDomain(bookmark.url);
    if (!domain) return [];

    const userPatterns = await this.analyzeUserTaggingPatterns();

    if (userPatterns[domain]) {
      // Get tags user has used for this domain before
      const tagCounts = userPatterns[domain];
      return Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1]) // Sort by frequency
        .map(([tag]) => tag);
    }

    return [];
  },

  /**
   * Combined suggestion using both knowledge base and user patterns
   */
  async getSmartSuggestions(bookmark) {
    // Get suggestions from knowledge base
    const knowledgeBaseTags = DomainKnowledge.suggestTags(bookmark);

    // Get suggestions from user patterns
    const userPatternTags = await this.suggestBasedOnUserPatterns(bookmark);

    // Combine, prioritizing user patterns
    const combinedTags = [...new Set([...userPatternTags, ...knowledgeBaseTags])];

    return {
      all: combinedTags,
      fromKnowledgeBase: knowledgeBaseTags,
      fromUserPatterns: userPatternTags,
      recommended: combinedTags.slice(0, 5) // Top 5 recommendations
    };
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.AutoTagger = AutoTagger;
}
