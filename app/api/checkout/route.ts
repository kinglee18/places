import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: NextRequest) {
  const { propertyId } = await req.json();

  if (!propertyId) {
    return NextResponse.json({ error: 'propertyId required' }, { status: 400 });
  }

  const origin = req.headers.get('origin') ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'mxn',
          product_data: {
            name: 'Publicar anuncio en LocalIQ',
            description: 'Visibilidad pública · Badge verificado · Análisis de competencia 2km · Reporte descargable',
          },
          unit_amount: 29900, // $299 MXN in centavos
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    metadata: { propertyId },
    success_url: `${origin}/publicado?id=${propertyId}`,
    cancel_url: `${origin}/registro`,
  });

  return NextResponse.json({ url: session.url });
}
