'use client';

import { useState } from 'react';

type FeedbackItem = {
  id: string;
  type: 'bug' | 'question' | 'suggestion';
  message: string;
  sender_email: string | null;
  sender_name: string | null;
  page_url: string | null;
  is_read: boolean;
  created_at: string;
};

const TYPE_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  bug:        { bg: '#fee2e2', color: '#b91c1c', label: '🐛 Bug' },
  question:   { bg: '#dbeafe', color: '#1d4ed8', label: '❓ Question' },
  suggestion: { bg: '#d1fae5', color: '#065f46', label: '💡 Suggestion' },
};

const FILTER_OPTIONS = ['all', 'unread', 'bug', 'question', 'suggestion'] as const;
type Filter = (typeof FILTER_OPTIONS)[number];

export default function FeedbackList({ initial }: { initial: FeedbackItem[] }) {
  const [items, setItems]     = useState<FeedbackItem[]>(initial);
  const [filter, setFilter]   = useState<Filter>('all');
  const [marking, setMarking] = useState<string | null>(null);

  async function markRead(id: string) {
    if (marking) return;
    setMarking(id);
    try {
      await fetch('/api/feedback', {
        method:  'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ id }),
      });
      setItems((prev) => prev.map((item) => item.id === id ? { ...item, is_read: true } : item));
    } finally {
      setMarking(null);
    }
  }

  const unreadCount = items.filter((i) => !i.is_read).length;

  const filtered = items.filter((item) => {
    if (filter === 'all')    return true;
    if (filter === 'unread') return !item.is_read;
    return item.type === filter;
  });

  return (
    <div>
      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {FILTER_OPTIONS.map((f) => {
          const count = f === 'all'    ? items.length
                      : f === 'unread' ? unreadCount
                      : items.filter((i) => i.type === f).length;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding:      '6px 16px',
                borderRadius: '999px',
                border:       filter === f ? '2px solid #3b6fa0' : '2px solid #e4e7f0',
                background:   filter === f ? '#eaf1fa' : '#f8f9fb',
                color:        filter === f ? '#0f1b3d' : '#5a6288',
                fontSize:     '13px',
                fontWeight:   filter === f ? 700 : 500,
                cursor:       'pointer',
                display:      'flex',
                alignItems:   'center',
                gap:          '6px',
              }}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={{
                background:   filter === f ? '#3b6fa0' : '#e4e7f0',
                color:        filter === f ? '#fff' : '#5a6288',
                borderRadius: '999px',
                padding:      '1px 7px',
                fontSize:     '11px',
                fontWeight:   700,
              }}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback cards */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', color: '#9099b8', padding: '48px 0', fontSize: '15px' }}>
          No feedback yet in this category.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map((item) => {
            const badge = TYPE_COLORS[item.type] ?? { bg: '#f3f4f6', color: '#374151', label: item.type };
            return (
              <div
                key={item.id}
                onClick={() => !item.is_read && markRead(item.id)}
                style={{
                  background:   item.is_read ? '#fff' : 'oklch(0.975 0.01 240)',
                  border:       item.is_read ? '1.5px solid #e4e7f0' : '1.5px solid #3b6fa0',
                  borderRadius: '12px',
                  padding:      '16px 20px',
                  cursor:       item.is_read ? 'default' : 'pointer',
                  transition:   'border-color 0.15s',
                  position:     'relative',
                }}
              >
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px', flexWrap: 'wrap' }}>
                  <span style={{
                    background:   badge.bg,
                    color:        badge.color,
                    padding:      '3px 10px',
                    borderRadius: '999px',
                    fontSize:     '12px',
                    fontWeight:   700,
                  }}>
                    {badge.label}
                  </span>

                  {!item.is_read && (
                    <span style={{
                      background: '#3b6fa0',
                      color:      '#fff',
                      padding:    '2px 8px',
                      borderRadius: '999px',
                      fontSize:   '11px',
                      fontWeight: 700,
                    }}>
                      NEW
                    </span>
                  )}

                  <span style={{ marginLeft: 'auto', color: '#9099b8', fontSize: '12px' }}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', year: 'numeric',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                {/* Message */}
                <p style={{ color: '#181e38', fontSize: '14px', lineHeight: 1.65, margin: '0 0 12px' }}>
                  {item.message}
                </p>

                {/* Meta */}
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '12px', color: '#9099b8' }}>
                  {item.sender_email && (
                    <a
                      href={`mailto:${item.sender_email}`}
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#3b6fa0', textDecoration: 'none' }}
                    >
                      ✉ {item.sender_name ? `${item.sender_name} <${item.sender_email}>` : item.sender_email}
                    </a>
                  )}
                  {!item.sender_email && (
                    <span>Anonymous</span>
                  )}
                  {item.page_url && (
                    <a
                      href={item.page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{ color: '#9099b8', textDecoration: 'none', maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      title={item.page_url}
                    >
                      🔗 {item.page_url.replace(/^https?:\/\/[^/]+/, '')}
                    </a>
                  )}
                </div>

                {!item.is_read && (
                  <div style={{ marginTop: '10px', fontSize: '11px', color: '#9099b8' }}>
                    Click to mark as read
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
