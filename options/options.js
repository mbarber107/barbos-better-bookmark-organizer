// Options page script

document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  setupEventListeners();
});

async function loadSettings() {
  try {
    const settings = await StorageUtils.getSettings();

    document.getElementById('oldThreshold').value = settings.oldBookmarkThreshold;
    document.getElementById('autoScan').checked = settings.autoScanOnStartup;
    document.getElementById('confirmDelete').checked = settings.confirmBeforeDelete;
    document.getElementById('reviewCount').value = settings.reviewCount;
    document.getElementById('reviewInterval').value = settings.reviewInterval;
    document.getElementById('archiveRetentionDays').value = settings.archiveRetentionDays;
    document.getElementById('autoDeleteArchived').checked = settings.autoDeleteArchived;
    document.getElementById('theme').value = settings.theme;

  } catch (error) {
    console.error('Error loading settings:', error);
    showStatus('Error loading settings', 'error');
  }
}

function setupEventListeners() {
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);

  // Cancel button
  document.getElementById('cancelBtn').addEventListener('click', () => {
    window.close();
  });

  // Cleanup button
  document.getElementById('cleanupBtn').addEventListener('click', async () => {
    if (confirm('This will remove metadata for bookmarks that no longer exist. Continue?')) {
      try {
        const allBookmarks = await BookmarkUtils.getAllBookmarks();
        const bookmarkIds = allBookmarks.map(b => b.id);
        await StorageUtils.cleanupMetadata(bookmarkIds);
        showStatus('Cleanup completed successfully', 'success');
      } catch (error) {
        console.error('Error during cleanup:', error);
        showStatus('Error during cleanup', 'error');
      }
    }
  });

  // Export button
  document.getElementById('exportBtn').addEventListener('click', async () => {
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

      showStatus('Data exported successfully', 'success');
    } catch (error) {
      console.error('Error exporting data:', error);
      showStatus('Error exporting data', 'error');
    }
  });

  // Import button
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (confirm('This will overwrite your current metadata and settings. Continue?')) {
        await StorageUtils.importData(data);
        await loadSettings();
        showStatus('Data imported successfully', 'success');
      }
    } catch (error) {
      console.error('Error importing data:', error);
      showStatus('Error importing data - invalid file format', 'error');
    }

    // Reset file input
    e.target.value = '';
  });

  // Reset button
  document.getElementById('resetBtn').addEventListener('click', async () => {
    if (confirm('This will delete all metadata and reset settings to defaults. Your bookmarks will NOT be deleted. Continue?')) {
      if (confirm('Are you absolutely sure? This action cannot be undone.')) {
        try {
          await browser.storage.local.clear();
          await loadSettings();
          showStatus('All data reset successfully', 'success');
        } catch (error) {
          console.error('Error resetting data:', error);
          showStatus('Error resetting data', 'error');
        }
      }
    }
  });
}

async function saveSettings() {
  try {
    const settings = {
      oldBookmarkThreshold: parseInt(document.getElementById('oldThreshold').value, 10),
      autoScanOnStartup: document.getElementById('autoScan').checked,
      confirmBeforeDelete: document.getElementById('confirmDelete').checked,
      reviewCount: parseInt(document.getElementById('reviewCount').value, 10),
      reviewInterval: parseInt(document.getElementById('reviewInterval').value, 10),
      archiveRetentionDays: parseInt(document.getElementById('archiveRetentionDays').value, 10),
      autoDeleteArchived: document.getElementById('autoDeleteArchived').checked,
      theme: document.getElementById('theme').value
    };

    // Validate
    if (settings.oldBookmarkThreshold < 1 || settings.oldBookmarkThreshold > 3650) {
      showStatus('Please enter a valid threshold between 1 and 3650 days', 'error');
      return;
    }

    if (settings.reviewCount < 1 || settings.reviewCount > 20) {
      showStatus('Please enter a valid review count between 1 and 20', 'error');
      return;
    }

    if (settings.reviewInterval < 1 || settings.reviewInterval > 730) {
      showStatus('Please enter a valid review interval between 1 and 730 days', 'error');
      return;
    }

    if (settings.archiveRetentionDays < 1 || settings.archiveRetentionDays > 365) {
      showStatus('Please enter a valid archive retention period between 1 and 365 days', 'error');
      return;
    }

    await StorageUtils.saveSettings(settings);
    showStatus('Settings saved successfully', 'success');

    // Close after 1 second
    setTimeout(() => {
      window.close();
    }, 1000);

  } catch (error) {
    console.error('Error saving settings:', error);
    showStatus('Error saving settings', 'error');
  }
}

function showStatus(message, type) {
  const statusDiv = document.getElementById('saveStatus');
  statusDiv.textContent = message;
  statusDiv.className = `save-status ${type}`;

  // Clear after 3 seconds
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'save-status';
  }, 3000);
}
