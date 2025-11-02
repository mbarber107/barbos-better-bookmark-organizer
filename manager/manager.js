// Manager page script

let currentView = 'review';
let allBookmarks = [];
let selectedBookmarks = new Set();
let filteredBookmarks = [];
let reviewBookmarks = [];

// Initialize on load
document.addEventListener('DOMContentLoaded', async () => {
  // Check URL parameters for initial view
  const urlParams = new URLSearchParams(window.location.search);
  const viewParam = urlParams.get('view');
  if (viewParam) {
    currentView = viewParam;
  }

  await loadData();
  setupEventListeners();
  updateView();
});

async function loadData() {
  showLoading(true);

  try {
    // Load all bookmarks
    allBookmarks = await BookmarkUtils.getAllBookmarks();

    // Update navigation counts
    document.getElementById('navCountAll').textContent = allBookmarks.length;

    // Load review bookmarks
    const settings = await StorageUtils.getSettings();
    reviewBookmarks = await StorageUtils.getBookmarksForReview(settings.reviewCount, settings.reviewInterval);
    document.getElementById('navCountReview').textContent = reviewBookmarks.length;

    // Load duplicates
    const duplicates = await BookmarkUtils.findDuplicates();
    const duplicateCount = duplicates.reduce((sum, dup) => sum + dup.count - 1, 0);
    document.getElementById('navCountDuplicates').textContent = duplicateCount;

    // Load similar bookmarks
    const similarGroups = await BookmarkUtils.findSimilarBookmarks(70);
    const similarCount = similarGroups.reduce((sum, group) => sum + group.count, 0);
    document.getElementById('navCountSimilar').textContent = similarCount;

    // Load old bookmarks
    const oldBookmarks = await StorageUtils.findOldBookmarks(settings.oldBookmarkThreshold);
    document.getElementById('navCountOld').textContent = oldBookmarks.length;

    // Load tags
    const allTags = await StorageUtils.getAllTags();
    document.getElementById('navCountTags').textContent = allTags.length;

    // Load archived bookmarks
    const archivedBookmarks = await StorageUtils.getArchivedBookmarks();
    document.getElementById('navCountArchive').textContent = archivedBookmarks.length;

    // Load auto-tag stats
    const autoTagStats = await AutoTagger.getAutoTagStats();
    document.getElementById('navCountAutoTag').textContent = autoTagStats.canSuggestTags;

  } catch (error) {
    console.error('Error loading data:', error);
  } finally {
    showLoading(false);
  }
}

function setupEventListeners() {
  // Navigation
  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const view = item.dataset.view;
      switchView(view);
    });
  });

  // Search
  document.getElementById('searchInput').addEventListener('input', (e) => {
    handleSearch(e.target.value);
  });

  // Toolbar buttons
  document.getElementById('selectAllBtn').addEventListener('click', selectAll);
  document.getElementById('deselectAllBtn').addEventListener('click', deselectAll);
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);
  document.getElementById('tagSelectedBtn').addEventListener('click', showTagModal);

  // Header buttons
  document.getElementById('refreshBtn').addEventListener('click', async () => {
    await loadData();
    updateView();
  });

  document.getElementById('settingsBtn').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
  });

  document.getElementById('exportBtn').addEventListener('click', exportData);

  // Tag modal
  document.querySelector('.modal-close').addEventListener('click', hideTagModal);
  document.getElementById('cancelTagBtn').addEventListener('click', hideTagModal);
  document.getElementById('saveTagBtn').addEventListener('click', saveTags);
}

function switchView(view) {
  currentView = view;

  // Update active nav item
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.view === view);
  });

  updateView();
}

async function updateView() {
  const contentArea = document.getElementById('contentArea');
  selectedBookmarks.clear();
  updateSelectionInfo();

  switch (currentView) {
    case 'review':
      document.getElementById('viewTitle').textContent = 'Review Queue';
      document.getElementById('viewDescription').textContent = 'Review random bookmarks to keep your collection organized';
      await renderReviewQueue();
      break;

    case 'all':
      document.getElementById('viewTitle').textContent = 'All Bookmarks';
      document.getElementById('viewDescription').textContent = 'Manage and organize your bookmarks';
      await renderAllBookmarks();
      break;

    case 'duplicates':
      document.getElementById('viewTitle').textContent = 'Duplicate Bookmarks';
      document.getElementById('viewDescription').textContent = 'Find and remove duplicate bookmarks';
      await renderDuplicates();
      break;

    case 'similar':
      document.getElementById('viewTitle').textContent = 'Similar Bookmarks';
      document.getElementById('viewDescription').textContent = 'Find bookmarks with similar URLs';
      await renderSimilarBookmarks();
      break;

    case 'old':
      document.getElementById('viewTitle').textContent = 'Old/Unused Bookmarks';
      document.getElementById('viewDescription').textContent = 'Bookmarks that haven\'t been accessed recently';
      await renderOldBookmarks();
      break;

    case 'archive':
      document.getElementById('viewTitle').textContent = 'Archive';
      document.getElementById('viewDescription').textContent = 'View and manage archived bookmarks';
      await renderArchive();
      break;

    case 'tags':
      document.getElementById('viewTitle').textContent = 'Tags';
      document.getElementById('viewDescription').textContent = 'Browse bookmarks by tags';
      await renderTags();
      break;

    case 'auto-tag':
      document.getElementById('viewTitle').textContent = 'Auto-Tag Bookmarks';
      document.getElementById('viewDescription').textContent = 'Automatically suggest and apply tags based on URL analysis';
      await renderAutoTag();
      break;
  }
}

async function renderReviewQueue() {
  const contentArea = document.getElementById('contentArea');

  if (reviewBookmarks.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h3>No bookmarks to review!</h3>
        <p>All bookmarks have been recently reviewed. Check back later!</p>
        <button id="loadMoreReviewBtnEmpty" class="btn btn-primary" style="margin-top: 20px;">
          <span>📚</span> Load More Bookmarks Anyway
        </button>
      </div>
    `;

    // Add event listener for load more button
    document.getElementById('loadMoreReviewBtnEmpty').addEventListener('click', async () => {
      await loadMoreReviewBookmarks();
    });
    return;
  }

  contentArea.innerHTML = '';

  // Add intro message
  const intro = document.createElement('div');
  intro.className = 'review-intro';
  intro.innerHTML = `
    <h3>Time to Review Your Bookmarks!</h3>
    <p>Below are ${reviewBookmarks.length} random bookmark(s) for you to review. Decide if you still need them or if they should be deleted. Reviewed bookmarks won't appear again for a while.</p>
  `;
  contentArea.appendChild(intro);

  // Render each bookmark as a review card
  for (const bookmark of reviewBookmarks) {
    const card = await createReviewCard(bookmark);
    contentArea.appendChild(card);
  }

  // Add "Load More" button at the bottom
  const loadMoreContainer = document.createElement('div');
  loadMoreContainer.style.textAlign = 'center';
  loadMoreContainer.style.marginTop = '30px';
  loadMoreContainer.innerHTML = `
    <button id="loadMoreReviewBtnBottom" class="btn btn-secondary" style="padding: 14px 28px;">
      <span>📚</span> Load More Bookmarks to Review
    </button>
  `;
  contentArea.appendChild(loadMoreContainer);

  // Add event listener for load more button
  document.getElementById('loadMoreReviewBtnBottom').addEventListener('click', async () => {
    await loadMoreReviewBookmarks();
  });
}

async function createReviewCard(bookmark) {
  const metadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
  const path = await BookmarkUtils.getBookmarkPath(bookmark.parentId);

  const card = document.createElement('div');
  card.className = 'review-card';
  card.dataset.bookmarkId = bookmark.id;

  // Header with favicon and info
  const header = document.createElement('div');
  header.className = 'review-card-header';

  const favicon = document.createElement('img');
  favicon.className = 'review-card-favicon';
  favicon.src = bookmark.url ? `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}&sz=32` : '';
  favicon.onerror = () => {
    favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" fill="%23ddd"/></svg>';
  };

  const info = document.createElement('div');
  info.className = 'review-card-info';

  const title = document.createElement('div');
  title.className = 'review-card-title';
  title.textContent = bookmark.title || 'Untitled';

  const url = document.createElement('div');
  url.className = 'review-card-url';
  url.textContent = bookmark.url || '';

  info.appendChild(title);
  info.appendChild(url);

  header.appendChild(favicon);
  header.appendChild(info);

  // Metadata
  const metaDiv = document.createElement('div');
  metaDiv.className = 'review-card-meta';

  if (path) {
    const pathSpan = document.createElement('span');
    pathSpan.textContent = `📁 ${path}`;
    metaDiv.appendChild(pathSpan);
  }

  if (metadata.accessCount > 0) {
    const accessSpan = document.createElement('span');
    accessSpan.textContent = `👁️ ${metadata.accessCount} visits`;
    metaDiv.appendChild(accessSpan);
  }

  if (metadata.lastAccessed) {
    const lastAccessedSpan = document.createElement('span');
    const daysSince = Math.floor((Date.now() - metadata.lastAccessed) / (24 * 60 * 60 * 1000));
    lastAccessedSpan.textContent = `🕒 Last visited ${daysSince} days ago`;
    metaDiv.appendChild(lastAccessedSpan);
  } else {
    const neverSpan = document.createElement('span');
    neverSpan.textContent = '🕒 Never visited';
    metaDiv.appendChild(neverSpan);
  }

  // Tags
  const tagsDiv = document.createElement('div');
  tagsDiv.className = 'review-card-tags';

  if (metadata.tags && metadata.tags.length > 0) {
    metadata.tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'tag';
      tagSpan.textContent = tag;
      tagsDiv.appendChild(tagSpan);
    });
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'review-card-actions';

  const visitBtn = document.createElement('button');
  visitBtn.className = 'review-action-btn visit';
  visitBtn.innerHTML = '<span>🔗</span> Visit';
  visitBtn.addEventListener('click', () => {
    browser.tabs.create({ url: bookmark.url });
  });

  const skipBtn = document.createElement('button');
  skipBtn.className = 'review-action-btn skip';
  skipBtn.innerHTML = '<span>⏭️</span> Skip';
  skipBtn.addEventListener('click', async () => {
    await handleSkipBookmark(bookmark.id);
    card.remove();
    await updateReviewCount();
  });

  const archiveBtn = document.createElement('button');
  archiveBtn.className = 'review-action-btn archive';
  archiveBtn.innerHTML = '<span>📦</span> Archive';
  archiveBtn.addEventListener('click', async () => {
    const result = await BookmarkUtils.archiveBookmark(bookmark.id);
    if (result.success) {
      card.remove();
      await loadData();
      await updateReviewCount();
    } else {
      alert('Error archiving bookmark: ' + result.error);
    }
  });

  const keepBtn = document.createElement('button');
  keepBtn.className = 'review-action-btn keep';
  keepBtn.innerHTML = '<span>✓</span> Keep';
  keepBtn.addEventListener('click', async () => {
    await handleKeepBookmark(bookmark.id);
    card.remove();
    await updateReviewCount();
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'review-action-btn delete';
  deleteBtn.innerHTML = '<span>✗</span> Delete';
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      await BookmarkUtils.removeBookmark(bookmark.id);
      card.remove();
      await loadData();
      await updateReviewCount();
    }
  });

  actions.appendChild(visitBtn);
  actions.appendChild(skipBtn);
  actions.appendChild(archiveBtn);
  actions.appendChild(keepBtn);
  actions.appendChild(deleteBtn);

  // Assemble card
  card.appendChild(header);
  card.appendChild(metaDiv);
  if (metadata.tags && metadata.tags.length > 0) {
    card.appendChild(tagsDiv);
  }
  card.appendChild(actions);

  return card;
}

async function handleSkipBookmark(bookmarkId) {
  // Just remove from review list without marking as reviewed
  reviewBookmarks = reviewBookmarks.filter(b => b.id !== bookmarkId);

  // If no more bookmarks to review, show completion state
  if (reviewBookmarks.length === 0) {
    await showReviewCompletion();
  }
}

async function handleKeepBookmark(bookmarkId) {
  await StorageUtils.markAsReviewed(bookmarkId);

  // Remove from review list
  reviewBookmarks = reviewBookmarks.filter(b => b.id !== bookmarkId);

  // If no more bookmarks to review, show completion state
  if (reviewBookmarks.length === 0) {
    await showReviewCompletion();
  }
}

async function showReviewCompletion() {
  const contentArea = document.getElementById('contentArea');
  contentArea.innerHTML = `
    <div class="empty-state">
      <div class="empty-state-icon">🎉</div>
      <h3>All done!</h3>
      <p>You've reviewed all available bookmarks. Great job keeping your collection organized!</p>
      <button id="loadMoreReviewBtn" class="btn btn-primary" style="margin-top: 20px;">
        <span>📚</span> Load More Bookmarks to Review
      </button>
    </div>
  `;

  // Add event listener for load more button
  document.getElementById('loadMoreReviewBtn').addEventListener('click', async () => {
    await loadMoreReviewBookmarks();
  });
}

async function updateReviewCount() {
  document.getElementById('navCountReview').textContent = reviewBookmarks.length;
}

async function loadMoreReviewBookmarks() {
  showLoading(true);

  try {
    const settings = await StorageUtils.getSettings();
    // Get more bookmarks - use the configured count
    const moreBookmarks = await StorageUtils.getBookmarksForReview(settings.reviewCount, settings.reviewInterval);

    if (moreBookmarks.length === 0) {
      // No more bookmarks available
      const contentArea = document.getElementById('contentArea');
      contentArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h3>No more bookmarks available!</h3>
          <p>You've reached the end of available bookmarks to review. All your bookmarks have been recently reviewed!</p>
        </div>
      `;
    } else {
      // Add new bookmarks to the review list
      reviewBookmarks = [...reviewBookmarks, ...moreBookmarks];

      // Update counts
      document.getElementById('navCountReview').textContent = reviewBookmarks.length;

      // Re-render the review queue
      await renderReviewQueue();
    }
  } catch (error) {
    console.error('Error loading more bookmarks:', error);
    alert('Error loading more bookmarks. Please try again.');
  } finally {
    showLoading(false);
  }
}

async function renderAllBookmarks() {
  const contentArea = document.getElementById('contentArea');
  filteredBookmarks = [...allBookmarks];

  if (filteredBookmarks.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📚</div>
        <h3>No bookmarks found</h3>
        <p>Start adding some bookmarks!</p>
      </div>
    `;
    return;
  }

  const bookmarkList = document.createElement('div');
  bookmarkList.className = 'bookmark-list';

  for (const bookmark of filteredBookmarks) {
    const metadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
    const path = await BookmarkUtils.getBookmarkPath(bookmark.parentId);

    const item = createBookmarkItem(bookmark, metadata, path);
    bookmarkList.appendChild(item);
  }

  contentArea.innerHTML = '';
  contentArea.appendChild(bookmarkList);
}

async function renderDuplicates() {
  const contentArea = document.getElementById('contentArea');
  const duplicates = await BookmarkUtils.findDuplicates();

  if (duplicates.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h3>No duplicates found</h3>
        <p>Your bookmarks are clean!</p>
      </div>
    `;
    return;
  }

  contentArea.innerHTML = '';

  for (const duplicate of duplicates) {
    const group = document.createElement('div');
    group.className = 'duplicate-group';

    const header = document.createElement('div');
    header.className = 'duplicate-header';
    header.textContent = `${duplicate.count} duplicates of: ${duplicate.originalUrl}`;
    group.appendChild(header);

    const list = document.createElement('div');
    list.className = 'bookmark-list';

    for (const bookmark of duplicate.bookmarks) {
      const metadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
      const path = await BookmarkUtils.getBookmarkPath(bookmark.parentId);
      const item = createBookmarkItem(bookmark, metadata, path);
      list.appendChild(item);
    }

    group.appendChild(list);
    contentArea.appendChild(group);
  }
}

async function renderSimilarBookmarks() {
  const contentArea = document.getElementById('contentArea');
  const similarGroups = await BookmarkUtils.findSimilarBookmarks(70);

  if (similarGroups.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h3>No similar bookmarks found</h3>
        <p>Your bookmarks don't have similar URLs!</p>
      </div>
    `;
    return;
  }

  contentArea.innerHTML = '';

  // Add sorting controls
  const sortControls = document.createElement('div');
  sortControls.className = 'sort-controls';
  sortControls.innerHTML = `
    <label>Sort by:</label>
    <select id="similarSortBy">
      <option value="similarity">Similarity %</option>
      <option value="count">Group Size</option>
      <option value="title">Title</option>
      <option value="url">URL</option>
    </select>
    <select id="similarSortOrder">
      <option value="desc">Descending</option>
      <option value="asc">Ascending</option>
    </select>
  `;
  contentArea.appendChild(sortControls);

  // Store groups for re-sorting
  window.currentSimilarGroups = similarGroups;

  // Render groups
  renderSimilarGroups(similarGroups);

  // Add sort event listeners
  document.getElementById('similarSortBy').addEventListener('change', handleSimilarSort);
  document.getElementById('similarSortOrder').addEventListener('change', handleSimilarSort);
}

async function renderSimilarGroups(groups) {
  const contentArea = document.getElementById('contentArea');

  // Remove existing groups (keep sort controls)
  const existingGroups = contentArea.querySelectorAll('.similar-group');
  existingGroups.forEach(group => group.remove());

  for (const group of groups) {
    const groupDiv = document.createElement('div');
    groupDiv.className = 'similar-group';

    const header = document.createElement('div');
    header.className = 'similar-header';
    header.innerHTML = `
      <span class="similar-count">${group.count} similar bookmarks</span>
      <span class="similar-avg">Avg. Similarity: ${group.averageSimilarity}%</span>
      <span class="similar-base-url">${group.baseUrl}</span>
    `;

    // Add dismiss button
    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'btn btn-sm dismiss-group-btn';
    dismissBtn.textContent = 'Dismiss Group';
    dismissBtn.addEventListener('click', async () => {
      if (confirm('Dismiss this group of similar bookmarks? New bookmarks matching this pattern will still appear.')) {
        await StorageUtils.dismissSimilarGroup(group.bookmarkIds);
        groupDiv.style.opacity = '0.5';
        groupDiv.style.transition = 'opacity 0.3s';
        setTimeout(async () => {
          await loadData();
          updateView();
        }, 300);
      }
    });
    header.appendChild(dismissBtn);

    groupDiv.appendChild(header);

    const list = document.createElement('div');
    list.className = 'bookmark-list';

    for (const bookmark of group.bookmarks) {
      const item = await createSimilarBookmarkItem(bookmark);
      list.appendChild(item);
    }

    groupDiv.appendChild(list);
    contentArea.appendChild(groupDiv);
  }
}

async function createSimilarBookmarkItem(bookmark) {
  const metadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
  const path = await BookmarkUtils.getBookmarkPath(bookmark.parentId);

  const item = document.createElement('div');
  item.className = 'bookmark-item';
  item.dataset.bookmarkId = bookmark.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'bookmark-checkbox';
  checkbox.checked = selectedBookmarks.has(bookmark.id);
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedBookmarks.add(bookmark.id);
    } else {
      selectedBookmarks.delete(bookmark.id);
    }
    updateSelectionInfo();
  });

  // Favicon
  const favicon = document.createElement('img');
  favicon.className = 'bookmark-favicon';
  favicon.src = bookmark.url ? `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}` : '';
  favicon.onerror = () => {
    favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
  };

  // Info
  const info = document.createElement('div');
  info.className = 'bookmark-info';

  const title = document.createElement('div');
  title.className = 'bookmark-title';
  title.textContent = bookmark.title || 'Untitled';

  const url = document.createElement('div');
  url.className = 'bookmark-url';
  url.textContent = bookmark.url || '';

  const meta = document.createElement('div');
  meta.className = 'bookmark-meta';

  if (path) {
    const pathSpan = document.createElement('span');
    pathSpan.textContent = `📁 ${path}`;
    meta.appendChild(pathSpan);
  }

  // Similarity badge
  if (bookmark.similarity !== undefined) {
    const similarityBadge = document.createElement('span');
    similarityBadge.className = 'similarity-badge';
    similarityBadge.textContent = `${bookmark.similarity}% similar`;

    // Color code based on similarity
    if (bookmark.similarity >= 90) {
      similarityBadge.style.background = '#27ae60';
    } else if (bookmark.similarity >= 80) {
      similarityBadge.style.background = '#f39c12';
    } else {
      similarityBadge.style.background = '#95a5a6';
    }

    meta.appendChild(similarityBadge);
  }

  info.appendChild(title);
  info.appendChild(url);
  info.appendChild(meta);

  // Tags
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'bookmark-tags';

  if (metadata.tags && metadata.tags.length > 0) {
    metadata.tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'tag';
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'bookmark-actions';

  const visitBtn = document.createElement('button');
  visitBtn.className = 'bookmark-action-btn';
  visitBtn.textContent = 'Visit';
  visitBtn.addEventListener('click', () => {
    browser.tabs.create({ url: bookmark.url });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'bookmark-action-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      await BookmarkUtils.removeBookmark(bookmark.id);
      await loadData();
      updateView();
    }
  });

  actions.appendChild(visitBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(checkbox);
  item.appendChild(favicon);
  item.appendChild(info);
  item.appendChild(tagsContainer);
  item.appendChild(actions);

  return item;
}

async function handleSimilarSort() {
  const sortBy = document.getElementById('similarSortBy').value;
  const sortOrder = document.getElementById('similarSortOrder').value;

  let sorted = [...window.currentSimilarGroups];

  // Sort groups
  sorted.sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'similarity':
        comparison = a.averageSimilarity - b.averageSimilarity;
        break;
      case 'count':
        comparison = a.count - b.count;
        break;
      case 'title':
        comparison = (a.baseBookmark.title || '').localeCompare(b.baseBookmark.title || '');
        break;
      case 'url':
        comparison = a.baseUrl.localeCompare(b.baseUrl);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  await renderSimilarGroups(sorted);
}

async function renderOldBookmarks() {
  const contentArea = document.getElementById('contentArea');
  const settings = await StorageUtils.getSettings();
  const oldBookmarks = await StorageUtils.findOldBookmarks(settings.oldBookmarkThreshold);

  if (oldBookmarks.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">✅</div>
        <h3>No old bookmarks found</h3>
        <p>All your bookmarks are being used!</p>
      </div>
    `;
    return;
  }

  const bookmarkList = document.createElement('div');
  bookmarkList.className = 'bookmark-list';

  for (const oldBookmark of oldBookmarks) {
    try {
      const bookmarks = await browser.bookmarks.get(oldBookmark.id);
      if (bookmarks.length > 0) {
        const bookmark = bookmarks[0];
        const metadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
        const path = await BookmarkUtils.getBookmarkPath(bookmark.parentId);

        const item = createBookmarkItem(bookmark, metadata, path, {
          daysSinceAccess: oldBookmark.daysSinceAccess
        });
        bookmarkList.appendChild(item);
      }
    } catch (error) {
      console.error('Error loading old bookmark:', error);
    }
  }

  contentArea.innerHTML = '';
  contentArea.appendChild(bookmarkList);
}

async function renderArchive() {
  const contentArea = document.getElementById('contentArea');
  const archivedBookmarks = await StorageUtils.getArchivedBookmarks();
  const settings = await StorageUtils.getSettings();

  if (archivedBookmarks.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📦</div>
        <h3>Archive is empty</h3>
        <p>Archived bookmarks will appear here</p>
      </div>
    `;
    return;
  }

  const bookmarkList = document.createElement('div');
  bookmarkList.className = 'bookmark-list';

  for (const archivedBookmark of archivedBookmarks) {
    const metadata = await StorageUtils.getBookmarkMetadata(archivedBookmark.id);

    const item = document.createElement('div');
    item.className = 'bookmark-item';
    item.dataset.bookmarkId = archivedBookmark.id;

    // Checkbox
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.className = 'bookmark-checkbox';
    checkbox.checked = selectedBookmarks.has(archivedBookmark.id);
    checkbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        selectedBookmarks.add(archivedBookmark.id);
      } else {
        selectedBookmarks.delete(archivedBookmark.id);
      }
      updateSelectionInfo();
    });

    // Favicon
    const favicon = document.createElement('img');
    favicon.className = 'bookmark-favicon';
    favicon.src = archivedBookmark.url ? `https://www.google.com/s2/favicons?domain=${new URL(archivedBookmark.url).hostname}` : '';
    favicon.onerror = () => {
      favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
    };

    // Info
    const info = document.createElement('div');
    info.className = 'bookmark-info';

    const title = document.createElement('div');
    title.className = 'bookmark-title';
    title.textContent = archivedBookmark.title || 'Untitled';

    const url = document.createElement('div');
    url.className = 'bookmark-url';
    url.textContent = archivedBookmark.url || '';

    const meta = document.createElement('div');
    meta.className = 'bookmark-meta';

    const archivedSpan = document.createElement('span');
    archivedSpan.textContent = `📦 Archived ${archivedBookmark.daysSinceArchived} days ago`;
    meta.appendChild(archivedSpan);

    const daysRemaining = settings.archiveRetentionDays - archivedBookmark.daysSinceArchived;
    if (daysRemaining > 0) {
      const remainingSpan = document.createElement('span');
      remainingSpan.textContent = `⏱️ ${daysRemaining} days until auto-delete`;
      if (daysRemaining <= 7) {
        remainingSpan.style.color = '#e74c3c';
        remainingSpan.style.fontWeight = 'bold';
      }
      meta.appendChild(remainingSpan);
    } else {
      const expiredSpan = document.createElement('span');
      expiredSpan.textContent = '⚠️ Eligible for deletion';
      expiredSpan.style.color = '#e74c3c';
      expiredSpan.style.fontWeight = 'bold';
      meta.appendChild(expiredSpan);
    }

    info.appendChild(title);
    info.appendChild(url);
    info.appendChild(meta);

    // Tags
    const tagsContainer = document.createElement('div');
    tagsContainer.className = 'bookmark-tags';

    if (metadata.tags && metadata.tags.length > 0) {
      metadata.tags.forEach(tag => {
        const tagSpan = document.createElement('span');
        tagSpan.className = 'tag';
        tagSpan.textContent = tag;
        tagsContainer.appendChild(tagSpan);
      });
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'bookmark-actions';

    const visitBtn = document.createElement('button');
    visitBtn.className = 'bookmark-action-btn';
    visitBtn.textContent = 'Visit';
    visitBtn.addEventListener('click', () => {
      browser.tabs.create({ url: archivedBookmark.url });
    });

    const unarchiveBtn = document.createElement('button');
    unarchiveBtn.className = 'bookmark-action-btn';
    unarchiveBtn.textContent = 'Unarchive';
    unarchiveBtn.style.background = '#27ae60';
    unarchiveBtn.style.color = 'white';
    unarchiveBtn.addEventListener('click', async () => {
      const result = await BookmarkUtils.unarchiveBookmark(archivedBookmark.id);
      if (result.success) {
        await loadData();
        updateView();
      } else {
        alert('Error unarchiving bookmark: ' + result.error);
      }
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'bookmark-action-btn';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Are you sure you want to permanently delete this bookmark?')) {
        await BookmarkUtils.removeBookmark(archivedBookmark.id);
        await loadData();
        updateView();
      }
    });

    actions.appendChild(visitBtn);
    actions.appendChild(unarchiveBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(checkbox);
    item.appendChild(favicon);
    item.appendChild(info);
    item.appendChild(tagsContainer);
    item.appendChild(actions);

    bookmarkList.appendChild(item);
  }

  contentArea.innerHTML = '';
  contentArea.appendChild(bookmarkList);
}

async function renderTags() {
  const contentArea = document.getElementById('contentArea');
  const allTags = await StorageUtils.getAllTags();

  if (allTags.length === 0) {
    contentArea.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🏷️</div>
        <h3>No tags found</h3>
        <p>Start tagging your bookmarks!</p>
      </div>
    `;
    return;
  }

  contentArea.innerHTML = '<div class="bookmark-list" id="tagsList"></div>';
  const tagsList = document.getElementById('tagsList');

  for (const tag of allTags) {
    const bookmarkIds = await StorageUtils.findBookmarksByTag(tag);

    const tagItem = document.createElement('div');
    tagItem.className = 'bookmark-item';
    tagItem.innerHTML = `
      <span class="tag">${tag}</span>
      <span style="margin-left: auto; color: #999;">${bookmarkIds.length} bookmarks</span>
    `;
    tagItem.style.cursor = 'pointer';
    tagItem.addEventListener('click', () => showBookmarksWithTag(tag));

    tagsList.appendChild(tagItem);
  }
}

async function showBookmarksWithTag(tag) {
  const bookmarkIds = await StorageUtils.findBookmarksByTag(tag);
  const contentArea = document.getElementById('contentArea');

  document.getElementById('viewTitle').textContent = `Tag: ${tag}`;

  const bookmarkList = document.createElement('div');
  bookmarkList.className = 'bookmark-list';

  for (const bookmarkId of bookmarkIds) {
    try {
      const bookmarks = await browser.bookmarks.get(bookmarkId);
      if (bookmarks.length > 0) {
        const bookmark = bookmarks[0];
        const metadata = await StorageUtils.getBookmarkMetadata(bookmark.id);
        const path = await BookmarkUtils.getBookmarkPath(bookmark.parentId);
        const item = createBookmarkItem(bookmark, metadata, path);
        bookmarkList.appendChild(item);
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    }
  }

  contentArea.innerHTML = '';
  contentArea.appendChild(bookmarkList);
}

function createBookmarkItem(bookmark, metadata, path, extra = {}) {
  const item = document.createElement('div');
  item.className = 'bookmark-item';
  item.dataset.bookmarkId = bookmark.id;

  // Checkbox
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'bookmark-checkbox';
  checkbox.checked = selectedBookmarks.has(bookmark.id);
  checkbox.addEventListener('change', (e) => {
    if (e.target.checked) {
      selectedBookmarks.add(bookmark.id);
    } else {
      selectedBookmarks.delete(bookmark.id);
    }
    updateSelectionInfo();
  });

  // Favicon
  const favicon = document.createElement('img');
  favicon.className = 'bookmark-favicon';
  favicon.src = bookmark.url ? `https://www.google.com/s2/favicons?domain=${new URL(bookmark.url).hostname}` : '';
  favicon.onerror = () => {
    favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"><rect width="16" height="16" fill="%23ddd"/></svg>';
  };

  // Info
  const info = document.createElement('div');
  info.className = 'bookmark-info';

  const title = document.createElement('div');
  title.className = 'bookmark-title';
  title.textContent = bookmark.title || 'Untitled';

  const url = document.createElement('div');
  url.className = 'bookmark-url';
  url.textContent = bookmark.url || '';

  const meta = document.createElement('div');
  meta.className = 'bookmark-meta';

  if (path) {
    const pathSpan = document.createElement('span');
    pathSpan.textContent = `📁 ${path}`;
    meta.appendChild(pathSpan);
  }

  if (extra.daysSinceAccess) {
    const daysSpan = document.createElement('span');
    daysSpan.textContent = `🕒 ${extra.daysSinceAccess} days since last access`;
    meta.appendChild(daysSpan);
  }

  if (metadata.accessCount > 0) {
    const accessSpan = document.createElement('span');
    accessSpan.textContent = `👁️ ${metadata.accessCount} visits`;
    meta.appendChild(accessSpan);
  }

  info.appendChild(title);
  info.appendChild(url);
  info.appendChild(meta);

  // Tags
  const tagsContainer = document.createElement('div');
  tagsContainer.className = 'bookmark-tags';

  if (metadata.tags && metadata.tags.length > 0) {
    metadata.tags.forEach(tag => {
      const tagSpan = document.createElement('span');
      tagSpan.className = 'tag';
      tagSpan.textContent = tag;
      tagsContainer.appendChild(tagSpan);
    });
  }

  // Actions
  const actions = document.createElement('div');
  actions.className = 'bookmark-actions';

  const visitBtn = document.createElement('button');
  visitBtn.className = 'bookmark-action-btn';
  visitBtn.textContent = 'Visit';
  visitBtn.addEventListener('click', () => {
    browser.tabs.create({ url: bookmark.url });
  });

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'bookmark-action-btn';
  deleteBtn.textContent = 'Delete';
  deleteBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to delete this bookmark?')) {
      await BookmarkUtils.removeBookmark(bookmark.id);
      await loadData();
      updateView();
    }
  });

  actions.appendChild(visitBtn);
  actions.appendChild(deleteBtn);

  item.appendChild(checkbox);
  item.appendChild(favicon);
  item.appendChild(info);
  item.appendChild(tagsContainer);
  item.appendChild(actions);

  return item;
}

function handleSearch(query) {
  if (!query.trim()) {
    updateView();
    return;
  }

  const lowerQuery = query.toLowerCase();
  filteredBookmarks = allBookmarks.filter(bookmark => {
    return (
      (bookmark.title && bookmark.title.toLowerCase().includes(lowerQuery)) ||
      (bookmark.url && bookmark.url.toLowerCase().includes(lowerQuery))
    );
  });

  renderAllBookmarks();
}

function selectAll() {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = true;
    const bookmarkId = checkbox.closest('.bookmark-item').dataset.bookmarkId;
    selectedBookmarks.add(bookmarkId);
  });
  updateSelectionInfo();
}

function deselectAll() {
  const checkboxes = document.querySelectorAll('.bookmark-checkbox');
  checkboxes.forEach(checkbox => {
    checkbox.checked = false;
  });
  selectedBookmarks.clear();
  updateSelectionInfo();
}

function updateSelectionInfo() {
  const count = selectedBookmarks.size;
  document.getElementById('selectionInfo').textContent = `${count} selected`;

  const deleteBtn = document.getElementById('deleteSelectedBtn');
  const tagBtn = document.getElementById('tagSelectedBtn');

  deleteBtn.disabled = count === 0;
  tagBtn.disabled = count === 0;
}

async function deleteSelected() {
  if (selectedBookmarks.size === 0) return;

  const count = selectedBookmarks.size;
  if (!confirm(`Are you sure you want to delete ${count} bookmark(s)?`)) {
    return;
  }

  showLoading(true);

  try {
    await BookmarkUtils.removeBookmarks(Array.from(selectedBookmarks));
    selectedBookmarks.clear();
    await loadData();
    updateView();
  } catch (error) {
    console.error('Error deleting bookmarks:', error);
    alert('Error deleting bookmarks. Please try again.');
  } finally {
    showLoading(false);
  }
}

async function showTagModal() {
  if (selectedBookmarks.size === 0) return;

  // Load existing tags
  const allTags = await StorageUtils.getAllTags();
  const suggestionsDiv = document.getElementById('existingTags');
  suggestionsDiv.innerHTML = '<p style="margin-bottom: 8px; color: #666;">Existing tags:</p>';

  allTags.forEach(tag => {
    const tagSpan = document.createElement('span');
    tagSpan.className = 'tag-suggestion';
    tagSpan.textContent = tag;
    tagSpan.addEventListener('click', () => {
      const input = document.getElementById('tagInput');
      const currentTags = input.value.split(',').map(t => t.trim()).filter(t => t);
      if (!currentTags.includes(tag)) {
        currentTags.push(tag);
        input.value = currentTags.join(', ');
      }
    });
    suggestionsDiv.appendChild(tagSpan);
  });

  document.getElementById('tagModal').style.display = 'flex';
  document.getElementById('tagInput').value = '';
  document.getElementById('tagInput').focus();
}

function hideTagModal() {
  document.getElementById('tagModal').style.display = 'none';
}

async function saveTags() {
  const input = document.getElementById('tagInput').value;
  const tags = input.split(',').map(t => t.trim()).filter(t => t);

  if (tags.length === 0) {
    alert('Please enter at least one tag');
    return;
  }

  showLoading(true);
  hideTagModal();

  try {
    for (const bookmarkId of selectedBookmarks) {
      await StorageUtils.addTags(bookmarkId, tags);
    }

    await loadData();
    updateView();
  } catch (error) {
    console.error('Error saving tags:', error);
    alert('Error saving tags. Please try again.');
  } finally {
    showLoading(false);
  }
}

async function exportData() {
  try {
    const data = await StorageUtils.exportData();
    const bookmarks = await BookmarkUtils.getAllBookmarks();

    const exportObj = {
      ...data,
      bookmarks: bookmarks
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmark-organizer-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Error exporting data. Please try again.');
  }
}

async function renderAutoTag() {
  const contentArea = document.getElementById('contentArea');

  // Get auto-tag statistics
  const stats = await AutoTagger.getAutoTagStats();

  // Create header with stats
  contentArea.innerHTML = `
    <div class="auto-tag-header">
      <div class="auto-tag-stats">
        <div class="stat-card">
          <div class="stat-number">${stats.totalBookmarks}</div>
          <div class="stat-label">Total Bookmarks</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.taggedBookmarks}</div>
          <div class="stat-label">Already Tagged</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.untaggedBookmarks}</div>
          <div class="stat-label">Untagged</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">${stats.canSuggestTags}</div>
          <div class="stat-label">Can Auto-Tag</div>
        </div>
      </div>
      <div class="auto-tag-actions">
        <button id="scanUntaggedBtn" class="btn btn-primary">
          🔍 Scan Untagged Bookmarks
        </button>
        <button id="scanAllBtn" class="btn btn-secondary">
          🔍 Scan All Bookmarks
        </button>
      </div>
    </div>
    <div id="autoTagResults" class="auto-tag-results"></div>
  `;

  // Add event listeners
  document.getElementById('scanUntaggedBtn').addEventListener('click', async () => {
    await scanAndShowSuggestions(false);
  });

  document.getElementById('scanAllBtn').addEventListener('click', async () => {
    await scanAndShowSuggestions(true);
  });
}

async function scanAndShowSuggestions(scanAll) {
  const resultsArea = document.getElementById('autoTagResults');
  resultsArea.innerHTML = '<div class="loading-message">🔍 Analyzing bookmarks...</div>';

  try {
    let suggestions;
    if (scanAll) {
      suggestions = await AutoTagger.autoTagAllBookmarks();
    } else {
      suggestions = await AutoTagger.autoTagUntaggedBookmarks();
    }

    if (suggestions.length === 0) {
      resultsArea.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">✅</div>
          <h3>No suggestions available</h3>
          <p>All bookmarks are either already tagged or don't match any patterns.</p>
        </div>
      `;
      return;
    }

    // Group suggestions by domain for better organization
    const domainGroups = {};
    suggestions.forEach(suggestion => {
      const domain = DomainKnowledge.extractDomain(suggestion.bookmark.url);
      if (!domainGroups[domain]) {
        domainGroups[domain] = [];
      }
      domainGroups[domain].push(suggestion);
    });

    // Render suggestions
    resultsArea.innerHTML = `
      <div class="suggestions-header">
        <h3>Found ${suggestions.length} bookmarks with tag suggestions</h3>
        <div class="suggestions-actions">
          <button id="applyAllSuggestionsBtn" class="btn btn-primary">
            ✨ Apply All Suggestions
          </button>
          <button id="clearSuggestionsBtn" class="btn btn-secondary">
            Clear
          </button>
        </div>
      </div>
      <div class="suggestions-list"></div>
    `;

    const suggestionsList = resultsArea.querySelector('.suggestions-list');

    // Render each suggestion
    for (const suggestion of suggestions) {
      const suggestionCard = await createSuggestionCard(suggestion);
      suggestionsList.appendChild(suggestionCard);
    }

    // Add event listener for apply all
    document.getElementById('applyAllSuggestionsBtn').addEventListener('click', async () => {
      if (confirm(`Apply suggested tags to ${suggestions.length} bookmarks?`)) {
        await applyAllSuggestions(suggestions);
      }
    });

    document.getElementById('clearSuggestionsBtn').addEventListener('click', () => {
      resultsArea.innerHTML = '';
    });

  } catch (error) {
    console.error('Error scanning bookmarks:', error);
    resultsArea.innerHTML = `
      <div class="error-message">
        ❌ Error scanning bookmarks. Please try again.
      </div>
    `;
  }
}

async function createSuggestionCard(suggestion) {
  const card = document.createElement('div');
  card.className = 'suggestion-card';
  card.dataset.bookmarkId = suggestion.bookmarkId;

  const bookmark = suggestion.bookmark;
  const domain = DomainKnowledge.extractDomain(bookmark.url);

  card.innerHTML = `
    <div class="suggestion-bookmark-info">
      <img class="suggestion-favicon" src="https://www.google.com/s2/favicons?domain=${domain}"
           onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22><rect width=%2216%22 height=%2216%22 fill=%22%23ddd%22/></svg>'">
      <div class="suggestion-details">
        <div class="suggestion-title">${bookmark.title || 'Untitled'}</div>
        <div class="suggestion-url">${bookmark.url}</div>
        <div class="suggestion-domain">Domain: ${domain}</div>
      </div>
    </div>
    <div class="suggestion-tags-section">
      <div class="existing-tags-label">
        ${suggestion.existingTags.length > 0 ? 'Current tags:' : 'No tags yet'}
      </div>
      <div class="existing-tags">
        ${suggestion.existingTags.map(tag => `<span class="tag tag-existing">${tag}</span>`).join('')}
      </div>
      <div class="suggested-tags-label">
        Suggested tags: <span class="suggestion-count">(${suggestion.newTags.length} new)</span>
      </div>
      <div class="suggested-tags">
        ${suggestion.newTags.map(tag => `
          <label class="tag-checkbox">
            <input type="checkbox" checked value="${tag}">
            <span class="tag tag-suggested">${tag}</span>
          </label>
        `).join('')}
      </div>
      ${suggestion.folderSuggestion ? `
        <div class="folder-suggestion">
          📁 Suggested folder: <strong>${suggestion.folderSuggestion}</strong>
        </div>
      ` : ''}
    </div>
    <div class="suggestion-actions">
      <button class="btn btn-sm btn-primary apply-suggestion-btn">
        ✅ Apply Selected Tags
      </button>
      <button class="btn btn-sm btn-secondary skip-suggestion-btn">
        Skip
      </button>
    </div>
  `;

  // Add event listeners
  const applyBtn = card.querySelector('.apply-suggestion-btn');
  applyBtn.addEventListener('click', async () => {
    const selectedTags = Array.from(card.querySelectorAll('.tag-checkbox input:checked'))
      .map(checkbox => checkbox.value);

    if (selectedTags.length > 0) {
      await AutoTagger.applyTags(suggestion.bookmarkId, selectedTags);
      card.style.opacity = '0.5';
      card.style.pointerEvents = 'none';
      applyBtn.textContent = '✅ Applied';
      applyBtn.disabled = true;

      // Show success message
      const successMsg = document.createElement('div');
      successMsg.className = 'success-message-inline';
      successMsg.textContent = `Applied ${selectedTags.length} tags!`;
      card.querySelector('.suggestion-actions').appendChild(successMsg);

      // Update count in navigation
      await loadData();
    }
  });

  const skipBtn = card.querySelector('.skip-suggestion-btn');
  skipBtn.addEventListener('click', () => {
    card.remove();
  });

  return card;
}

async function applyAllSuggestions(suggestions) {
  const resultsArea = document.getElementById('autoTagResults');
  resultsArea.innerHTML = '<div class="loading-message">✨ Applying tags to all bookmarks...</div>';

  try {
    let appliedCount = 0;
    for (const suggestion of suggestions) {
      await AutoTagger.applyTags(suggestion.bookmarkId, suggestion.newTags);
      appliedCount++;
    }

    resultsArea.innerHTML = `
      <div class="success-state">
        <div class="success-icon">✅</div>
        <h3>Successfully tagged ${appliedCount} bookmarks!</h3>
        <button id="scanAgainBtn" class="btn btn-primary">Scan Again</button>
      </div>
    `;

    document.getElementById('scanAgainBtn').addEventListener('click', () => {
      renderAutoTag();
    });

    // Update counts
    await loadData();

  } catch (error) {
    console.error('Error applying suggestions:', error);
    resultsArea.innerHTML = `
      <div class="error-message">
        ❌ Error applying tags. Some tags may have been applied.
      </div>
    `;
  }
}

function showLoading(show) {
  document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
}
