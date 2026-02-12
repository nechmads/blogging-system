/**
 * ProtectedRoute — wraps authenticated routes.
 *
 * - Signed in: syncs the Clerk session token to the API client, waits
 *   for the first token before rendering children.
 * - Signed out: redirects to the sign-in page
 */

import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react'
import { useEffect, useState, type ReactNode } from 'react'
import { setTokenProvider } from '@/lib/api'

function TokenSync({ children }: { children: ReactNode }) {
  const { getToken, isSignedIn } = useAuth()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!isSignedIn) {
      setTokenProvider(null)
      setReady(true)
      return
    }

    // Register Clerk's getToken as the provider — each API call
    // will invoke it to get a fresh (or cached-by-Clerk) JWT.
    setTokenProvider(() => getToken())
    setReady(true)

    return () => setTokenProvider(null)
  }, [isSignedIn, getToken])

  if (!ready) return null
  return <>{children}</>
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <>
      <SignedIn>
        <TokenSync>{children}</TokenSync>
      </SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  )
}
