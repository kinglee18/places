import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const published = searchParams.get('published');
  const limit = searchParams.get('limit');

  let query = supabase
    .from('properties')
    .select(`
      id,
      colonia,
      calle,
      city,
      state,
      numero,
      tipo_local,
      m2,
      banos,
      habitaciones,
      estacionamientos,
      agua_drenaje,
      modalidad,
      precio_inmueble,
      precio_mantenimiento,
      descripcion,
      photo_urls,
      nivel_piso,
      created_at`
    )
    .order('created_at', { ascending: false });

  if (published === 'true') query = query.eq('is_published', true);
  if (limit) query = query.limit(Number(limit));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
