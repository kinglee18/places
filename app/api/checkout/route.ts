import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

type Kind = 'extra' | 'extend';

// Trial-stage pricing (MXN, in centavos).
const PRODUCTS: Record<Kind, { amount: number; name: string; description: string }> = {
  extra: {
    amount: 14900, // $149 MXN
    name: 'Additional listing on Plaziia',
    description: 'Publish another listing this month · 30 days live · full Google Maps + AI analysis',
  },
  extend: {
    amount: 9900, // $99 MXN
    name: 'Extend listing · 30 days',
    description: 'Keep your listing published for another 30 days',
  },
};

export async function POST(req: NextRequest) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const { propertyId, kind: rawKind } = await req.json();

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  const kind: Kind = rawKind === 'extend' ? 'extend' : 'extra';
  const product = PRODUCTS[kind];

  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const successUrl = kind === 'extend'
    ? `${origin}/propiedades/${propertyId}?extended=1`
    : `${origin}/publicado?id=${propertyId}`;
  const cancelUrl = kind === 'extend'
    ? `${origin}/propiedades/${propertyId}`
    : `${origin}/registro`;

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.amount,
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: { propertyId, kind },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  return NextResponse.json({ url: session.url });
}
