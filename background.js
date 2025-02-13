chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    keywords: "",     // Список ключевых слов (по одному на строку)
    whitelist: "",    // Список сайтов, на которых фильтрация не работает
    caseSensitive: false, // Регистр фильтрации (false – нечувствительно)
    lang: "ru"        // Язык интерфейса по умолчанию ("ru" или "en")
  });
});
