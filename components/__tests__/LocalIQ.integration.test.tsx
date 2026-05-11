/**
 * Integration test for the LocalIQ registration form.
 *
 * Covers the full happy-path flow:
 *   Step 1 (Location) → Step 2 (Features) → Step 3 (Details) → Submit → Success
 *
 * Also covers:
 *   - Required-field validation blocking "Next" on steps 1 and 2
 *   - Supabase insert called with the correct payload
 *   - "Register another property" resets the form
 *   - Supabase error surfaces as an inline message
 */

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// ── Mocks ────────────────────────────────────────────────────────────────────

// next-auth session
jest.mock('next-auth/react', () => ({
  useSession: () => ({
    data: { user: { email: 'test@example.com' } },
    status: 'authenticated',
  }),
}));

// Supabase client
const mockInsert = jest.fn();
const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();

jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
    storage: {
      from: () => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  },
}));

// MapPicker (dynamic import / Leaflet — not meaningful in jsdom)
jest.mock('../MapPicker', () => ({
  __esModule: true,
  default: ({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) => (
    <button
      type="button"
      data-testid="map-picker"
      onClick={() => onLocationSelect(19.432, -99.133)}
    >
      Mock Map
    </button>
  ),
}));

// ── Helpers ──────────────────────────────────────────────────────────────────

import LocalIQ from '../LocalIQ';

/** Select a MUI <Select> by its label text and pick an option */
async function selectOption(user: ReturnType<typeof userEvent.setup>, labelText: string, optionText: string) {
  const combo = screen.getByRole('combobox', { name: new RegExp(labelText, 'i') });
  await user.click(combo);
  const listbox = await screen.findByRole('listbox');
  await user.click(within(listbox).getByText(optionText));
}

// ── Tests ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockInsert.mockResolvedValue({ error: null });
  mockUpload.mockResolvedValue({ error: null });
  mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://cdn.example.com/photo.jpg' } });
});

afterEach(() => jest.clearAllMocks());

describe('LocalIQ registration form', () => {
  it('completes all three steps and saves the property to Supabase', async () => {
    const user = userEvent.setup();
    render(<LocalIQ />);

    // ── Step 1: Location ──────────────────────────────────────────────────
    expect(screen.getByText('Location')).toBeInTheDocument();

    await selectOption(user, 'NEIGHBORHOOD', 'Condesa');

    // optional fields
    await user.type(screen.getByPlaceholderText(/Insurgentes/i), 'Av. Álvaro Obregón');
    await user.type(screen.getByPlaceholderText(/123/i), '42');

    // pin a map location
    await user.click(screen.getByTestId('map-picker'));

    await user.click(screen.getByRole('button', { name: /next/i }));

    // ── Step 2: Features ──────────────────────────────────────────────────
    await waitFor(() => expect(screen.getByText('Features')).toBeInTheDocument());

    await selectOption(user, 'PROPERTY TYPE', 'Corner unit');

    const sizeInput = screen.getByPlaceholderText(/45/i);
    await user.clear(sizeInput);
    await user.type(sizeInput, '80');

    const ageInput = screen.getByPlaceholderText(/10/i);
    await user.clear(ageInput);
    await user.type(ageInput, '5');

    await user.click(screen.getByRole('button', { name: /next/i }));

    // ── Step 3: Details ───────────────────────────────────────────────────
    await waitFor(() => expect(screen.getByText('Details')).toBeInTheDocument());

    await user.type(
      screen.getByPlaceholderText(/describe the property/i),
      'Bright corner unit on a busy street'
    );

    await selectOption(user, 'WATER AND DRAINAGE', 'Water and drainage complete');

    // increment parking to 1
    const parkingSection = screen.getByText('PARKING SPACES').closest('div')!;
    await user.click(within(parkingSection).getByText('+'));

    // submit
    await user.click(screen.getByRole('button', { name: /register property/i }));

    // ── Success state ─────────────────────────────────────────────────────
    await waitFor(() =>
      expect(screen.getByText('Property registered!')).toBeInTheDocument()
    );

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_email: 'test@example.com',
        colonia: 'Condesa',
        calle: 'Av. Álvaro Obregón',
        numero: '42',
        tipo_local: 'Corner unit',
        m2: 80,
        antiguedad: 5,
        agua_drenaje: 'Water and drainage complete',
        estacionamientos: 1,
        lat: 19.432,
        lng: -99.133,
        photo_urls: [],
      })
    );
  });

  it('blocks "Next" on step 1 when no neighborhood is selected', async () => {
    const user = userEvent.setup();
    render(<LocalIQ />);

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() =>
      expect(screen.getByText(/neighborhood required/i)).toBeInTheDocument()
    );
    // still on step 1
    expect(screen.queryByText(/property type/i)).not.toBeInTheDocument();
  });

  it('blocks "Next" on step 2 when required fields are missing', async () => {
    const user = userEvent.setup();
    render(<LocalIQ />);

    // pass step 1
    await selectOption(user, 'NEIGHBORHOOD', 'Roma Norte');
    await user.click(screen.getByRole('button', { name: /next/i }));
    await waitFor(() => expect(screen.getByText('Features')).toBeInTheDocument());

    // attempt step 2 without filling required fields
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() =>
      expect(screen.getByText(/type required/i)).toBeInTheDocument()
    );
  });

  it('shows an error message when Supabase insert fails', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });

    const user = userEvent.setup();
    render(<LocalIQ />);

    // step 1
    await selectOption(user, 'NEIGHBORHOOD', 'Polanco');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // step 2
    await waitFor(() => screen.getByText('Features'));
    await selectOption(user, 'PROPERTY TYPE', 'Street-facing (with storefront)');
    await user.type(screen.getByPlaceholderText(/45/i), '60');
    await user.click(screen.getByRole('button', { name: /next/i }));

    // step 3
    await waitFor(() => screen.getByText('Details'));
    await user.click(screen.getByRole('button', { name: /register property/i }));

    await waitFor(() =>
      expect(screen.getByText(/could not save the property/i)).toBeInTheDocument()
    );
    expect(screen.queryByText('Property registered!')).not.toBeInTheDocument();
  });

  it('"Register another property" resets the form back to step 1', async () => {
    const user = userEvent.setup();
    render(<LocalIQ />);

    // fast path to submission
    await selectOption(user, 'NEIGHBORHOOD', 'Del Valle');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => screen.getByText('Features'));
    await selectOption(user, 'PROPERTY TYPE', 'Market stall');
    await user.type(screen.getByPlaceholderText(/45/i), '20');
    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => screen.getByText('Details'));
    await user.click(screen.getByRole('button', { name: /register property/i }));

    await waitFor(() => screen.getByText('Property registered!'));

    await user.click(screen.getByRole('button', { name: /register another/i }));

    // back to the blank form at step 1
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    );
    expect(screen.queryByText('Property registered!')).not.toBeInTheDocument();
  });
});
