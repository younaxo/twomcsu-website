# Ban System TODO

## Types
- Account ban (soft) — блокирует аккаунт
- IP ban (hard) — блокирует IP
- HWID ban — блокирует по железу (нужен плагин)

## Duration
- Temporary (1h, 24h, 7d, 30d)
- Permanent

## Behavior
- Banned могут anonymous purchases через `/store/quick-buy`
- Banned не могут login
- IP bans блокируют registration
- HWID bans блокируют полностью

## Bans list page
- `/bans` (public)
- Показывает: ник, причина, срок, кто забанил
- Возможность обжалования через `/report/new/appeal`

## Admin management
- `/admin/users/:id/ban`
- Массовые баны
- История банов юзера
- Статистика банов
