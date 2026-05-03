'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { NAV_ITEMS, type NavDropdownItem, type NavItem } from '@/config/navigation';
import { ThemeToggle } from '@/components/ThemeToggle';

const C = {
  bg: 'var(--bg)',
  bgElev: 'var(--bg-elev)',
  border: 'var(--border-1)',
  borderHi: 'var(--border-hi)',
  text: 'var(--fg-1)',
  muted: 'var(--fg-3)',
  dim: 'var(--fg-4)',
  orange: 'var(--orange)',
};

function isDropdown(item: NavItem): item is NavDropdownItem {
  return 'groups' in item && item.groups !== undefined;
}

export default function Navbar() {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const openMenu = useCallback((label: string) => {
    clearTimeout(closeTimer.current);
    setOpenDropdown(label);
  }, []);

  const scheduleClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120);
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, []);

  return (
    <>
      <style>{`
        .nb-link:hover { color: #e9ecf2 !important; }
        .nb-dropdown-link:hover { background: rgba(255,255,255,0.05) !important; }
        .nb-mobile-link:hover { color: #fb923c !important; }
        .nb-burger:hover { background: rgba(255,255,255,0.06) !important; }
        @keyframes nb-fadein {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nb-mobile-open {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <nav
        ref={navRef}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          background: 'var(--bg-card)',
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '0 28px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 24,
          }}
        >
          {/* Brand */}
          <Link
            href="/"
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 22,
              fontStyle: 'italic',
              color: C.text,
              letterSpacing: -0.3,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            futur<span style={{ color: C.orange, fontStyle: 'normal' }}>•</span>e
          </Link>

          {/* Desktop links */}
          <div
            className="nb-desktop-links"
            style={{ display: 'flex', alignItems: 'center', gap: 32 }}
          >
            {NAV_ITEMS.map((item) => {
              if (isDropdown(item)) {
                const isOpen = openDropdown === item.label;
                return (
                  <div
                    key={item.label}
                    style={{ position: 'relative' }}
                    onMouseEnter={() => openMenu(item.label)}
                    onMouseLeave={scheduleClose}
                  >
                    <button
                      aria-haspopup="true"
                      aria-expanded={isOpen}
                      onClick={() =>
                        setOpenDropdown(isOpen ? null : item.label)
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOpenDropdown(isOpen ? null : item.label);
                        }
                      }}
                      className="nb-link"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 11,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: isOpen ? C.text : C.muted,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        transition: 'color 0.15s',
                      }}
                    >
                      {item.label}
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                        style={{
                          transform: isOpen ? 'rotate(180deg)' : 'none',
                          transition: 'transform 0.2s',
                          opacity: 0.6,
                        }}
                      >
                        <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </button>

                    {isOpen && (
                      <div
                        role="menu"
                        onMouseEnter={() => clearTimeout(closeTimer.current)}
                        onMouseLeave={scheduleClose}
                        style={{
                          position: 'absolute',
                          top: 'calc(100% + 12px)',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          background: 'rgba(10,13,28,0.97)',
                          backdropFilter: 'blur(20px)',
                          WebkitBackdropFilter: 'blur(20px)',
                          border: `1px solid ${C.borderHi}`,
                          borderRadius: 10,
                          padding: '20px 8px',
                          display: 'flex',
                          gap: 0,
                          minWidth: 560,
                          boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                          animation: 'nb-fadein 0.18s ease both',
                        }}
                      >
                        {item.groups.map((group, gi) => (
                          <div
                            key={group.groupLabel}
                            style={{
                              flex: 1,
                              padding: '0 12px',
                              borderRight:
                                gi < item.groups.length - 1
                                  ? `1px solid ${C.border}`
                                  : 'none',
                            }}
                          >
                            {/* Group header */}
                            <div
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: 9,
                                letterSpacing: '0.14em',
                                textTransform: 'uppercase',
                                color: group.color,
                                marginBottom: 10,
                                paddingLeft: 10,
                              }}
                            >
                              {group.groupLabel}
                            </div>

                            {group.links.map((link) => (
                              <Link
                                key={link.href}
                                href={link.href}
                                role="menuitem"
                                onClick={() => setOpenDropdown(null)}
                                className="nb-dropdown-link"
                                style={{
                                  display: 'block',
                                  padding: '8px 10px',
                                  borderRadius: 6,
                                  textDecoration: 'none',
                                  transition: 'background 0.12s',
                                  opacity: link.badge ? 0.55 : 1,
                                  pointerEvents: link.badge ? 'none' : 'auto',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    marginBottom: 2,
                                  }}
                                >
                                  <span
                                    style={{
                                      fontSize: 13,
                                      color: C.text,
                                      fontFamily: "'Instrument Sans', sans-serif",
                                      fontWeight: 500,
                                    }}
                                  >
                                    {link.label}
                                  </span>
                                  {link.badge && (
                                    <span
                                      style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 9,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        color: C.dim,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 4,
                                        padding: '1px 5px',
                                      }}
                                    >
                                      {link.badge}
                                    </span>
                                  )}
                                </div>
                                {link.description && (
                                  <div
                                    style={{
                                      fontSize: 11,
                                      color: C.dim,
                                      fontFamily: "'JetBrains Mono', monospace",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    {link.description}
                                  </div>
                                )}
                              </Link>
                            ))}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              // Flat link
              return (
                <a
                  key={item.label}
                  href={item.href}
                  className="nb-link"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    color: C.muted,
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ThemeToggle />
            <div
              className="nb-actions-desktop"
              style={{ display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <Link
                href="/connexion"
                style={{
                  padding: '8px 12px',
                  borderRadius: 999,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                  textDecoration: 'none',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 11,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(255,255,255,0.02)',
                }}
              >
                Se connecter
              </Link>
              <Link
                href="/inscription"
                style={{
                  padding: '8px 20px',
                  borderRadius: 6,
                  background: C.orange,
                  color: C.bg,
                  fontFamily: "'Instrument Sans', sans-serif",
                  fontWeight: 600,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                Commencer
              </Link>
            </div>

            {/* Burger button — mobile only */}
            <button
              aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((prev) => !prev)}
              className="nb-burger nb-mobile-only"
              style={{
                display: 'none',
                background: 'none',
                border: `1px solid ${C.border}`,
                borderRadius: 6,
                padding: '8px 10px',
                cursor: 'pointer',
                color: C.text,
                transition: 'background 0.15s',
              }}
            >
              {mobileOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2L16 16M16 2L2 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 4.5H16M2 9H16M2 13.5H16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile panel */}
        {mobileOpen && (
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              background: 'var(--bg-card-opaque)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              animation: 'nb-mobile-open 0.2s ease both',
              paddingBottom: 16,
            }}
          >
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px' }}>
              {NAV_ITEMS.map((item) => {
                if (isDropdown(item)) {
                  const expanded = mobileExpanded === item.label;
                  return (
                    <div key={item.label} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <button
                        aria-expanded={expanded}
                        onClick={() =>
                          setMobileExpanded(expanded ? null : item.label)
                        }
                        style={{
                          width: '100%',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '16px 0',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: C.text,
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: 12,
                          letterSpacing: '0.1em',
                          textTransform: 'uppercase',
                        }}
                      >
                        {item.label}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 12 12"
                          fill="none"
                          style={{
                            transform: expanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <path d="M2 4L6 8L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>

                      {expanded && (
                        <div style={{ paddingBottom: 12 }}>
                          {item.groups.map((group) => (
                            <div key={group.groupLabel} style={{ marginBottom: 16 }}>
                              <div
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: 9,
                                  letterSpacing: '0.14em',
                                  textTransform: 'uppercase',
                                  color: group.color,
                                  marginBottom: 8,
                                  paddingLeft: 4,
                                }}
                              >
                                {group.groupLabel}
                              </div>
                              {group.links.map((link) => (
                                <Link
                                  key={link.href}
                                  href={link.href}
                                  onClick={() => setMobileOpen(false)}
                                  className="nb-mobile-link"
                                  style={{
                                    display: 'flex',
                                    padding: '9px 4px',
                                    color: link.badge ? C.dim : C.muted,
                                    textDecoration: 'none',
                                    fontFamily: "'Instrument Sans', sans-serif",
                                    fontSize: 14,
                                    pointerEvents: link.badge ? 'none' : 'auto',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'color 0.15s',
                                  }}
                                >
                                  {link.label}
                                  {link.badge && (
                                    <span
                                      style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: 9,
                                        letterSpacing: '0.1em',
                                        textTransform: 'uppercase',
                                        color: C.dim,
                                        border: `1px solid ${C.border}`,
                                        borderRadius: 4,
                                        padding: '1px 5px',
                                      }}
                                    >
                                      {link.badge}
                                    </span>
                                  )}
                                </Link>
                              ))}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <a
                    key={item.label}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="nb-mobile-link"
                    style={{
                      display: 'block',
                      padding: '16px 0',
                      borderBottom: `1px solid ${C.border}`,
                      color: C.muted,
                      textDecoration: 'none',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 12,
                      letterSpacing: '0.1em',
                      textTransform: 'uppercase',
                      transition: 'color 0.15s',
                    }}
                  >
                    {item.label}
                  </a>
                );
              })}

              {/* Mobile CTA */}
              <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <Link
                  href="/connexion"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '12px',
                    textAlign: 'center',
                    border: `1px solid ${C.border}`,
                    borderRadius: 8,
                    color: C.text,
                    textDecoration: 'none',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Se connecter
                </Link>
                <Link
                  href="/inscription"
                  onClick={() => setMobileOpen(false)}
                  style={{
                    display: 'block',
                    padding: '14px',
                    textAlign: 'center',
                    background: C.orange,
                    borderRadius: 8,
                    color: C.bg,
                    textDecoration: 'none',
                    fontFamily: "'Instrument Sans', sans-serif",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Commencer
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      <style>{`
        @media (max-width: 768px) {
          .nb-desktop-links { display: none !important; }
          .nb-actions-desktop { display: none !important; }
          .nb-mobile-only { display: flex !important; }
        }
        @media (min-width: 769px) {
          .nb-mobile-only { display: none !important; }
        }
      `}</style>
    </>
  );
}
