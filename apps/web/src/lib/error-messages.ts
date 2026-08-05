/** Nest answers in english whenever a message is not set explicitly */
const KNOWN_MESSAGES: Record<string, string> = {
  unauthorized: 'Нужно войти в аккаунт',
  forbidden: 'Доступ запрещён',
  'forbidden resource': 'Недостаточно прав',
  'bad request': 'Некорректный запрос',
  'not found': 'Ничего не найдено',
  'too many requests': 'Слишком много запросов. Попробуйте позже',
  'throttlerexception: too many requests': 'Слишком много запросов. Попробуйте позже',
  'internal server error': 'Ошибка сервера. Попробуйте позже',
  'service unavailable': 'Сервер недоступен. Попробуйте позже',
  'network error': 'Нет связи с сервером',
};

/** class-validator prefixes every default message with the field name */
const VALIDATION_RULES: [RegExp, string][] = [
  [/should not be empty/i, 'Обязательное поле'],
  [/must be an email/i, 'Некорректный email'],
  [/must be shorter than or equal to (\d+) characters/i, 'Не длиннее $1 символов'],
  [/must be longer than or equal to (\d+) characters/i, 'Не короче $1 символов'],
  [
    /must be longer than or equal to (\d+) and shorter than or equal to (\d+)/i,
    'От $1 до $2 символов',
  ],
  [/must not be greater than (\d+)/i, 'Максимум $1'],
  [/must not be less than (\d+)/i, 'Минимум $1'],
  [/must match .* regular expression/i, 'Недопустимый формат'],
  [/must be one of the following values/i, 'Недопустимое значение'],
  [/must be a (string|number|boolean|integer|UUID)/i, 'Недопустимое значение'],
];

export function translateError(message: string): string {
  const trimmed = message.trim();
  const known = KNOWN_MESSAGES[trimmed.toLowerCase()];

  if (known) {
    return known;
  }

  for (const [pattern, translation] of VALIDATION_RULES) {
    const match = trimmed.match(pattern);

    if (match) {
      return translation.replace(/\$(\d)/g, (_, index: string) => match[Number(index)] ?? '');
    }
  }

  return trimmed;
}
