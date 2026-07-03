export type ZoneType = 'cultural' | 'religious' | 'entertainment' | 'nature' | 'lodging' | 'mixed';

export interface ZoneSuggestion {
  category: string;
  reason: string;
}

const ZONE_SUGGESTIONS_EN: Record<ZoneType, ZoneSuggestion[]> = {
  cultural: [
    { category: 'Souvenir / Crafts', reason: 'Museum and historic district visitors look for local mementos.' },
    { category: 'Themed café', reason: 'Cultural tourists value spaces to rest and socialize between visits.' },
    { category: 'Tour operator', reason: 'High demand for guided tours and organized experiences.' },
    { category: 'Photo / Print shop', reason: 'Visitors want to print or frame photos from their trip.' },
    { category: 'Bookstore / Art', reason: 'Books, catalogs, and local art reproductions sell well here.' },
  ],
  religious: [
    { category: 'Religious articles', reason: 'Visitors and worshippers seek candles, icons, and devotional items.' },
    { category: 'Café / Bakery', reason: 'Religious-zone visitors look for nearby rest options.' },
    { category: 'Flower shop', reason: 'High demand for flowers and offerings for ceremonies.' },
    { category: 'Convenience / Grocery', reason: 'Basic needs for tourists and residents in the area.' },
  ],
  entertainment: [
    { category: 'Snacks / Fast food', reason: 'Stadiums and amusement parks drive high demand for casual food.' },
    { category: 'Souvenir / Merchandise', reason: 'Event attendees look for memorabilia and branded goods.' },
    { category: 'Photo / Print shop', reason: 'Photo printing and event souvenirs.' },
    { category: 'Convenience store', reason: 'Drinks, snacks, and quick-use items before and after events.' },
  ],
  nature: [
    { category: 'Outdoor gear rental', reason: 'Bicycles, kayaks, and camping equipment are in high demand near parks and zoos.' },
    { category: 'Café / Restaurant', reason: 'Park visitors look for outdoor dining options.' },
    { category: 'Snacks / Juices', reason: 'High demand for healthy and light options.' },
    { category: 'Photo / Print shop', reason: 'Nature tourists want to print their photos locally.' },
  ],
  lodging: [
    { category: 'Laundry', reason: 'Hotel and hostel guests frequently need laundry service.' },
    { category: 'Convenience / Grocery', reason: 'Staying tourists look for nearby stores for essentials.' },
    { category: 'Café / Breakfast', reason: 'Travelers want quick breakfast options near their accommodation.' },
    { category: 'Tour operator', reason: 'Hotel guests seek organized activities and excursions.' },
  ],
  mixed: [
    { category: 'Souvenir / Crafts', reason: 'Mixed tourist flow zone — high demand for general souvenirs.' },
    { category: 'Café', reason: 'Universal rest point for any type of tourist.' },
    { category: 'Tour operator', reason: 'Diverse attractions generate demand for organized tours.' },
    { category: 'Photo / Print shop', reason: 'Tourists of all types want to save visual memories.' },
  ],
};

const ZONE_SUGGESTIONS_ES: Record<ZoneType, ZoneSuggestion[]> = {
  cultural: [
    { category: 'Souvenirs / Artesanía', reason: 'Los visitantes de museos y zonas históricas buscan recuerdos locales.' },
    { category: 'Café temático', reason: 'Los turistas culturales valoran espacios para descansar y socializar entre visitas.' },
    { category: 'Operador turístico', reason: 'Alta demanda de tours guiados y experiencias organizadas.' },
    { category: 'Foto / Imprenta', reason: 'Los visitantes quieren imprimir o enmarcar fotos de su viaje.' },
    { category: 'Librería / Arte', reason: 'Libros, catálogos y reproducciones de arte local se venden bien aquí.' },
  ],
  religious: [
    { category: 'Artículos religiosos', reason: 'Visitantes y feligreses buscan velas, íconos y artículos devocionales.' },
    { category: 'Café / Panadería', reason: 'Los visitantes de zonas religiosas buscan opciones cercanas para descansar.' },
    { category: 'Florería', reason: 'Alta demanda de flores y ofrendas para ceremonias.' },
    { category: 'Abarrotes / Minisuper', reason: 'Necesidades básicas para turistas y residentes del área.' },
  ],
  entertainment: [
    { category: 'Snacks / Comida rápida', reason: 'Estadios y parques de diversiones generan alta demanda de comida casual.' },
    { category: 'Souvenirs / Merchandising', reason: 'Los asistentes a eventos buscan recuerdos y artículos de marca.' },
    { category: 'Foto / Imprenta', reason: 'Impresión de fotos y souvenirs del evento.' },
    { category: 'Tienda de conveniencia', reason: 'Bebidas, snacks y artículos de uso rápido antes y después de eventos.' },
  ],
  nature: [
    { category: 'Renta de equipo al aire libre', reason: 'Bicicletas, kayaks y equipo de campismo tienen alta demanda cerca de parques y zoológicos.' },
    { category: 'Café / Restaurante', reason: 'Los visitantes de parques buscan opciones para comer al aire libre.' },
    { category: 'Snacks / Jugos', reason: 'Alta demanda de opciones saludables y ligeras.' },
    { category: 'Foto / Imprenta', reason: 'Los turistas de naturaleza quieren imprimir sus fotos localmente.' },
  ],
  lodging: [
    { category: 'Lavandería', reason: 'Los huéspedes de hoteles y hostales frecuentemente necesitan servicio de lavandería.' },
    { category: 'Abarrotes / Minisuper', reason: 'Los turistas hospedados buscan tiendas cercanas para lo esencial.' },
    { category: 'Café / Desayunos', reason: 'Los viajeros quieren opciones rápidas de desayuno cerca de su hospedaje.' },
    { category: 'Operador turístico', reason: 'Los huéspedes de hotel buscan actividades y excursiones organizadas.' },
  ],
  mixed: [
    { category: 'Souvenirs / Artesanía', reason: 'Zona de flujo turístico mixto — alta demanda de souvenirs generales.' },
    { category: 'Café', reason: 'Punto de descanso universal para cualquier tipo de turista.' },
    { category: 'Operador turístico', reason: 'La diversidad de atracciones genera demanda de tours organizados.' },
    { category: 'Foto / Imprenta', reason: 'Los turistas de todo tipo quieren guardar memorias visuales.' },
  ],
};

export function getZoneSuggestions(zone: ZoneType, locale: string): ZoneSuggestion[] {
  const map = locale === 'es' ? ZONE_SUGGESTIONS_ES : ZONE_SUGGESTIONS_EN;
  return map[zone] ?? [];
}
