# 🌐 Website Categories Blocking

## English

### Overview
This folder contains text files with domain lists for blocking entire websites by category. When a domain is in an enabled category, users won't be able to access it - they'll see a blocking page instead.

### How It Works
- Each `.txt` file corresponds to a category (adult, gambling, drugs, etc.)
- Add one domain per line without `http://` or `https://`
- Lines starting with `#` are treated as comments
- Matching checks both exact domain and subdomains

### File Format
```
# Comment lines start with #
example.com
subdomain.example.com
another-site.org
```

### Matching Rules
- `example.com` will block:
  - `example.com`
  - `www.example.com`
  - `subdomain.example.com`
  - `https://example.com/any/path`

### Adding Domains
1. Open the appropriate category file
2. Add the domain on a new line (lowercase recommended)
3. Save the file
4. Reload the extension or restart your browser

### Categories
- **adult.txt** - Adult/NSFW content websites
- **gambling.txt** - Gambling and casino websites
- **drugs.txt** - Drug-related websites
- **violence.txt** - Violence and gore websites
- **hate-speech.txt** - Hate speech websites
- **dating.txt** - Dating and hookup websites

### Notes
- Keep one domain per line
- Use lowercase for consistency
- Don't include protocols (http://, https://)
- Don't include paths (/page/path)
- Empty lines are ignored
- Changes take effect after browser restart or extension reload

---

## Русский

### Обзор
Эта папка содержит текстовые файлы со списками доменов для блокировки целых сайтов по категориям. Когда домен находится в активной категории, пользователи не смогут получить к нему доступ - вместо этого увидят страницу блокировки.

### Как Работает
- Каждый `.txt` файл соответствует категории (adult, gambling, drugs и т.д.)
- Добавляйте один домен на строку без `http://` или `https://`
- Строки, начинающиеся с `#`, считаются комментариями
- Проверка включает как точное совпадение домена, так и поддомены

### Формат Файла
```
# Строки комментариев начинаются с #
example.com
subdomain.example.com
another-site.org
```

### Правила Совпадения
- `example.com` заблокирует:
  - `example.com`
  - `www.example.com`
  - `subdomain.example.com`
  - `https://example.com/любой/путь`

### Добавление Доменов
1. Откройте нужный файл категории
2. Добавьте домен на новой строке (рекомендуется строчными буквами)
3. Сохраните файл
4. Перезагрузите расширение или перезапустите браузер

### Категории
- **adult.txt** - Сайты для взрослых/NSFW контент
- **gambling.txt** - Азартные игры и казино
- **drugs.txt** - Сайты связанные с наркотиками
- **violence.txt** - Сайты с насилием и жестокостью
- **hate-speech.txt** - Сайты с языком вражды
- **dating.txt** - Сайты знакомств

### Примечания
- Один домен на строку
- Используйте строчные буквы для единообразия
- Не включайте протоколы (http://, https://)
- Не включайте пути (/page/path)
- Пустые строки игнорируются
- Изменения вступают в силу после перезапуска браузера или перезагрузки расширения
