# FlaskaWoW

Атмосферный лендинг в стилистике World of Warcraft: Mists of Pandaria с формой регистрации, отправкой заявок на почту и запуском как локально, так и через Docker.

## Что внутри

- Статический лендинг на HTML, CSS и vanilla JavaScript
- Встроенный Node.js сервер для раздачи страницы и обработки формы
- Отправка заявок на email через SMTP
- Поддержка локального запуска и запуска в Docker

## Структура проекта

- `index.html` — разметка лендинга
- `styles.css` — стили и адаптив
- `script.js` — анимации и отправка формы
- `server.js` — HTTP-сервер и SMTP-отправка писем
- `.env` — локальные переменные окружения
- `.env.example` — шаблон переменных окружения
- `Dockerfile` — сборка контейнера
- `docker-compose.yml` — удобный запуск через Docker Compose

## Требования

Для локального запуска:

- Node.js 20+ или новее
- npm

Для запуска в Docker:

- Docker
- Docker Compose

## Настройка почты

Сервер отправляет заявки на почту через SMTP. Перед запуском нужно заполнить файл `.env`.

Текущий пример:

```env
PORT=3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=fedoravdeev3@gmail.com
SMTP_PASS=your_app_password
SENDER_EMAIL=fedoravdeev3@gmail.com
RECIPIENT_EMAIL=fedoravdeev3@gmail.com
```

### Если используется Gmail

Нужен не обычный пароль от почты, а `App Password`.

Как получить:

1. Открой [Google Account](https://myaccount.google.com/)
2. Перейди в раздел `Безопасность`
3. Включи двухэтапную аутентификацию
4. Открой страницу [Пароли приложений](https://myaccount.google.com/apppasswords)
5. Создай новый пароль приложения
6. Вставь его в `.env` в поле `SMTP_PASS`

## Локальный запуск

### 1. Установить зависимости

```bash
cd "/Users/fedoravdeev/projects/wow panda"
npm install
```

### 2. Проверить `.env`

Убедись, что в файле `.env` заполнены:

- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SENDER_EMAIL`
- `RECIPIENT_EMAIL`

### 3. Запустить сервер

```bash
npm start
```

После запуска сайт будет доступен по адресу:

[http://localhost:3000](http://localhost:3000)

## Запуск через Docker

### Вариант 1. Через Docker Compose

Самый удобный способ:

```bash
cd "/Users/fedoravdeev/projects/wow panda"
docker compose up --build
```

После старта сайт будет доступен по адресу:

[http://localhost:3000](http://localhost:3000)

Чтобы остановить:

```bash
docker compose down
```

### Вариант 2. Через обычный Docker

Собрать образ:

```bash
cd "/Users/fedoravdeev/projects/wow panda"
docker build -t flaskawow-landing .
```

Запустить контейнер:

```bash
docker run --rm -p 3000:3000 --env-file .env flaskawow-landing
```

Остановить контейнер:

Нажми `Ctrl+C`, если контейнер запущен в текущем терминале.

## Проверка формы

После запуска:

1. Открой сайт
2. Заполни `Email`
3. Заполни `Пароль`
4. При желании добавь комментарий
5. Нажми `Отправить заявку`

Если всё настроено правильно, на `RECIPIENT_EMAIL` придёт письмо с данными заявки.

## Если что-то не работает

### Порт 3000 уже занят

Посмотреть процесс:

```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
```

Остановить процесс:

```bash
kill PID
```

Потом снова запустить сервер.

### Gmail пишет `EAUTH` или `535-5.7.8 Username and Password not accepted`

Причина обычно в одном из пунктов:

- используется обычный пароль вместо `App Password`
- пароль приложения введён с ошибкой
- `SMTP_USER` не совпадает с почтой, для которой создан пароль приложения
- сервер не был перезапущен после обновления `.env`

### На вкладке не видно фавикон

Проверь, открывается ли:

[http://localhost:3000/favicon.svg](http://localhost:3000/favicon.svg)

Потом сделай жёсткое обновление страницы:

- macOS: `Cmd + Shift + R`

## Полезные команды

Установить зависимости:

```bash
npm install
```

Запустить локально:

```bash
npm start
```

Запустить в Docker Compose:

```bash
docker compose up --build
```

Остановить Docker Compose:

```bash
docker compose down
```

## Важно

Сейчас форма отправляет email и пароль на почту в открытом виде. Для production это небезопасно. Если проект пойдёт дальше, лучше заменить это на нормальную серверную регистрацию с хешированием пароля и хранением в базе данных.
