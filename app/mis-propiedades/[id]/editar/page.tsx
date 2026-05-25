import { redirect, notFound } from 'next/navigation';
import { auth } from '@/auth';
import { getSupabase } from '@/lib/supabase';
import NavHeader from '@/components/NavHeader';
import EditProperty, { type PropertyData } from '@/components/EditProperty';

export default async function EditarPropiedadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect('/login');

  const { id } = await params;

  const { data } = await getSupabase()
    .from('properties')
    .select('id, colonia, calle, numero, lat, lng, tipo_local, m2, antiguedad, nivel_piso, uso_anterior, agua_drenaje, habitaciones, banos, estacionamientos, modalidad, precio_inmueble, precio_mantenimiento, descripcion, photo_urls, user_email')
    .eq('id', id)
    .single();

  if (!data) notFound();
  if (data.user_email !== session.user.email) redirect('/mis-propiedades');

  const property = data as PropertyData & { user_email: string };

  return (
    <main style={{ minHeight: '100vh', background: 'oklch(0.985 0.005 240)' }}>
      <NavHeader />
      <EditProperty property={property} />
    </main>
  );
}
