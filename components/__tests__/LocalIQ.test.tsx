// Tests for components/LocalIQ.tsx
// Covers: stepper rendering, step validation, step navigation,
// form submission (success + error), and NumberStepper interactions.
//
// Key MUI quirks discovered:
// - MUI Select renders as role="combobox" with aria-labelledby pointing to its own id,
//   so accessible name is "" — query by index: [0]=colonia, [1]=tipoLocal, [2]=aguaDrenaje.
// - All step content is in the DOM at all times (display:flex vs display:none),
//   so all comboboxes are always findable.
// - The Previous button uses visibility:hidden on step 0, so it IS in the DOM but disabled.
//   The button text is "← Previous" so getByRole('button', {name: /← Previous/}) matches.

import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LocalIQ from '@/components/LocalIQ';

// ── Mocks ──────────────────────────────────────────────────────────────────

// NextAuth session — authenticated user
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(() => ({
    data: { user: { email: 'test@example.com', name: 'Test User' } },
    status: 'authenticated',
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// next/dynamic — return the MapPicker mock synchronously
jest.mock('next/dynamic', () => {
  return function dynamicMock() {
    function MockMap({
      onLocationSelect,
    }: {
      onLocationSelect: (lat: number, lng: number) => void;
      initialLat?: number;
      initialLng?: number;
    }) {
      return (
        <button
          type="button"
          data-testid="mock-map-picker"
          onClick={() => onLocationSelect(19.4326, -99.1332)}
        >
          Mock Map — click to pin
        </button>
      );
    }
    MockMap.displayName = 'MockMapPicker';
    return MockMap;
  };
});

// Supabase — mock the chained .from().insert() call
const mockInsert = jest.fn();
const mockFrom = jest.fn(() => ({ insert: mockInsert }));
jest.mock('@/lib/supabase', () => ({
  supabase: { from: (...args: unknown[]) => mockFrom(...args) },
}));

// ── Query helpers ──────────────────────────────────────────────────────────
// MUI Select renders as role="combobox" with no accessible name.
// Because each step is rendered inside a div with display:flex/none, ARIA hides
// the inactive step selects. So at any given step there is only 1 visible combobox
// (plus the aguaDrenaje select on step 3 which also has 1).
// We always use [0] to get the first (and usually only) visible combobox on that step.

function getFirstVisibleCombobox() {
  return screen.getAllByRole('combobox')[0];
}

// ── Step navigation helpers ────────────────────────────────────────────────

function renderLocalIQ() {
  return render(<LocalIQ />);
}

/** Advance past Step 1 by selecting a valid colonia */
async function advanceFromStep1(user: ReturnType<typeof userEvent.setup>) {
  // On step 1, only the colonia combobox is in the accessible tree
  await user.click(getFirstVisibleCombobox());
  const condesa = await screen.findByRole('option', { name: 'Condesa' });
  await user.click(condesa);
  await user.click(screen.getByRole('button', { name: /next →/i }));
}

/** Advance past Step 2 by filling tipoLocal and m2 */
async function advanceFromStep2(user: ReturnType<typeof userEvent.setup>) {
  // On step 2, only the tipoLocal combobox is in the accessible tree (step 1/3 are display:none)
  await user.click(getFirstVisibleCombobox());
  const option = await screen.findByRole('option', { name: /street-facing/i });
  await user.click(option);

  // m2 is a type="number" input — spinbutton role; the only visible spinbutton on step 2
  const m2Inputs = screen.getAllByRole('spinbutton');
  await user.clear(m2Inputs[0]);
  await user.type(m2Inputs[0], '50');

  await user.click(screen.getByRole('button', { name: /next →/i }));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LocalIQ — initial render', () => {
  it('should render without crashing', () => {
    renderLocalIQ();
    expect(screen.getByText(/register your property/i)).toBeInTheDocument();
  });

  it('should render the stepper with all three step labels', () => {
    renderLocalIQ();
    expect(screen.getByText('Location')).toBeInTheDocument();
    expect(screen.getByText('Features')).toBeInTheDocument();
    expect(screen.getByText('Details')).toBeInTheDocument();
  });

  it('should show the NEIGHBORHOOD label on step 1', () => {
    renderLocalIQ();
    // Step 1 has a label "NEIGHBORHOOD *"
    expect(screen.getAllByText(/neighborhood \*/i).length).toBeGreaterThanOrEqual(1);
  });

  it('should render the Next button on step 1', () => {
    renderLocalIQ();
    expect(screen.getByRole('button', { name: /next →/i })).toBeInTheDocument();
  });

  it('should have the Previous button disabled on step 1', () => {
    renderLocalIQ();
    // MUI Button with visibility:hidden is still in accessible tree as disabled.
    // Query all buttons (including hidden ones) and find by text.
    // The button text is the literal "← Previous" (arrow + space + word).
    const allButtons = document.querySelectorAll('button');
    const prevBtn = Array.from(allButtons).find(b => b.textContent?.includes('Previous'));
    expect(prevBtn).toBeDefined();
    expect(prevBtn).toBeDisabled();
  });

  it('should render the mock map picker', () => {
    renderLocalIQ();
    expect(screen.getByTestId('mock-map-picker')).toBeInTheDocument();
  });
});

describe('LocalIQ — Step 1 validation', () => {
  it('should show a validation error when Next is clicked without selecting a neighborhood', async () => {
    renderLocalIQ();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /next →/i }));

    await waitFor(() => {
      expect(screen.getByText(/neighborhood required/i)).toBeInTheDocument();
    });
  });

  it('should show the validation error (not the success state) when validation fails', async () => {
    renderLocalIQ();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /next →/i }));

    // Error message is shown — we're still on the form, not the success state
    await waitFor(() => {
      expect(screen.getByText(/neighborhood required/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/property registered/i)).not.toBeInTheDocument();
  });
});

describe('LocalIQ — Step navigation', () => {
  it('should reveal Property Type fields after valid step 1', async () => {
    renderLocalIQ();
    const user = userEvent.setup();
    await advanceFromStep1(user);

    await waitFor(() => {
      expect(screen.getByText(/property type \*/i)).toBeInTheDocument();
    });
  });

  it('should go back from Step 2 to Step 1 when Previous is clicked', async () => {
    renderLocalIQ();
    const user = userEvent.setup();
    await advanceFromStep1(user);

    await waitFor(() => {
      expect(screen.getByText(/property type \*/i)).toBeInTheDocument();
    });

    const buttons = screen.getAllByRole('button');
    const prevBtn = buttons.find(b => b.textContent?.includes('Previous'));
    await user.click(prevBtn!);

    await waitFor(() => {
      expect(screen.getAllByText(/neighborhood \*/i).length).toBeGreaterThanOrEqual(1);
    });
  });

  it('should advance to Step 3 when Step 2 fields are valid', async () => {
    renderLocalIQ();
    const user = userEvent.setup();
    await advanceFromStep1(user);
    await waitFor(() => expect(screen.getByText(/property type \*/i)).toBeInTheDocument());
    await advanceFromStep2(user);

    await waitFor(() => {
      // Step 3 shows DESCRIPTION label
      expect(screen.getByText(/description/i)).toBeInTheDocument();
    });
  });

  it('should show "Register Property →" submit button on Step 3', async () => {
    renderLocalIQ();
    const user = userEvent.setup();
    await advanceFromStep1(user);
    await waitFor(() => expect(screen.getByText(/property type \*/i)).toBeInTheDocument());
    await advanceFromStep2(user);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /register property →/i })).toBeInTheDocument();
    });
  });
});

describe('LocalIQ — Step 2 validation', () => {
  async function goToStep2(user: ReturnType<typeof userEvent.setup>) {
    renderLocalIQ();
    await advanceFromStep1(user);
    await waitFor(() => expect(screen.getByText(/property type \*/i)).toBeInTheDocument());
  }

  it('should show validation error when Next is clicked on Step 2 without property type', async () => {
    const user = userEvent.setup();
    await goToStep2(user);

    // Fill m2 but not tipoLocal
    const m2Inputs = screen.getAllByRole('spinbutton');
    await user.clear(m2Inputs[0]);
    await user.type(m2Inputs[0], '45');
    await user.click(screen.getByRole('button', { name: /next →/i }));

    await waitFor(() => {
      expect(screen.getByText(/type required/i)).toBeInTheDocument();
    });
  });

  it('should show validation error when Next is clicked on Step 2 without m2', async () => {
    const user = userEvent.setup();
    await goToStep2(user);

    // Select tipoLocal but leave m2 empty — on step 2, [0] is tipoLocal
    await user.click(getFirstVisibleCombobox());
    const option = await screen.findByRole('option', { name: /corner unit/i });
    await user.click(option);

    await user.click(screen.getByRole('button', { name: /next →/i }));

    await waitFor(() => {
      expect(screen.getByText(/size required/i)).toBeInTheDocument();
    });
  });
});

describe('LocalIQ — NumberStepper', () => {
  async function navigateToStep3() {
    const user = userEvent.setup();
    renderLocalIQ();
    await advanceFromStep1(user);
    await waitFor(() => expect(screen.getByText(/property type \*/i)).toBeInTheDocument());
    await advanceFromStep2(user);
    await waitFor(() => expect(screen.getByText(/description/i)).toBeInTheDocument());
    return user;
  }

  // The NumberStepper renders: outer div > span(label) + inner div > button(−) + span(value) + button(+)
  // We find buttons by order: [0,1]=rooms(−,+), [2,3]=bathrooms(−,+), [4,5]=parking(−,+)
  // and values by label proximity. All stepper buttons come AFTER the Register Property button,
  // but we can find them as the non-submit buttons.

  it('should increment ROOMS when + is clicked', async () => {
    const user = await navigateToStep3();

    // Get all stepper buttons: pairs of [−, +] for rooms, bathrooms, parking
    const stepperButtons = screen.getAllByRole('button').filter(
      b => b.textContent === '+' || b.textContent === '−'
    );

    // ROOMS + is index 1 (first pair)
    const roomsPlus = stepperButtons[1];
    // Value span is between the two buttons in the inner row div
    const roomsMinus = stepperButtons[0];
    const valueSpan = roomsMinus.nextElementSibling as HTMLElement;
    expect(valueSpan.textContent).toBe('0');

    await user.click(roomsPlus);
    expect(valueSpan.textContent).toBe('1');
  });

  it('should not decrement ROOMS below 0', async () => {
    const user = await navigateToStep3();

    const stepperButtons = screen.getAllByRole('button').filter(
      b => b.textContent === '+' || b.textContent === '−'
    );
    const roomsMinus = stepperButtons[0];
    const valueSpan = roomsMinus.nextElementSibling as HTMLElement;

    await user.click(roomsMinus);
    expect(valueSpan.textContent).toBe('0');
  });

  it('should increment BATHROOMS independently', async () => {
    const user = await navigateToStep3();

    const stepperButtons = screen.getAllByRole('button').filter(
      b => b.textContent === '+' || b.textContent === '−'
    );
    // BATHROOMS: index 2(−) and 3(+)
    const bathMinus = stepperButtons[2];
    const bathPlus = stepperButtons[3];
    const valueSpan = bathMinus.nextElementSibling as HTMLElement;

    await user.click(bathPlus);
    await user.click(bathPlus);
    expect(valueSpan.textContent).toBe('2');
  });

  it('should increment PARKING SPACES', async () => {
    const user = await navigateToStep3();

    const stepperButtons = screen.getAllByRole('button').filter(
      b => b.textContent === '+' || b.textContent === '−'
    );
    // PARKING: index 4(−) and 5(+)
    const parkingMinus = stepperButtons[4];
    const parkingPlus = stepperButtons[5];
    const valueSpan = parkingMinus.nextElementSibling as HTMLElement;

    await user.click(parkingPlus);
    expect(valueSpan.textContent).toBe('1');
  });
});

describe('LocalIQ — form submission', () => {
  beforeEach(() => {
    mockInsert.mockReset();
    mockFrom.mockReturnValue({ insert: mockInsert });
  });

  async function fillAndSubmit() {
    const user = userEvent.setup();
    renderLocalIQ();
    await advanceFromStep1(user);
    await waitFor(() => expect(screen.getByText(/property type \*/i)).toBeInTheDocument());
    await advanceFromStep2(user);
    await waitFor(() => expect(screen.getByRole('button', { name: /register property →/i })).toBeInTheDocument());
    await user.click(screen.getByRole('button', { name: /register property →/i }));
    return user;
  }

  it('should call supabase.from("properties").insert() on submit', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await fillAndSubmit();

    await waitFor(() => {
      expect(mockFrom).toHaveBeenCalledWith('properties');
      expect(mockInsert).toHaveBeenCalledTimes(1);
    });
  });

  it('should insert with the correct user_email from session', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await fillAndSubmit();

    await waitFor(() => {
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.user_email).toBe('test@example.com');
    });
  });

  it('should insert with the selected colonia', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await fillAndSubmit();

    await waitFor(() => {
      const insertArg = mockInsert.mock.calls[0][0];
      expect(insertArg.colonia).toBe('Condesa');
    });
  });

  it('should show the success state after a successful submission', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/property registered!/i)).toBeInTheDocument();
    });
  });

  it('should show "Register another property" button in success state', async () => {
    mockInsert.mockResolvedValue({ error: null });
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /register another property/i })).toBeInTheDocument();
    });
  });

  it('should reset back to Step 1 when "Register another property" is clicked', async () => {
    mockInsert.mockResolvedValue({ error: null });
    const user = await fillAndSubmit();

    await waitFor(() => screen.getByRole('button', { name: /register another property/i }));
    await user.click(screen.getByRole('button', { name: /register another property/i }));

    expect(screen.getByText(/register your property/i)).toBeInTheDocument();
    expect(screen.getByText('Location')).toBeInTheDocument();
  });

  it('should show an error message when supabase returns an error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/could not save the property/i)).toBeInTheDocument();
    });
  });

  it('should NOT show success state when supabase returns an error', async () => {
    mockInsert.mockResolvedValue({ error: { message: 'DB error' } });
    await fillAndSubmit();

    await waitFor(() => {
      expect(screen.getByText(/could not save the property/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/property registered!/i)).not.toBeInTheDocument();
  });
});

describe('LocalIQ — map pin interaction', () => {
  it('should render the map picker on step 1', () => {
    renderLocalIQ();
    expect(screen.getByTestId('mock-map-picker')).toBeInTheDocument();
  });

  it('should accept a location pin from the MapPicker without errors', async () => {
    renderLocalIQ();
    const user = userEvent.setup();
    const mapBtn = screen.getByTestId('mock-map-picker');
    await user.click(mapBtn);
    // No crash — location state is internal; just verify button still exists
    expect(mapBtn).toBeInTheDocument();
  });
});
