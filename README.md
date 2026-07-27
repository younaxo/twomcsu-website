# twomc.su

Монорепозиторий сайта Minecraft-сервера twomc.su.

## Стек

- **apps/api** — NestJS 10, Prisma, PostgreSQL 16, Redis 7
- **apps/web** — Next.js 14 (App Router), React 18, Tailwind
- **packages/shared** — общие типы для фронта и бэка

## Требования

- Node.js 20 LTS
- pnpm 9+ (`corepack enable`)
- Docker с Docker Compose (только под базу и Redis)

## Запуск

```bash
pnpm install
cp .env.example .env

pnpm db:up       # postgres + redis в docker
pnpm db:migrate  # накатить миграции
pnpm db:seed     # владелец из SEED_OWNER_* и тестовые аккаунты

pnpm dev         # api :4000 и web :3000
```

Проверка, что бэкенд поднялся:

```bash
curl http://localhost:4000/health
# {"status":"ok"}
```

## Скрипты

| Команда           | Что делает                    |
| ----------------- | ----------------------------- |
| `pnpm dev`        | api и web параллельно         |
| `pnpm build`      | сборка всех пакетов           |
| `pnpm lint`       | eslint по всем пакетам        |
| `pnpm format`     | prettier по репозиторию       |
| `pnpm db:up`      | поднять postgres и redis      |
| `pnpm db:down`    | остановить контейнеры         |
| `pnpm db:migrate` | `prisma migrate dev`          |
| `pnpm db:seed`    | сид владельца (идемпотентный) |
| `pnpm db:studio`  | Prisma Studio                 |

## Порты

| Сервис   | Порт |
| -------- | ---- |
| web      | 3000 |
| api      | 4000 |
| postgres | 5433 |
| redis    | 6379 |

Контейнер postgres проброшен на 5433, чтобы не конфликтовать с локально установленным сервером на 5432.
Порт меняется через `POSTGRES_PORT` в `.env` (не забудь про `DATABASE_URL`).

## Переменные окружения

Все переменные лежат в одном `.env` в корне репозитория, шаблон — `.env.example`.
API читает его через `@nestjs/config`, Next — через `next.config.mjs`, Prisma CLI — через `dotenv-cli`.

Отдельно: `WEB_ORIGIN` (по умолчанию `http://localhost:3000`) задаёт origin для CORS.

В деве `HCAPTCHA_DISABLED=true`, поэтому капча не проверяется и поле `captchaToken` можно не слать.
Для прода нужны реальные `HCAPTCHA_SECRET` и `NEXT_PUBLIC_HCAPTCHA_SITE_KEY`, а `JWT_*` секреты
генерируются через `openssl rand -hex 64`.

## Авторизация

| Метод и путь                 | Что делает                                                      |
| ---------------------------- | --------------------------------------------------------------- |
| `POST /auth/register`        | Регистрация, 201, отдаёт access token и ставит refresh в cookie |
| `POST /auth/login`           | Вход по email или никнейму                                      |
| `POST /auth/refresh`         | Ротация refresh токена, отдаёт новый access token               |
| `POST /auth/forgot-password` | Запрос ссылки для сброса, 3 запроса в час на IP                 |
| `POST /auth/reset-password`  | Смена пароля по токену из ссылки                                |
| `POST /auth/logout`          | Отзывает refresh токен и чистит cookie (нужен access token)     |
| `GET /auth/me`               | Текущий пользователь (нужен access token)                       |
| `POST /auth/change-password` | Смена пароля, отзывает все сессии                               |
| `GET /auth/sessions`         | Список активных сессий                                          |
| `DELETE /auth/sessions`      | Выйти со всех устройств                                         |
| `DELETE /auth/sessions/:id`  | Завершить конкретную сессию                                     |

Как это устроено:

- access token живёт 15 минут и хранится только в памяти клиента;
- refresh token — случайные 64 байта, в базе лежит его HMAC-SHA256, в браузере — httpOnly cookie;
- каждый `/auth/refresh` отзывает старый токен и выдаёт новый, повтор отозванного токена гасит все сессии пользователя;
- после 3 неудачных входов с одного IP апи отвечает `{"requiresCaptcha":true}`, после 10 — 429 на 15 минут;
- лимиты: 100 запросов в минуту глобально, 3 в час на регистрацию, 10 в минуту на вход, 20 в минуту на refresh.

Капча обязательна на всех четырёх формах (`/login`, `/register`, `/forgot-password`, `/reset-password`):
кнопка отправки заблокирована, пока hCaptcha не пройдена, потому что токен лежит в поле формы
и его требует zod. На бэкенде проверка зависит от `HCAPTCHA_DISABLED`: с `true` токен не валидируется,
но фронт всё равно заставит его получить.

### Сброс пароля

`POST /auth/forgot-password` всегда отвечает `{"success":true}`, даже если такого email нет —
иначе форма превращается в перечислялку зарегистрированных адресов. Токен живёт час, одноразовый,
в базе лежит его SHA-256. Новый запрос гасит предыдущие ссылки, успешный сброс отзывает все
refresh токены пользователя.

Письма пока не отправляются. В деве ссылка пишется в лог апи:

```
WARN [AuthService] Password reset for steve@mail.ru: http://localhost:3000/reset-password?token=...
```

Скопируй её из консоли `pnpm dev` и открой в браузере. Учти: у сидовых аккаунтов адреса вида
`player1@localhost`, а `@IsEmail()` отбраковывает домен без TLD, поэтому форму сброса можно
проверить только на аккаунте с нормальным email — зарегистрируй его через `/register`.

### Промокоды

Поле «Промокод» на регистрации необязательное. Регистр не важен, поиск в базе
case-insensitive. Невалидный код не ломает регистрацию: аккаунт создаётся, а в ответе приходит
`promoCode: { applied: false, message }`, фронт показывает это предупреждением.

Один пользователь может активировать код один раз — это держит unique-индекс
`[promoCodeId, userId]`. Сама скидка пока не применяется, ждёт модуль магазина.

Тестовые коды из `pnpm db:seed`:

| Код           | Тип     | Значение | Лимит      |
| ------------- | ------- | -------- | ---------- |
| `WELCOME2024` | PERCENT | 10       | без лимита |
| `VIP50`       | FIXED   | 50       | 100        |
| `BONUS100`    | BONUS   | 100      | 1000       |

### Тестовые аккаунты

Создаются `pnpm db:seed`, в `NODE_ENV=production` сидится только владелец.

| Email                 | Пароль                | Группа    | Позиция               |
| --------------------- | --------------------- | --------- | --------------------- |
| `owner@localhost`     | `SEED_OWNER_PASSWORD` | OWNER     | Owner                 |
| `admin@localhost`     | `Admin1234`           | ADMIN     | Special Administrator |
| `moderator@localhost` | `Moder1234`           | MODERATOR | Head Cheat Hunter     |
| `helper@localhost`    | `Helper1234`          | HELPER    | Chief Helper          |
| `player1@localhost`   | `Player1234`          | PLAYER    | Default               |
| `player2@localhost`   | `Player1234`          | PLAYER    | Svarog                |

### Проверка через curl

```bash
# регистрация
curl -i -X POST http://localhost:4000/auth/register \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"email":"steve@mail.ru","username":"steve","password":"Steve1234"}'

# вход, refresh cookie падает в cookies.txt
curl -i -X POST http://localhost:4000/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{"emailOrUsername":"admin@localhost","password":"Admin1234"}'

# текущий пользователь
curl http://localhost:4000/auth/me -H "Authorization: Bearer <accessToken>"

# новый access token по cookie
curl -i -X POST http://localhost:4000/auth/refresh -b cookies.txt -c cookies.txt

# выход
curl -i -X POST http://localhost:4000/auth/logout \
  -H "Authorization: Bearer <accessToken>" \
  -b cookies.txt -c cookies.txt
```

Что стоит проверить руками: занятый email и никнейм дают 409, три неверных пароля включают капчу,
десятый подряд — 429, `/auth/me` без токена — 401, а старый refresh после логаута — 401.

## Позиции

Позиция — это титул внутри группы: цвет ника, бейдж, приоритет в списках. Права она не даёт,
их определяет только `roleGroup` пользователя. У каждой группы есть одна позиция с `isDefault`,
её получают новые аккаунты. При назначении позиции `roleGroup` пользователя подтягивается
под группу этой позиции.

| Метод и путь                | Доступ    | Что делает                                             |
| --------------------------- | --------- | ------------------------------------------------------ |
| `GET /positions`            | публичный | Видимые позиции, фильтр `?group=OWNER`                 |
| `GET /positions/manage`     | ADMIN+    | Все позиции, включая скрытые — для админки             |
| `GET /positions/:slug`      | публичный | Позиция целиком плюс до 100 её носителей               |
| `POST /positions`           | OWNER     | Создать позицию                                        |
| `PATCH /positions/:id`      | OWNER     | Обновить позицию                                       |
| `DELETE /positions/:id`     | OWNER     | Удалить, если она не дефолтная и на ней никто не висит |
| `POST /positions/:id/assign` | ADMIN+   | Выдать позицию игроку, `{ "userId": "..." }`           |
| `GET /users/:username/public` | публичный | Публичный профиль с позицией                         |
| `GET /users/search?q=`      | ADMIN+    | Поиск по никнейму для модалки назначения               |

Выдать позицию выше своей группы нельзя, как и трогать пользователя старше себя.

Страницы: `/users/<никнейм>` — публичный профиль, `/admin/positions` — управление
(ADMIN видит список и назначение, кнопки создания и удаления только у OWNER).

## Расширенный профиль

Профиль игрока: баннер, аватар, статус, био, страна/город, пол, возраст, приватность,
соцсети, медиа-бейджи, награды, статистика, лайки/дизлайки, просмотры и жалобы.

Загрузки картинок лежат в `UPLOADS_DIR` (по умолчанию `./uploads` относительно `apps/api`)
и отдаются по `/uploads/...`. Лимиты: `UPLOAD_MAX_AVATAR_SIZE` (5 МБ) и `UPLOAD_MAX_BANNER_SIZE` (10 МБ).

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /users/me/profile` | авторизованный | Свой профиль для редактирования |
| `PATCH /users/me/profile` | авторизованный | Обновить поля и приватность |
| `POST/DELETE /users/me/avatar` | авторизованный | Загрузить / удалить аватар |
| `POST/DELETE /users/me/banner` | авторизованный | Загрузить / удалить баннер |
| `PATCH /users/me/banner/preset` | авторизованный | Выбрать пресет баннера |
| `GET /banners/presets` | публичный | Список активных пресетов |
| `GET/PUT/DELETE /users/me/socials...` | авторизованный | Соцсети |
| `POST /users/me/media-request` | авторизованный | Заявка на медиа-бейдж |
| `GET /users/me/media-requests` | авторизованный | Мои заявки |
| `GET /users/:username/public` | публичный (+optional JWT) | Полный публичный профиль |
| `GET /users/:username/statistics` | публичный | Статистика с учётом приватности |
| `POST /users/:username/view` | авторизованный | Уникальный просмотр |
| `PUT /users/:username/reaction` | авторизованный | Like / dislike / сброс |
| `POST /users/:username/report` | авторизованный | Жалоба на профиль |
| `GET /awards` | публичный | Активные награды |
| `GET/POST/PATCH/DELETE /admin/awards...` | ADMIN/OWNER | Каталог и выдача наград |
| `GET/POST/DELETE /admin/users/:userId/badges...` | ADMIN+ | Выдача UserBadge |
| `GET/PATCH /admin/media-requests...` | ADMIN+ | Модерация медиа-заявок |
| `GET/PATCH /admin/profile-reports...` | ADMIN+ | Модерация жалоб |
| `PATCH /admin/users/:userId/statistics` | ADMIN+ | Правка статистики |

Страницы:

- `/profile/settings` — табы Профиль / Приватность / Соц сети / Медиа / Безопасность
- `/users/[username]` — баннер, статистика, 3D скин, информация, реакции
- `/admin/badges`, `/admin/awards`, `/admin/media-requests`, `/admin/profile-reports`

## Друзья

Система друзей: запросы, принятие/отклонение, удаление, блокировка.
Статусы связи: `none`, `friends`, `pending_sent`, `pending_received`, `blocked_by_me`,
`blocked_by_them`, `self`.

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `POST /friends/request/:username` | авторизованный, 20/час | Отправить запрос |
| `POST /friends/accept/:requestId` | авторизованный | Принять входящий |
| `POST /friends/reject/:requestId` | авторизованный | Отклонить входящий |
| `DELETE /friends/requests/:requestId` | авторизованный | Отменить исходящий |
| `DELETE /friends/:username` | авторизованный | Удалить из друзей |
| `POST /friends/block/:username` | авторизованный, 30/час | Заблокировать |
| `DELETE /friends/block/:username` | авторизованный | Разблокировать |
| `GET /friends?page=&limit=` | авторизованный | Список друзей |
| `GET /friends/requests/incoming` | авторизованный | Входящие запросы (пагинация) |
| `GET /friends/requests/incoming/count` | авторизованный | Число входящих (кэш 30с) |
| `GET /friends/requests/outgoing` | авторизованный | Исходящие запросы (пагинация) |
| `GET /friends/blocked` | авторизованный | Чёрный список (пагинация) |
| `GET /friends/status/:username` | авторизованный | Статус относительно пользователя |
| `GET /friends/count` | авторизованный | Число своих друзей |
| `GET /friends/count/:username` | публичный | Число друзей пользователя |

Страницы:

- `/profile/friends` — табы Друзья / Входящие / Исходящие / Заблокированные
- `/users/[username]` — кнопка `FriendButton` и счётчик друзей в карточке «Информация»

В шапке пункт «Друзья» и красный badge с числом входящих запросов (React Query, refetch раз в 30 сек).

## Performance

Кэш и лимиты, чтобы API и веб не дёргали БД лишний раз.

### Backend

- Prisma SQL-логи только при `PRISMA_DEBUG=true` (в production всегда выключены)
- Redis `CacheService`: `/auth/me`, список позиций, счётчики друзей
- Индексы на `friendships (addresseeId, status)`, `users (roleGroup, isBanned)` и др.
- Списки друзей/запросов отдают `{ data, pagination }` с `limit` ≤ 100
- `GET /health` проверяет PostgreSQL (`SELECT 1`) и Redis (`PING`)
- Медленные ответы (>500ms) пишутся в лог, заголовок `X-Response-Time`

Очистить Redis-кэш локально:

```bash
docker exec -it twomc-redis redis-cli -a "$REDIS_PASSWORD" FLUSHDB
```

### Frontend

- TanStack Query: staleTime 1 мин, без refetch на focus
- Optimistic / invalidate для friend mutations
- Prefetch профиля по hover на нике и карточках друзей
- `SkinViewer` через `next/dynamic` (ssr: false)
- `ANALYZE=true pnpm --filter @twomc/web build` — bundle analyzer

### Env

| Переменная | Зачем |
| ---------- | ----- |
| `PRISMA_DEBUG` | `true` — логировать каждый SQL |
| `DATABASE_URL` | `?connection_limit=10&pool_timeout=20` для пула Prisma |

## Структура

```
apps/
  api/                NestJS
    prisma/           schema, миграции, seed
    src/
      common/         pagination, user selects, performance middleware
      config/         конфиг и валидация env
      modules/
        auth/         эндпоинты, гварды, стратегии, капча, брутфорс, сессии
        awards/       каталог наград и выдача
        cache/        Redis CacheService (global)
        friends/      запросы, друзья, блокировки
        health/       GET /health
        positions/    титулы, их crud и назначение игрокам
        prisma/       PrismaService (глобальный модуль)
        redis/        ioredis клиент (глобальный модуль)
        uploads/      sharp + раздача /uploads
        users/        профиль, аватар/баннер, соцсети, реакции, жалобы
  web/                Next.js
    src/app/          (auth), /users/[username], /profile/settings, /profile/friends, /admin/*
    src/components/   ui kit, profile, shared, admin, шапка, QueryProvider
    src/hooks/        useAuth, useFriendRequestsCount, useFriendsQueries
    src/lib/          axios клиент, query-keys, profile helpers
    src/stores/       zustand: auth
packages/
  shared/             RoleGroup, Position, Profile, Friends, Auth типы
```
