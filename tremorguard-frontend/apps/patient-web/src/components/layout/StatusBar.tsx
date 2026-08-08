export function StatusBar() {
  return (
    <div
      className="h-11 w-full flex-shrink-0 bg-background md:hidden"
      aria-hidden="true"
      style={{ height: 'var(--tg-statusbar-height)' }}
    />
  );
}
