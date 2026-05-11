'use client';

import { signIn } from 'next-auth/react';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <main style={{
      minHeight: '100vh',
      background: '#06060f',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Inter', sans-serif",
      color: '#f0f0f8',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Background blobs */}
      <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translate(-50%,-50%)', width: '700px', height: '500px', background: 'radial-gradient(ellipse, rgba(0,245,160,0.06) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(124,58,237,0.07) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Card */}
      <div style={{
        background: '#0d0d1a',
        border: '1px solid #1e1e35',
        borderRadius: '24px',
        padding: '48px 40px',
        width: '100%',
        maxWidth: '420px',
        textAlign: 'center',
        position: 'relative',
        zIndex: 1,
        boxShadow: '0 32px 80px rgba(0,0,0,0.5)',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '32px' }}>
          <div style={{ width: 40, height: 40, background: 'linear-gradient(135deg, #00f5a0, #00b4d8)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', boxShadow: '0 4px 16px rgba(0,245,160,0.3)' }}>
            📍
          </div>
          <span style={{ fontSize: '22px', fontWeight: 800 }}>
            Local<span style={{ color: '#00f5a0' }}>IQ</span>
          </span>
        </div>

        {/* Heading */}
        <h1 style={{ fontSize: '26px', fontWeight: 900, marginBottom: '10px', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          Sign in to publish
        </h1>
        <p style={{ color: '#6b6b9a', fontSize: '15px', marginBottom: '36px', lineHeight: 1.6 }}>
          You need an account to register and manage your properties.
        </p>

        {/* Divider */}
        <div style={{ height: '1px', background: '#1e1e35', marginBottom: '28px' }} />

        {/* Google Button */}
        <button
          id="google-signin-btn"
          onClick={() => signIn('google', { callbackUrl: '/registro' })}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: '#ffffff',
            color: '#1a1a2e',
            border: 'none',
            borderRadius: '12px',
            padding: '14px 20px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: "'Inter', sans-serif",
            transition: 'all 0.2s',
            boxShadow: '0 4px 16px rgba(255,255,255,0.08)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 28px rgba(255,255,255,0.15)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow = '0 4px 16px rgba(255,255,255,0.08)';
          }}
        >
          {/* Google SVG Icon */}
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Footer note */}
        <p style={{ marginTop: '24px', fontSize: '12px', color: '#6b6b9a', lineHeight: 1.6 }}>
          By signing in you accept our terms of use and privacy policy.
        </p>

        {/* Back link */}
        <div style={{ marginTop: '28px', paddingTop: '24px', borderTop: '1px solid #1e1e35' }}>
          <Link href="/" style={{ color: '#6b6b9a', fontSize: '14px', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#00f5a0')}
            onMouseLeave={e => (e.currentTarget.style.color = '#6b6b9a')}>
            ← Back to home
          </Link>
        </div>
      </div>
    </main>
  );
}
