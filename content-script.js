// Global Content Guard - Enhanced Content Script
// Advanced content filtering with image/video blocking and dynamic content support

let filterSettings = null;
let regexes = [];
let observer = null;
let blockedCount = 0;

// Check if current website is blocked
function checkIfWebsiteBlocked() {
  const currentHostname = window.location.hostname.toLowerCase();
  
  chrome.runtime.sendMessage({ 
    action: "checkBlockedWebsite", 
    hostname: currentHostname 
  }, function(response) {
    if (response && response.isBlocked) {
      blockEntireWebsite(response.category);
    }
  });
}

// Block entire website with a warning page
function blockEntireWebsite(category) {
  document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>🚫 Website Blocked - Global Content Guard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
          color: #ffffff;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 20px;
        }
        .container {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-radius: 20px;
          padding: 60px 40px;
          max-width: 600px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .icon {
          font-size: 80px;
          margin-bottom: 20px;
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        h1 {
          font-size: 32px;
          margin-bottom: 15px;
          color: #ff4444;
        }
        .category {
          display: inline-block;
          background: rgba(255, 68, 68, 0.2);
          color: #ff6b6b;
          padding: 8px 20px;
          border-radius: 20px;
          font-size: 14px;
          margin: 15px 0;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          margin: 20px 0;
          color: #cccccc;
        }
        .info {
          background: rgba(255, 255, 255, 0.03);
          padding: 20px;
          border-radius: 10px;
          margin: 25px 0;
          border-left: 4px solid #ff4444;
        }
        .info-title {
          font-weight: 600;
          color: #ffffff;
          margin-bottom: 10px;
        }
        .url {
          font-family: 'Courier New', monospace;
          background: rgba(0, 0, 0, 0.3);
          padding: 10px;
          border-radius: 5px;
          word-break: break-all;
          font-size: 14px;
          color: #ff6b6b;
        }
        .button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 15px 40px;
          border-radius: 30px;
          text-decoration: none;
          margin-top: 30px;
          font-weight: 600;
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: pointer;
          border: none;
          font-size: 16px;
        }
        .button:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
        }
        .footer {
          margin-top: 30px;
          font-size: 13px;
          color: #888;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="icon">🛡️</div>
        <h1>Website Blocked</h1>
        <div class="category">${category} content</div>
        <p>
          This website has been blocked by <strong>Global Content Guard</strong> 
          because it belongs to a restricted category.
        </p>
        <div class="info">
          <div class="info-title">🔗 Blocked URL:</div>
          <div class="url">${window.location.href}</div>
        </div>
        <p>
          If you believe this is a mistake, you can adjust your settings 
          or add this domain to your whitelist.
        </p>
        <button class="button" onclick="history.back()">← Go Back</button>
        <div class="footer">
          Protected by Global Content Guard v${chrome.runtime.getManifest().version}
        </div>
      </div>
    </body>
    </html>
  `;
  
  // Update statistics
  chrome.runtime.sendMessage({
    action: "updateStatistics",
    count: 1
  });
}

// Initialize content blocker
(async function init() {
  // First, check if the entire website should be blocked
  checkIfWebsiteBlocked();
  
  // Then get settings for content filtering
  chrome.runtime.sendMessage({ action: "getSettings" }, function(settings) {
    if (!settings) return;
    
    // Check whitelist
    const whitelist = settings.whitelist ? settings.whitelist.split('\n') : [];
    const currentDomain = window.location.hostname;
    
    if (whitelist.some(domain => {
      if (domain.trim() === '') return false;
      return currentDomain.includes(domain.trim()) || domain.trim().includes(currentDomain);
    })) {
      console.log('Domain whitelisted, skipping content filtering');
      return;
    }
    
    filterSettings = settings;
    applyFilters();
    
    // Set up mutation observer for dynamic content
    setupMutationObserver();
  });
})();

// Listen for manual apply requests
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "applyFilters") {
    chrome.runtime.sendMessage({ action: "getSettings" }, function(settings) {
      filterSettings = settings;
      applyFilters();
    });
  }
});

function applyFilters() {
  if (!filterSettings || !filterSettings.filterText) return;
  
  const filterPatterns = filterSettings.filterText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (filterPatterns.length === 0) return;
  
  // Create regex patterns
  regexes = filterPatterns.map(pattern => {
    let regexPattern;
    
    if (pattern.includes('*')) {
      regexPattern = pattern.replace(/\*/g, '.*');
    } else if (filterSettings.wholeWord || pattern.endsWith('^')) {
      const cleanPattern = pattern.endsWith('^') ? 
        pattern.substring(0, pattern.length - 1) : pattern;
      regexPattern = `\\b${escapeRegExp(cleanPattern)}\\b`;
    } else {
      regexPattern = escapeRegExp(pattern);
    }
    
    return new RegExp(
      regexPattern,
      filterSettings.caseSensitive ? 'g' : 'gi'
    );
  });
  
  // Process all content
  processAllContent();
  
  // Update statistics
  if (blockedCount > 0) {
    chrome.runtime.sendMessage({
      action: "updateStatistics",
      count: blockedCount
    });
  }
}

function processAllContent() {
  processTextNodes();
  processLinks();
  
  if (filterSettings.blockImages) {
    processImages();
  }
  
  if (filterSettings.blockVideos) {
    processVideos();
  }
  
  if (filterSettings.aggressiveMode) {
    processContainers();
  }
}

function processTextNodes() {
  const treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentNode.closest('[data-gcg-filtered]')) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  while (treeWalker.nextNode()) {
    textNodes.push(treeWalker.currentNode);
  }
  
  textNodes.forEach(node => {
    const parent = node.parentNode;
    if (!parent || parent.closest('[data-gcg-filtered]')) return;
    
    const matches = regexes.some(regex => regex.test(node.textContent));
    if (matches) {
      hideElement(parent, 'text');
      blockedCount++;
    }
  });
}

function processLinks() {
  document.querySelectorAll('a:not([data-gcg-filtered])').forEach(link => {
    if (link.closest('[data-gcg-filtered]')) return;
    
    const linkText = link.textContent + ' ' + (link.href || '') + ' ' + (link.title || '');
    const matches = regexes.some(regex => regex.test(linkText));
    
    if (matches) {
      hideElement(link, 'link');
      blockedCount++;
    }
  });
}

function processImages() {
  document.querySelectorAll('img:not([data-gcg-filtered]), picture:not([data-gcg-filtered])').forEach(img => {
    if (img.closest('[data-gcg-filtered]')) return;
    
    const altText = img.alt || '';
    const srcText = img.src || img.currentSrc || '';
    const titleText = img.title || '';
    const ariaLabel = img.getAttribute('aria-label') || '';
    
    // Check all text attributes
    const allText = `${altText} ${srcText} ${titleText} ${ariaLabel}`;
    const matches = regexes.some(regex => regex.test(allText));
    
    if (matches) {
      // Try to hide parent container if it's just for the image
      if (img.parentElement && shouldHideParent(img.parentElement)) {
        hideElement(img.parentElement, 'image-container');
      } else {
        hideElement(img, 'image');
      }
      blockedCount++;
    }
  });
  
  // Process background images
  document.querySelectorAll('[style*="background-image"]:not([data-gcg-filtered])').forEach(el => {
    if (el.closest('[data-gcg-filtered]')) return;
    
    const style = el.style.backgroundImage;
    const matches = regexes.some(regex => regex.test(style));
    
    if (matches) {
      el.style.backgroundImage = 'none';
      el.style.backgroundColor = '#1a1a1a';
      el.setAttribute('data-gcg-filtered', 'background-image');
      blockedCount++;
    }
  });
}

function processVideos() {
  document.querySelectorAll('video:not([data-gcg-filtered]), iframe:not([data-gcg-filtered])').forEach(video => {
    if (video.closest('[data-gcg-filtered]')) return;
    
    const src = video.src || video.currentSrc || '';
    const title = video.title || '';
    const ariaLabel = video.getAttribute('aria-label') || '';
    
    // For iframes, check src for video platforms
    const allText = `${src} ${title} ${ariaLabel}`;
    const matches = regexes.some(regex => regex.test(allText));
    
    if (matches) {
      if (video.parentElement && shouldHideParent(video.parentElement)) {
        hideElement(video.parentElement, 'video-container');
      } else {
        hideElement(video, 'video');
      }
      blockedCount++;
    }
  });
}

function processContainers() {
  const containerSelectors = [
    'article', 'section', 'div.post', 'div.card', 'div.item',
    'li', 'tr', 'aside', '[role="article"]'
  ];
  
  containerSelectors.forEach(selector => {
    document.querySelectorAll(selector + ':not([data-gcg-filtered])').forEach(container => {
      if (container.closest('[data-gcg-filtered]')) return;
      
      const textContent = getTextContent(container);
      const matches = regexes.some(regex => regex.test(textContent));
      
      if (matches) {
        const matchingRatio = getMatchingRatio(container, textContent);
        
        // Hide entire container if significant portion matches
        if (matchingRatio > 0.5) {
          hideElement(container, 'container');
          blockedCount++;
        }
      }
    });
  });
}

function hideElement(element, type) {
  if (!element || element.hasAttribute('data-gcg-filtered')) return;
  
  element.style.display = 'none';
  element.setAttribute('data-gcg-filtered', type);
  element.setAttribute('data-gcg-timestamp', Date.now());
  
  // Add a subtle marker for debugging (can be removed in production)
  element.setAttribute('title', 'Content hidden by Global Content Guard');
}

function shouldHideParent(parent) {
  // Check if parent is a simple container with few children
  const childCount = parent.children.length;
  const hasText = parent.textContent.trim().length > 0;
  
  // Hide parent if it's a simple wrapper (1-2 children, minimal text)
  return childCount <= 2 && (!hasText || parent.textContent.trim().length < 50);
}

function getTextContent(element) {
  const clone = element.cloneNode(true);
  
  // Remove scripts, styles, and already filtered content
  clone.querySelectorAll('script, style, [data-gcg-filtered]').forEach(el => el.remove());
  
  return clone.textContent || '';
}

function getMatchingRatio(element, textContent) {
  if (!textContent || textContent.trim().length === 0) return 0;
  
  let matchingChars = 0;
  const totalChars = textContent.length;
  
  regexes.forEach(regex => {
    const matches = textContent.matchAll(regex);
    for (const match of matches) {
      matchingChars += match[0].length;
    }
  });
  
  return matchingChars / totalChars;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Set up mutation observer for dynamic content
function setupMutationObserver() {
  if (observer) {
    observer.disconnect();
  }
  
  observer = new MutationObserver((mutations) => {
    let shouldProcess = false;
    
    mutations.forEach((mutation) => {
      // Check if new nodes were added
      if (mutation.addedNodes.length > 0) {
        shouldProcess = true;
      }
      
      // Check if text content changed
      if (mutation.type === 'characterData') {
        shouldProcess = true;
      }
    });
    
    if (shouldProcess) {
      // Debounce processing
      clearTimeout(window.gcgProcessTimeout);
      window.gcgProcessTimeout = setTimeout(() => {
        processAllContent();
      }, 100);
    }
  });
  
  // Start observing
  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// Reapply filters when page becomes visible again (for SPAs)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && filterSettings) {
    processAllContent();
  }
});

// Handle dynamic navigation (for single-page apps)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    blockedCount = 0; // Reset counter for new page
    setTimeout(() => {
      if (filterSettings) {
        applyFilters();
      }
    }, 500);
  }
}).observe(document, { subtree: true, childList: true });
