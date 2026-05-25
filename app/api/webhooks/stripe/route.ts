import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  // Use service role key so webhook can bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) return NextResponse.json({ error: 'No signature' }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const propertyId = session.metadata?.propertyId;
    const kind = session.metadata?.kind ?? 'extra';

    if (propertyId) {
      const now = Date.now();

      if (kind === 'extend') {
        // Push expiry forward by 30 days from whichever is later: now or current expiry.
        const { data: current } = await supabaseAdmin
          .from('properties')
          .select('expires_at')
          .eq('id', propertyId)
          .single();

        const base = current?.expires_at
          ? Math.max(new Date(current.expires_at).getTime(), now)
          : now;
        const newExpiry = new Date(base + THIRTY_DAYS_MS).toISOString();

        await supabaseAdmin
          .from('properties')
          .update({ is_published: true, expires_at: newExpiry })
          .eq('id', propertyId);
      } else {
        // Paid additional listing: publish it for 30 days.
        await supabaseAdmin
          .from('properties')
          .update({
            is_published: true,
            expires_at: new Date(now + THIRTY_DAYS_MS).toISOString(),
          })
          .eq('id', propertyId);
      }
    }
  }

  return NextResponse.json({ received: true });
}
