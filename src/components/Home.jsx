import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import ChatFlowLogo from "../components/ChatFlowLogo";

/* ─────────────────────────────────────────
   Design tokens
   Flat, near-black surface system with a single
   muted indigo-violet accent. No gradients on
   backgrounds/buttons/icons — accent is used
   sparingly, not as decoration everywhere.
───────────────────────────────────────── */
const T = {
  bg: "#09090c",
  surface: "#121216",
  surfaceHover: "#17171c",
  border: "rgba(255,255,255,0.08)",
  borderHover: "rgba(255,255,255,0.16)",
  textPrimary: "#f4f4f6",
  textSecondary: "rgba(244,244,246,0.58)",
  textTertiary: "rgba(244,244,246,0.36)",
  accent: "#5b57e0",
  accentHover: "#6c68ee",
  accentSoft: "rgba(91,87,224,0.14)",
  accentSoftHover: "rgba(91,87,224,0.22)",
  success: "#34d399",
};

/* ─────────────────────────────────────────
   Scroll-triggered visibility hook
───────────────────────────────────────── */
function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) setInView(true);
      },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, inView];
}

/* ─────────────────────────────────────────
   Navbar
───────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 200,
        transition: "background 0.3s, border-color 0.3s",
        background: scrolled ? "rgba(9,9,12,0.88)" : "transparent",
        backdropFilter: scrolled ? "blur(14px)" : "none",
        borderBottom: `1px solid ${scrolled ? T.border : "transparent"}`,
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 28px",
          height: 68,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <ChatFlowLogo size="md" />

        {/* Desktop nav */}
        <ul
          className="nav-links"
          style={{
            display: "flex",
            gap: 40,
            listStyle: "none",
            margin: 0,
            padding: 0,
            alignItems: "center",
          }}
        >
          {["Features"].map((label) => (
            <li key={label}>
              <a
                href={`#${label.toLowerCase()}`}
                style={{
                  color: T.textSecondary,
                  textDecoration: "none",
                  fontSize: 14,
                  fontWeight: 500,
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.target.style.color = T.textPrimary)}
                onMouseLeave={(e) => (e.target.style.color = T.textSecondary)}
              >
                {label}
              </a>
            </li>
          ))}
          <li>
            <Link
              to="/login"
              style={{
                color: T.textSecondary,
                textDecoration: "none",
                fontSize: 14,
                fontWeight: 500,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.target.style.color = T.textPrimary)}
              onMouseLeave={(e) => (e.target.style.color = T.textSecondary)}
            >
              Sign in
            </Link>
          </li>
          <li>
            <Link
              to="/signup"
              style={{
                background: T.accent,
                color: "white",
                textDecoration: "none",
                padding: "9px 20px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                transition: "background 0.18s",
                display: "inline-block",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = T.accent)
              }
            >
              Get started
            </Link>
          </li>
        </ul>

        {/* Hamburger */}
        <button
          onClick={() => setOpen((o) => !o)}
          className="ham-btn"
          style={{
            display: "none",
            flexDirection: "column",
            gap: 5,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 8,
          }}
        >
          <span
            style={{
              width: 22,
              height: 2,
              background: T.textPrimary,
              borderRadius: 1,
              transition: "transform 0.25s",
              display: "block",
              transform: open ? "rotate(45deg) translate(5px,5px)" : "none",
            }}
          />
          <span
            style={{
              width: 22,
              height: 2,
              background: T.textPrimary,
              borderRadius: 1,
              transition: "opacity 0.25s",
              display: "block",
              opacity: open ? 0 : 1,
            }}
          />
          <span
            style={{
              width: 22,
              height: 2,
              background: T.textPrimary,
              borderRadius: 1,
              transition: "transform 0.25s",
              display: "block",
              transform: open ? "rotate(-45deg) translate(5px,-5px)" : "none",
            }}
          />
        </button>
      </div>

      {open && (
        <div
          className="mob-menu"
          style={{
            background: "rgba(9,9,12,0.98)",
            borderBottom: `1px solid ${T.border}`,
            padding: "10px 28px 22px",
          }}
        >
          {["Features"].map((l) => (
            <a
              key={l}
              href={`#${l.toLowerCase()}`}
              onClick={() => setOpen(false)}
              style={{
                display: "block",
                color: T.textSecondary,
                textDecoration: "none",
                padding: "13px 0",
                fontSize: 15,
                fontWeight: 500,
                borderBottom: `1px solid ${T.border}`,
              }}
            >
              {l}
            </a>
          ))}
          <Link
            to="/login"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              color: T.textSecondary,
              textDecoration: "none",
              padding: "13px 0",
              fontSize: 15,
              fontWeight: 500,
              borderBottom: `1px solid ${T.border}`,
            }}
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            onClick={() => setOpen(false)}
            style={{
              display: "block",
              marginTop: 16,
              textAlign: "center",
              background: T.accent,
              color: "white",
              textDecoration: "none",
              padding: "13px",
              borderRadius: 8,
              fontSize: 15,
              fontWeight: 600,
            }}
          >
            Get started
          </Link>
        </div>
      )}
    </nav>
  );
}

/* ─────────────────────────────────────────
   Animated chat mockup
───────────────────────────────────────── */
const MESSAGES = [
  { id: 1, from: "them", text: "Hey! Just tried ChatFlow 👋", delay: 0 },
  { id: 2, from: "me", text: "It's incredible right?", delay: 900 },
  {
    id: 3,
    from: "them",
    text: "The video calling works perfectly!",
    delay: 1800,
  },
  { id: 4, from: "me", text: "And look how fast messages are", delay: 2700 },
  {
    id: 5,
    from: "them",
    text: "Switching to ChatFlow for everything",
    delay: 3600,
  },
];

function ChatMockup({ animate }) {
  const [visible, setVisible] = useState([]);

  useEffect(() => {
    if (!animate) return;
    setVisible([]);
    const timers = MESSAGES.map((m) =>
      setTimeout(() => setVisible((v) => [...v, m.id]), m.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [animate]);

  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
      }}
    >
      {/* Window bar */}
      <div
        style={{
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "rgba(255,255,255,0.02)",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          {[
            "rgba(255,255,255,0.16)",
            "rgba(255,255,255,0.16)",
            "rgba(255,255,255,0.16)",
          ].map((c, i) => (
            <div
              key={i}
              style={{
                width: 9,
                height: 9,
                borderRadius: "50%",
                background: c,
              }}
            />
          ))}
        </div>
        <span
          style={{
            flex: 1,
            textAlign: "center",
            color: T.textTertiary,
            fontSize: 12,
            fontWeight: 500,
          }}
        >
          ChatFlow — Live Demo
        </span>
        <div
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: T.success,
          }}
        />
      </div>

      {/* Chat header */}
      <div
        style={{
          padding: "11px 18px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <ChatFlowLogo size="sm" mark={false} />
        <div>
          <div style={{ color: T.textPrimary, fontWeight: 600, fontSize: 14 }}>
            Alex
          </div>
          <div style={{ color: T.success, fontSize: 11, fontWeight: 500 }}>
            Online
          </div>
        </div>
        <div style={{ marginLeft: "auto", display: "flex", gap: 16 }}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.textTertiary}
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect x="1" y="5" width="15" height="14" rx="2" />
          </svg>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={T.textTertiary}
            strokeWidth="1.8"
            strokeLinecap="round"
          >
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.81 19.79 19.79 0 01.02 1.18 2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z" />
          </svg>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          padding: "16px",
          minHeight: 224,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {MESSAGES.map((msg) => (
          <div
            key={msg.id}
            style={{
              display: "flex",
              justifyContent: msg.from === "me" ? "flex-end" : "flex-start",
              opacity: visible.includes(msg.id) ? 1 : 0,
              transform: visible.includes(msg.id)
                ? "translateY(0)"
                : "translateY(8px)",
              transition: "opacity 0.32s ease, transform 0.32s ease",
            }}
          >
            <div
              style={{
                maxWidth: "75%",
                padding: "10px 14px",
                borderRadius:
                  msg.from === "me"
                    ? "14px 14px 3px 14px"
                    : "14px 14px 14px 3px",
                background:
                  msg.from === "me" ? T.accent : "rgba(255,255,255,0.06)",
                border: msg.from === "me" ? "none" : `1px solid ${T.border}`,
                color: msg.from === "me" ? "white" : T.textPrimary,
                fontSize: 13.5,
                lineHeight: 1.45,
              }}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {visible.length === MESSAGES.length && (
          <div>
            <div
              style={{
                display: "inline-flex",
                gap: 5,
                alignItems: "center",
                padding: "10px 16px",
                background: "rgba(255,255,255,0.06)",
                border: `1px solid ${T.border}`,
                borderRadius: "14px 14px 14px 3px",
              }}
            >
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: T.textTertiary,
                    animation: "typingDot 1.2s ease-in-out infinite",
                    animationDelay: `${i * 0.2}s`,
                  }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Input bar */}
      <div
        style={{
          padding: "11px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          borderTop: `1px solid ${T.border}`,
          background: "rgba(0,0,0,0.14)",
        }}
      >
        <div
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid ${T.border}`,
            borderRadius: 18,
            padding: "9px 16px",
            color: T.textTertiary,
            fontSize: 13,
          }}
        >
          Type a message…
        </div>
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            flexShrink: 0,
            background: T.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.2"
            strokeLinecap="round"
          >
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Feature cards — all icons share one flat
   accent treatment, not a rainbow per card
───────────────────────────────────────── */
const FeatureIcons = {
  bolt: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  lock: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="11" width="18" height="11" rx="2" />
      <path d="M7 11V7a5 5 0 0110 0v4" />
    </svg>
  ),
  sparkles: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" />
      <path d="M5 3l.75 2.25L8 6l-2.25.75L5 9l-.75-2.25L2 6l2.25-.75z" />
      <path d="M19 15l.75 2.25L22 18l-2.25.75L19 21l-.75-2.25L16 18l2.25-.75z" />
    </svg>
  ),
  devices: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="5" y="2" width="14" height="20" rx="2" />
      <line x1="12" y1="18" x2="12.01" y2="18" />
    </svg>
  ),
  video: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" />
    </svg>
  ),
  activity: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke={T.accent}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
};

const FEATURES = [
  {
    iconKey: "bolt",
    title: "Lightning Fast",
    desc: "Messages delivered in real-time via Firebase — zero perceptible lag.",
  },
  {
    iconKey: "lock",
    title: "Secure & Private",
    desc: "Your conversations stay yours. Authentication built on Firebase Auth.",
  },
  {
    iconKey: "sparkles",
    title: "Beautiful Design",
    desc: "A clean interface that feels native on any device or screen size.",
  },
  {
    iconKey: "devices",
    title: "Cross Platform",
    desc: "Responsive from day one — desktop, tablet, or phone.",
  },
  {
    iconKey: "video",
    title: "Video & Voice Calls",
    desc: "Crystal-clear calls powered by Zegocloud, right inside the app.",
  },
  {
    iconKey: "activity",
    title: "Always On",
    desc: "Presence indicators, typing signals, and read receipts in real time.",
  },
];

function FeatureCard({ feature, index }) {
  const [ref, inView] = useInView(0.08);
  const [hovered, setHovered] = useState(false);

  return (
    <div
      ref={ref}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: T.surface,
        border: `1px solid ${hovered ? T.borderHover : T.border}`,
        borderRadius: 14,
        padding: "26px 22px",
        transition:
          "border-color 0.25s, transform 0.35s cubic-bezier(0.16,1,0.3,1)",
        transitionDelay: `${index * 60}ms`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(28px)",
        cursor: "default",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: 10,
          marginBottom: 16,
          background: hovered ? T.accentSoftHover : T.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "background 0.25s",
        }}
      >
        {FeatureIcons[feature.iconKey]}
      </div>
      <h3
        style={{
          color: T.textPrimary,
          fontSize: 16,
          fontWeight: 600,
          margin: "0 0 8px",
        }}
      >
        {feature.title}
      </h3>
      <p
        style={{
          color: T.textSecondary,
          fontSize: 14,
          lineHeight: 1.65,
          margin: 0,
        }}
      >
        {feature.desc}
      </p>
    </div>
  );
}

/* ─────────────────────────────────────────
   Tech stack strip — replaces fake usage
   stats with the real technologies used
───────────────────────────────────────── */
const TECH_STACK = [
  {
    icon: FeatureIcons.bolt,
    title: "Firebase",
    desc: "Real-time messaging & auth",
  },
  {
    icon: FeatureIcons.video,
    title: "Agora",
    desc: "Video & voice calling",
  },
  {
    icon: FeatureIcons.activity,
    title: "TanStack Query",
    desc: "Data fetching & caching",
  },
  {
    icon: FeatureIcons.lock,
    title: "TypeScript",
    desc: "Type-safe end to end",
  },
];

function TechCard({ icon, title, desc, isLast }) {
  const [ref, inView] = useInView(0.3);

  return (
    <div
      ref={ref}
      className="stat-item"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "8px 0",
        borderRight: isLast ? "none" : `1px solid ${T.border}`,
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(10px)",
        transition: "opacity 0.5s ease, transform 0.5s ease",
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: T.accentSoft,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 700,
          lineHeight: 1.2,
          color: T.textPrimary,
        }}
      >
        {title}
      </div>
      <div
        style={{
          color: T.textTertiary,
          fontSize: 12,
          fontWeight: 500,
          letterSpacing: "0.02em",
          textAlign: "center",
          maxWidth: 140,
        }}
      >
        {desc}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════
   HOME PAGE
═══════════════════════════════════════════ */
export default function Home() {
  const [mockupRef, mockupInView] = useInView(0.18);
  const [featuresRef, featuresInView] = useInView(0.04);
  const [ctaRef, ctaInView] = useInView(0.18);
  const [heroVisible, setHeroVisible] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  const onMouseMove = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    setTilt({
      x: ((e.clientX - r.left) / r.width - 0.5) * 10,
      y: ((e.clientY - r.top) / r.height - 0.5) * -7,
    });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: T.bg,
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        overflowX: "hidden",
        position: "relative",
      }}
    >
      <style>{`
        @keyframes typingDot{0%,60%,100%{transform:translateY(0);opacity:.5}30%{transform:translateY(-6px);opacity:1}}
        @keyframes fadeDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        @media(max-width:768px){
          .nav-links{display:none!important}
          .ham-btn{display:flex!important}
          .hero-row{flex-direction:column!important;gap:48px!important}
          .hero-h1{font-size:40px!important}
          .stats-grid{grid-template-columns:1fr 1fr!important}
          .stats-wrap{padding:24px 16px!important}
          .stat-item:nth-child(2){border-right:none!important}
          .stat-item:nth-child(3){border-right:1px solid ${T.border}!important;border-top:1px solid ${T.border}!important}
          .stat-item:nth-child(4){border-right:none!important;border-top:1px solid ${T.border}!important}
          .stat-item{padding:18px 0!important}
          .feat-grid{grid-template-columns:1fr 1fr!important}
        }
        @media(max-width:480px){
          .feat-grid{grid-template-columns:1fr!important}
          .hero-h1{font-size:32px!important}
        }
        @media(min-width:769px){
          .mob-menu{display:none!important}
        }
      `}</style>

      <Navbar />

      {/* ══ HERO ══ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1120,
          margin: "0 auto",
          padding: "124px 28px 76px",
        }}
      >
        <div
          className="hero-row"
          style={{ display: "flex", alignItems: "center", gap: 64 }}
        >
          {/* Left — text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p
              style={{
                color: T.textTertiary,
                fontSize: 13,
                fontWeight: 600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                margin: "0 0 20px",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(14px)",
                transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)",
              }}
            >
              Now with video &amp; voice calling
            </p>

            <h1
              className="hero-h1"
              style={{
                fontSize: 60,
                fontWeight: 700,
                lineHeight: 1.08,
                color: T.textPrimary,
                margin: "0 0 22px",
                letterSpacing: "-2px",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(22px)",
                transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.06s",
              }}
            >
              Chat like
              <br />
              <span style={{ color: T.accent }}>never before</span>
            </h1>

            <p
              style={{
                color: T.textSecondary,
                fontSize: 17,
                lineHeight: 1.7,
                maxWidth: 440,
                margin: "0 0 34px",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(18px)",
                transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.12s",
              }}
            >
              A modern, secure messaging platform with real-time presence,
              typing indicators, and seamless video calls — all in one place.
            </p>

            <div
              style={{
                display: "flex",
                gap: 12,
                flexWrap: "wrap",
                opacity: heroVisible ? 1 : 0,
                transform: heroVisible ? "translateY(0)" : "translateY(14px)",
                transition: "all 0.6s cubic-bezier(0.16,1,0.3,1) 0.18s",
              }}
            >
              <Link
                to="/signup"
                style={{
                  background: T.accent,
                  color: "white",
                  textDecoration: "none",
                  padding: "13px 28px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  transition: "background 0.18s",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = T.accentHover)
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = T.accent)
                }
              >
                Get started free
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="white"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                to="/login"
                style={{
                  background: "transparent",
                  border: `1px solid ${T.border}`,
                  color: T.textPrimary,
                  textDecoration: "none",
                  padding: "13px 26px",
                  borderRadius: 10,
                  fontWeight: 600,
                  fontSize: 15,
                  transition: "border-color 0.18s, background 0.18s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = T.borderHover;
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = T.border;
                  e.currentTarget.style.background = "transparent";
                }}
              >
                Sign in
              </Link>
            </div>
          </div>

          {/* Right — subtle 3-D tilt mockup */}
          <div
            ref={mockupRef}
            style={{ flex: 1, minWidth: 0, maxWidth: 460, perspective: 1100 }}
            onMouseMove={onMouseMove}
            onMouseLeave={() => setTilt({ x: 0, y: 0 })}
          >
            <div
              style={{
                transform: `rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
                transition: "transform 0.1s ease-out",
                transformStyle: "preserve-3d",
                opacity: mockupInView ? 1 : 0,
                transitionProperty: "transform, opacity",
                transitionDuration: mockupInView ? "0.6s" : "0.1s",
              }}
            >
              <ChatMockup animate={mockupInView} />
            </div>
          </div>
        </div>
      </section>

      {/* ══ TECH STACK ══ */}
      <section
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 28px 80px",
        }}
      >
        <p
          style={{
            textAlign: "center",
            color: T.textTertiary,
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            margin: "0 0 20px",
          }}
        >
          Under the hood
        </p>
        <div
          className="stats-wrap"
          style={{
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            padding: "32px 24px",
          }}
        >
          <div
            className="stats-grid"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4,1fr)",
              alignItems: "center",
            }}
          >
            {TECH_STACK.map((s, i) => (
              <TechCard
                key={s.title}
                {...s}
                isLast={i === TECH_STACK.length - 1}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══ */}
      <section
        id="features"
        ref={featuresRef}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 1120,
          margin: "0 auto",
          padding: "0 28px 88px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            marginBottom: 52,
            opacity: featuresInView ? 1 : 0,
            transform: featuresInView ? "translateY(0)" : "translateY(24px)",
            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <p
            style={{
              color: T.accent,
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              margin: "0 0 14px",
            }}
          >
            Why ChatFlow
          </p>
          <h2
            style={{
              color: T.textPrimary,
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-1px",
              margin: "0 0 16px",
            }}
          >
            Everything you need,
            <br />
            nothing you don't
          </h2>
          <p
            style={{
              color: T.textSecondary,
              fontSize: 16,
              maxWidth: 460,
              margin: "0 auto",
            }}
          >
            Built with modern tech for real people — messaging that just works.
          </p>
        </div>

        <div
          className="feat-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3,1fr)",
            gap: 18,
          }}
        >
          {FEATURES.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </section>

      {/* ══ CTA ══ */}
      <section
        ref={ctaRef}
        style={{
          position: "relative",
          zIndex: 1,
          maxWidth: 820,
          margin: "0 auto",
          padding: "0 28px 110px",
        }}
      >
        <div
          style={{
            textAlign: "center",
            background: T.surface,
            border: `1px solid ${T.border}`,
            borderRadius: 20,
            padding: "64px 44px",
            opacity: ctaInView ? 1 : 0,
            transform: ctaInView ? "translateY(0)" : "translateY(28px)",
            transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <ChatFlowLogo size="lg" />
          </div>

          <h2
            style={{
              color: T.textPrimary,
              fontSize: 38,
              fontWeight: 700,
              letterSpacing: "-1px",
              margin: "0 0 16px",
            }}
          >
            Ready to get started?
          </h2>
          <p
            style={{
              color: T.textSecondary,
              fontSize: 16,
              lineHeight: 1.68,
              maxWidth: 420,
              margin: "0 auto 36px",
            }}
          >
            A real-time messaging app built from the ground up — give it a try
            and see how it feels.
          </p>

          <div
            style={{
              display: "flex",
              gap: 12,
              justifyContent: "center",
              flexWrap: "wrap",
            }}
          >
            <Link
              to="/signup"
              style={{
                background: T.accent,
                color: "white",
                textDecoration: "none",
                padding: "14px 34px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
                transition: "background 0.18s",
                display: "inline-block",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = T.accentHover)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = T.accent)
              }
            >
              Create free account
            </Link>
            <Link
              to="/login"
              style={{
                background: "transparent",
                border: `1px solid ${T.border}`,
                color: T.textPrimary,
                textDecoration: "none",
                padding: "14px 28px",
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 15,
                transition: "border-color 0.18s, background 0.18s",
                display: "inline-block",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = T.borderHover;
                e.currentTarget.style.background = "rgba(255,255,255,0.03)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = T.border;
                e.currentTarget.style.background = "transparent";
              }}
            >
              Sign in
            </Link>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ══ */}
      <footer
        style={{
          position: "relative",
          zIndex: 1,
          borderTop: `1px solid ${T.border}`,
          padding: "28px 28px",
          textAlign: "center",
          color: T.textTertiary,
          fontSize: 13,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 8,
          }}
        >
          <ChatFlowLogo size="sm" />
        </div>
        © {new Date().getFullYear()} ChatFlow. Built with TypeScript, React,
        TanStack Query, Tailwind CSS, Agora &amp; Firebase.
      </footer>
    </div>
  );
}
