const pattern = /^(\d+)(s|m|h|d)$/;

const multipliers: Record<string, number> = {
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

/** Converts "15m" / "30d" style values to seconds */
export function durationToSeconds(value: string): number {
  const match = pattern.exec(value.trim());

  if (!match) {
    throw new Error(`Unsupported duration format: ${value}`);
  }

  return Number(match[1]) * multipliers[match[2]];
}
