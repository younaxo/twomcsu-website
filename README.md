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
`[promoCodeId, userId]`. На регистрации бонусные коды (`BONUS`) учитываются отдельно;
процентные и фиксированные скидки применяются в магазине при оформлении заказа.

Тестовые коды из `pnpm db:seed`:

| Код           | Тип     | Значение | Лимит / заметка        |
| ------------- | ------- | -------- | ---------------------- |
| `WELCOME2024` | PERCENT | 10       | первая покупка в магазине |
| `SUMMER20`    | PERCENT | 20       | только ранги           |
| `KEYS50`      | PERCENT | 50       | только ключи, 1×/юзер  |
| `VIP50`       | FIXED   | 50       | 100 использований      |
| `BONUS100`    | BONUS   | 100      | 1000 (бонус при регистрации) |

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

## Комментарии на профиле

Комментарии с markdown, спойлерами (`||текст||`), упоминаниями `@username`, ответами
(один уровень), реакциями, закреплением (до 3) и жалобами.

Политика `commentPolicy`: `EVERYONE` / `FRIENDS` / `FRIENDS_OF_FRIENDS` / `NOBODY`.
Админ/модератор может принудительно отключить комментарии (`commentsEnabled=false`).

Лимиты: 2000 символов, 1 комментарий в минуту, 10 в час. Редактирование — 15 минут.

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /users/:username/comments` | публичный (+optional JWT) | Список + закреплённые, пагинация до 150 |
| `POST /users/:username/comments` | авторизованный | Создать комментарий / ответ |
| `PATCH /users/:username/comments/:id` | автор, ≤15 мин | Редактировать |
| `DELETE /users/:username/comments/:id` | автор или MODERATOR+ | Soft delete |
| `POST /users/:username/comments/:id/pin` | владелец профиля | Закрепить |
| `POST /users/:username/comments/:id/unpin` | владелец профиля | Открепить |
| `POST /users/:username/comments/:id/reactions` | авторизованный | Добавить реакцию |
| `DELETE /users/:username/comments/:id/reactions/:emoji` | авторизованный | Убрать реакцию |
| `POST /users/:username/comments/:id/report` | авторизованный | Жалоба |
| `POST /admin/users/:userId/comments/disable` | MODERATOR+ | Принудительно отключить |
| `POST /admin/users/:userId/comments/enable` | MODERATOR+ | Включить обратно |
| `GET /admin/comment-reports` | MODERATOR+ | Очередь жалоб |
| `PATCH /admin/comment-reports/:id` | MODERATOR+ | Одобрить / отклонить |
| `DELETE /admin/comments/:id` | MODERATOR+ | Hard delete |

Страницы:

- `/users/[username]` — таб «Комментарии»
- `/profile/settings` — политика комментариев и уведомления (таб «Приватность»)
- `/admin/comment-reports` — модерация жалоб
- `/admin/badges` — отключение/включение комментариев выбранному игроку

## Магазин

Единая страница `/store` с вкладками: Все | Привилегии | Ключи | Валюта | Украшения | Наборы | Другое.
Поиск с debounce 300 мс, лента недавних покупок, селектор валюты отображения (localStorage).
Корзина — центрированный диалог. Wishlist в UI называется «Желаемое».
На карточке товара: «С этим покупают» и быстрая покупка по Minecraft нику (не для decorations/plus/verify/unmute/unban/booster).
`/store/currency` редиректит на `/store?tab=currency`.

Оплата пока заглушка (UnitPay — этап 31): заказ создаётся со статусом `PENDING`,
страница `/store/mock-payment` умеет симулировать успешную оплату.

Типы товаров: привилегии, ключи, подписка, значки, БП, валюта, украшения, бандлы и др.
Цены в ₽. Для валюты `quantity` = сумма в рублях (от 50 до 50 000).

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /store/categories` | публичный | Дерево категорий |
| `GET /store/products` | публичный | Каталог (`category`, `type`, `search`, `sort`, пагинация) |
| `GET /store/products/:slug` | публичный (+optional JWT) | Карточка товара |
| `GET /store/products/:id/bought-together` | публичный | «С этим покупают» |
| `GET /store/bundles` | публичный | Список бандлов |
| `GET /store/bundles/:slug` | публичный | Детали бандла |
| `GET /store/currencies` | публичный | Курсы валют отображения |
| `GET /store/recent-purchases` | публичный | Лента недавних покупок |
| `POST /store/quick-buy` | публичный | Быстрая покупка по нику |
| `GET /store/discounts/bulk` | публичный | Оптовые скидки |
| `GET /store/discounts/loyalty` | публичный | Уровни лояльности |
| `GET/POST/PATCH/DELETE /store/cart...` | авторизованный | Корзина, промокод, расчёт |
| `GET/POST/DELETE/PATCH /store/wishlist...` | авторизованный | Желаемое |
| `GET /store/wishlist/:username` | публичный | Публичное желаемое |
| `POST /store/orders` | авторизованный | Создать заказ (`PENDING` + mock paymentUrl) |
| `GET /store/orders` | авторизованный | Мои заказы |
| `GET /store/orders/:orderNumber` | авторизованный | Детали заказа |
| `POST /store/orders/:orderId/mock-complete` | авторизованный | Симуляция оплаты |
| `POST /store/promocodes/validate` | авторизованный | Проверка промокода |
| `CRUD /admin/store/categories\|products\|bundles\|discounts\|currencies` | ADMIN+ | Админка каталога |
| `GET /admin/store/stats` | ADMIN+ | Статистика с графиками |
| `CRUD /admin/promocodes` | ADMIN+ | Промокоды |
| `GET /admin/orders`, `GET /admin/orders/stats` | ADMIN+ | Заказы и сводка |

## Уведомления

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /notifications` | авторизованный | Список (`page`, `limit`, `unreadOnly`) |
| `GET /notifications/unread-count` | авторизованный | Счётчик непрочитанных (poll 30 с в шапке) |
| `PATCH /notifications/:id/read` | авторизованный | Прочитать одно |
| `PATCH /notifications/read-all` | авторизованный | Прочитать все → `{ count }` |

Страницы: `/profile/notifications`. В шапке — колокольчик и пункт «Уведомления» в меню.

Промокоды магазина из сида:

| Код | Эффект |
| --- | --- |
| `WELCOME2024` | −10%, только первая покупка |
| `SUMMER20` | −20% на ранги |
| `KEYS50` | −50% на ключи (1 раз на юзера) |

Страницы:

- `/store` (вкладки), `/store/product/[slug]`, `/store/bundle/[slug]`
- `/store/cart`, `/store/checkout`, `/store/success`, `/store/mock-payment`
- `/profile/orders`, `/profile/orders/[orderNumber]`, `/profile/wishlist`, `/profile/notifications`
- `/admin/store/*` (включая `stats`, `currencies`), `/admin/promocodes`, `/admin/orders`

В шапке — «Магазин», колокольчик уведомлений, корзина (диалог) и dropdown профиля с ChevronDown.

## Мониторинг серверов

Опрос Minecraft-серверов каждые 30 секунд (`minecraft-server-util` + `@nestjs/schedule`).
Статус кэшируется в Redis (`server:{id}:status`, TTL 60 с), история пишется в `ServerStatusLog`.

Никнейм на сайте = Minecraft ник (`username`). Поле `minecraftNick` удалено.
В настройках профиля ник только для чтения.

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /servers` | публичный | Активные серверы + статус + категория |
| `GET /server-categories` | публичный | Категории серверов |
| `GET /servers/overview` | публичный | Общий онлайн, пик 24ч, топ |
| `GET /servers/:slug` | публичный | Детали сервера |
| `GET /servers/:slug/status` | публичный | Только статус |
| `GET /servers/:slug/players` | публичный | Онлайн-игроки |
| `GET /servers/:slug/history?days=` | публичный | История для графика |
| `GET /servers/widget?ids=` | публичный | HTML-виджет |
| `GET/POST/PATCH/DELETE /admin/servers` | ADMIN+ | CRUD серверов (включая categoryId) |
| `GET/POST/PATCH/DELETE /admin/server-categories` | ADMIN+ | CRUD категорий |
| `GET /admin/servers/:id/logs` | ADMIN+ | Логи мониторинга |

Страницы: `/servers` (фильтр по категориям, крупные карточки без MOTD), `/servers/[slug]`, `/admin/servers`, `/admin/servers/[id]/logs`.
На главной — счётчик онлайна и топ серверов. В профиле — «Играет на …» / «Не в игре».

## Админка (расширения)

| Метод и путь | Доступ | Что делает |
| --- | --- | --- |
| `GET /admin/dashboard` | ADMIN+ | Метрики и графики |
| `GET /admin/audit-log` | ADMIN+ | Журнал действий |
| `POST /admin/broadcast` | ADMIN+ | Массовые уведомления |
| `GET/PATCH /admin/settings` | ADMIN+ | SiteSettings (key-value) |
| `GET/POST/PATCH/DELETE /admin/announcements` | ADMIN+ | Баннеры объявлений |
| `GET /admin/maintenance/status` | ADMIN+ | Статус техработ |
| `POST /admin/maintenance/enable` | ADMIN+ | Включить техработы |
| `POST /admin/maintenance/disable` | ADMIN+ | Выключить техработы |
| `PATCH /admin/modules/:module` | ADMIN+ | Вкл/выкл модуль (store, chat, …) |

Публичные:

| Метод и путь | Что делает |
| --- | --- |
| `GET /system/status` | maintenance + disabledModules + active announcements |
| `GET /system/modules` | статусы модулей |
| `GET /announcements/active` | активные баннеры |

Страницы: `/admin/dashboard`, `/admin/audit-log`, `/admin/broadcast`, `/admin/settings`,
`/admin/settings/maintenance`, `/admin/settings/modules`, `/admin/settings/announcements`.
Общие UI-компоненты: `AdminPageHeader`, `AdminFilters`, `AdminTable`, `AdminEmptyState`, `AdminCreateEditDialog`, `AdminDeleteConfirm`.

Заглушки «в разработке»: `/support`, `/support/faq`, `/wiki`, `/reports`, `/news`. Backend tickets не реализован.

## Чат (Socket.IO)

Один общий канал (`general`). Закреплённые сообщения — sticky сверху (до 3). Реакции в чате отключены (остались в комментариях профиля).

| Метод / событие | Что делает |
| --- | --- |
| `GET /chat/channels` | Активные каналы (сейчас только general) |
| `GET /chat/channels/:slug/messages` | История (infinite scroll, `before`) |
| `GET /chat/channels/:slug/online` | Онлайн в канале |
| `GET /chat/channels/:slug/pinned` | Закреплённые (max 3) |
| `WS /chat` namespace | `join_channel`, `send_message`, typing, pin/mute/ban |
| `GET/POST/... /admin/chat/*` | Муты, баны, поиск, anti-spam настройки |

Страницы: `/chat`, виджет в углу, `/admin/chat/*`, настройки в `/profile/settings` (вкладка «Чат»).
Курсы игровой валюты: `GET /store/currency-rates`, мок-обмен `POST /store/exchange`.

## Дизайн

Акцент оранжевый (`#F57C00` / hover `#E65100`), нейтральный тёмный фон без синевы.
Утилиты `.glass-heavy` / `.glass-medium` / `.glass-light` / `.glass-strong`.
Плавающая glass-шапка + левая боковая панель «влитая в стенку» (260px) с категориями и валютой.
Tooltip без обводки, логотипы/аватары/H1 с `user-select: none`.
Бейджи — SVG в `/public/badges`, в UI после ника.

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
- `ChatWidget` и `ServerHistoryChart` через `next/dynamic`
- `React.memo` на тяжёлых карточках (`ServerCard`, `MessageBubble`)
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
        admin/        дашборд, audit log, broadcast, settings, announcements
        cache/        Redis CacheService (global)
        chat/         Socket.IO чат, каналы, модерация, anti-spam
        comments/     комментарии профиля
        friends/      запросы, друзья, блокировки
        health/       GET /health
        minecraft/    мониторинг серверов (cron + CRUD)
        positions/    титулы, их crud и назначение игрокам
        prisma/       PrismaService (глобальный модуль)
        redis/        ioredis клиент (глобальный модуль)
        store/        магазин: каталог, корзина, wishlist, заказы
        uploads/      sharp + раздача /uploads
        users/        профиль, аватар/баннер, соцсети, реакции, жалобы
  web/                Next.js
    src/app/          (auth), /chat, /servers/*, /store/*, /users/[username], /profile/*, /admin/*
    src/components/   ui kit, chat, servers, store, profile, shared, admin, шапка
    src/hooks/        useAuth, useSocket, useChat, friends, comments, store/*, servers/*
    src/lib/          axios клиент, query-keys, profile helpers
    src/stores/       zustand: auth, storeUi, chat
packages/
  shared/             RoleGroup, Position, Profile, Friends, Store, Servers, Chat, Auth типы
```
