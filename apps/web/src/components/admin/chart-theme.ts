export const ADMIN_CHART_COLORS = {
  primary: 'hsl(var(--primary))',
  secondary: '#22c55e',
  muted: 'hsl(var(--border))',
  text: 'hsl(var(--muted-foreground))',
  grid: 'hsl(var(--border))',
};

// Fixed categorical hues for multi-series charts — intentionally independent of
// theme/brand color so series stay distinguishable and consistent across reports.
export const ADMIN_CHART_PALETTE = [
  'hsl(var(--primary))',
  '#22c55e',
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#14b8a6',
  '#eab308',
  '#64748b',
];

export const adminChartTooltipStyle = {
  contentStyle: {
    backgroundColor: 'hsl(var(--popover))',
    border: '1px solid hsl(var(--border))',
    borderRadius: 'var(--radius-control)',
    fontSize: '12px',
    color: 'hsl(var(--popover-foreground))',
  },
  labelStyle: { color: 'hsl(var(--popover-foreground))' },
};
