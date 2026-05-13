'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';

export default function NavHeader({ activePage }: { activePage?: 'propiedades' | 'home' }) {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header style={{
      padding: '18px 48px',
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      borderBottom: '1px solid #1e1e35',
      background: 'rgba(6,6,15,0.9)',
      backdropFilter: 'blur(20px)',
      position: 'sticky', top: 0, zIndex: 50,
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo */}
      <Link href="/" style={{ fontWeight: 800, fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px', color: '#f0f0f8', textDecoration: 'none' }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 4px 12px rgba(0,245,160,0.25)' }}>📍</div>
        Local<span style={{ color: '#00f5a0' }}>IQ</span>
      </Link>

      {/* Nav links */}
      <nav style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
        <Link href="/propiedades" style={{
          fontSize: '14px', fontWeight: activePage === 'propiedades' ? 600 : 500,
          color: activePage === 'propiedades' ? '#00f5a0' : '#9090b8',
          textDecoration: 'none', transition: 'color 0.2s',
          borderBottom: activePage === 'propiedades' ? '1px solid #00f5a0' : 'none',
          paddingBottom: '2px',
        }}>
          Properties
        </Link>

        {/* Auth section */}
        {status === 'loading' ? (
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#1e1e35', animation: 'pulse 1.5s infinite' }} />
        ) : session?.user ? (
          /* Logged in: avatar + dropdown */
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen(o => !o)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: '#12122a', border: '1px solid #2a2a4a',
                borderRadius: '100px', padding: '5px 12px 5px 5px',
                cursor: 'pointer', color: '#f0f0f8', fontFamily: "'Inter', sans-serif",
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#00f5a0')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#2a2a4a')}
            >
              {session.user.image ? (
                <img src={session.user.image} alt="avatar" style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, color: '#06060f', fontWeight: 700 }}>
                  {session.user.name?.[0] ?? '?'}
                </div>
              )}
              <span style={{ fontSize: '13px', fontWeight: 600, maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {session.user.name?.split(' ')[0]}
              </span>
              <span style={{ fontSize: '10px', color: '#6b6b9a' }}>▾</span>
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div style={{
                position: 'absolute', top: 'calc(100% + 8px)', right: 0,
                background: '#0d0d1a', border: '1px solid #1e1e35',
                borderRadius: '14px', minWidth: '200px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                overflow: 'hidden', zIndex: 100,
              }}>
                {/* User info */}
                <div style={{ padding: '14px 16px', borderBottom: '1px solid #1e1e35' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#f0f0f8', marginBottom: '2px' }}>{session.user.name}</div>
                  <div style={{ fontSize: '11px', color: '#6b6b9a', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session.user.email}</div>
                </div>
                {/* Actions */}
                <div style={{ padding: '8px' }}>
                  <Link href="/registro" onClick={() => setMenuOpen(false)} style={{
                    display: 'block', padding: '9px 12px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600, color: '#f0f0f8',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1e1e35')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    📝 Publish property
                  </Link>
                  <Link href="/mis-propiedades" onClick={() => setMenuOpen(false)} style={{
                    display: 'block', padding: '9px 12px', borderRadius: '8px',
                    fontSize: '13px', fontWeight: 600, color: '#f0f0f8',
                    textDecoration: 'none', transition: 'background 0.15s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#1e1e35')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    🏠 My properties
                  </Link>
                  <button
                    onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                    style={{
                      display: 'block', width: '100%', textAlign: 'left',
                      padding: '9px 12px', borderRadius: '8px', background: 'none', border: 'none',
                      fontSize: '13px', fontWeight: 600, color: '#ff6b6b',
                      cursor: 'pointer', fontFamily: "'Inter', sans-serif",
                      transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#2a0a0a')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    🚪 Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* Not logged in */
          <Link href="/registro" style={{
            background: 'linear-gradient(135deg, #00f5a0, #00b4d8)',
            color: '#06060f', padding: '9px 22px', borderRadius: '10px',
            fontWeight: 700, fontSize: '14px', textDecoration: 'none',
            boxShadow: '0 4px 16px rgba(0,245,160,0.25)',
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,245,160,0.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,245,160,0.25)'; }}
          >
            + Publicar
          </Link>
        )}
      </nav>
    </header>
  );
}
