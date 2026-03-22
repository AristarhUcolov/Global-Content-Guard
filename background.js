// Global Content Guard v3.0 - Background Service Worker

const CATEGORIES = {
  adult: 'categories/adult.txt',
  gambling: 'categories/gambling.txt',
  drugs: 'categories/drugs.txt',
  violence: 'categories/violence.txt',
  'hate-speech': 'categories/hate-speech.txt',
  dating: 'categories/dating.txt'
};

const WEBSITE_CATEGORIES = {
  adult: 'websites_categories/adult.txt',
  gambling: 'websites_categories/gambling.txt',
  drugs: 'websites_categories/drugs.txt',
  violence: 'websites_categories/violence.txt',
  'hate-speech': 'websites_categories/hate-speech.txt',
  dating: 'websites_categories/dating.txt'
};

const DEFAULT_SETTINGS = {
  enabled: true,
  websiteBlocking: true,
  contentFiltering: true,
  enabledCategories: [],
  enabledWebsiteCategories: [],
  enabledTextCategories: [],
  customBlockedSites: '',
  customFilters: '',
  caseSensitive: false,
  wholeWord: true,
  blockImages: true,
  blockVideos: true,
  aggressiveMode: true,
  whitelist: '',
  statistics: {
    blockedToday: 0,
    blockedTotal: 0,
    lastReset: new Date().toDateString()
  }
};

let categoryCache = {};
let websiteCategoryCache = {};

// ─── Install / Update ───

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.sync.set(DEFAULT_SETTINGS);
  } else if (details.reason === 'update') {
    // Migrate from older versions
    const data = await chrome.storage.sync.get(null);
    const updates = {};

    if (data.enabled === undefined) updates.enabled = true;
    if (data.websiteBlocking === undefined) updates.websiteBlocking = true;
    if (data.contentFiltering === undefined) updates.contentFiltering = true;

    // Migrate enabledCategories -> enabledWebsiteCategories + enabledTextCategories
    if (data.enabledWebsiteCategories === undefined && data.enabledCategories) {
      updates.enabledWebsiteCategories = data.enabledCategories;
    }
    if (data.enabledTextCategories === undefined && data.enabledCategories) {
      updates.enabledTextCategories = data.enabledCategories;
    }
    if (data.enabledWebsiteCategories === undefined && !data.enabledCategories) {
      updates.enabledWebsiteCategories = [];
    }
    if (data.enabledTextCategories === undefined && !data.enabledCategories) {
      updates.enabledTextCategories = [];
    }

    if (Object.keys(updates).length > 0) {
      await chrome.storage.sync.set(updates);
    }
  }

  await loadAllCategories();
  updateBadge();
});

// ─── Category Loading ───

async function loadTextFile(path) {
  try {
    const url = chrome.runtime.getURL(path);
    const response = await fetch(url);
    const text = await response.text();
    return text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('#'));
  } catch (error) {
    console.error(`Failed to load ${path}:`, error);
    return [];
  }
}

async function loadAllCategories() {
  const promises = [
    ...Object.entries(CATEGORIES).map(async ([name, path]) => {
      categoryCache[name] = await loadTextFile(path);
    }),
    ...Object.entries(WEBSITE_CATEGORIES).map(async ([name, path]) => {
      const domains = await loadTextFile(path);
      websiteCategoryCache[name] = domains.map(d => d.toLowerCase());
    })
  ];
  await Promise.all(promises);
}

// ─── Active Filters (text-only categories) ───

async function getActiveFilters() {
  const data = await chrome.storage.sync.get([
    'enabledTextCategories', 'enabledCategories', 'customFilters'
  ]);

  let allWords = [];

  // Use enabledTextCategories (new), fall back to enabledCategories (old)
  const textCats = data.enabledTextCategories || data.enabledCategories || [];

  for (const category of textCats) {
    if (categoryCache[category]) {
      allWords = allWords.concat(categoryCache[category]);
    }
  }

  if (data.customFilters) {
    const custom = data.customFilters.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    allWords = allWords.concat(custom);
  }

  return [...new Set(allWords)];
}

// ─── Statistics ───

async function updateStatistics(count = 1) {
  const data = await chrome.storage.sync.get(['statistics']);
  const stats = data.statistics || {
    blockedToday: 0,
    blockedTotal: 0,
    lastReset: new Date().toDateString()
  };

  const today = new Date().toDateString();
  if (stats.lastReset !== today) {
    stats.blockedToday = 0;
    stats.lastReset = today;
  }

  stats.blockedToday += count;
  stats.blockedTotal += count;

  await chrome.storage.sync.set({ statistics: stats });
  updateBadge();
}

// ─── Badge ───

async function updateBadge() {
  try {
    const data = await chrome.storage.sync.get(['enabled', 'statistics']);

    if (data.enabled === false) {
      chrome.action.setBadgeText({ text: 'OFF' });
      chrome.action.setBadgeBackgroundColor({ color: '#ef4444' });
      return;
    }

    const count = data.statistics?.blockedToday || 0;
    if (count > 0) {
      chrome.action.setBadgeText({ text: count > 999 ? '999+' : String(count) });
      chrome.action.setBadgeBackgroundColor({ color: '#4f8cff' });
    } else {
      chrome.action.setBadgeText({ text: '' });
    }
  } catch { /* service worker context may be invalid */ }
}

// ─── Domain Matching ───

function isDomainBlocked(hostname, enabledWebsiteCategories) {
  for (const category of enabledWebsiteCategories) {
    const domains = websiteCategoryCache[category];
    if (!domains) continue;

    for (const domain of domains) {
      if (hostname === domain || hostname.endsWith('.' + domain)) {
        return { isBlocked: true, category };
      }
    }
  }
  return { isBlocked: false, category: null };
}

// ─── Message Handler ───

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'getSettings': {
      chrome.storage.sync.get([
        'enabled', 'websiteBlocking', 'contentFiltering',
        'enabledCategories', 'enabledWebsiteCategories', 'enabledTextCategories',
        'customBlockedSites', 'customFilters', 'caseSensitive', 'wholeWord', 'blockImages', 'blockVideos',
        'aggressiveMode', 'whitelist'
      ], async (data) => {
        const filterWords = await getActiveFilters();
        sendResponse({
          ...data,
          filterText: filterWords.join('\n')
        });
      });
      return true;
    }

    case 'updateStatistics': {
      updateStatistics(request.count || 1).then(() => sendResponse({ success: true }));
      return true;
    }

    case 'getActiveFilters': {
      getActiveFilters().then(filters => sendResponse({ filters }));
      return true;
    }

    case 'reloadCategories': {
      loadAllCategories().then(() => sendResponse({ success: true }));
      return true;
    }

    case 'checkBlockedWebsite': {
      chrome.storage.sync.get([
        'enabled', 'websiteBlocking',
        'enabledWebsiteCategories', 'enabledCategories',
        'customBlockedSites'
      ], (data) => {
        if (data.enabled === false || data.websiteBlocking === false) {
          sendResponse({ isBlocked: false, category: null });
          return;
        }

        const hostname = request.hostname;

        // Check custom blocked sites first
        if (data.customBlockedSites) {
          const customDomains = data.customBlockedSites.split('\n')
            .map(d => d.trim().toLowerCase())
            .filter(d => d.length > 0 && !d.startsWith('#'));

          for (const domain of customDomains) {
            if (hostname === domain || hostname.endsWith('.' + domain)) {
              sendResponse({ isBlocked: true, category: 'custom' });
              return;
            }
          }
        }

        // Check category-based blocked sites
        const siteCats = data.enabledWebsiteCategories || data.enabledCategories || [];
        const result = isDomainBlocked(hostname, siteCats);
        sendResponse(result);
      });
      return true;
    }
  }
});

// ─── Daily Reset Alarm ───

chrome.alarms.create('resetDailyStats', {
  periodInMinutes: 60,
  delayInMinutes: 1
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'resetDailyStats') {
    chrome.storage.sync.get(['statistics'], (data) => {
      const stats = data.statistics || {};
      const today = new Date().toDateString();
      if (stats.lastReset !== today) {
        stats.blockedToday = 0;
        stats.lastReset = today;
        chrome.storage.sync.set({ statistics: stats });
        updateBadge();
      }
    });
  }
});

// ─── On Startup ───

chrome.runtime.onStartup?.addListener(async () => {
  await loadAllCategories();
  updateBadge();
});

// Load immediately for service worker restarts
loadAllCategories();
updateBadge();
