// Check if current domain is whitelisted
chrome.runtime.sendMessage({action: "getSettings"}, function(settings) {
  if (!settings) return;
  
  const whitelist = settings.whitelist ? settings.whitelist.split('\n') : [];
  const currentDomain = window.location.hostname;
  
  if (whitelist.some(domain => {
    if (domain.trim() === '') return false;
    return currentDomain.includes(domain.trim()) || 
           domain.trim().includes(currentDomain);
  })) {
    return; // Skip filtering for whitelisted domains
  }
  
  applyFilters(settings);
});

// Listen for manual apply requests
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "applyFilters") {
    chrome.runtime.sendMessage({action: "getSettings"}, function(settings) {
      applyFilters(settings);
    });
  }
});

function applyFilters(settings) {
  if (!settings.filterText) return;
  
  const filterPatterns = settings.filterText.split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);
  
  if (filterPatterns.length === 0) return;
  
  // Create regex patterns for each filter
  const regexes = filterPatterns.map(pattern => {
    let regexPattern;
    
    if (pattern.includes('*')) {
      regexPattern = pattern.replace(/\*/g, '.*');
    } 
    else if (settings.wholeWord || pattern.endsWith('^')) {
      const cleanPattern = pattern.endsWith('^') ? 
        pattern.substring(0, pattern.length - 1) : pattern;
      regexPattern = `\\b${escapeRegExp(cleanPattern)}\\b`;
    } 
    else {
      regexPattern = escapeRegExp(pattern);
    }
    
    return new RegExp(
      regexPattern, 
      settings.caseSensitive ? 'g' : 'gi'
    );
  });

  // Process different types of elements
  processTextNodes(regexes);
  processLinks(regexes);
  processImages(regexes);
  processContainers(regexes);
}

function processTextNodes(regexes) {
  // Create a TreeWalker to find all text nodes
  const treeWalker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        return node.textContent.trim().length > 0 ? 
          NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  while (treeWalker.nextNode()) {
    textNodes.push(treeWalker.currentNode);
  }

  textNodes.forEach(node => {
    const parent = node.parentNode;
    if (!parent || parent.closest('[data-content-blocker-filtered]')) return;

    const matches = regexes.some(regex => regex.test(node.textContent));
    if (matches) {
      // For text nodes, we can replace the text or hide the parent
      if (parent.childNodes.length === 1 && parent.nodeName !== 'A') {
        parent.style.display = 'none';
        parent.setAttribute('data-content-blocker-filtered', 'text');
      } else {
        // Create a replacement span for just this text
        const span = document.createElement('span');
        span.style.display = 'none';
        span.setAttribute('data-content-blocker-filtered', 'text');
        parent.replaceChild(span, node);
      }
    }
  });
}

function processLinks(regexes) {
  document.querySelectorAll('a').forEach(link => {
    if (link.closest('[data-content-blocker-filtered]')) return;

    const linkText = link.textContent + ' ' + (link.href || '');
    const matches = regexes.some(regex => regex.test(linkText));

    if (matches) {
      // Hide the entire link
      link.style.display = 'none';
      link.setAttribute('data-content-blocker-filtered', 'link');
    }
  });
}

function processImages(regexes) {
  document.querySelectorAll('img').forEach(img => {
    if (img.closest('[data-content-blocker-filtered]')) return;

    const altText = img.alt || '';
    const srcText = img.src || '';
    const matches = regexes.some(regex => 
      regex.test(altText) || regex.test(srcText)
    );

    if (matches) {
      // Hide the image and its immediate container if it's just for the image
      if (img.parentElement.childNodes.length === 1) {
        img.parentElement.style.display = 'none';
        img.parentElement.setAttribute('data-content-blocker-filtered', 'image-container');
      } else {
        img.style.display = 'none';
        img.setAttribute('data-content-blocker-filtered', 'image');
      }
    }
  });
}

function processContainers(regexes) {
  const containerSelectors = [
    'div', 'section', 'article', 'li', 'tr', 
    'td', 'header', 'footer', 'aside', 'main'
  ];

  containerSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(container => {
      if (container.closest('[data-content-blocker-filtered]')) return;

      const textContent = getTextContent(container);
      const matches = regexes.some(regex => regex.test(textContent));

      if (matches) {
        // Check if this container is mostly matching content
        const matchingRatio = getMatchingRatio(container, regexes);
        if (matchingRatio > 0.7) {
          // Hide the entire container if most content matches
          container.style.display = 'none';
          container.setAttribute('data-content-blocker-filtered', 'container-full');
        } else {
          // Otherwise just mark it for partial processing
          container.setAttribute('data-content-blocker-partial', 'true');
        }
      }
    });
  });
}

function getTextContent(element) {
  const clone = element.cloneNode(true);
  const scripts = clone.querySelectorAll('script, style');
  scripts.forEach(script => script.remove());
  return clone.textContent || '';
}

function getMatchingRatio(element, regexes) {
  const allText = getTextContent(element);
  if (!allText.trim()) return 0;

  let matchingChars = 0;
  let totalChars = allText.length;

  regexes.forEach(regex => {
    let match;
    while ((match = regex.exec(allText)) !== null) {
      matchingChars += match[0].length;
    }
  });

  return matchingChars / totalChars;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}