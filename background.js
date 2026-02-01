// Global Content Guard - Enhanced Background Script
// Handles category loading, settings management, and statistics

const CATEGORIES = {
  adult: 'categories/adult.txt',
  gambling: 'categories/gambling.txt',
  drugs: 'categories/drugs.txt',
  violence: 'categories/violence.txt',
  'hate-speech': 'categories/hate-speech.txt',
  dating: 'categories/dating.txt'
};

// Cache for category words
let categoryCache = {};

// Initialize extension
chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    // Set default settings on first install
    await chrome.storage.sync.set({
      enabledCategories: [],
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
    });
    console.log('Global Content Guard installed successfully!');
  } else if (details.reason === 'update') {
    console.log('Global Content Guard updated to version', chrome.runtime.getManifest().version);
  }
  
  // Load all categories into cache
  await loadAllCategories();
});

// Load a single category file
async function loadCategory(categoryName) {
  try {
    const url = chrome.runtime.getURL(CATEGORIES[categoryName]);
    const response = await fetch(url);
    const text = await response.text();
    const words = text.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    return words;
  } catch (error) {
    console.error(`Failed to load category ${categoryName}:`, error);
    return [];
  }
}

// Load all categories
async function loadAllCategories() {
  for (const categoryName of Object.keys(CATEGORIES)) {
    categoryCache[categoryName] = await loadCategory(categoryName);
  }
  console.log('All categories loaded:', Object.keys(categoryCache));
}

// Get combined filter list based on enabled categories and custom filters
async function getActiveFilters() {
  const settings = await chrome.storage.sync.get([
    'enabledCategories',
    'customFilters'
  ]);
  
  let allWords = [];
  
  // Add words from enabled categories
  if (settings.enabledCategories && settings.enabledCategories.length > 0) {
    for (const category of settings.enabledCategories) {
      if (categoryCache[category]) {
        allWords = allWords.concat(categoryCache[category]);
      }
    }
  }
  
  // Add custom filters
  if (settings.customFilters) {
    const customWords = settings.customFilters.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    allWords = allWords.concat(customWords);
  }
  
  // Remove duplicates
  return [...new Set(allWords)];
}

// Update statistics
async function updateStatistics(count = 1) {
  const data = await chrome.storage.sync.get(['statistics']);
  const stats = data.statistics || {
    blockedToday: 0,
    blockedTotal: 0,
    lastReset: new Date().toDateString()
  };
  
  // Reset daily counter if it's a new day
  const today = new Date().toDateString();
  if (stats.lastReset !== today) {
    stats.blockedToday = 0;
    stats.lastReset = today;
  }
  
  stats.blockedToday += count;
  stats.blockedTotal += count;
  
  await chrome.storage.sync.set({ statistics: stats });
}

// Message handler
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    chrome.storage.sync.get([
      'enabledCategories',
      'customFilters',
      'caseSensitive',
      'wholeWord',
      'blockImages',
      'blockVideos',
      'aggressiveMode',
      'whitelist'
    ], async (data) => {
      // Get active filters
      const filterWords = await getActiveFilters();
      sendResponse({
        ...data,
        filterText: filterWords.join('\n')
      });
    });
    return true; // Required for async response
  }
  
  if (request.action === "updateStatistics") {
    updateStatistics(request.count || 1);
    sendResponse({ success: true });
    return true;
  }
  
  if (request.action === "getActiveFilters") {
    getActiveFilters().then(filters => {
      sendResponse({ filters });
    });
    return true;
  }
  
  if (request.action === "reloadCategories") {
    loadAllCategories().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Reset daily statistics at midnight
if (chrome.alarms) {
  chrome.alarms.create('resetDailyStats', { 
    periodInMinutes: 1440,
    when: Date.now() + 1000 * 60 * 60 * 24 // Start after 24 hours
  });
  
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'resetDailyStats') {
      chrome.storage.sync.get(['statistics'], (data) => {
        const stats = data.statistics || {};
        stats.blockedToday = 0;
        stats.lastReset = new Date().toDateString();
        chrome.storage.sync.set({ statistics: stats });
      });
    }
  });
}
