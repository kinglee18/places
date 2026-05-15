import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

const SELECT = 'id, colonia, calle, numero, tipo_local, m2, banos, habitaciones, estacionamientos, agua_drenaje, modalidad, precio_inmueble, precio_mantenimiento, descripcion, photo_urls, nivel_piso, created_at, city, state, estado_conservacion, uso_suelo, tipo_energia';

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;

  let query = getSupabase().from('properties').select(SELECT).order('created_at', { ascending: false });

  if (sp.get('published') === 'true') query = query.eq('is_published', true);
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
