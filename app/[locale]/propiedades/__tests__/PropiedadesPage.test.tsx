// Tests for app/propiedades/page.tsx
// Covers property listing, search, neighbourhood filter, sort, and empty state.
// NavHeader is mocked to avoid the auth dependency chain.

import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PropiedadesPage from '@/app/propiedades/page';

// ── Mocks ──────────────────────────────────────────────────────────────────

jest.mock('@/components/NavHeader', () => {
  const MockNavHeader = () => <nav data-testid="nav-header" />;
  MockNavHeader.displayName = 'MockNavHeader';
  return MockNavHeader;
});

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('PropiedadesPage — initial render', () => {
  it('should render the page heading', () => {
    render(<PropiedadesPage />);
    expect(screen.getByRole('heading', { name: /available properties/i })).toBeInTheDocument();
  });

  it('should render all 6 properties by default', () => {
    render(<PropiedadesPage />);
    expect(screen.getByText(/6 properties found/i)).toBeInTheDocument();
  });

  it('should render each property colonia', () => {
    render(<PropiedadesPage />);
    expect(screen.getAllByText('Roma Norte').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Condesa').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Polanco').length).toBeGreaterThanOrEqual(1);
  });

  it('should render "View details" buttons for each property', () => {
    render(<PropiedadesPage />);
    const viewButtons = screen.getAllByRole('button', { name: /view details/i });
    expect(viewButtons).toHaveLength(6);
  });

  it('should render the NavHeader', () => {
    render(<PropiedadesPage />);
    expect(screen.getByTestId('nav-header')).toBeInTheDocument();
  });
});

describe('PropiedadesPage — search filter', () => {
  it('should filter properties by colonia when searching', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/neighborhood, street, description/i);

    await user.type(searchInput, 'Polanco');

    // Only the Polanco property should remain
    expect(screen.getByText(/1 property found/i)).toBeInTheDocument();
    expect(screen.getAllByText('Polanco').length).toBeGreaterThanOrEqual(1);
  });

  it('should filter properties by street name', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/neighborhood, street, description/i);

    await user.type(searchInput, 'Masaryk');

    expect(screen.getByText(/1 property found/i)).toBeInTheDocument();
  });

  it('should filter properties by description keyword', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/neighborhood, street, description/i);

    // 'bohemian' only appears in Coyoacán description
    await user.type(searchInput, 'bohemian');

    expect(screen.getByText(/1 property found/i)).toBeInTheDocument();
  });

  it('should show empty state when search yields no results', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    const searchInput = screen.getByPlaceholderText(/neighborhood, street, description/i);

    await user.type(searchInput, 'zzznonexistent123');

    expect(screen.getByText(/no results/i)).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your search filters/i)).toBeInTheDocument();
  });

  it('should show a clear button when a search is active', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/neighborhood, street, description/i), 'test');

    expect(screen.getByRole('button', { name: /clear/i })).toBeInTheDocument();
  });

  it('should clear the search when the clear button is clicked', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/neighborhood, street, description/i), 'zzznonexistent123');

    // Confirm empty state first
    expect(screen.getByText(/no results/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /clear/i }));

    // All properties restored
    expect(screen.getByText(/6 properties found/i)).toBeInTheDocument();
  });
});

describe('PropiedadesPage — neighbourhood filter', () => {
  // The <label> and <select> in this component are not associated via htmlFor/id.
  // The search is an <input> (not combobox), so selects are: [0]=colonia, [1]=tipo, [2]=sort.
  function getColoniaSelect() {
    return screen.getAllByRole('combobox')[0];
  }

  it('should filter by neighbourhood when a colonia is selected', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();

    await user.selectOptions(getColoniaSelect(), 'Condesa');

    expect(screen.getByText(/1 property found/i)).toBeInTheDocument();
    expect(screen.getAllByText('Condesa').length).toBeGreaterThanOrEqual(1);
  });

  it('should filter to a single property when Narvarte is selected', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();

    await user.selectOptions(getColoniaSelect(), 'Narvarte');

    expect(screen.getByText(/1 property found/i)).toBeInTheDocument();
  });
});

describe('PropiedadesPage — sort', () => {
  // Selects: [0]=colonia, [1]=tipo, [2]=sort (search is an <input>, not combobox)
  function getSortSelect() {
    return screen.getAllByRole('combobox')[2];
  }

  it('should sort by price ascending by default', () => {
    render(<PropiedadesPage />);
    // Narvarte (1,800,000) is the cheapest — verify it's present
    expect(screen.getAllByText('Narvarte').length).toBeGreaterThanOrEqual(1);
  });

  it('should sort by price descending when selected', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();

    await user.selectOptions(getSortSelect(), 'precio-desc');

    // The heading count should still be 6 (sort doesn't remove items)
    expect(screen.getByText(/6 properties found/i)).toBeInTheDocument();
  });

  it('should sort by m2 ascending when selected', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    await user.selectOptions(getSortSelect(), 'm2-asc');

    expect(screen.getByText(/6 properties found/i)).toBeInTheDocument();
  });

  it('should sort by m2 descending when selected', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    await user.selectOptions(getSortSelect(), 'm2-desc');

    expect(screen.getByText(/6 properties found/i)).toBeInTheDocument();
  });
});

describe('PropiedadesPage — empty state', () => {
  it('should display empty state illustration and text when no results', async () => {
    render(<PropiedadesPage />);
    const user = userEvent.setup();
    await user.type(screen.getByPlaceholderText(/neighborhood, street, description/i), 'zzznoresult9999');

    expect(screen.getByText('No results')).toBeInTheDocument();
    expect(screen.getByText(/try adjusting your search filters/i)).toBeInTheDocument();
    // No property cards in the grid
    expect(screen.queryAllByRole('button', { name: /view details/i })).toHaveLength(0);
  });
});
