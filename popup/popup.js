// Global Content Guard - Enhanced Popup Script
// Handles UI, settings, and internationalization

document.addEventListener('DOMContentLoaded', async function() {
  // Load saved language preference
  await loadLanguagePreference();
  
  // Initialize internationalization
  initializeI18n();
  
  // Load saved settings
  await loadSettings();
  
  // Setup tab switching
  setupTabs();
  
  // Setup event listeners
  setupEventListeners();
  
  // Load and display statistics
  updateStatistics();
});

// Language Management
let currentLanguage = 'en';

async function loadLanguagePreference() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['preferredLanguage'], function(data) {
      if (data.preferredLanguage) {
        currentLanguage = data.preferredLanguage;
      } else {
        // Auto-detect browser language
        const browserLang = chrome.i18n.getUILanguage().toLowerCase();
        currentLanguage = browserLang.startsWith('ru') ? 'ru' : 'en';
      }
      updateLanguageDisplay();
      resolve();
    });
  });
}

function updateLanguageDisplay() {
  const langDisplay = document.getElementById('currentLang');
  if (langDisplay) {
    langDisplay.textContent = currentLanguage.toUpperCase();
  }
}

function switchLanguage() {
  // Toggle between EN and RU
  currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
  
  // Save preference
  chrome.storage.sync.set({ preferredLanguage: currentLanguage }, function() {
    // Update display
    updateLanguageDisplay();
    
    // Show notification
    showStatus(
      currentLanguage === 'en' ? 'Language changed to English' : 'Язык изменён на Русский',
      'success'
    );
    
    // Reload popup to apply translations
    setTimeout(() => {
      location.reload();
    }, 500);
  });
}

// Internationalization
async function initializeI18n() {
  // Load translations manually based on preferred language
  const translations = await loadTranslations(currentLanguage);
  
  // Get all elements with translation IDs
  document.querySelectorAll('[id]').forEach(element => {
    const key = getI18nKey(element.id);
    if (key && translations[key]) {
      const message = translations[key];
      if (element.tagName === 'INPUT' && element.type !== 'checkbox') {
        element.placeholder = message;
      } else if (element.tagName === 'TEXTAREA') {
        element.placeholder = message;
      } else {
        element.textContent = message;
      }
    }
  });
  
  // Handle data-i18n attributes
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const key = element.dataset.i18n;
    if (translations[key]) {
      element.textContent = translations[key];
    }
  });
}

async function loadTranslations(lang) {
  try {
    const response = await fetch(chrome.runtime.getURL(`_locales/${lang}/messages.json`));
    const messages = await response.json();
    
    // Convert to simple key-value format
    const translations = {};
    for (const [key, value] of Object.entries(messages)) {
      translations[key] = value.message;
    }
    return translations;
  } catch (error) {
    console.error('Failed to load translations:', error);
    // Fallback to chrome.i18n
    return {};
  }
}

function getI18nKey(elementId) {
  const keyMap = {
    'pageTitle': 'popupTitle',
    'mainTitle': 'popupTitle',
    'tabCategories': 'tabCategories',
    'tabCustom': 'tabCustom',
    'tabSettings': 'tabSettings',
    'tabStatistics': 'tabStatistics',
    'catAdult': 'categoryAdult',
    'catGambling': 'categoryGambling',
    'catDrugs': 'categoryDrugs',
    'catViolence': 'categoryViolence',
    'catHateSpeech': 'categoryHateSpeech',
    'catDating': 'categoryDating',
    'customTitle': 'customFiltersLabel',
    'settingCaseSensitive': 'caseSensitiveLabel',
    'settingWholeWord': 'wholeWordLabel',
    'settingBlockImages': 'blockImagesLabel',
    'settingBlockVideos': 'blockVideosLabel',
    'settingAggressiveMode': 'aggressiveModeLabel',
    'aggressiveModeDesc': 'aggressiveModeDescription',
    'whitelistTitle': 'whitelistLabel',
    'whitelistDesc': 'whitelistPlaceholder',
    'statsTitle': 'tabStatistics',
    'statsBlockedTodayLabel': 'statsBlockedToday',
    'statsBlockedTotalLabel': 'statsBlockedTotal',
    'statsActiveFiltersLabel': 'statsActiveFilters',
    'donateTitle': 'donateTitle'
  };
  
  return keyMap[elementId] || null;
}

// Load settings from storage
async function loadSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get([
      'enabledCategories',
      'customFilters',
      'caseSensitive',
      'wholeWord',
      'blockImages',
      'blockVideos',
      'aggressiveMode',
      'whitelist',
      'statistics'
    ], function(data) {
      // Load category checkboxes
      if (data.enabledCategories) {
        data.enabledCategories.forEach(category => {
          const checkbox = document.querySelector(`.category-checkbox[data-category="${category}"]`);
          if (checkbox) {
            checkbox.checked = true;
          }
        });
      }
      
      // Load custom filters
      document.getElementById('customFilters').value = data.customFilters || '';
      
      // Load settings
      document.getElementById('caseSensitive').checked = data.caseSensitive || false;
      document.getElementById('wholeWord').checked = data.wholeWord !== false; // Default true
      document.getElementById('blockImages').checked = data.blockImages !== false; // Default true
      document.getElementById('blockVideos').checked = data.blockVideos !== false; // Default true
      document.getElementById('aggressiveMode').checked = data.aggressiveMode !== false; // Default true
      
      // Load whitelist
      document.getElementById('whitelist').value = data.whitelist || '';
      
      // Update statistics display
      if (data.statistics) {
        document.getElementById('statsBlockedTodayValue').textContent = data.statistics.blockedToday || 0;
        document.getElementById('statsBlockedTotalValue').textContent = data.statistics.blockedTotal || 0;
      }
      
      // Count active filters
      updateActiveFiltersCount();
      
      resolve();
    });
  });
}

// Setup tab switching
function setupTabs() {
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetTab = button.dataset.tab;
      
      // Update button states
      tabButtons.forEach(btn => btn.classList.remove('active'));
      button.classList.add('active');
      
      // Update content visibility
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
        }
      });
      
      // Update statistics when stats tab is opened
      if (targetTab === 'stats') {
        updateStatistics();
      }
    });
  });
}

// Setup event listeners
function setupEventListeners() {
  // Language switch button
  const langBtn = document.getElementById('langSwitch');
  if (langBtn) {
    langBtn.addEventListener('click', switchLanguage);
  }
  
  // Save button
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  
  // Apply button
  document.getElementById('applyBtn').addEventListener('click', applyFiltersNow);
  
  // Reset button
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
  
  // Export button
  document.getElementById('exportBtn').addEventListener('click', exportSettings);
  
  // Import button
  document.getElementById('importBtn').addEventListener('click', importSettings);
  
  // Donate button
  document.getElementById('donateBtn').addEventListener('click', () => {
    window.open('https://www.buymeacoffee.com/aristarh.ucolov', '_blank');
  });
  
  // Auto-save on category change
  document.querySelectorAll('.category-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', () => {
      updateActiveFiltersCount();
    });
  });
}

// Save settings
async function saveSettings() {
  // Get enabled categories
  const enabledCategories = [];
  document.querySelectorAll('.category-checkbox:checked').forEach(checkbox => {
    enabledCategories.push(checkbox.dataset.category);
  });
  
  // Get other settings
  const settings = {
    enabledCategories: enabledCategories,
    customFilters: document.getElementById('customFilters').value,
    caseSensitive: document.getElementById('caseSensitive').checked,
    wholeWord: document.getElementById('wholeWord').checked,
    blockImages: document.getElementById('blockImages').checked,
    blockVideos: document.getElementById('blockVideos').checked,
    aggressiveMode: document.getElementById('aggressiveMode').checked,
    whitelist: document.getElementById('whitelist').value
  };
  
  // Save to storage
  chrome.storage.sync.set(settings, function() {
    showStatus(chrome.i18n.getMessage('statusSaved') || 'Settings saved successfully!', 'success');
    updateActiveFiltersCount();
  });
}

// Apply filters immediately to current tab
function applyFiltersNow() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {action: "applyFilters"}, function(response) {
        if (chrome.runtime.lastError) {
          showStatus('Please refresh the page to apply filters.', 'warning');
        } else {
          showStatus(chrome.i18n.getMessage('statusApplied') || 'Filters applied!', 'success');
        }
      });
    }
  });
}

// Reset all settings
function resetSettings() {
  const confirmMessage = chrome.i18n.getMessage('confirmReset') || 'Are you sure you want to reset all settings?';
  
  if (confirm(confirmMessage)) {
    chrome.storage.sync.clear(function() {
      // Reset UI
      document.querySelectorAll('.category-checkbox').forEach(checkbox => {
        checkbox.checked = false;
      });
      
      document.getElementById('customFilters').value = '';
      document.getElementById('caseSensitive').checked = false;
      document.getElementById('wholeWord').checked = true;
      document.getElementById('blockImages').checked = true;
      document.getElementById('blockVideos').checked = true;
      document.getElementById('aggressiveMode').checked = true;
      document.getElementById('whitelist').value = '';
      
      // Reset statistics display
      document.getElementById('statsBlockedTodayValue').textContent = '0';
      document.getElementById('statsBlockedTotalValue').textContent = '0';
      document.getElementById('statsActiveFiltersValue').textContent = '0';
      
      showStatus(chrome.i18n.getMessage('statusReset') || 'All settings reset.', 'success');
    });
  }
}

// Export settings
function exportSettings() {
  chrome.storage.sync.get(null, function(data) {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'global-content-guard-settings.json';
    a.click();
    
    URL.revokeObjectURL(url);
    showStatus('Settings exported successfully!', 'success');
  });
}

// Import settings
function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/json';
  
  input.onchange = function(e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    
    reader.onload = function(event) {
      try {
        const settings = JSON.parse(event.target.result);
        chrome.storage.sync.set(settings, function() {
          loadSettings();
          showStatus('Settings imported successfully!', 'success');
        });
      } catch (error) {
        showStatus('Error importing settings. Invalid file format.', 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  input.click();
}

// Update statistics
function updateStatistics() {
  chrome.storage.sync.get(['statistics'], function(data) {
    if (data.statistics) {
      document.getElementById('statsBlockedTodayValue').textContent = data.statistics.blockedToday || 0;
      document.getElementById('statsBlockedTotalValue').textContent = data.statistics.blockedTotal || 0;
    }
  });
  
  updateActiveFiltersCount();
}

// Update active filters count
async function updateActiveFiltersCount() {
  chrome.runtime.sendMessage({action: "getActiveFilters"}, function(response) {
    if (response && response.filters) {
      document.getElementById('statsActiveFiltersValue').textContent = response.filters.length;
    }
  });
}

// Show status message
function showStatus(message, type = 'info') {
  const status = document.getElementById('status');
  status.textContent = message;
  status.className = 'status ' + type;
  status.style.display = 'block';
  
  setTimeout(() => {
    status.style.display = 'none';
  }, 3000);
}
