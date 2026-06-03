'use client';

import { SessionProvider } from 'next-auth/react';
import FeedbackWidget from './FeedbackWidget';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <FeedbackWidget />
    </SessionProvider>
  );
}
