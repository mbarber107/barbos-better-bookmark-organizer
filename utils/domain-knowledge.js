// Domain knowledge database for auto-tagging
// This file contains curated domain-to-tag mappings and pattern detection rules

const DomainKnowledge = {
  /**
   * Curated database of known domains with their appropriate tags
   */
  knownDomains: {
    // Development & Code
    'github.com': ['development', 'code', 'repository', 'programming'],
    'gitlab.com': ['development', 'code', 'repository', 'programming'],
    'bitbucket.org': ['development', 'code', 'repository', 'programming'],
    'stackoverflow.com': ['development', 'Q&A', 'programming', 'help'],
    'stackexchange.com': ['development', 'Q&A', 'programming', 'help'],
    'codepen.io': ['development', 'code', 'demo', 'frontend'],
    'jsfiddle.net': ['development', 'code', 'demo', 'frontend'],
    'repl.it': ['development', 'code', 'online-editor'],
    'glitch.com': ['development', 'code', 'web-apps'],
    'npmjs.com': ['development', 'javascript', 'packages'],
    'pypi.org': ['development', 'python', 'packages'],

    // Documentation
    'developer.mozilla.org': ['documentation', 'web', 'reference', 'development'],
    'w3schools.com': ['documentation', 'tutorial', 'web', 'development'],
    'docs.python.org': ['documentation', 'python', 'programming'],
    'nodejs.org': ['documentation', 'javascript', 'node'],
    'reactjs.org': ['documentation', 'javascript', 'react', 'frontend'],
    'vuejs.org': ['documentation', 'javascript', 'vue', 'frontend'],

    // Learning & Tutorials
    'udemy.com': ['learning', 'courses', 'education', 'tutorial'],
    'coursera.org': ['learning', 'courses', 'education', 'university'],
    'edx.org': ['learning', 'courses', 'education', 'university'],
    'khanacademy.org': ['learning', 'education', 'tutorial', 'free'],
    'freecodecamp.org': ['learning', 'programming', 'tutorial', 'free'],
    'codecademy.com': ['learning', 'programming', 'tutorial', 'interactive'],
    'pluralsight.com': ['learning', 'courses', 'technology', 'professional'],
    'linkedin.com/learning': ['learning', 'courses', 'professional'],

    // News & Articles
    'medium.com': ['articles', 'blog', 'reading', 'writing'],
    'dev.to': ['articles', 'blog', 'development', 'community'],
    'hackernews.com': ['news', 'technology', 'startups'],
    'reddit.com': ['community', 'discussion', 'social'],
    'twitter.com': ['social', 'news', 'microblog'],
    'news.ycombinator.com': ['news', 'technology', 'startups'],

    // Design & Creative
    'dribbble.com': ['design', 'inspiration', 'portfolio'],
    'behance.net': ['design', 'portfolio', 'creative'],
    'figma.com': ['design', 'tool', 'ui-ux', 'collaboration'],
    'sketch.com': ['design', 'tool', 'ui-ux'],
    'canva.com': ['design', 'tool', 'graphics'],
    'unsplash.com': ['images', 'photos', 'free', 'stock'],
    'pexels.com': ['images', 'photos', 'free', 'stock'],

    // Video & Entertainment
    'youtube.com': ['video', 'entertainment', 'streaming'],
    'vimeo.com': ['video', 'creative', 'streaming'],
    'twitch.tv': ['video', 'streaming', 'gaming', 'live'],
    'netflix.com': ['video', 'streaming', 'entertainment'],
    'spotify.com': ['music', 'streaming', 'audio'],

    // Shopping & E-commerce
    'amazon.com': ['shopping', 'e-commerce', 'retail'],
    'ebay.com': ['shopping', 'e-commerce', 'auction'],
    'etsy.com': ['shopping', 'handmade', 'creative'],
    'aliexpress.com': ['shopping', 'e-commerce', 'international'],

    // Productivity & Tools
    'google.com/drive': ['productivity', 'storage', 'cloud', 'documents'],
    'dropbox.com': ['productivity', 'storage', 'cloud'],
    'notion.so': ['productivity', 'notes', 'workspace'],
    'trello.com': ['productivity', 'project-management', 'kanban'],
    'asana.com': ['productivity', 'project-management', 'team'],
    'slack.com': ['productivity', 'communication', 'team'],
    'gmail.com': ['email', 'communication', 'google'],

    // Reference & Information
    'wikipedia.org': ['reference', 'encyclopedia', 'information'],
    'wikihow.com': ['reference', 'how-to', 'tutorial'],
    'imdb.com': ['reference', 'movies', 'entertainment'],
    'goodreads.com': ['reference', 'books', 'reading'],

    // Cloud & Hosting
    'aws.amazon.com': ['cloud', 'hosting', 'infrastructure'],
    'cloud.google.com': ['cloud', 'hosting', 'infrastructure'],
    'azure.microsoft.com': ['cloud', 'hosting', 'infrastructure'],
    'heroku.com': ['cloud', 'hosting', 'platform'],
    'vercel.com': ['cloud', 'hosting', 'frontend'],
    'netlify.com': ['cloud', 'hosting', 'frontend']
  },

  /**
   * URL path patterns that indicate content type
   */
  pathPatterns: {
    '/blog': ['blog', 'articles'],
    '/blogs': ['blog', 'articles'],
    '/post': ['blog', 'articles'],
    '/posts': ['blog', 'articles'],
    '/article': ['articles', 'reading'],
    '/articles': ['articles', 'reading'],
    '/news': ['news', 'articles'],
    '/docs': ['documentation', 'reference'],
    '/documentation': ['documentation', 'reference'],
    '/wiki': ['wiki', 'reference', 'documentation'],
    '/tutorial': ['tutorial', 'learning'],
    '/tutorials': ['tutorial', 'learning'],
    '/guide': ['guide', 'tutorial'],
    '/guides': ['guide', 'tutorial'],
    '/learn': ['learning', 'education'],
    '/course': ['course', 'learning'],
    '/courses': ['course', 'learning'],
    '/shop': ['shopping', 'e-commerce'],
    '/store': ['shopping', 'e-commerce'],
    '/products': ['products', 'shopping'],
    '/product': ['products', 'shopping'],
    '/video': ['video', 'media'],
    '/videos': ['video', 'media'],
    '/watch': ['video', 'media'],
    '/forum': ['forum', 'community', 'discussion'],
    '/forums': ['forum', 'community', 'discussion'],
    '/community': ['community', 'discussion'],
    '/support': ['support', 'help'],
    '/help': ['help', 'support'],
    '/faq': ['help', 'reference'],
    '/api': ['api', 'development', 'reference'],
    '/download': ['download', 'software'],
    '/downloads': ['download', 'software']
  },

  /**
   * Subdomain patterns that indicate content type
   */
  subdomainPatterns: {
    'docs': ['documentation', 'reference'],
    'doc': ['documentation', 'reference'],
    'wiki': ['wiki', 'reference'],
    'blog': ['blog', 'articles'],
    'news': ['news', 'articles'],
    'shop': ['shopping', 'e-commerce'],
    'store': ['shopping', 'e-commerce'],
    'support': ['support', 'help'],
    'help': ['help', 'support'],
    'api': ['api', 'development'],
    'developer': ['development', 'documentation'],
    'dev': ['development'],
    'forum': ['forum', 'community'],
    'community': ['community', 'discussion'],
    'learn': ['learning', 'education'],
    'www': [] // Common but not meaningful
  },

  /**
   * TLD (Top Level Domain) patterns
   */
  tldPatterns: {
    '.edu': ['education', 'academic'],
    '.gov': ['government', 'official'],
    '.org': ['organization', 'non-profit'],
    '.io': ['technology', 'startup'],
    '.dev': ['development', 'technology'],
    '.app': ['application', 'software'],
    '.blog': ['blog', 'articles']
  },

  /**
   * Common keywords in titles/URLs that indicate category
   */
  keywordPatterns: {
    'github': ['development', 'code', 'git'],
    'stackoverflow': ['development', 'programming', 'Q&A'],
    'tutorial': ['tutorial', 'learning'],
    'documentation': ['documentation', 'reference'],
    'blog': ['blog', 'articles'],
    'news': ['news'],
    'video': ['video', 'media'],
    'shop': ['shopping'],
    'store': ['shopping'],
    'download': ['download', 'software'],
    'forum': ['forum', 'community'],
    'wiki': ['wiki', 'reference'],
    'learn': ['learning', 'education'],
    'course': ['course', 'learning'],
    'api': ['api', 'development'],
    'recipe': ['cooking', 'food', 'recipe'],
    'travel': ['travel', 'lifestyle'],
    'finance': ['finance', 'money'],
    'health': ['health', 'wellness'],
    'fitness': ['fitness', 'health'],
    'gaming': ['gaming', 'entertainment'],
    'music': ['music', 'audio'],
    'podcast': ['podcast', 'audio'],
    'job': ['career', 'jobs'],
    'career': ['career', 'professional']
  },

  /**
   * Get domain from URL
   */
  extractDomain(url) {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname.toLowerCase();
    } catch (e) {
      return null;
    }
  },

  /**
   * Get subdomain from URL
   */
  extractSubdomain(url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.hostname.toLowerCase().split('.');
      if (parts.length > 2) {
        return parts[0]; // Return first part (subdomain)
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Get TLD from URL
   */
  extractTLD(url) {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.hostname.toLowerCase().split('.');
      if (parts.length >= 2) {
        return '.' + parts[parts.length - 1];
      }
      return null;
    } catch (e) {
      return null;
    }
  },

  /**
   * Analyze URL path for patterns
   */
  analyzePath(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname.toLowerCase();
      const tags = new Set();

      for (const [pattern, patternTags] of Object.entries(this.pathPatterns)) {
        if (path.includes(pattern)) {
          patternTags.forEach(tag => tags.add(tag));
        }
      }

      return Array.from(tags);
    } catch (e) {
      return [];
    }
  },

  /**
   * Analyze title for keywords
   */
  analyzeTitle(title) {
    if (!title) return [];

    const titleLower = title.toLowerCase();
    const tags = new Set();

    for (const [keyword, keywordTags] of Object.entries(this.keywordPatterns)) {
      if (titleLower.includes(keyword)) {
        keywordTags.forEach(tag => tags.add(tag));
      }
    }

    return Array.from(tags);
  },

  /**
   * Main function: Suggest tags for a bookmark
   */
  suggestTags(bookmark) {
    const suggestions = new Set();
    const url = bookmark.url;
    const title = bookmark.title || '';

    // 1. Check known domains
    const domain = this.extractDomain(url);
    if (domain && this.knownDomains[domain]) {
      this.knownDomains[domain].forEach(tag => suggestions.add(tag));
    }

    // 2. Check subdomain patterns
    const subdomain = this.extractSubdomain(url);
    if (subdomain && this.subdomainPatterns[subdomain]) {
      this.subdomainPatterns[subdomain].forEach(tag => suggestions.add(tag));
    }

    // 3. Check TLD patterns
    const tld = this.extractTLD(url);
    if (tld && this.tldPatterns[tld]) {
      this.tldPatterns[tld].forEach(tag => suggestions.add(tag));
    }

    // 4. Analyze URL path
    const pathTags = this.analyzePath(url);
    pathTags.forEach(tag => suggestions.add(tag));

    // 5. Analyze title
    const titleTags = this.analyzeTitle(title);
    titleTags.forEach(tag => suggestions.add(tag));

    // 6. Add domain as a tag (for organization)
    if (domain) {
      // Remove TLD and www for cleaner domain tag
      const cleanDomain = domain.replace(/^www\./, '').replace(/\.[^.]+$/, '');
      suggestions.add(cleanDomain);
    }

    return Array.from(suggestions).sort();
  },

  /**
   * Get folder suggestion based on tags
   */
  suggestFolder(tags) {
    // Priority mapping for folder suggestions
    const folderPriority = {
      'development': 'Development',
      'code': 'Development',
      'programming': 'Development',
      'documentation': 'Development/Documentation',
      'learning': 'Education',
      'education': 'Education',
      'tutorial': 'Education/Tutorials',
      'course': 'Education/Courses',
      'shopping': 'Shopping',
      'e-commerce': 'Shopping',
      'video': 'Media/Video',
      'music': 'Media/Music',
      'blog': 'Reading/Blogs',
      'articles': 'Reading/Articles',
      'news': 'Reading/News',
      'reference': 'Reference',
      'wiki': 'Reference/Wiki',
      'productivity': 'Productivity',
      'design': 'Design',
      'social': 'Social Media'
    };

    for (const tag of tags) {
      if (folderPriority[tag]) {
        return folderPriority[tag];
      }
    }

    return null; // No specific folder suggestion
  }
};

// Make available globally
if (typeof window !== 'undefined') {
  window.DomainKnowledge = DomainKnowledge;
}
