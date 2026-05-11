---
name: LocalIQ Project Testing Context
description: Key architectural facts, mock strategies, and testing patterns for the LocalIQ property registration app; updated after full test suite was written and green
type: project
---

LocalIQ is a Next.js 16 App Router + TypeScript app. Test infrastructure was set up from scratch in the first test session.

**Why:** First test session established baseline; second session completed full test suite (71 tests passing).

**How to apply:** Always install Jest + RTL + ts-jest + identity-obj-proxy + jest-environment-jsdom before writing any tests. Check package.json before assuming any test dep is present.

## Test infrastructure (installed and working)
- `jest@30`, `@testing-library/react@16`, `@testing-library/user-event@14`, `@testing-library/jest-dom@6`, `ts-jest@29`, `jest-environment-jsdom@30`, `identity-obj-proxy`
- `jest.config.ts` uses `next/jest.js` wrapper + `setupFilesAfterEnv` (NOT `setupFilesAfterFramework`)
- `jest.setup.ts` imports `@testing-library/jest-dom`
- Test scripts: `test`, `test:watch`, `test:coverage` added to package.json

## Critical dependencies found
- `@supabase/supabase-js` used in `lib/supabase.ts` and called directly in `LocalIQ.tsx` — mock `@/lib/supabase`
- NextAuth v5 beta — `useSession`, `signIn`, `signOut` from `next-auth/react`
- React Hook Form 7 with `Controller` pattern throughout
- Leaflet imported via `next/dynamic` with SSR disabled in `LocalIQ.tsx` — mock `next/dynamic` (see pattern below)
- MUI 5 Stepper for multi-step form navigation

## Supabase mock pattern
```ts
const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
jest.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));
```
Reset with `mockInsert.mockReset(); mockFrom.mockReturnValue({ insert: mockInsert });` in `beforeEach`.

## next/dynamic mock pattern (for MapPicker in LocalIQ)
```ts
jest.mock('next/dynamic', () => {
  return function dynamicMock() {
    function MockMap({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
      return <button data-testid="mock-map-picker" onClick={() => onLocationSelect(19.4326, -99.1332)}>Map</button>;
    }
    MockMap.displayName = 'MockMapPicker';
    return MockMap;
  };
});
```
Define the component INSIDE the `jest.mock` factory, not outside (hoisting issue with jest.mock).

## MUI Select / combobox query patterns
- MUI Select renders as `role="combobox"` with `aria-labelledby` pointing to its own `id` — no accessible name from the label
- Query by `getAllByRole('combobox')[index]` 
- **Critical**: All form steps are in DOM at all times (display:flex/none). ARIA hides elements in `display:none` containers, so only the active step's comboboxes are accessible. On each step there is typically only 1 visible combobox.
- Use `getAllByRole('combobox')[0]` for the first visible combobox at any step
- MUI Select options open in a portal — `findByRole('option', {name: ...})` works after clicking the combobox

## Form validation fields per step
- Step 0 (Location): `colonia` required ("Neighborhood required") — MUI Select
- Step 1 (Features): `tipoLocal` required ("Type required"), `m2` required + min:1 — MUI Select + TextField
- Step 2 (Details): all optional fields

## Key behaviors tested
- `handleNext` validates only the current step's fields before advancing
- `onSubmit` calls `supabase.from('properties').insert(...)` with session email
- On Supabase error: sets `submitError` state → renders "Could not save the property. Please try again."
- On success: sets `submitted=true` → renders "Property registered!" 
- `startNew()` resets form, step, pinLocation, submitError
- Previous button: `disabled={activeStep === 0}` + `visibility: hidden` — accessible via `document.querySelectorAll('button')` (not `getAllByRole`)

## NumberStepper button query pattern
```ts
const stepperButtons = screen.getAllByRole('button').filter(
  b => b.textContent === '+' || b.textContent === '−'
);
// Pairs: [0,1]=rooms, [2,3]=bathrooms, [4,5]=parking
// Value span: minus_button.nextElementSibling
```

## PropiedadesPage quirks
- `formatPrice` extracted to `lib/formatPrice.ts` (pure function, highest-value unit test)
- `<label>` and `<select>` filters are NOT associated via htmlFor/id — query selects by index:
  - `getAllByRole('combobox')[0]` = colonia filter
  - `getAllByRole('combobox')[1]` = tipo filter  
  - `getAllByRole('combobox')[2]` = sort filter
- coloniaFilter default is 'All' (not 'Todas' — note inconsistency between COLONIAS list and filter logic)
- Search input uses `placeholder="Neighborhood, street, description..."` for querying

## NavHeader behaviors
- `status === 'loading'` → renders loading spinner div (no buttons)
- `session?.user` truthy → renders avatar button; click opens dropdown with email, sign-out, "Publicar propiedad" link
- No session → renders "+ Publicar" link to /registro
- Logo link: "Local" + "IQ" are in separate elements — query by `getAllByRole('link')` + href check

## Text split across elements (common pattern in this codebase)
- "LocalIQ" brand is always split: `<span>Local<span>IQ</span></span>`
- Don't use `getByText(/localiq/i)` — it will fail. Use `getByText('IQ')` or check the parent link by href.

## Auth callback (auth.ts)
- `authorized` callback: if `/registro` path and not logged in → redirect to `/login`
- middleware.ts just re-exports `auth` — no custom logic to test

## formatPrice test cases
- `formatPrice('3200000')` → `'$3,200,000 MXN'`
- `formatPrice('0')` → `'—'`
- `formatPrice('')` → `'—'`
- `formatPrice('1000')` → `'$1,000 MXN'`
