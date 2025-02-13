document.addEventListener('DOMContentLoaded', () => {
  const translations = {
    ru: {
      popupTitle: "Настройки фильтрации",
      titleHeader: "Настройки фильтрации",
      languageLabel: "Язык:",
      caseSensitiveLabel: "Регистр чувствителен",
      keywordsLabel: "Ключевые слова (одно на строку):",
      saveKeywords: "Сохранить ключевые слова",
      whitelistLabel: "Whitelist сайтов (одно на строку):",
      saveWhitelist: "Сохранить whitelist"
    },
    en: {
      popupTitle: "Filtering Settings",
      titleHeader: "Filtering Settings",
      languageLabel: "Language:",
      caseSensitiveLabel: "Case Sensitive",
      keywordsLabel: "Keywords (one per line):",
      saveKeywords: "Save Keywords",
      whitelistLabel: "Whitelist websites (one per line):",
      saveWhitelist: "Save Whitelist"
    }
  };

  const popupTitle = document.getElementById('popupTitle');
  const titleHeader = document.getElementById('titleHeader');
  const languageLabel = document.getElementById('languageLabel');
  const caseSensitiveLabel = document.getElementById('caseSensitiveLabel');
  const keywordsLabel = document.getElementById('keywordsLabel');
  const saveKeywordsButton = document.getElementById('saveKeywords');
  const whitelistLabel = document.getElementById('whitelistLabel');
  const saveWhitelistButton = document.getElementById('saveWhitelist');

  const languageSelect = document.getElementById('languageSelect');
  const caseSensitiveCheckbox = document.getElementById('caseSensitiveCheckbox');
  const keywordsArea = document.getElementById('keywordsArea');
  const whitelistArea = document.getElementById('whitelistArea');

  // Загружаем сохранённые настройки
  chrome.storage.local.get(['keywords', 'whitelist', 'caseSensitive', 'lang'], (data) => {
    keywordsArea.value = data.keywords || "";
    whitelistArea.value = data.whitelist || "";
    caseSensitiveCheckbox.checked = data.caseSensitive || false;
    languageSelect.value = data.lang || "ru";
    applyTranslations(data.lang || "ru");
  });

  // Применяем переводы для выбранного языка
  function applyTranslations(lang) {
    const t = translations[lang];
    popupTitle.textContent = t.popupTitle;
    titleHeader.textContent = t.titleHeader;
    languageLabel.textContent = t.languageLabel;
    // Обновляем текст метки для чекбокса (сохранение самого чекбокса)
    caseSensitiveLabel.innerHTML = `<input type="checkbox" id="caseSensitiveCheckbox"> ${t.caseSensitiveLabel}`;
    keywordsLabel.textContent = t.keywordsLabel;
    saveKeywordsButton.textContent = t.saveKeywords;
    whitelistLabel.textContent = t.whitelistLabel;
    saveWhitelistButton.textContent = t.saveWhitelist;
    // Привязываем событие к вновь созданному чекбоксу
    document.getElementById('caseSensitiveCheckbox').checked = caseSensitiveCheckbox.checked;
    document.getElementById('caseSensitiveCheckbox').addEventListener('change', () => {
      chrome.storage.local.set({ caseSensitive: document.getElementById('caseSensitiveCheckbox').checked });
    });
  }

  languageSelect.addEventListener('change', () => {
    const lang = languageSelect.value;
    chrome.storage.local.set({ lang });
    applyTranslations(lang);
  });

  saveKeywordsButton.addEventListener('click', () => {
    const keywords = keywordsArea.value;
    chrome.storage.local.set({ keywords });
  });

  saveWhitelistButton.addEventListener('click', () => {
    const whitelist = whitelistArea.value;
    chrome.storage.local.set({ whitelist });
  });
});
