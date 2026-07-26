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

| Метод и путь          | Что делает                                                      |
| --------------------- | --------------------------------------------------------------- |
| `POST /auth/register` | Регистрация, 201, отдаёт access token и ставит refresh в cookie |
| `POST /auth/login`    | Вход по email или никнейму                                      |
| `POST /auth/refresh`  | Ротация refresh токена, отдаёт новый access token               |
| `POST /auth/logout`   | Отзывает refresh токен и чистит cookie (нужен access token)     |
| `GET /auth/me`        | Текущий пользователь (нужен access token)                       |

Как это устроено:

- access token живёт 15 минут и хранится только в памяти клиента;
- refresh token — случайные 64 байта, в базе лежит его HMAC-SHA256, в браузере — httpOnly cookie;
- каждый `/auth/refresh` отзывает старый токен и выдаёт новый, повтор отозванного токена гасит все сессии пользователя;
- после 3 неудачных входов с одного IP апи отвечает `{"requiresCaptcha":true}`, после 10 — 429 на 15 минут;
- лимиты: 100 запросов в минуту глобально, 3 в час на регистрацию, 10 в минуту на вход, 20 в минуту на refresh.

### Тестовые аккаунты

Создаются `pnpm db:seed`, в `NODE_ENV=production` сидится только владелец.

| Email                 | Пароль                | Группа    |
| --------------------- | --------------------- | --------- |
| `owner@localhost`     | `SEED_OWNER_PASSWORD` | OWNER     |
| `admin@localhost`     | `Admin1234`           | ADMIN     |
| `moderator@localhost` | `Moder1234`           | MODERATOR |
| `helper@localhost`    | `Helper1234`          | HELPER    |
| `player1@localhost`   | `Player1234`          | PLAYER    |
| `player2@localhost`   | `Player1234`          | PLAYER    |

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

## Структура

```
apps/
  api/                NestJS
    prisma/           schema, миграции, seed
    src/
      common/         мелкие утилиты
      config/         конфиг и валидация env
      modules/
        auth/         эндпоинты, гварды, стратегии, капча, брутфорс
        health/       GET /health
        prisma/       PrismaService (глобальный модуль)
        redis/        ioredis клиент (глобальный модуль)
  web/                Next.js
    src/app/          App Router, (auth) группа со входом и регистрацией
    src/components/   ui kit (shadcn), провайдеры, шапка
    src/hooks/        useAuth
    src/lib/          axios клиент
    src/stores/       zustand стор авторизации
packages/
  shared/             общие типы (RoleGroup, контракты auth)
```
