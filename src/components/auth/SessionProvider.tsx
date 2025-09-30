'use client';

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { Session } from 'next-auth';

interface SessionProviderProps {
  children: React.ReactNode;
  session?: Session | null;
}

export function SessionProvider({ children, session }: SessionProviderProps) {
  return (
    <NextAuthSessionProvider 
      session={session}
      refetchInterval={0} // Disable automatic session refresh
      refetchOnWindowFocus={false} // Disable refresh on window focus (prevents alt-tab reloads)
    >
      {children}
    </NextAuthSessionProvider>
  );
}
