---
name: LocalIQ Project State
description: Current data model, registration form fields, Free/Pro tier split, and backend status for LocalIQ.
type: project
---

Platform targets commercial property owners in CDMX colonias. As of April 2026:

**Currently collected in registration form (properties table):**
- colonia (required) — dropdown of 20 CDMX colonias
- calle, numero (optional) — street address
- tipo_local (required) — 5 types: street-facing, inside plaza, corner unit, basement, market stall
- m2 (required) — size in square meters
- antiguedad (optional) — age in years
- agua_drenaje (optional) — water/drainage status
- habitaciones, banos, estacionamientos (steppers, default 0)
- precio_inmueble, precio_mantenimiento (optional, MXN)
- descripcion (optional free text)
- lat/lng (optional map pin)
- photo_urls (required, exactly 5 photos)

**Free plan:** registration + digital property sheet (not publicly searchable)
**Monetization direction (decided April 2026):** Shifting from Pro subscription to pay-per-listing (anuncio destacado) model. Subscription model was rejected for individual owners — they do not list frequently enough to justify recurring fees. Subscription tier reserved for future "plan agencia" targeting brokers/property managers with 3+ listings.

**Paid listing (anuncio) should include:**
- Public visibility / searchability (strongest gate — free = stored, paid = discoverable)
- Competitor radius analysis report (2km, one-time PDF output)
- AI-generated business recommendation report (downloadable, not live dashboard)
- Featured placement for 60–90 days with renewal trigger at day 50
- "Anuncio verificado" trust badge
- Colonia consumption trend snapshot

**Target price point:** MXN $299–$599 per anuncio (60–90 day duration)

**Competitive precedent:** ML Inmuebles, Inmuebles24, Lamudi, Properati all use transactional per-listing pricing for individual owners in LATAM. Subscription only for agencies.

**Backend:** Supabase (live, properties table exists). Photo upload to Supabase Storage is implemented. Auth via NextAuth Google OAuth.

**How to apply:** Any feature suggestions should account for what data is already in the schema and what would require new form fields or external data sources. Monetization features should be scoped to the pay-per-listing model, not a monthly subscription.
