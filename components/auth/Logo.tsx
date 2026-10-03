export function LogoMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 36 36" className={className} aria-hidden="true">
      <rect x="6" y="2" width="24" height="32" rx="6" fill="var(--brand)" />
      <rect x="6" y="13" width="24" height="2" fill="var(--brand-ink)" />
      <rect x="10" y="6" width="2.5" height="4.5" rx="1.25" fill="#fff" />
      <rect x="10" y="18" width="2.5" height="8" rx="1.25" fill="#fff" />
      <circle cx="24" cy="25" r="2.2" fill="#ffd27a" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-[1.375rem] font-bold tracking-[-0.02em] text-ink">frezill</span>
    </span>
  );
}
