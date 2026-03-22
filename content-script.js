// Global Content Guard v3.0 - Content Script

let filterSettings = null;
let filterPatterns = [];
let observer = null;
let blockedCount = 0;
let isBlockedSite = false;

// ─── Init ───

(function init() {
  checkIfWebsiteBlocked();

  chrome.runtime.sendMessage({ action: 'getSettings' }, settings => {
    if (chrome.runtime.lastError || !settings) return;

    // Master toggle off — do nothing
    if (settings.enabled === false) return;

    // Content filtering off — skip text/image/video filtering
    if (settings.contentFiltering === false) return;

    // Whitelist check
    if (isWhitelisted(settings.whitelist)) return;

    filterSettings = settings;
    buildPatterns();
    waitForBody(() => {
      processAllContent();
      reportBlocked();
      setupMutationObserver();
    });
  });
})();

// ─── Website Blocking ───

function checkIfWebsiteBlocked() {
  const hostname = window.location.hostname.toLowerCase();

  chrome.runtime.sendMessage({
    action: 'checkBlockedWebsite',
    hostname
  }, response => {
    if (chrome.runtime.lastError) return;
    if (response && response.isBlocked) {
      isBlockedSite = true;
      blockEntireWebsite(response.category);
    }
  });
}

function blockEntireWebsite(category) {
  const version = chrome.runtime.getManifest().version;
  const url = window.location.href;

  document.documentElement.innerHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Blocked - Global Content Guard</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: #0f1012;
          color: #e4e5e9;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 100vh;
          padding: 24px;
        }
        .card {
          background: #1a1b1f;
          border: 1px solid #2e2f34;
          border-radius: 18px;
          padding: 48px 40px;
          max-width: 520px;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.6);
        }
        .shield {
          font-size: 64px;
          margin-bottom: 16px;
          animation: pulse 2.5s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.08); opacity: 0.9; }
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 12px;
          color: #ef4444;
        }
        .badge {
          display: inline-block;
          background: rgba(239, 68, 68, 0.12);
          color: #f87171;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-bottom: 16px;
        }
        p {
          font-size: 14px;
          line-height: 1.7;
          color: #8b8d95;
          margin-bottom: 12px;
        }
        .url-box {
          background: #0f1012;
          border: 1px solid #2e2f34;
          border-radius: 8px;
          padding: 12px;
          margin: 20px 0;
          word-break: break-all;
          font-family: 'Cascadia Code', 'Fira Code', monospace;
          font-size: 12px;
          color: #f87171;
        }
        .back-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #4f8cff;
          color: #fff;
          padding: 12px 32px;
          border-radius: 30px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          margin-top: 20px;
          transition: 0.2s;
        }
        .back-btn:hover {
          background: #3a7bff;
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(79, 140, 255, 0.3);
        }
        .footer {
          margin-top: 24px;
          font-size: 11px;
          color: #5c5e66;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="shield">\u{1F6E1}\u{FE0F}</div>
        <h1>Website Blocked</h1>
        <div class="badge">${escapeHTML(category)} content</div>
        <p>
          This website has been blocked by <strong>Global Content Guard</strong>
          because it belongs to a restricted category.
        </p>
        <div class="url-box">${escapeHTML(url)}</div>
        <p>
          You can adjust your settings or add this domain to your whitelist
          through the extension popup.
        </p>
        <button class="back-btn" onclick="history.back()">\u2190 Go Back</button>
        <div class="footer">Protected by Global Content Guard v${escapeHTML(version)}</div>
      </div>
    </body>
    </html>
  `;

  chrome.runtime.sendMessage({ action: 'updateStatistics', count: 1 });
}

// ─── Whitelist ───

function isWhitelisted(whitelist) {
  if (!whitelist) return false;
  const domains = whitelist.split('\n').map(d => d.trim().toLowerCase()).filter(Boolean);
  const hostname = window.location.hostname.toLowerCase();
  return domains.some(d => hostname === d || hostname.endsWith('.' + d));
}

// ─── Pattern Building ───

function buildPatterns() {
  if (!filterSettings || !filterSettings.filterText) return;

  const lines = filterSettings.filterText.split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);

  if (lines.length === 0) return;

  // Build a single combined regex for performance
  const parts = lines.map(pattern => {
    if (pattern.includes('*')) {
      return pattern.split('*').map(escapeRegExp).join('.*');
    }

    if (filterSettings.wholeWord || pattern.endsWith('^')) {
      const clean = pattern.endsWith('^') ? pattern.slice(0, -1) : pattern;
      return '\\b' + escapeRegExp(clean) + '\\b';
    }

    return escapeRegExp(pattern);
  });

  // Create a single combined regex (no global flag to avoid lastIndex bug)
  const flags = filterSettings.caseSensitive ? '' : 'i';
  try {
    filterPatterns = [new RegExp(parts.join('|'), flags)];
  } catch {
    // Fallback: individual patterns if combined fails
    filterPatterns = parts.map(p => {
      try { return new RegExp(p, flags); }
      catch { return null; }
    }).filter(Boolean);
  }
}

function matchesFilter(text) {
  if (!text || filterPatterns.length === 0) return false;
  return filterPatterns.some(regex => regex.test(text));
}

// ─── Content Processing ───

function waitForBody(callback) {
  if (document.body) {
    callback();
    return;
  }
  const bodyObserver = new MutationObserver(() => {
    if (document.body) {
      bodyObserver.disconnect();
      callback();
    }
  });
  bodyObserver.observe(document.documentElement, { childList: true });
}

function processAllContent() {
  if (isBlockedSite || filterPatterns.length === 0) return;
  processTextNodes();
  processLinks();
  if (filterSettings.blockImages) processImages();
  if (filterSettings.blockVideos) processVideos();
  if (filterSettings.aggressiveMode) processContainers();
}

function processTextNodes() {
  if (!document.body) return;

  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (node.parentNode.closest('[data-gcg-filtered]')) return NodeFilter.FILTER_REJECT;
        const tag = node.parentNode.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);

  for (const node of nodes) {
    const parent = node.parentNode;
    if (!parent || parent.closest('[data-gcg-filtered]')) continue;

    if (matchesFilter(node.textContent)) {
      hideElement(parent, 'text');
      blockedCount++;
    }
  }
}

function processLinks() {
  const links = document.querySelectorAll('a:not([data-gcg-filtered])');
  for (const link of links) {
    if (link.closest('[data-gcg-filtered]')) continue;

    const text = (link.textContent || '') + ' ' + (link.title || '');
    if (matchesFilter(text)) {
      hideElement(link, 'link');
      blockedCount++;
    }
  }
}

function processImages() {
  // Regular images
  const images = document.querySelectorAll('img:not([data-gcg-filtered]), picture:not([data-gcg-filtered])');
  for (const img of images) {
    if (img.closest('[data-gcg-filtered]')) continue;

    const text = [img.alt, img.title, img.getAttribute('aria-label')]
      .filter(Boolean).join(' ');

    if (matchesFilter(text)) {
      const parent = img.parentElement;
      if (parent && isSimpleWrapper(parent)) {
        hideElement(parent, 'image-container');
      } else {
        hideElement(img, 'image');
      }
      blockedCount++;
    }
  }

  // Background images
  const bgElements = document.querySelectorAll('[style*="background-image"]:not([data-gcg-filtered])');
  for (const el of bgElements) {
    if (el.closest('[data-gcg-filtered]')) continue;
    const style = el.style.backgroundImage;
    if (matchesFilter(style)) {
      el.style.backgroundImage = 'none';
      el.style.backgroundColor = '#1a1b1f';
      el.setAttribute('data-gcg-filtered', 'bg-image');
      blockedCount++;
    }
  }
}

function processVideos() {
  const videos = document.querySelectorAll('video:not([data-gcg-filtered]), iframe:not([data-gcg-filtered])');
  for (const video of videos) {
    if (video.closest('[data-gcg-filtered]')) continue;

    const text = [video.src, video.title, video.getAttribute('aria-label')]
      .filter(Boolean).join(' ');

    if (matchesFilter(text)) {
      const parent = video.parentElement;
      if (parent && isSimpleWrapper(parent)) {
        hideElement(parent, 'video-container');
      } else {
        hideElement(video, 'video');
      }
      blockedCount++;
    }
  }
}

function processContainers() {
  const selectors = 'article, section, div.post, div.card, div.item, [role="article"]';
  const containers = document.querySelectorAll(selectors);

  for (const container of containers) {
    if (container.hasAttribute('data-gcg-filtered')) continue;
    if (container.closest('[data-gcg-filtered]')) continue;

    const text = getCleanText(container);
    if (!text) continue;

    if (matchesFilter(text)) {
      // Only hide if a significant portion matches
      const ratio = getMatchRatio(text);
      if (ratio > 0.3) {
        hideElement(container, 'container');
        blockedCount++;
      }
    }
  }
}

// ─── Helpers ───

function hideElement(el, type) {
  if (!el || el.hasAttribute('data-gcg-filtered')) return;
  el.style.setProperty('display', 'none', 'important');
  el.setAttribute('data-gcg-filtered', type);
}

function isSimpleWrapper(parent) {
  return parent.children.length <= 2 && parent.textContent.trim().length < 50;
}

function getCleanText(element) {
  const clone = element.cloneNode(true);
  clone.querySelectorAll('script, style, [data-gcg-filtered]').forEach(el => el.remove());
  return clone.textContent || '';
}

function getMatchRatio(text) {
  const trimmed = text.trim();
  if (!trimmed) return 0;

  let matchLen = 0;
  // Use a global version just for counting match lengths
  for (const regex of filterPatterns) {
    const globalRegex = new RegExp(regex.source, regex.flags + (regex.flags.includes('g') ? '' : 'g'));
    const matches = trimmed.matchAll(globalRegex);
    for (const m of matches) {
      matchLen += m[0].length;
    }
  }

  return matchLen / trimmed.length;
}

function reportBlocked() {
  if (blockedCount > 0) {
    chrome.runtime.sendMessage({ action: 'updateStatistics', count: blockedCount });
    blockedCount = 0;
  }
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ─── Mutation Observer ───

function setupMutationObserver() {
  if (observer) observer.disconnect();

  let timeout = null;

  observer = new MutationObserver(mutations => {
    let hasNewContent = false;

    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE && !node.hasAttribute('data-gcg-filtered')) {
            hasNewContent = true;
            break;
          }
        }
      }
      if (hasNewContent) break;

      if (mutation.type === 'characterData') {
        hasNewContent = true;
        break;
      }
    }

    if (hasNewContent) {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        processAllContent();
        reportBlocked();
      }, 150);
    }
  });

  if (document.body) {
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }
}

// ─── SPA Navigation ───

let lastUrl = location.href;

new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    blockedCount = 0;

    // Re-check website blocking for new URL
    checkIfWebsiteBlocked();

    // Re-apply content filters after short delay for page render
    setTimeout(() => {
      if (filterSettings && !isBlockedSite) {
        processAllContent();
        reportBlocked();
      }
    }, 500);
  }
}).observe(document, { subtree: true, childList: true });

// ─── Listen for manual apply ───

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'applyFilters') {
    chrome.runtime.sendMessage({ action: 'getSettings' }, settings => {
      if (chrome.runtime.lastError || !settings) return;
      if (settings.enabled === false || settings.contentFiltering === false) return;

      filterSettings = settings;
      buildPatterns();
      processAllContent();
      reportBlocked();
    });
    sendResponse({ ok: true });
  }
});

// ─── Re-process on visibility change ───

document.addEventListener('visibilitychange', () => {
  if (!document.hidden && filterSettings && !isBlockedSite) {
    processAllContent();
    reportBlocked();
  }
});
