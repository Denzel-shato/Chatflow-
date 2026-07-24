/**
 * ChatFlowLogo — reusable logo component
 *
 * Props:
 *  size   — "sm" | "md" | "lg"  (default: "md")
 *  mark   — true = icon + wordmark (default), false = icon only
 *
 * Usage:
 *  <ChatFlowLogo />                  — navbar default
 *  <ChatFlowLogo size="lg" />        — hero / auth pages
 *  <ChatFlowLogo mark={false} />     — favicon / avatar contexts
 */

const SIZES = {
    sm: { box: 28, rx: 8,  icon: 16, font: 18, gap: 8  },
    md: { box: 36, rx: 10, icon: 20, font: 22, gap: 10 },
    lg: { box: 56, rx: 18, icon: 28, font: 34, gap: 14 },
  }
  
  export default function ChatFlowLogo({ size = 'md', mark = true }) {
    const s = SIZES[size]
    const id = `cf-${size}` // unique gradient id per size
  
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: s.gap, flexShrink: 0 }}>
        {/* ── Icon mark ── */}
        <svg
          width={s.box} height={s.box}
          viewBox="0 0 56 56"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ flexShrink: 0 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`${id}-a`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#c4b5fd"/>
              <stop offset="1" stopColor="#6d28d9"/>
            </linearGradient>
            <linearGradient id={`${id}-b`} x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop stopColor="#a78bfa"/>
              <stop offset="1" stopColor="#4c1d95"/>
            </linearGradient>
          </defs>
  
          {/* Rounded square background */}
          <rect width="56" height="56" rx="16" fill={`url(#${id}-a)`}/>
  
          {/* Main chat bubble */}
          <rect x="8" y="12" width="30" height="20" rx="7" fill="white" opacity="0.22"/>
          <rect x="8" y="12" width="30" height="20" rx="7" fill={`url(#${id}-a)`}/>
          {/* Main bubble tail — bottom-left */}
          <path d="M14 32 L8 42 L22 32 Z" fill={`url(#${id}-a)`}/>
  
          {/* Secondary bubble — top-right overlap */}
          <rect x="26" y="18" width="22" height="16" rx="6" fill={`url(#${id}-b)`} opacity="0.92"/>
          {/* Secondary bubble tail — bottom-right */}
          <path d="M42 34 L48 42 L36 34 Z" fill={`url(#${id}-b)`} opacity="0.92"/>
  
          {/* Lines in main bubble */}
          <line x1="13" y1="19" x2="33" y2="19" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.9"/>
          <line x1="13" y1="25" x2="26" y2="25" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.65"/>
  
          {/* Dots in secondary bubble */}
          <circle cx="31" cy="26" r="2.2" fill="white" opacity="0.95"/>
          <circle cx="37" cy="26" r="2.2" fill="white" opacity="0.95"/>
          <circle cx="43" cy="26" r="2.2" fill="white" opacity="0.95"/>
        </svg>
  
        {/* ── Wordmark ── */}
        {mark && (
          <span
            aria-label="ChatFlow"
            style={{
              fontSize: s.font,
              fontWeight: 700,
              letterSpacing: '-0.5px',
              lineHeight: 1,
              fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
              userSelect: 'none',
            }}
          >
            <span style={{ color: 'white' }}>Chat</span>
            <span style={{
              background: 'linear-gradient(135deg, #e9d5ff 0%, #a78bfa 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>Flow</span>
          </span>
        )}
      </div>
    )
  }