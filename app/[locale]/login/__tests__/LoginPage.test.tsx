// Tests for app/login/page.tsx
// Covers heading, Google sign-in button rendering, and signIn invocation.

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '@/app/login/page';

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockSignIn = jest.fn();

jest.mock('next-auth/react', () => ({
  signIn: (...args: unknown[]) => mockSignIn(...args),
}));

jest.mock('next/link', () => {
  const MockLink = ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  );
  MockLink.displayName = 'MockLink';
  return MockLink;
});

// ── Tests ──────────────────────────────────────────────────────────────────

describe('LoginPage', () => {
  beforeEach(() => {
    mockSignIn.mockReset();
  });

  it('should render the page heading', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /sign in to publish/i })).toBeInTheDocument();
  });

  it('should render the LocalIQ brand name', () => {
    render(<LoginPage />);
    // "Local" and "IQ" are in separate elements; check both parts are present
    expect(screen.getByText(/local/i)).toBeInTheDocument();
    expect(screen.getByText('IQ')).toBeInTheDocument();
  });

  it('should render the Continue with Google button', () => {
    render(<LoginPage />);
    const btn = screen.getByRole('button', { name: /continue with google/i });
    expect(btn).toBeInTheDocument();
  });

  it('should call signIn with "google" and callbackUrl "/registro" when Google button is clicked', async () => {
    render(<LoginPage />);
    const user = userEvent.setup();
    const btn = screen.getByRole('button', { name: /continue with google/i });

    await user.click(btn);

    expect(mockSignIn).toHaveBeenCalledTimes(1);
    expect(mockSignIn).toHaveBeenCalledWith('google', { callbackUrl: '/registro' });
  });

  it('should render a back link to home', () => {
    render(<LoginPage />);
    const backLink = screen.getByRole('link', { name: /back to home/i });
    expect(backLink).toHaveAttribute('href', '/');
  });

  it('should render terms/privacy policy note', () => {
    render(<LoginPage />);
    expect(screen.getByText(/terms of use/i)).toBeInTheDocument();
  });
});
