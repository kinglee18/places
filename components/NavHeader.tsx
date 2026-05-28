'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

type ActivePage = 'home' | 'propiedades' | 'upgrade' | 'buscar';

export default function NavHeader({ activePage }: { activePage?: ActivePage }) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks: { label: string; href: string; id: ActivePage | null }[] = [
    { label: 'Properties', href: '/propiedades', id: 'propiedades' },
    { label: 'How it works', href: activePage === 'home' ? '#how-it-works' : '/#how-it-works', id: null },
    { label: 'Pro Plan', href: '/upgrade', id: 'upgrade' },
    { label: 'Find a Space', href: '/buscar', id: 'buscar' },
  ];

  return (
    <header style={{
      padding: '18px 48px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid var(--surface-border)',
      background: 'oklch(0.985 0.005 240 / 0.92)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo */}
      <Link href="/" style={{ fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--foreground)', textDecoration: 'none', letterSpacing: '-0.03em' }}>
        {/* Plaziia storefront icon */}
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0, filter: 'drop-shadow(0 4px 10px rgba(15,27,61,0.28))' }}>
          <defs>
            <linearGradient id="nav-g" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
              <stop stopColor="#0f1b3d"/>
              <stop offset="1" stopColor="#3b6fa0"/>
            </linearGradient>
          </defs>
          <rect width="32" height="32" rx="8" fill="url(#nav-g)"/>
          <rect x="4" y="8" width="24" height="3" rx="1.5" fill="white" opacity="0.9"/>
          <rect x="5" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
          <rect x="19" y="14" width="8" height="6" rx="1.5" fill="white" opacity="0.65"/>
          <rect x="12" y="22" width="8" height="7" rx="1.5" fill="white" opacity="0.45"/>
          <circle cx="18.5" cy="26" r="0.9" fill="white" opacity="0.9"/>
        </svg>
        <span style={{ color: '#0f1b3d' }}>Plazi</span><span style={{ color: '#3b6fa0' }}>ia</span>
      </Link>

      {/* Desktop nav */}
      <nav className="nav-desktop">
        {navLinks.map(link => (
          <Link key={link.href} href={link.href} style={{
            fontSize: '14px',
            fontWeight: activePage === link.id ? 600 : 500,
            color: activePage === link.id ? 'var(--brand)' : 'var(--muted)',
            textDecoration: 'none', transition: 'color 0.2s',
            borderBottom: activePage === link.id ? '1px solid var(--brand)' : 'none',
            paddingBottom: '2px',
          }}
            onMouseEnter={e => { if (activePage !== link.id) e.currentTarget.style.color = 'var(--foreground)'; }}
            onMouseLeave={e => { if (activePage !== link.id) e.currentTarget.style.color = 'var(--muted)'; }}
          >
            {link.label}
          </Link>
        ))}

        {/* Auth section */}
        {status === 'loading' ? (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--surface-border)', animation: 'pulse 1.5s infinite' }} />
        ) : session?.user ? (
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'oklch(0.96 0.01 250)', border: '1px solid #2a2a4a',
                borderRadius: '100px', padding: '5px 12px 5px 5px',
                cursor: 'pointer', color: 'var(--foreground)', fontFamily: "'Inter', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = 'oklch(0.55 0.11 250)')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'oklch(0.9 0.015 250)')}
            >
              {session.user.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={session.user.image} alt="avatar" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, oklch(0.235 0.07 265), oklch(0.55 0.11 250))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: 'oklch(0.985 0.005 240)', fontWeight: 700 }}>
                  {session.user.name?.[0] ?? '?'}
                </div>
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.name?.split(' ')[0]}
              </span>
              <span style={{ fontSize: '10px', color: 'oklch(0.45 0.03 260)' }}>▾</span>
            </button>

            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: 'var(--surface)', border: '1px solid var(--surface-border)',
                borderRadius: '14px', minWidth: '200px',
                boxShadow: '0 16px 48px oklch(0.18 0.04 260 / 0.12)',
                overflow: 'hidden', zIndex: 100,
              }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--surface-border)' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--foreground)', marginBottom: '2px' }}>{session.user.name}</div>
                  <div style={{ fontSize: '11px', color: 'oklch(0.45 0.03 260)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</div>
                </div>
                <div style={{ padding: '8px' }}>
                  <Link href="/registro" onClick={() => setMenuOpen(false)} style={{
                    display: 'block', padding: '9px 12px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600, color: 'var(--foreground)',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    📝 Publish property
                  </Link>
                  <Link href="/mis-propiedades" onClick={() => setMenuOpen(false)} style={{
                    display: 'block', padding: '9px 12px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600, color: 'var(--foreground)',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    🏠 My properties
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', borderRadius: '8px', background: 'none', border: 'none',
                      fontSize: '13px', fontWeight: 600, color: '#e53935',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'oklch(0.97 0.02 25)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    🚪 Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link href="/registro" style={{
            background: 'linear-gradient(135deg, oklch(0.235 0.07 265), oklch(0.55 0.11 250))',
            color: 'oklch(0.985 0.005 240)', padding: '9px 22px', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            boxShadow: '0 4px 16px oklch(0.235 0.07 265 / 0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px oklch(0.235 0.07 265 / 0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px oklch(0.235 0.07 265 / 0.25)'; }}
          >
            Register Property
          </Link>
        )}
      </nav>

      {/* Mobile hamburger */}
      <button
        className="nav-hamburger"
        aria-label="Open menu"
        onClick={() => setMobileOpen(o => !o)}
      >
        {mobileOpen ? '✕' : '☰'}
      </button>

      {/* Mobile drawer */}
      <div className={`nav-mobile-drawer${mobileOpen ? ' open' : ''}`} style={{ position: 'absolute', top: '100%' }}>
        {navLinks.map(link => (
          <Link key={link.href} href={link.href}
            className={`nav-mobile-link${activePage === link.id ? ' active' : ''}`}
            onClick={() => setMobileOpen(false)}
          >
            {link.label}
          </Link>
        ))}
        {session?.user ? (
          <>
            <Link href="/registro" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>📝 Publish property</Link>
            <Link href="/mis-propiedades" className="nav-mobile-link" onClick={() => setMobileOpen(false)}>🏠 My properties</Link>
            <button
              onClick={() => { setMobileOpen(false); signOut({ callbackUrl: '/' }); }}
              style={{
                display: 'block', width: '100%', textAlign: 'left',
                padding: '11px 12px', borderRadius: '10px', background: 'none', border: 'none',
                fontSize: '15px', fontWeight: 600, color: '#e53935',
                cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                marginTop: '4px',
              }}
            >
              🚪 Sign out
            </button>
          </>
        ) : (
          <Link href="/registro" className="nav-mobile-cta" onClick={() => setMobileOpen(false)}>
            Register Property
          </Link>
        )}
      </div>
    </header>
  );
}
