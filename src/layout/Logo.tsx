export function Logo() {
  return (
    <svg viewBox="0 0 512 512" className="size-7" role="img" aria-label="Logo ThothNet">
      <defs>
        <linearGradient id="logo-gradiente" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
        <mask id="logo-lua">
          <rect width="512" height="512" fill="white" />
          <circle cx="366" cy="256" r="158" fill="black" />
        </mask>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#logo-gradiente)" />
      <circle cx="304" cy="256" r="158" fill="#ffffff" mask="url(#logo-lua)" />
      <path d="M330 148l20 50 50 20-50 20-20 50-20-50-50-20 50-20z" fill="#fbbf24" />
    </svg>
  )
}