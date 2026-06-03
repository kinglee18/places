'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

type FeedbackType = 'bug' | 'question' | 'suggestion';

const TYPE_OPTIONS: { value: FeedbackType; label: string; placeholder: string }[] = [
  { value: 'bug',        label: '🐛 Bug',        placeholder: 'Describe what happened and how to reproduce it…' },
  { value: 'question',   label: '❓ Question',   placeholder: 'What would you like to know?…' },
  { value: 'suggestion', label: '💡 Suggestion', placeholder: 'What would make Plaziia better for you?…' },
];

export default function FeedbackWidget() {
  const { data: session } = useSession();

  const [open, setOpen]         = useState(false);
  const [type, setType]         = useState<FeedbackType>('question');
  const [message, setMessage]   = useState('');
  const [email, setEmail]       = useState('');
  const [sending, setSending]   = useState(false);
  const [success, setSuccess]   = useState(false);
  const [error, setError]       = useState('');

  const userEmail = session?.user?.email ?? null;

  function reset() {
    setType('question');
    setMessage('');
    setEmail('');
    setError('');
    setSuccess(false);
  }

  function handleClose() {
    setOpen(false);
    setTimeout(reset, 300); // wait for close animation
  }

  async function handleSubmit() {
    if (!message.trim()) {
      setError('Please write a message before sending.');
      return;
    }

    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: message.trim(),
          senderEmail: (userEmail ?? email.trim()) || undefined,
          pageUrl: window.location.href,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Unknown error');
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  }

  const placeholder = TYPE_OPTIONS.find((o) => o.value === type)?.placeholder ?? '';

  return (
    <>
      {/* Floating pill button */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open feedback"
        style={{
          position:     'fixed',
          bottom:       '24px',
          right:        '24px',
          zIndex:       90,
          display:      'flex',
          alignItems:   'center',
          gap:          '8px',
          padding:      '0 20px',
          height:       '48px',
          borderRadius: '999px',
          border:       'none',
          cursor:       'pointer',
          background:   'linear-gradient(135deg, #0f1b3d 0%, #3b6fa0 100%)',
          color:        '#fff',
          fontSize:     '14px',
          fontWeight:   600,
          boxShadow:    '0 4px 20px rgba(15,27,61,0.35)',
          transition:   'opacity 0.15s, transform 0.15s',
          letterSpacing: '0.01em',
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '0.88'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.opacity = '1'; }}
      >
        <span style={{ fontSize: '18px', lineHeight: 1 }}>💬</span>
        Feedback
      </button>

      {/* Modal card */}
      {open && (
        <div
          style={{
            position:     'fixed',
            bottom:       '84px',
            right:        '24px',
            zIndex:       91,
            width:        '308px',
            background:   '#fff',
            borderRadius: '16px',
            boxShadow:    '0 8px 40px rgba(15,27,61,0.20), 0 1px 4px rgba(0,0,0,0.08)',
            overflow:     'hidden',
            display:      'flex',
            flexDirection:'column',
          }}
        >
          {/* Header */}
          <div style={{
            background:   'linear-gradient(135deg, #0f1b3d 0%, #3b6fa0 100%)',
            padding:      '16px 20px',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: '15px' }}>Send feedback</div>
              <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: '12px', marginTop: '2px' }}>We read every message</div>
            </div>
            <button
              onClick={handleClose}
              aria-label="Close feedback"
              style={{
                background: 'rgba(255,255,255,0.15)',
                border:     'none',
                color:      '#fff',
                width:      '28px',
                height:     '28px',
                borderRadius: '50%',
                cursor:     'pointer',
                fontSize:   '16px',
                display:    'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: '16px 20px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {success ? (
              <div style={{
                textAlign:  'center',
                padding:    '24px 0',
                color:      '#1e6b3c',
                fontSize:   '15px',
                fontWeight: 600,
              }}>
                ✓ Thanks! We&apos;ll look into it.
              </div>
            ) : (
              <>
                {/* Type selector */}
                <div style={{ display: 'flex', gap: '6px' }}>
                  {TYPE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      style={{
                        flex:         1,
                        padding:      '6px 4px',
                        borderRadius: '8px',
                        border:       type === opt.value
                          ? '2px solid #3b6fa0'
                          : '2px solid #e4e7f0',
                        background:   type === opt.value ? '#eaf1fa' : '#f8f9fb',
                        color:        type === opt.value ? '#0f1b3d' : '#5a6288',
                        fontSize:     '12px',
                        fontWeight:   type === opt.value ? 700 : 500,
                        cursor:       'pointer',
                        transition:   'all 0.12s',
                        whiteSpace:   'nowrap',
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Message textarea */}
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={placeholder}
                  style={{
                    width:        '100%',
                    borderRadius: '10px',
                    border:       '1.5px solid #e4e7f0',
                    padding:      '10px 12px',
                    fontSize:     '13px',
                    color:        '#181e38',
                    resize:       'vertical',
                    outline:      'none',
                    fontFamily:   'inherit',
                    lineHeight:   1.6,
                    boxSizing:    'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#3b6fa0'; }}
                  onBlur={(e)  => { e.target.style.borderColor = '#e4e7f0'; }}
                />

                {/* Email input — only show when guest */}
                {!userEmail && (
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Your email (optional)"
                    style={{
                      width:        '100%',
                      borderRadius: '10px',
                      border:       '1.5px solid #e4e7f0',
                      padding:      '9px 12px',
                      fontSize:     '13px',
                      color:        '#181e38',
                      outline:      'none',
                      fontFamily:   'inherit',
                      boxSizing:    'border-box',
                    }}
                    onFocus={(e) => { e.target.style.borderColor = '#3b6fa0'; }}
                    onBlur={(e)  => { e.target.style.borderColor = '#e4e7f0'; }}
                  />
                )}

                {/* Error */}
                {error && (
                  <div style={{ color: '#b91c1c', fontSize: '12px', marginTop: '-4px' }}>
                    {error}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '2px' }}>
                  <button
                    onClick={handleClose}
                    style={{
                      flex:         1,
                      padding:      '9px',
                      borderRadius: '10px',
                      border:       '1.5px solid #e4e7f0',
                      background:   '#f8f9fb',
                      color:        '#5a6288',
                      fontSize:     '13px',
                      fontWeight:   600,
                      cursor:       'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={sending}
                    style={{
                      flex:         2,
                      padding:      '9px',
                      borderRadius: '10px',
                      border:       'none',
                      background:   sending ? '#9099b8' : 'linear-gradient(135deg, #0f1b3d 0%, #3b6fa0 100%)',
                      color:        '#fff',
                      fontSize:     '13px',
                      fontWeight:   700,
                      cursor:       sending ? 'default' : 'pointer',
                      transition:   'background 0.15s',
                    }}
                  >
                    {sending ? 'Sending…' : 'Send'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
