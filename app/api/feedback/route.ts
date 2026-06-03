import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { auth } from '@/auth';

const ADMIN_EMAIL = 'lee.gc18@gmail.com';
const VALID_TYPES = ['bug', 'question', 'suggestion'] as const;
type FeedbackType = (typeof VALID_TYPES)[number];

// POST /api/feedback — anyone can submit feedback
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { type, message, senderEmail, senderName, pageUrl } = body as {
    type: string;
    message: string;
    senderEmail?: string;
    senderName?: string;
    pageUrl?: string;
  };

  if (!VALID_TYPES.includes(type as FeedbackType)) {
    return NextResponse.json({ error: 'Invalid type. Must be bug, question, or suggestion.' }, { status: 400 });
  }
  if (!message?.trim()) {
    return NextResponse.json({ error: 'Message is required.' }, { status: 400 });
  }

  // Auto-fill identity from session if not provided
  const session = await auth();
  const resolvedEmail = senderEmail?.trim() || session?.user?.email || null;
  const resolvedName  = senderName?.trim()  || session?.user?.name  || null;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('feedback').insert({
    type,
    message:      message.trim(),
    sender_email: resolvedEmail,
    sender_name:  resolvedName,
    page_url:     pageUrl || null,
    is_read:      false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/feedback — admin only
export async function GET(req: NextRequest) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const unreadOnly = req.nextUrl.searchParams.get('unread') === 'true';

  const admin = getSupabaseAdmin();
  let query = admin
    .from('feedback')
    .select('id, type, message, sender_email, sender_name, page_url, is_read, created_at')
    .order('created_at', { ascending: false });

  if (unreadOnly) {
    query = query.eq('is_read', false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// PATCH /api/feedback — mark as read (admin only)
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (session?.user?.email !== ADMIN_EMAIL) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { id } = await req.json();
  if (!id) {
    return NextResponse.json({ error: 'id required' }, { status: 400 });
  }

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('feedback').update({ is_read: true }).eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
