import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import { auth } from '@/auth';

const SELECT = 'id, colonia, calle, numero, tipo_local, m2, banos, habitaciones, estacionamientos, agua_drenaje, modalidad, precio_inmueble, precio_mantenimiento, descripcion, photo_urls, nivel_piso, created_at, city, state, estado_conservacion, uso_suelo, tipo_energia, expires_at';

// Fields a client is allowed to set when creating a property. Server-controlled
// fields (user_email, is_published, is_extra, expires_at) are NOT in this list.
const INSERTABLE_FIELDS = [
  'colonia', 'calle', 'numero', 'descripcion', 'tipo_local', 'm2', 'antiguedad',
  'nivel_piso', 'uso_anterior', 'agua_drenaje', 'habitaciones', 'banos',
  'estacionamientos', 'modalidad', 'precio_inmueble', 'precio_mantenimiento',
  'lat', 'lng', 'photo_urls', 'city', 'state', 'country', 'm2_construccion',
  'frente_m', 'fondo_m', 'altura_techo_m', 'tipo_terreno', 'estado_conservacion',
  'calidad_construccion', 'tipo_energia', 'uso_suelo', 'servicios',
  'tipo_contrato', 'fecha_disponible',
];

const FREE_DAYS = 30;

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  let query = getSupabase().from('properties').select(SELECT).order('created_at', { ascending: false });

  if (sp.get('published') === 'true') {
    query = query
      .eq('is_published', true)
      // Only show listings that haven't expired (null = legacy/never expires)
      .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`);
  }
  if (sp.get('limit'))    query = query.limit(Number(sp.get('limit')));
  if (sp.get('modalidad')) query = query.eq('modalidad', sp.get('modalidad')!);
  if (sp.get('colonia'))  query = query.eq('colonia', sp.get('colonia')!);
  if (sp.get('tipo'))     query = query.eq('tipo_local', sp.get('tipo')!);
  if (sp.get('condicion')) query = query.eq('estado_conservacion', sp.get('condicion')!);
  if (sp.get('zoning'))   query = query.eq('uso_suelo', sp.get('zoning')!);
  if (sp.get('energia'))  query = query.eq('tipo_energia', sp.get('energia')!);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}

/**
 * Creates a property.
 *
 * Freemium rule (trial stage): each user gets ONE free listing per calendar
 * month, published immediately for 30 days. Any additional listing in the same
 * month is created unpublished (is_extra) and must be paid for via Stripe
 * before it goes live. The client should redirect to /api/checkout when
 * `requiresPayment` is true.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  const email = session?.user?.email;
  
  if (!email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const admin = getSupabaseAdmin();

  // Count this user's FREE listings created in the current calendar month.
  const now = new Date();
  const startOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();

  const { count, error: countError } = await admin
    .from('properties')
    .select('id', { count: 'exact', head: true })
    .eq('user_email', email)
    .eq('is_extra', false)
    .gte('created_at', startOfMonth);

  if (countError) {
    console.error('Count query error:', countError.code, countError.message, countError.details);
    return NextResponse.json({ error: countError.message || countError.code || 'Count query failed' }, { status: 500 });
  }

  const requiresPayment = (count ?? 0) >= 1;

  // Build the insert payload from whitelisted fields only.
  const insert: Record<string, unknown> = {};
  for (const key of INSERTABLE_FIELDS) {
    if (body[key] !== undefined) insert[key] = body[key];
  }

  insert.user_email = email;
  insert.is_extra = requiresPayment;
  // Free listing publishes immediately; paid extra waits for the webhook.
  insert.is_published = !requiresPayment;
  insert.expires_at = requiresPayment
    ? null
    : new Date(now.getTime() + FREE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  const { data: inserted, error } = await admin
    .from('properties')
    .insert(insert)
    .select('id')
    .single();

  if (error || !inserted) {
    console.error('Insert error:', error);
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 });
  }

  return NextResponse.json({ id: inserted.id, requiresPayment });
}
