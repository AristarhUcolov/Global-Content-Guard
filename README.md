# 🔐 Global Content Guard v2.0
## Smart Anti-NSFW & Content Blocker

[![Chrome Web Store Version](https://img.shields.io/chrome-web-store/v/ipceikogcggpnnenijogfalachefgafp?color=blue)](https://chrome.google.com/webstore/detail/global-content-guard-cont/ipceikogcggpnnenijogfalachefgafp)
[![GitHub license](https://img.shields.io/badge/license-MIT-green)](https://github.com/AristarhUcolov/Global-Content-Guard/blob/main/LICENSE)
![Manifest Version](https://img.shields.io/badge/manifest-v3-important)
[![GitHub stars](https://img.shields.io/github/stars/AristarhUcolov/Global-Content-Guard?style=social)](https://github.com/AristarhUcolov/Global-Content-Guard)

---

<div align="center">

## 🌍 English | Русский

**[English](#english)** | **[Русский](#русский)**

📖 [Installation](#installation--установка) • 🧪 [Testing](TESTING.md) • 📋 [Changelog](CHANGELOG.md)

</div>

---

# English

> **⚠️ MAJOR UPDATE:** This is version 2.0 with completely redesigned functionality!

**Global Content Guard v2.0** is an advanced anti-NSFW and content blocker for Chrome and Edge that automatically filters unwanted content by text, images, and videos on all websites. Block adult/NSFW, gambling, drugs, violence, hate speech, and dating content with 500+ pre-configured filters across 6 categories! 🚀

## ⭐ What's New in v2.0

### 🎯 Category System
- **🔞 Adult/NSFW** - adult content (300+ words)
- **🎰 Gambling & Casino** - gambling sites
- **💊 Drugs & Substances** - drug-related content
- **⚠️ Violence & Gore** - violent content
- **🚫 Hate Speech** - hate speech
- **💘 Dating & Hookups** - dating sites

### 🚀 New Features
- ✅ **Image Blocking** by alt-text, src, title
- ✅ **Video Blocking** and iframe filtering
- ✅ **Website Blocking** - block entire websites by domain
- ✅ **Aggressive Mode** - hides entire containers
- ✅ **MutationObserver** - works with dynamic content
- ✅ **SPA Support** - React, Vue, Angular
- ✅ **Statistics** - track blocked content
- ✅ **Import/Export** settings
- ✅ **Bilingual Interface** (🇬🇧/🇷🇺)
- ✅ **Language Switcher** - [🌐 EN/RU] button in UI

### 🎨 Modern Interface
- 🌑 Dark theme with gradients
- 📑 Tabbed navigation
- 🎴 Visual category cards
- 📊 Statistics dashboard
- ⚡ Smooth animations

## 📦 Quick Installation

### From Source (for developers)

1. **Clone the repository:**
   ```bash
   git clone https://github.com/AristarhUcolov/Global-Content-Guard.git
   cd Global-Content-Guard
   ```

2. **Open Chrome or Edge:**
   - Navigate to `chrome://extensions/` or `edge://extensions/`

3. **Enable Developer Mode:**
   - Toggle switch in the top right corner

4. **Load Unpacked Extension:**
   - Click "Load unpacked"
   - Select the `Global-Content-Guard` folder

5. **Done!** 🎉
   - Click the extension icon
   - Configure categories and filters

**📖 Detailed Instructions:** See [Installation Guide](#installation--установка)

## 🎯 How to Use

### 1️⃣ Configure Categories
- Open extension popup
- Go to **"Categories"** tab
- Enable desired categories (Adult, Gambling, Drugs, Violence, Hate Speech, Dating)
- **Categories block both words AND websites** - when enabled, blocks text content and entire domains

### 2️⃣ Custom Filters
- Go to **"Custom"** tab
- Add your own words (one per line)

### 3️⃣ Website Blocking
- Edit files in `websites_categories/` folder:
  - `adult.txt` - adult/NSFW sites
  - `gambling.txt` - gambling sites
  - `drugs.txt` - drug-related sites
  - `violence.txt` - violence sites
  - `hate-speech.txt` - hate speech sites
  - `dating.txt` - dating sites
- Add domains (one per line, without http://)
- Example: `pornhub.com`, `bet365.com`
- Blocks entire website with warning page

### 4️⃣ Settings
- **Case Sensitive** - distinguish uppercase/lowercase
- **Whole Word** - match complete words only
- **Block Images** - filter images by alt/src
- **Block Videos** - hide videos and iframes
- **Aggressive Mode** - hide entire content blocks
- **Whitelist** - trusted domains

### 5️⃣ Statistics
- 📊 **Blocked Today** - daily counter
- 📈 **Total Blocked** - overall statistics (words + websites)
- 🔍 **Active Filters** - number of rules
- 🔄 **Resets at Midnight** - daily update

## 🤝 Contributing

We welcome community contributions! 🎉

- 🐛 [Report Bugs](https://github.com/AristarhUcolov/Global-Content-Guard/issues)
- 💡 Suggest new features
- 📝 Improve documentation
- 🌍 Add translations
- 📋 Expand word lists

## 📜 License

MIT License © 2026 Aristarh Ucolov - see [LICENSE](LICENSE) file for details

---

# Русский

> **⚠️ ВАЖНОЕ ОБНОВЛЕНИЕ:** Это версия 2.0 с полностью переработанным функционалом!

**Global Content Guard v2.0** — это продвинутый анти-NSFW блокировщик контента для Chrome и Edge, автоматически фильтрующий нежелательный контент по тексту, изображениям и видео на всех сайтах. Блокируйте взрослый/NSFW контент, азартные игры, наркотики, насилие, язык ненависти и знакомства с помощью 500+ готовых фильтров в 6 категориях! 🚀

## ⭐ Что нового в v2.0

### 🎯 Система категорий
- **🔞 Adult/NSFW** - контент для взрослых (300+ слов)
- **🎰 Gambling & Casino** - азартные игры
- **💊 Drugs & Substances** - наркотики
- **⚠️ Violence & Gore** - насилие
- **🚫 Hate Speech** - язык ненависти
- **💘 Dating & Hookups** - знакомства

### 🚀 Новые возможности
- ✅ **Блокировка изображений** по alt-тексту, src, title
- ✅ **Блокировка видео** и iframe
- ✅ **Блокировка сайтов** - блокировка целых сайтов по домену
- ✅ **Агрессивный режим** - скрывает целые контейнеры
- ✅ **MutationObserver** - работа с динамическим контентом
- ✅ **Поддержка SPA** - React, Vue, Angular
- ✅ **Статистика** - отслеживание заблокированного контента
- ✅ **Импорт/Экспорт** настроек
- ✅ **Двуязычный интерфейс** (🇷🇺/🇬🇧)
- ✅ **Переключатель языка** - кнопка [🌐 EN/RU] в интерфейсе

### 🎨 Современный интерфейс
- 🌑 Темная тема с градиентами
- 📑 Вкладочная навигация
- 🎴 Визуальные карточки категорий
- 📊 Дашборд статистики
- ⚡ Плавные анимации

## 📦 Быстрая установка

### Из исходников (для разработчиков)

1. **Скачайте репозиторий:**
   ```bash
   git clone https://github.com/AristarhUcolov/Global-Content-Guard.git
   cd Global-Content-Guard
   ```

2. **Откройте Chrome или Edge:**
   - Перейдите в `chrome://extensions/` или `edge://extensions/`

3. **Включите режим разработчика:**
   - Переключатель в правом верхнем углу

4. **Загрузите распакованное расширение:**
   - Нажмите "Загрузить распакованное расширение"
   - Выберите папку `Global-Content-Guard`

5. **Готово!** 🎉
   - Кликните по иконке расширения
   - Настройте категории и фильтры

**📖 Подробная инструкция:** См. [Руководство по установке](#installation--установка)

## 🎯 Как использовать

### 1️⃣ Настройка категорий
- Откройте popup расширения
- Перейдите на вкладку **"Категории"**
- Включите нужные категории (Adult, Gambling, Drugs, Violence, Hate Speech, Dating)
- **Категории блокируют И слова, И сайты** - при включении блокирует текстовый контент и целые домены

### 2️⃣ Пользовательские фильтры
- Вкладка **"Свои фильтры"**
- Добавьте свои слова (по одному на строку)

### 3️⃣ Блокировка сайтов
- Редактируйте файлы в папке `websites_categories/`:
  - `adult.txt` - сайты для взрослых/NSFW
  - `gambling.txt` - сайты азартных игр
  - `drugs.txt` - сайты о наркотиках
  - `violence.txt` - сайты с насилием
  - `hate-speech.txt` - сайты с языком ненависти
  - `dating.txt` - сайты знакомств
- Добавьте домены (по одному на строку, без http://)
- Пример: `pornhub.com`, `bet365.com`
- Блокирует весь сайт с предупреждающей страницей

### 4️⃣ Настройки
- **Регистр важен** - различать заглавные/строчные
- **Целые слова** - искать только полные слова
- **Блокировать изображения** - фильтровать картинки по alt/src
- **Блокировать видео** - скрывать видео и iframe
- **Агрессивный режим** - скрывать целые блоки контента
- **Белый список** - доверенные домены

### 5️⃣ Статистика
- 📊 **Заблокировано сегодня** - счетчик за день
- 📈 **Всего заблокировано** - общая статистика (слова + сайты)
- 🔍 **Активных фильтров** - количество правил
- 🔄 **Сброс в полночь** - ежедневное обновление

## 🤝 Вклад в проект

Мы приветствуем вклад сообщества! 🎉

- 🐛 [Сообщайте об ошибках](https://github.com/AristarhUcolov/Global-Content-Guard/issues)
- 💡 Предлагайте новые функции
- 📝 Улучшайте документацию
- 🌍 Добавляйте переводы
- 📋 Расширяйте списки слов

## 📜 Лицензия

MIT License © 2026 Aristarh Ucolov - см. файл [LICENSE](LICENSE)

---

# Installation / Установка

## English: Installation Guide

### Prerequisites
- Google Chrome (version 88+) or Microsoft Edge (version 88+)
- Developer Mode enabled

### Installation Steps

1. **Download the extension:**
   ```bash
   git clone https://github.com/AristarhUcolov/Global-Content-Guard.git
   ```

2. **Open Extensions Page:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Enable Developer Mode:**
   - Toggle switch in top right corner

4. **Load Extension:**
   - Click "Load unpacked"
   - Select `Global-Content-Guard` folder

5. **Configure:**
   - Click extension icon
   - Enable desired categories
   - Customize settings

### First Launch

1. **Choose Language:** Click [🌐 EN/RU] button
2. **Enable Categories:** Go to "Categories" tab
3. **Configure Settings:** Adjust blocking options
4. **Add Custom Filters:** (Optional) Add your own words

### Troubleshooting

**Extension not working?**
- Reload the page after enabling
- Check if extension is enabled in chrome://extensions/
- Verify categories are selected

**Popup not opening?**
- Reload extension (🔄 button)
- Check console for errors

---

## Русский: Руководство по установке

### Требования
- Google Chrome (версия 88+) или Microsoft Edge (версия 88+)
- Режим разработчика включен

### Шаги установки

1. **Скачайте расширение:**
   ```bash
   git clone https://github.com/AristarhUcolov/Global-Content-Guard.git
   ```

2. **Откройте страницу расширений:**
   - Chrome: `chrome://extensions/`
   - Edge: `edge://extensions/`

3. **Включите режим разработчика:**
   - Переключатель в правом верхнем углу

4. **Загрузите расширение:**
   - Нажмите "Загрузить распакованное расширение"
   - Выберите папку `Global-Content-Guard`

5. **Настройте:**
   - Кликните по иконке расширения
   - Включите нужные категории
   - Настройте параметры

### Первый запуск

1. **Выберите язык:** Нажмите кнопку [🌐 EN/RU]
2. **Включите категории:** Вкладка "Категории"
3. **Настройте параметры:** Настройте блокировку
4. **Добавьте свои фильтры:** (Опционально) Добавьте свои слова

### Решение проблем

**Расширение не работает?**
- Перезагрузите страницу после включения
- Проверьте, включено ли расширение в chrome://extensions/
- Убедитесь, что категории выбраны

**Popup не открывается?**
- Перезагрузите расширение (кнопка 🔄)
- Проверьте консоль на ошибки

---

## Author / Автор

**Aristarh Ucolov (Аристарх Уколов)**

<div align="center">
<img src="https://github.com/user-attachments/assets/29df3dff-ed52-47fa-899d-ccd0bbcbb878" width="500">
</div>

---

<div align="center">

**⭐ Star this project if you find it useful! / Поставьте звезду, если проект полезен! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/AristarhUcolov/Global-Content-Guard?style=social)](https://github.com/AristarhUcolov/Global-Content-Guard)

[🐛 Report Bug / Сообщить об ошибке](https://github.com/AristarhUcolov/Global-Content-Guard/issues) • [✨ Request Feature / Запросить функцию](https://github.com/AristarhUcolov/Global-Content-Guard/issues)

---

## 💖 Support the Project / Поддержать проект

<div align="center">

### English / Русский

If this extension helps you browse safer, consider supporting its development!  
Если это расширение помогает вам безопаснее пользоваться интернетом, поддержите его разработку!

[![Buy Me A Coffee](https://img.shields.io/badge/Buy%20Me%20A%20Coffee-Support%20%2F%20Поддержать-yellow?style=for-the-badge&logo=buy-me-a-coffee)](https://buymeacoffee.com/aristarh.ucolov)

**🏦 Bank Transfer / Банковский перевод:**
```
Bank: Moldindconbank
Card: 4028 1202 1106 0963
Recipient: Aristarh Ucolov
```

**Your support helps / Ваша поддержка помогает:**
- 🚀 Add new features and categories / Добавлять новые функции
- 🐛 Fix bugs and improve performance / Исправлять ошибки
- 📝 Maintain documentation / Поддерживать документацию
- 🌍 Add more languages / Добавлять больше языков

</div>

---

<div align="center">

**⭐ Star this project if you find it useful! / Поставьте звезду, если проект полезен! ⭐**

[![GitHub stars](https://img.shields.io/github/stars/AristarhUcolov/Global-Content-Guard?style=social)](https://github.com/AristarhUcolov/Global-Content-Guard)

[🐛 Report Bug / Сообщить об ошибке](https://github.com/AristarhUcolov/Global-Content-Guard/issues) • [✨ Request Feature / Запросить функцию](https://github.com/AristarhUcolov/Global-Content-Guard/issues)

**Made with ❤️ by Aristarh Ucolov**

</div>
