// Popup script

// Load stats on popup open
document.addEventListener('DOMContentLoaded', async () => {
  await loadStats();
  setupEventListeners();
});

async function loadStats() {
  try {
    // Get all bookmarks
    const allBookmarks = await BookmarkUtils.getAllBookmarks();
    document.getElementById('totalBookmarks').textContent = allBookmarks.length;

    // Get duplicates count
    const duplicates = await BookmarkUtils.findDuplicates();
    const duplicateCount = duplicates.reduce((sum, dup) => sum + dup.count - 1, 0);
    document.getElementById('duplicateCount').textContent = duplicateCount;

    // Get old bookmarks count
    const settings = await StorageUtils.getSettings();
    const oldBookmarks = await StorageUtils.findOldBookmarks(settings.oldBookmarkThreshold);
    document.getElementById('oldBookmarksCount').textContent = oldBookmarks.length;

    // Get tag count
    const allTags = await StorageUtils.getAllTags();
    document.getElementById('tagCount').textContent = allTags.length;

  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

function setupEventListeners() {
  // Open full manager
  document.getElementById('openManager').addEventListener('click', () => {
    browser.tabs.create({
      url: browser.runtime.getURL('manager/manager.html')
    });
    window.close();
  });

  // Find duplicates
  document.getElementById('findDuplicates').addEventListener('click', () => {
    browser.tabs.create({
      url: browser.runtime.getURL('manager/manager.html?view=duplicates')
    });
    window.close();
  });

  // Find old bookmarks
  document.getElementById('findOldBookmarks').addEventListener('click', () => {
    browser.tabs.create({
      url: browser.runtime.getURL('manager/manager.html?view=old')
    });
    window.close();
  });

  // Open settings
  document.getElementById('openSettings').addEventListener('click', () => {
    browser.runtime.openOptionsPage();
    window.close();
  });
}
