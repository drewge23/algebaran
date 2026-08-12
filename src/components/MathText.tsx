/**
 * Renders mathematics in a serif italic face so equations read like a textbook.
 * Content is plain Unicode (`x²`, the true minus `−`), which keeps us free of a
 * math-typesetting dependency — a deliberate choice for a fast-loading app.
 */
export function MathText({
  children,
  size = 'lg',
  onDark = false,
}: {
  children: string;
  size?: 'lg' | 'sm';
  onDark?: boolean;
}) {
  const classes = ['math'];
  if (size === 'sm') classes.push('math--sm');
  if (onDark) classes.push('math--on-dark');
  return <div className={classes.join(' ')}>{children}</div>;
}
