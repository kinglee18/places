import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { auth } from '@/auth';

// POST /api/inquiries — anyone (logged-in or not) can send an inquiry
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { propertyId, senderName, senderEmail, questions, message } = body as {
    propertyId: string;
    senderName?: string;
    senderEmail?: string;
    questions: string[];
    message?: string;
  };

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }
  if ((!questions || questions.length === 0) && !message?.trim()) {
    return NextResponse.json({ error: 'At least one question or message required' }, { status: 400 });
  }

  // Verify property exists and is published
  const { data: property, error: propError } = await getSupabase()
    .from('properties')
    .select('id, user_email')
    .eq('id', propertyId)
    .single();

  if (propError || !property) {
    return NextResponse.json({ error: 'Property not found' }, { status: 404 });
  }

  // Use the session email if the user is logged in and didn't provide one
  const session = await auth();
  const resolvedEmail = senderEmail?.trim() || session?.user?.email || null;
  const resolvedName  = senderName?.trim()  || session?.user?.name  || null;

  const admin = getSupabaseAdmin();
  const { error } = await admin.from('inquiries').insert({
    property_id:  propertyId,
    sender_name:  resolvedName,
    sender_email: resolvedEmail,
    questions:    questions ?? [],
    message:      message?.trim() || null,
    is_read:      false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

// GET /api/inquiries?propertyId=xxx — only the property owner can read
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const propertyId = req.nextUrl.searchParams.get('propertyId');
  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  // Verify ownership
  const { data: property } = await getSupabase()
    .from('properties')
    .select('user_email')
    .eq('id', propertyId)
    .single();

  if (!property || property.user_email !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  const { data, error } = await admin
    .from('inquiries')
    .select('id, sender_name, sender_email, questions, message, is_read, created_at')
    .eq('property_id', propertyId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data ?? []);
}

// PATCH /api/inquiries — mark as read
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { inquiryId, propertyId } = await req.json();
  if (!inquiryId || !propertyId) {
    return NextResponse.json({ error: 'inquiryId and propertyId required' }, { status: 400 });
  }

  // Verify ownership
  const { data: property } = await getSupabase()
    .from('properties')
    .select('user_email')
    .eq('id', propertyId)
    .single();

  if (!property || property.user_email !== session.user.email) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = getSupabaseAdmin();
  await admin.from('inquiries').update({ is_read: true }).eq('id', inquiryId);

  return NextResponse.json({ ok: true });
}
