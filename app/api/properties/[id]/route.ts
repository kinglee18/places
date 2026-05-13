import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { auth } from '@/auth';

// Admin client se crea solo cuando se necesita (DELETE) para no crashear el módulo completo
// si SUPABASE_SERVICE_ROLE_KEY no está configurada
function getAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key);
}

const EDITABLE_FIELDS = [
  'colonia', 'calle', 'numero', 'lat', 'lng', 'city', 'state', 'country',
  'tipo_local', 'm2', 'antiguedad', 'nivel_piso', 'uso_anterior', 'agua_drenaje',
  'habitaciones', 'banos', 'estacionamientos', 'modalidad', 'precio_inmueble',
  'precio_mantenimiento', 'descripcion', 'photo_urls', 'is_published', 'competition_data',
];

async function verifyOwnership(id: string, email: string) {
  const { data } = await supabase
    .from('properties')
    .select('user_email, photo_urls')
    .eq('id', id)
    .single();
  if (!data || data.user_email !== email) return null;
  return data as { user_email: string; photo_urls: string[] };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await verifyOwnership(id, session.user.email);
  if (!existing) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => EDITABLE_FIELDS.includes(k))
  );

  const { error } = await supabase
    .from('properties')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const existing = await verifyOwnership(id, session.user.email);
  if (!existing) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Remove photos from storage before deleting the record
  const photoUrls: string[] = existing.photo_urls ?? [];
  if (photoUrls.length > 0) {
    const adminClient = getAdminClient();
    if (adminClient) {
      const storagePaths = photoUrls
        .map((url) => {
          const parts = url.split('/property-photos/');
          return parts[1] ?? '';
        })
        .filter(Boolean);

      if (storagePaths.length > 0) {
        await adminClient.storage.from('property-photos').remove(storagePaths);
      }
    }
    // Si no hay SUPABASE_SERVICE_ROLE_KEY las fotos quedan huérfanas en Storage
    // pero el registro se elimina igual
  }

  const { error } = await supabase
    .from('properties')
    .delete()
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
