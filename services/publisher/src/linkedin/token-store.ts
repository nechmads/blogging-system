/**
 * LinkedIn token and OAuth state management via the Data Access Layer.
 * Encryption is handled internally by the DAL service.
 */

import type { DataLayerApi } from '@hotmetal/data-layer'

// Publisher currently has a single implicit user
const DEFAULT_USER_ID = 'default'

// ─── Token management ────────────────────────────────────────────────

export async function storeLinkedInToken(
  dal: DataLayerApi,
  accessToken: string,
  personUrn: string | null,
  expiresIn: number,
): Promise<void> {
  const now = Math.floor(Date.now() / 1000)

  // Find any existing LinkedIn connection before creating the new one
  const connections = await dal.getSocialConnectionsByUser(DEFAULT_USER_ID)
  const existing = connections.find((c) => c.provider === 'linkedin')

  // Create the new connection first (DAL encrypts tokens internally).
  // If we crash between create and delete, we have a recoverable duplicate
  // rather than zero connections (data loss).
  await dal.createSocialConnection({
    userId: DEFAULT_USER_ID,
    provider: 'linkedin',
    accessToken,
    externalId: personUrn ?? undefined,
    tokenExpiresAt: now + expiresIn,
  })

  // Remove the old connection after the new one is safely stored
  if (existing) {
    await dal.deleteSocialConnection(existing.id)
  }
}

export async function getValidLinkedInToken(
  dal: DataLayerApi,
): Promise<{ accessToken: string; personUrn: string } | null> {
  const now = Math.floor(Date.now() / 1000)
  const connections = await dal.getSocialConnectionsByUser(DEFAULT_USER_ID)
  const linkedin = connections.find(
    (c) => c.provider === 'linkedin' && (c.tokenExpiresAt === null || c.tokenExpiresAt > now),
  )

  if (!linkedin) return null

  // Get decrypted tokens from DAL
  const decrypted = await dal.getSocialConnectionWithDecryptedTokens(linkedin.id)
  if (!decrypted?.accessToken || !decrypted.externalId) return null

  return { accessToken: decrypted.accessToken, personUrn: decrypted.externalId }
}

export async function hasValidLinkedInToken(dal: DataLayerApi): Promise<boolean> {
  return dal.hasValidSocialConnection(DEFAULT_USER_ID, 'linkedin')
}

// ─── OAuth state management ──────────────────────────────────────────

export async function storeOAuthState(
  dal: DataLayerApi,
  state: string,
  ttlSeconds?: number,
): Promise<void> {
  await dal.storeOAuthState(state, 'linkedin', ttlSeconds)
}

export async function validateAndConsumeOAuthState(
  dal: DataLayerApi,
  state: string,
): Promise<boolean> {
  return dal.validateAndConsumeOAuthState(state, 'linkedin')
}
