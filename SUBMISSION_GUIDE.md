# Firefox Add-ons Submission Guide

## Step-by-Step Instructions

### 1. Create a Firefox Add-ons Developer Account

1. Go to: https://addons.mozilla.org/developers/
2. Click "Register or Log In"
3. Sign in with your Firefox Account (or create one)
4. Accept the Developer Agreement

### 2. Submit Your Extension

1. Go to: https://addons.mozilla.org/developers/addon/submit/distribution
2. Choose "On this site" (to be listed publicly on Firefox Add-ons)
3. Click "Continue"

### 3. Upload Your Extension

1. Click "Select a file..." or drag and drop
2. Upload: `barbos-better-bookmark-organizer-1.0.0.zip` (located in your project root)
3. Wait for validation to complete
4. Mozilla will automatically check for common issues

### 4. Fill in Extension Details

#### Basic Information
- **Name**: Barbo's Better Bookmark Organizer
- **Add-on URL**: barbos-better-bookmark-organizer (or choose your preferred slug)
- **Summary**: A powerful bookmark management tool that helps you organize, review, and maintain your Firefox bookmarks with intelligent duplicate detection, similarity analysis, and archiving features.

#### Categories
Select:
- **Primary**: Bookmarks & Tabs
- **Secondary**: Productivity (if available)

#### Description
```
Barbo's Better Bookmark Organizer is a comprehensive bookmark management extension that helps you maintain a clean and organized bookmark collection.

KEY FEATURES:

📋 Review Queue
• Periodically review random bookmarks to keep your collection relevant
• Configurable review interval (default: 6 months)
• Skip, keep, archive, or delete bookmarks
• Load more bookmarks on demand

🔍 Duplicate Detection
• Find exact duplicate bookmarks with smart URL normalization
• Removes protocol variations, www prefixes, and tracking parameters
• Easy bulk deletion

🔗 Similar Bookmarks
• Find bookmarks with similar URLs using advanced algorithms
• Shows similarity percentage for each group
• Sortable by similarity, count, title, or URL
• Dismiss groups you've already reviewed

📦 Archive System
• Temporarily archive uncertain bookmarks instead of deleting
• Configurable auto-deletion after retention period (default: 90 days)
• Restore archived bookmarks to original location

🕒 Old/Unused Bookmarks
• Automatically track bookmark usage
• Identify bookmarks you haven't accessed in a while
• Configurable age threshold (default: 365 days)

🏷️ Tag Management
• Add custom tags to organize bookmarks
• Bulk tagging support
• Filter bookmarks by tag

⚙️ Customizable Settings
• Configure thresholds for old bookmarks
• Set review intervals and quantities
• Control archive retention periods
• Enable/disable auto-deletion features

All data is stored locally in your browser - no external servers, no tracking, complete privacy!

Open source: https://github.com/mbarber107/barbos-better-bookmark-organizer
```

#### Tags/Keywords
Add these tags (comma-separated):
```
bookmarks, organize, duplicates, tags, archive, review, cleanup, management, productivity, similar
```

#### Support Information
- **Support Email**: (your email address)
- **Support Website**: https://github.com/mbarber107/barbos-better-bookmark-organizer/issues
- **Homepage**: https://github.com/mbarber107/barbos-better-bookmark-organizer

#### Privacy Policy
Paste the content from `PRIVACY_POLICY.md` or provide the URL:
```
https://github.com/mbarber107/barbos-better-bookmark-organizer/blob/main/PRIVACY_POLICY.md
```

### 5. Version Information

#### Version Notes (for 1.0.0)
```
Initial release of Barbo's Better Bookmark Organizer

Features:
- Review Queue with configurable intervals
- Duplicate bookmark detection
- Similar bookmark detection using Levenshtein distance
- Archive system with auto-deletion
- Old/unused bookmark detection
- Tag management system
- Usage tracking
- Comprehensive settings

All features tested and working. No external dependencies.
```

#### Release Notes for Users
```
Welcome to Barbo's Better Bookmark Organizer v1.0.0!

This is the initial release featuring comprehensive bookmark management tools:
• Review Queue to periodically maintain your bookmarks
• Find and remove duplicate bookmarks
• Discover similar bookmarks based on URL patterns
• Archive bookmarks with automatic cleanup
• Track bookmark usage over time
• Add custom tags for organization

All your data stays local - complete privacy guaranteed!
```

### 6. Source Code Submission (Optional but Recommended)

If the automated review requires it:

1. You may be asked to submit source code
2. You can point to your GitHub repository: https://github.com/mbarber107/barbos-better-bookmark-organizer
3. Or create a source code archive:
   ```bash
   git archive --format=zip --output=barbos-source-1.0.0.zip HEAD
   ```

### 7. Review Process

After submission:
1. **Automated Review**: Usually completes within minutes
2. **Manual Review**: Can take 1-10 days depending on complexity
3. You'll receive emails about the review status
4. If changes are requested, you can upload a new version

### 8. What Mozilla Reviewers Look For

✅ You're good on these:
- Clear description of functionality
- Privacy policy (provided)
- No external API calls or data collection
- No minified/obfuscated code
- All permissions justified
- Open source code available

### 9. After Approval

Once approved:
- Your extension will be publicly listed
- Users can install it from addons.mozilla.org
- You'll get a public extension page
- You can track downloads and ratings

### 10. Publishing Updates

For future updates:
1. Update version in `manifest.json`
2. Create new .zip package
3. Upload to your extension's page on AMO
4. Provide version notes
5. Wait for review (updates are usually faster)

## Important Notes

- **Do not** include .git files, node_modules, or development files in the .zip
- Keep version numbers consistent across manifest.json and submission
- Respond promptly to reviewer questions
- The first review usually takes longest (3-7 days typically)

## Package Location

Your submission package is ready at:
```
/Users/mbarber/ffbookmarkbomer/barbos-better-bookmark-organizer-1.0.0.zip
```

## Helpful Links

- Developer Hub: https://addons.mozilla.org/developers/
- Extension Workshop: https://extensionworkshop.com/
- Review Policies: https://extensionworkshop.com/documentation/publish/add-on-policies/
- Submission API: https://addons.mozilla.org/developers/addon/submit/

Good luck with your submission! 🚀
