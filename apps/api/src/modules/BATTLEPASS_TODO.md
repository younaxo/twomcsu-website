# Battle Pass System — TODO (Future)

## Concept

- Seasonal battle pass with tasks and rewards
- Levels 1-100 (or more)
- Free tier and Premium tier
- Weekly and daily challenges
- Cosmetic and utility rewards

## Data Model

- `BattlePassSeason` (id, name, startDate, endDate, isActive)
- `BattlePassLevel` (id, seasonId, level, xpRequired, freeReward, premiumReward)
- `BattlePassTask` (id, seasonId, name, description, xpReward, type: DAILY/WEEKLY/SEASONAL)
- `UserBattlePass` (id, userId, seasonId, currentXp, currentLevel, isPremium, purchasedAt)
- `UserBattlePassTask` (id, userId, taskId, progress, isCompleted, completedAt)

## Integration

- Sync with in-game achievements (via TWOMCBridge plugin)
- Track player actions in game (kills, mining, playtime)
- Reward system that grants items in game

## UI Pages

- `/battlepass` — main page with progression bar and rewards
- `/battlepass/tasks` — daily/weekly tasks
- `/battlepass/history` — past seasons

## Admin

- `/admin/battlepass/seasons` — CRUD seasons
- `/admin/battlepass/rewards` — configure rewards for each level
- `/admin/battlepass/tasks` — CRUD tasks

## Estimated

Separate large stage (~4-6 hours of Cursor)
