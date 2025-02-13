// Получаем настройки: ключевые слова, whitelist и режим чувствительности регистра
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['keywords', 'whitelist', 'caseSensitive'], (data) => {
      const keywords = (data.keywords || "")
        .split("\n")
        .map(s => s.trim())
        .filter(s => s);
      const whitelist = (data.whitelist || "")
        .split("\n")
        .map(s => s.trim())
        .filter(s => s);
      const caseSensitive = data.caseSensitive;
      resolve({ keywords, whitelist, caseSensitive });
    });
  });
}

// Проверка, является ли узел полем поиска (input с type=search или с placeholder/aria-label содержащим 'search' или 'поиск')
function isSearchInput(node) {
  if (node.nodeType !== Node.ELEMENT_NODE) return false;
  if (node.tagName.toLowerCase() === 'input') {
    const type = (node.getAttribute('type') || "").toLowerCase();
    const placeholder = (node.getAttribute('placeholder') || "").toLowerCase();
    const ariaLabel = (node.getAttribute('aria-label') || "").toLowerCase();
    const searchIndicators = ['search', 'поиск'];
    if (type === 'search' || (type === 'text' && searchIndicators.some(ind => placeholder.includes(ind) || ariaLabel.includes(ind)))) {
      return true;
    }
  }
  return false;
}

// Функция для сравнения строки с учётом режима регистрозависимости
function matchText(text, keyword, caseSensitive) {
  if (caseSensitive) {
    return text.includes(keyword);
  } else {
    return text.toLocaleLowerCase().includes(keyword.toLocaleLowerCase());
  }
}

// Список известных поисковых движков
const searchEngines = ['google', 'bing', 'yahoo', 'duckduckgo', 'yandex', 'baidu'];
function isSearchEngine() {
  return searchEngines.some(engine => window.location.hostname.toLowerCase().includes(engine));
}

// Основная функция фильтрации узла
function filterNode(node, keywords, caseSensitive) {
  if (!node) return;

  // Не обрабатываем поля поиска
  if (node.nodeType === Node.ELEMENT_NODE && isSearchInput(node)) {
    return;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent;
    if (keywords.some(kw => matchText(text, kw, caseSensitive))) {
      if (node.parentElement) node.parentElement.remove();
      return;
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    const tagName = node.tagName.toLowerCase();

    // Если это изображение, проверяем alt и src
    if (tagName === 'img') {
      const altText = node.alt || "";
      const srcText = node.src || "";
      if (keywords.some(kw => matchText(altText, kw, caseSensitive) || matchText(srcText, kw, caseSensitive))) {
        const container = node.closest('div') || node.parentElement;
        if (container) {
          container.remove();
        } else {
          node.remove();
        }
        return;
      }
    }

    // Если это ссылка, проверяем её текст
    if (tagName === 'a') {
      const linkText = node.innerText;
      if (keywords.some(kw => matchText(linkText, kw, caseSensitive))) {
        if (isSearchEngine()) {
          // Для поисковых систем удаляем ближайший контейнер (блок результата)
          const container = node.closest('div');
          if (container && container !== document.body) {
            container.remove();
            return;
          }
        }
        node.remove();
        return;
      }
    }

    // Если это блок, секция или статья – проверяем внутренний текст и удаляем весь блок при совпадении
    if (tagName === 'div' || tagName === 'section' || tagName === 'article') {
      const text = node.innerText;
      if (keywords.some(kw => matchText(text, kw, caseSensitive))) {
        node.remove();
        return;
      }
    }

    // Рекурсивно обрабатываем всех потомков
    Array.from(node.childNodes).forEach(child => filterNode(child, keywords, caseSensitive));
  }
}

// Инициализация фильтрации: первичный проход по document.body и установка MutationObserver
async function initFiltering() {
  const { keywords, whitelist, caseSensitive } = await getSettings();
  if (!keywords.length) return;
  if (whitelist.includes(window.location.hostname)) return;

  // Первичная фильтрация страницы
  filterNode(document.body, keywords, caseSensitive);

  // Отслеживание динамически добавляемых узлов
  const observer = new MutationObserver((mutations) => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        filterNode(node, keywords, caseSensitive);
      });
    });
  });
  observer.observe(document.body, { childList: true, subtree: true });
}

initFiltering();
