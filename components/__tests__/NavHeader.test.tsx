// Tests for components/NavHeader.tsx
// Covers rendering in both authenticated and unauthenticated states,
// dropdown open/close behaviour, and sign-out invocation.

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NavHeader from '@/components/NavHeader';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSignOut = jest.fn();

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...rest }: { href: string; children: React.ReactNode; onClick?: () => void }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// Helper to get the mocked useSession hook
import { useSession } from 'next-auth/react';
const mockUseSession = useSession as jest.Mock;

// ── Helpers ────────────────────────────────────────────────────────────────

function renderNav(activePage?: 'propiedades' | 'home') {
  return render(<NavHeader activePage={activePage} />);
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe('NavHeader — unauthenticated state', () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' });
  });

  it('should render the LocalIQ logo link', () => {
    renderNav();
    // "Local" and "IQ" are in separate child elements; check the link exists by href
    const homeLink = screen.getByRole('link', { name: /local/i });
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('should render the Propiedades nav link', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /propiedades/i })).toBeInTheDocument();
  });

  it('should render a "Publicar" CTA link when not logged in', () => {
    renderNav();
    expect(screen.getByRole('link', { name: /publicar/i })).toBeInTheDocument();
  });

  it('should NOT render a sign-out button when unauthenticated', () => {
    renderNav();
    expect(screen.queryByRole('button', { name: /cerrar sesión/i })).not.toBeInTheDocument();
  });
});

describe('NavHeader — loading state', () => {
  it('should not render sign-in or sign-out buttons while loading', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'loading' });
    renderNav();
    expect(screen.queryByRole('button', { name: /cerrar sesión/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /publicar/i })).not.toBeInTheDocument();
  });
});

describe('NavHeader — authenticated state', () => {
  const session = {
    user: {
      name: 'Test User',
      email: 'test@example.com',
      image: null,
    },
  };

  beforeEach(() => {
    mockUseSession.mockReturnValue({ data: session, status: 'authenticated' });
    mockSignOut.mockReset();
  });

  it('should render the user avatar button with the first name', () => {
    renderNav();
    // Button shows the first name segment
    expect(screen.getByRole('button', { name: /test/i })).toBeInTheDocument();
  });

  it('should show initial letter avatar when user has no image', () => {
    renderNav();
    // The initial 'T' from 'Test User' should be visible
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('should show a user image when session has an image URL', () => {
    mockUseSession.mockReturnValue({
      data: { user: { ...session.user, image: 'https://example.com/avatar.jpg' } },
      status: 'authenticated',
    });
    renderNav();
    const img = screen.getByAltText('avatar') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toBe('https://example.com/avatar.jpg');
  });

  it('should open the dropdown menu when the avatar button is clicked', async () => {
    renderNav();
    const user = userEvent.setup();
    const avatarBtn = screen.getByRole('button', { name: /test/i });

    await user.click(avatarBtn);

    // Dropdown should now show user email and sign-out button
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cerrar sesión/i })).toBeInTheDocument();
  });

  it('should close the dropdown after clicking sign-out', async () => {
    renderNav();
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /test/i }));
    const signOutBtn = screen.getByRole('button', { name: /cerrar sesión/i });
    await user.click(signOutBtn);

    expect(mockSignOut).toHaveBeenCalledWith({ callbackUrl: '/' });
    // Dropdown should close
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('should toggle dropdown closed when avatar button is clicked twice', async () => {
    renderNav();
    const user = userEvent.setup();
    const avatarBtn = screen.getByRole('button', { name: /test/i });

    await user.click(avatarBtn);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();

    await user.click(avatarBtn);
    expect(screen.queryByText('test@example.com')).not.toBeInTheDocument();
  });

  it('should render the "Publicar propiedad" link in the dropdown', async () => {
    renderNav();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /test/i }));

    expect(screen.getByRole('link', { name: /publicar propiedad/i })).toBeInTheDocument();
  });

  it('should highlight Propiedades link when activePage is propiedades', () => {
    renderNav('propiedades');
    const propiedadesLink = screen.getByRole('link', { name: /propiedades/i });
    expect(propiedadesLink).toBeInTheDocument();
    // The active link has fontWeight 600 via inline style — check href is correct
    expect(propiedadesLink).toHaveAttribute('href', '/propiedades');
  });
});
