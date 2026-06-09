import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import FeedbackList from './FeedbackList';

export const metadata = { title: 'Feedback — Admin · Plaziia' };

const ADMIN_EMAIL = 'lee.gc18@gmail.com';

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

export default async function AdminFeedbackPage() {
  const session = await auth();

  if (session?.user?.email !== ADMIN_EMAIL) {
    redirect('/');
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('feedback')
    .select('id, type, message, sender_email, sender_name, page_url, is_read, created_at')
    .order('created_at', { ascending: false });

  const items: FeedbackItem[] = (data ?? []) as FeedbackItem[];
  const unreadCount = items.filter((i) => !i.is_read).length;

  if (error) {
    return (
      <main style={{ minHeight: '100vh', background: 'oklch(0.985 0.005 240)', padding: '80px 24px' }}>
        <p style={{ color: '#b91c1c' }}>Error loading feedback: {error.message}</p>
      </main>
    );
  }

  return (
    <main style={{ minHeight: '100vh', background: 'oklch(0.985 0.005 240)', padding: '60px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>
        {/* Back link */}
        <Link href="/" style={{ fontSize: '14px', color: '#5a6288', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '32px' }}>
          ← Back to home
        </Link>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px', flexWrap: 'wrap' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 900, color: '#181e38', margin: 0 }}>
            User Feedback
          </h1>
          {unreadCount > 0 && (
            <span style={{
              background:   '#3b6fa0',
              color:        '#fff',
              padding:      '3px 12px',
              borderRadius: '999px',
              fontSize:     '13px',
              fontWeight:   700,
            }}>
              {unreadCount} unread
            </span>
          )}
        </div>
        <p style={{ color: '#9099b8', fontSize: '14px', marginBottom: '40px' }}>
          {items.length} total submissions · only visible to you
        </p>

        <FeedbackList initial={items} />
      </div>
    </main>
  );
}
