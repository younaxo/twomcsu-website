export function wrapSelection(
  value: string,
  start: number,
  end: number,
  before: string,
  after = before,
): { value: string; selectionStart: number; selectionEnd: number } {
  const selected = value.slice(start, end);
  const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;
  if (selected) {
    return {
      value: next,
      selectionStart: start,
      selectionEnd: start + before.length + selected.length + after.length,
    };
  }
  return {
    value: next,
    selectionStart: start + before.length,
    selectionEnd: start + before.length,
  };
}

export function insertAtCursor(
  value: string,
  start: number,
  end: number,
  insertion: string,
): { value: string; selectionStart: number; selectionEnd: number } {
  const next = `${value.slice(0, start)}${insertion}${value.slice(end)}`;
  const cursor = start + insertion.length;
  return { value: next, selectionStart: cursor, selectionEnd: cursor };
}

export function getActiveTrigger(
  value: string,
  caret: number,
): { type: 'mention' | 'emoji'; query: string; start: number } | null {
  const before = value.slice(0, caret);
  const mentionMatch = /(?:^|[\s([{])@([A-Za-z0-9_]{0,16})$/.exec(before);
  if (mentionMatch) {
    return {
      type: 'mention',
      query: mentionMatch[1] ?? '',
      start: caret - (mentionMatch[1]?.length ?? 0) - 1,
    };
  }

  const emojiMatch = /(?:^|[\s([{]):([a-z0-9-]{0,32})$/i.exec(before);
  if (emojiMatch) {
    return {
      type: 'emoji',
      query: emojiMatch[1] ?? '',
      start: caret - (emojiMatch[1]?.length ?? 0) - 1,
    };
  }

  return null;
}
