// Global Content Guard v3.0 - Popup Script

document.addEventListener('DOMContentLoaded', async () => {
  await loadLanguagePreference();
  await applyTranslations();
  await loadSettings();
  setupTabs();
  setupEventListeners();
  updateDashboard();
});

// ─── Language ───

let currentLanguage = 'en';
let translations = {};

async function loadLanguagePreference() {
  return new Promise(resolve => {
    chrome.storage.sync.get(['preferredLanguage'], data => {
      if (data.preferredLanguage) {
        currentLanguage = data.preferredLanguage;
      } else {
        const browserLang = chrome.i18n.getUILanguage().toLowerCase();
        currentLanguage = browserLang.startsWith('ru') ? 'ru' : 'en';
      }
      document.getElementById('currentLang').textContent = currentLanguage.toUpperCase();
      resolve();
    });
  });
}

async function applyTranslations() {
  try {
    const response = await fetch(chrome.runtime.getURL(`_locales/${currentLanguage}/messages.json`));
    const messages = await response.json();
    translations = {};
    for (const [key, value] of Object.entries(messages)) {
      translations[key] = value.message;
    }
  } catch {
    translations = {};
    return;
  }

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    if (translations[key]) el.textContent = translations[key];
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.dataset.i18nPlaceholder;
    if (translations[key]) el.placeholder = translations[key];
  });

  const idMap = { 'mainTitle': 'popupTitle', 'pageTitle': 'popupTitle' };
  for (const [id, key] of Object.entries(idMap)) {
    const el = document.getElementById(id);
    if (el && translations[key]) el.textContent = translations[key];
  }
}

function t(key, fallback) {
  return translations[key] || fallback || key;
}

function switchLanguage() {
  currentLanguage = currentLanguage === 'en' ? 'ru' : 'en';
  chrome.storage.sync.set({ preferredLanguage: currentLanguage }, () => {
    location.reload();
  });
}

// ─── Settings ───

const SETTINGS_KEYS = [
  'enabled', 'websiteBlocking', 'contentFiltering',
  'enabledCategories', 'enabledWebsiteCategories', 'enabledTextCategories',
  'customBlockedSites', 'customFilters',
  'caseSensitive', 'wholeWord', 'blockImages', 'blockVideos',
  'aggressiveMode', 'whitelist', 'statistics'
];

async function loadSettings() {
  return new Promise(resolve => {
    chrome.storage.sync.get(SETTINGS_KEYS, data => {
      // Master toggle
      const enabled = data.enabled !== false;
      document.getElementById('masterToggle').checked = enabled;
      updateMasterState(enabled);

      // Feature toggles
      document.getElementById('websiteBlockingToggle').checked = data.websiteBlocking !== false;
      document.getElementById('contentFilteringToggle').checked = data.contentFiltering !== false;

      // Per-category toggles
      // Migrate from old enabledCategories if new arrays don't exist
      const siteCats = data.enabledWebsiteCategories || data.enabledCategories || [];
      const textCats = data.enabledTextCategories || data.enabledCategories || [];

      // Set button active states
      document.querySelectorAll('.cat-btn-sites').forEach(btn => {
        const cat = btn.dataset.category;
        if (siteCats.includes(cat)) btn.classList.add('active');
      });

      document.querySelectorAll('.cat-btn-text').forEach(btn => {
        const cat = btn.dataset.category;
        if (textCats.includes(cat)) btn.classList.add('active');
      });

      updateCardStates();

      // Custom blocked sites & filters
      document.getElementById('customBlockedSites').value = data.customBlockedSites || '';
      document.getElementById('customFilters').value = data.customFilters || '';

      // Settings toggles
      document.getElementById('caseSensitive').checked = data.caseSensitive || false;
      document.getElementById('wholeWord').checked = data.wholeWord !== false;
      document.getElementById('blockImages').checked = data.blockImages !== false;
      document.getElementById('blockVideos').checked = data.blockVideos !== false;
      document.getElementById('aggressiveMode').checked = data.aggressiveMode !== false;

      // Whitelist
      document.getElementById('whitelist').value = data.whitelist || '';

      // Stats
      if (data.statistics) {
        document.getElementById('dashBlockedToday').textContent = data.statistics.blockedToday || 0;
        document.getElementById('dashBlockedTotal').textContent = data.statistics.blockedTotal || 0;
        document.getElementById('statsBlockedTodayValue').textContent = data.statistics.blockedToday || 0;
        document.getElementById('statsBlockedTotalValue').textContent = data.statistics.blockedTotal || 0;
      }

      resolve();
    });
  });
}

function updateMasterState(enabled) {
  const app = document.querySelector('.app');
  const banner = document.getElementById('statusBanner');
  const statusTitle = document.getElementById('statusTitle');
  const statusSubtitle = document.getElementById('statusSubtitle');
  const statusIcon = document.getElementById('statusIcon');

  if (enabled) {
    app.classList.remove('disabled');
    banner.classList.remove('paused');
    statusIcon.textContent = '\u{1F6E1}\u{FE0F}';
    statusTitle.textContent = t('statusProtected', 'Protection Active');
    statusSubtitle.textContent = t('statusProtectedDesc', 'Your browsing is protected');
  } else {
    app.classList.add('disabled');
    banner.classList.add('paused');
    statusIcon.textContent = '\u{23F8}\u{FE0F}';
    statusTitle.textContent = t('statusPaused', 'Protection Paused');
    statusSubtitle.textContent = t('statusPausedDesc', 'Content filtering is disabled');
  }
}

// Update category card visual states based on active buttons
function updateCardStates() {
  document.querySelectorAll('.category-card').forEach(card => {
    const sitesBtn = card.querySelector('.cat-btn-sites');
    const textBtn = card.querySelector('.cat-btn-text');
    const sitesActive = sitesBtn && sitesBtn.classList.contains('active');
    const textActive = textBtn && textBtn.classList.contains('active');

    card.classList.remove('has-active', 'fully-active');
    if (sitesActive && textActive) {
      card.classList.add('fully-active');
    } else if (sitesActive || textActive) {
      card.classList.add('has-active');
    }
  });
}

// ─── Tabs ───

function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panels = document.querySelectorAll('.tab-panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      panels.forEach(p => {
        p.classList.remove('active');
        if (p.id === target) p.classList.add('active');
      });
      if (target === 'stats') updateStats();
      if (target === 'dashboard') updateDashboard();
    });
  });
}

// ─── Event Listeners ───

function setupEventListeners() {
  // Language
  document.getElementById('langSwitch').addEventListener('click', switchLanguage);

  // Master toggle
  document.getElementById('masterToggle').addEventListener('change', e => {
    updateMasterState(e.target.checked);
    autoSave();
  });

  // Feature toggles
  document.getElementById('websiteBlockingToggle').addEventListener('change', autoSave);
  document.getElementById('contentFilteringToggle').addEventListener('change', autoSave);

  // Category dual-toggle buttons
  document.querySelectorAll('.cat-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      updateCardStates();
      autoSave();
    });
  });

  // Settings toggles
  ['blockImages', 'blockVideos', 'aggressiveMode', 'wholeWord', 'caseSensitive'].forEach(id => {
    document.getElementById(id).addEventListener('change', autoSave);
  });

  // Action buttons
  document.getElementById('saveBtn').addEventListener('click', saveSettings);
  document.getElementById('applyBtn').addEventListener('click', applyNow);
  document.getElementById('resetBtn').addEventListener('click', resetSettings);
  document.getElementById('exportBtn').addEventListener('click', exportSettings);
  document.getElementById('importBtn').addEventListener('click', importSettings);
  document.getElementById('donateBtn').addEventListener('click', () => {
    window.open('https://www.buymeacoffee.com/aristarh.ucolov', '_blank');
  });
}

// ─── Auto Save ───

let autoSaveTimer = null;

function autoSave() {
  clearTimeout(autoSaveTimer);
  autoSaveTimer = setTimeout(() => saveSettingsQuiet(), 300);
}

function gatherSettings() {
  // Collect per-category toggles
  const enabledWebsiteCategories = [];
  const enabledTextCategories = [];

  document.querySelectorAll('.cat-btn-sites.active').forEach(btn => {
    enabledWebsiteCategories.push(btn.dataset.category);
  });

  document.querySelectorAll('.cat-btn-text.active').forEach(btn => {
    enabledTextCategories.push(btn.dataset.category);
  });

  // Combined list for backward compatibility
  const enabledCategories = [...new Set([...enabledWebsiteCategories, ...enabledTextCategories])];

  return {
    enabled: document.getElementById('masterToggle').checked,
    websiteBlocking: document.getElementById('websiteBlockingToggle').checked,
    contentFiltering: document.getElementById('contentFilteringToggle').checked,
    enabledCategories,
    enabledWebsiteCategories,
    enabledTextCategories,
    customBlockedSites: document.getElementById('customBlockedSites').value,
    customFilters: document.getElementById('customFilters').value,
    caseSensitive: document.getElementById('caseSensitive').checked,
    wholeWord: document.getElementById('wholeWord').checked,
    blockImages: document.getElementById('blockImages').checked,
    blockVideos: document.getElementById('blockVideos').checked,
    aggressiveMode: document.getElementById('aggressiveMode').checked,
    whitelist: document.getElementById('whitelist').value
  };
}

function saveSettingsQuiet() {
  chrome.storage.sync.set(gatherSettings());
}

function saveSettings() {
  chrome.storage.sync.set(gatherSettings(), () => {
    showToast(t('statusSaved', 'Settings saved!'), 'success');
    updateDashboard();
  });
}

// ─── Apply Now ───

function applyNow() {
  chrome.storage.sync.set(gatherSettings(), () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!tabs[0]) return;
      chrome.tabs.sendMessage(tabs[0].id, { action: 'applyFilters' }, () => {
        if (chrome.runtime.lastError) {
          showToast(t('statusRefreshNeeded', 'Refresh the page to apply'), 'warning');
        } else {
          showToast(t('statusApplied', 'Filters applied!'), 'success');
        }
      });
    });
  });
}

// ─── Reset ───

function resetSettings() {
  if (!confirm(t('confirmReset', 'Reset all settings to defaults?'))) return;

  chrome.storage.sync.clear(() => {
    chrome.storage.sync.set({
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
      statistics: { blockedToday: 0, blockedTotal: 0, lastReset: new Date().toDateString() }
    }, () => {
      // Reset all cat buttons
      document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
      updateCardStates();
      loadSettings().then(() => {
        updateDashboard();
        showToast(t('statusReset', 'Settings reset'), 'success');
      });
    });
  });
}

// ─── Export / Import ───

function exportSettings() {
  chrome.storage.sync.get(null, data => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'content-guard-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast(t('exportSuccess', 'Settings exported'), 'success');
  });
}

function importSettings() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';

  input.onchange = e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const data = JSON.parse(event.target.result);
        if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error();
        const knownKeys = new Set(SETTINGS_KEYS);
        if (!Object.keys(data).some(k => knownKeys.has(k))) throw new Error();

        chrome.storage.sync.set(data, () => {
          // Reset all buttons then reload
          document.querySelectorAll('.cat-btn').forEach(btn => btn.classList.remove('active'));
          loadSettings().then(() => {
            updateDashboard();
            showToast(t('importSuccess', 'Settings imported'), 'success');
          });
        });
      } catch {
        showToast(t('importError', 'Invalid settings file'), 'error');
      }
    };
    reader.readAsText(file);
  };
  input.click();
}

// ─── Dashboard Updates ───

function updateDashboard() {
  chrome.storage.sync.get(['statistics', 'enabledWebsiteCategories', 'enabledTextCategories', 'enabledCategories'], data => {
    const stats = data.statistics || {};
    document.getElementById('dashBlockedToday').textContent = stats.blockedToday || 0;
    document.getElementById('dashBlockedTotal').textContent = stats.blockedTotal || 0;

    chrome.runtime.sendMessage({ action: 'getActiveFilters' }, response => {
      if (response && response.filters) {
        document.getElementById('dashActiveFilters').textContent = response.filters.length;
      }
    });

    const siteCats = data.enabledWebsiteCategories || data.enabledCategories || [];
    countBlockedWebsites(siteCats).then(count => {
      document.getElementById('dashBlockedSites').textContent = count;
    });
  });
}

// ─── Stats Tab ───

function updateStats() {
  chrome.storage.sync.get(['statistics', 'enabledWebsiteCategories', 'enabledTextCategories', 'enabledCategories'], data => {
    const stats = data.statistics || {};
    document.getElementById('statsBlockedTodayValue').textContent = stats.blockedToday || 0;
    document.getElementById('statsBlockedTotalValue').textContent = stats.blockedTotal || 0;

    chrome.runtime.sendMessage({ action: 'getActiveFilters' }, response => {
      if (response && response.filters) {
        document.getElementById('statsActiveFiltersValue').textContent = response.filters.length;
      }
    });

    const siteCats = data.enabledWebsiteCategories || data.enabledCategories || [];
    const textCats = data.enabledTextCategories || data.enabledCategories || [];

    countBlockedWebsites(siteCats).then(count => {
      document.getElementById('statsBlockedWebsitesValue').textContent = count;
    });

    buildCategoryBreakdown(siteCats, textCats);
  });
}

const CATEGORY_META = {
  'adult': { icon: '\u{1F51E}', name: 'categoryAdult', fallback: 'Adult/NSFW' },
  'gambling': { icon: '\u{1F3B0}', name: 'categoryGambling', fallback: 'Gambling' },
  'drugs': { icon: '\u{1F48A}', name: 'categoryDrugs', fallback: 'Drugs' },
  'violence': { icon: '\u26A0\uFE0F', name: 'categoryViolence', fallback: 'Violence' },
  'hate-speech': { icon: '\u{1F6AB}', name: 'categoryHateSpeech', fallback: 'Hate Speech' },
  'dating': { icon: '\u{1F498}', name: 'categoryDating', fallback: 'Dating' }
};

async function buildCategoryBreakdown(siteCats, textCats) {
  const container = document.getElementById('categoryStats');
  container.innerHTML = '';

  for (const [cat, meta] of Object.entries(CATEGORY_META)) {
    const siteOn = siteCats.includes(cat);
    const textOn = textCats.includes(cat);

    let wordCount = 0;
    let siteCount = 0;

    try {
      const [wordsRes, sitesRes] = await Promise.all([
        fetch(chrome.runtime.getURL(`categories/${cat}.txt`)).then(r => r.text()),
        fetch(chrome.runtime.getURL(`websites_categories/${cat}.txt`)).then(r => r.text())
      ]);
      wordCount = wordsRes.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
      siteCount = sitesRes.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
    } catch { /* ignore */ }

    const row = document.createElement('div');
    row.className = 'category-stat-row';

    row.innerHTML = `
      <div class="category-stat-name">
        <span class="category-stat-icon">${meta.icon}</span>
        ${t(meta.name, meta.fallback)}
      </div>
      <div class="category-stat-badges">
        <span class="cat-stat-badge cat-stat-badge-sites ${siteOn ? '' : 'off'}">${siteCount} ${t('sites', 'sites')}</span>
        <span class="cat-stat-badge cat-stat-badge-text ${textOn ? '' : 'off'}">${wordCount} ${t('words', 'words')}</span>
      </div>
    `;

    container.appendChild(row);
  }
}

async function countBlockedWebsites(enabledCategories) {
  let total = 0;
  for (const cat of enabledCategories) {
    try {
      const url = chrome.runtime.getURL(`websites_categories/${cat}.txt`);
      const text = await (await fetch(url)).text();
      total += text.split('\n').filter(l => l.trim() && !l.startsWith('#')).length;
    } catch { /* ignore */ }
  }
  return total;
}

// ─── Toast ───

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  const icon = document.getElementById('toastIcon');
  const text = document.getElementById('toastText');

  const icons = { success: '\u2705', error: '\u274C', warning: '\u26A0\uFE0F', info: '\u2139\uFE0F' };
  icon.textContent = icons[type] || icons.info;
  text.textContent = message;
  toast.className = 'toast visible ' + type;

  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => toast.classList.remove('visible'), 2500);
}
