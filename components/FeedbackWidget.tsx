'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';

type FeedbackType = 'bug' | 'question' | 'suggestion';
type WidgetState = 'idle' | 'open' | 'submitting' | 'success';

export default function FeedbackWidget() {
  const t = useTranslations('FeedbackWidget');
  const { data: session } = useSession();

  const [widgetState, setWidgetState] = useState<WidgetState>('idle');
  const [type, setType] = useState<FeedbackType>('suggestion');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoggedIn = !!session?.user;
  const isOpen = widgetState === 'open' || widgetState === 'submitting';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 80);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const open = () => { setWidgetState('open'); setErrorMsg(''); };

  const close = () => {
    setWidgetState('idle');
    setMessage('');
    setType('suggestion');
    setEmail('');
    setErrorMsg('');
  };

  const submit = async () => {
    if (!message.trim()) {
      setErrorMsg(t('errorMessage'));
      textareaRef.current?.focus();
      return;
    }
    setErrorMsg('');
    setWidgetState('submitting');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          senderEmail: session?.user?.email || email.trim() || undefined,
          senderName: session?.user?.name || undefined,
          pageUrl: window.location.href,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || t('errorSubmit'));
      }
      setWidgetState('success');
      setTimeout(() => close(), 3200);
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : t('errorSubmit'));
      setWidgetState('open');
    }
  };

  const TYPES: { value: FeedbackType; emoji: string; label: string }[] = [
    { value: 'bug',        emoji: '🐛', label: t('typeBug') },
    { value: 'question',   emoji: '❓', label: t('typeQuestion') },
    { value: 'suggestion', emoji: '💡', label: t('typeSuggestion') },
  ];

  const isVisible = isOpen || widgetState === 'success';

  return (
    <>
      {/* ── Floating trigger button ─────────────────────────────────── */}
      <button
        onClick={open}
        aria-label={t('buttonLabel')}
        style={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          zIndex: 900,
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          padding: '9px 16px',
          borderRadius: '999px',
          border: '1px solid oklch(0.88 0.02 250)',
          background: 'oklch(0.985 0.005 240 / 0.96)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 24px oklch(0.18 0.04 260 / 0.10)',
          cursor: 'pointer',
          fontSize: '13px',
          fontWeight: 600,
          color: 'oklch(0.35 0.04 260)',
          fontFamily: "'Inter', sans-serif",
          transition: 'all 0.2s',
          opacity: isVisible ? 0 : 1,
          pointerEvents: isVisible ? 'none' : 'auto',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'oklch(0.55 0.08 250)';
          e.currentTarget.style.boxShadow = '0 6px 28px oklch(0.18 0.04 260 / 0.16)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'oklch(0.88 0.02 250)';
          e.currentTarget.style.boxShadow = '0 4px 24px oklch(0.18 0.04 260 / 0.10)';
        }}
      >
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M14 1H2C1.45 1 1 1.45 1 2v9c0 .55.45 1 1 1h2v3l4-3h6c.55 0 1-.45 1-1V2c0-.55-.45-1-1-1Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
        {t('buttonLabel')}
      </button>

      {/* ── Backdrop ────────────────────────────────────────────────── */}
      {isOpen && (
        <div
          onClick={close}
          style={{ position: 'fixed', inset: 0, zIndex: 901 }}
          aria-hidden="true"
        />
      )}

      {/* ── Panel ───────────────────────────────────────────────────── */}
      {isVisible && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={t('title')}
          style={{
            position: 'fixed',
            bottom: 72,
            right: 24,
            zIndex: 902,
            width: 320,
            background: '#ffffff',
            border: '1px solid oklch(0.88 0.02 250)',
            borderRadius: '16px',
            boxShadow: '0 16px 48px oklch(0.18 0.04 260 / 0.14)',
            fontFamily: "'Inter', sans-serif",
            overflow: 'hidden',
            animation: 'fb-slide-up 0.22s ease',
          }}
        >
          <style>{`
            @keyframes fb-slide-up {
              from { opacity: 0; transform: translateY(12px); }
              to   { opacity: 1; transform: none; }
            }
          `}</style>

          {widgetState === 'success' ? (
            <div style={{ padding: '32px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#181e38', marginBottom: 6 }}>
                {t('successTitle')}
              </div>
              <div style={{ fontSize: 13, color: '#5a6288' }}>{t('successBody')}</div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '16px 16px 0',
              }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#181e38' }}>{t('title')}</div>
                  <div style={{ fontSize: 12, color: '#9099b8', marginTop: 2 }}>{t('subtitle')}</div>
                </div>
                <button
                  onClick={close}
                  aria-label={t('close')}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    fontSize: 18, color: '#9099b8', lineHeight: 1,
                    padding: '4px 8px', borderRadius: 8,
                    transition: 'color 0.15s, background 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#181e38'; e.currentTarget.style.background = 'oklch(0.95 0.01 250)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#9099b8'; e.currentTarget.style.background = 'none'; }}
                >
                  {t('close')}
                </button>
              </div>

              <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Type selector */}
                <div style={{ display: 'flex', gap: 6 }}>
                  {TYPES.map(({ value, emoji, label }) => (
                    <button
                      key={value}
                      onClick={() => setType(value)}
                      style={{
                        flex: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                        padding: '7px 4px',
                        borderRadius: 10,
                        border: type === value
                          ? '1.5px solid oklch(0.55 0.08 250)'
                          : '1.5px solid oklch(0.88 0.02 250)',
                        background: type === value ? 'oklch(0.96 0.02 250)' : 'oklch(0.98 0.005 250)',
                        cursor: 'pointer',
                        fontSize: 11,
                        fontWeight: type === value ? 700 : 500,
                        color: type === value ? 'oklch(0.38 0.08 250)' : '#5a6288',
                        fontFamily: "'Inter', sans-serif",
                        transition: 'all 0.15s',
                      }}
                    >
                      <span>{emoji}</span>
                      <span>{label}</span>
                    </button>
                  ))}
                </div>

                {/* Message */}
                <textarea
                  ref={textareaRef}
                  value={message}
                  onChange={e => { setMessage(e.target.value); if (errorMsg) setErrorMsg(''); }}
                  placeholder={t('messagePlaceholder')}
                  rows={4}
                  disabled={widgetState === 'submitting'}
                  style={{
                    width: '100%',
                    resize: 'vertical',
                    padding: '10px 12px',
                    border: errorMsg ? '1.5px solid #fca5a5' : '1.5px solid oklch(0.88 0.02 250)',
                    borderRadius: 10,
                    background: 'oklch(0.98 0.005 250)',
                    fontFamily: "'DM Mono', monospace",
                    fontSize: 13,
                    color: '#181e38',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'border-color 0.15s',
                  }}
                  onFocus={e => { if (!errorMsg) e.currentTarget.style.borderColor = 'oklch(0.55 0.08 250)'; }}
                  onBlur={e => { if (!errorMsg) e.currentTarget.style.borderColor = 'oklch(0.88 0.02 250)'; }}
                />

                {/* Email — only when not logged in */}
                {!isLoggedIn && (
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('emailPlaceholder')}
                    disabled={widgetState === 'submitting'}
                    style={{
                      width: '100%',
                      padding: '9px 12px',
                      border: '1.5px solid oklch(0.88 0.02 250)',
                      borderRadius: 10,
                      background: 'oklch(0.98 0.005 250)',
                      fontFamily: "'DM Mono', monospace",
                      fontSize: 13,
                      color: '#181e38',
                      outline: 'none',
                      boxSizing: 'border-box',
                      transition: 'border-color 0.15s',
                    }}
                    onFocus={e => (e.currentTarget.style.borderColor = 'oklch(0.55 0.08 250)')}
                    onBlur={e => (e.currentTarget.style.borderColor = 'oklch(0.88 0.02 250)')}
                  />
                )}

                {/* Error */}
                {errorMsg && (
                  <div style={{ fontSize: 12, color: '#dc2626', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>⚠</span> {errorMsg}
                  </div>
                )}

                {/* Submit */}
                <button
                  onClick={submit}
                  disabled={widgetState === 'submitting'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: 10,
                    border: 'none',
                    background: widgetState === 'submitting'
                      ? 'oklch(0.70 0.06 250)'
                      : 'linear-gradient(135deg, #0f1b3d, #3b6fa0)',
                    color: '#f7f8fd',
                    fontFamily: "'Inter', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: widgetState === 'submitting' ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { if (widgetState !== 'submitting') e.currentTarget.style.opacity = '0.88'; }}
                  onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
                >
                  {widgetState === 'submitting' ? t('submitting') : t('submitBtn')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
