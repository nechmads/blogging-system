import { WorkerEntrypoint } from 'cloudflare:workers'
import type { NotificationsEnv } from './env'
import { sendNewIdeasEmail, sendDraftReadyEmail, sendPostPublishedEmail } from './emails'

export interface SendNewIdeasParams {
	userId: string
	publicationName: string
	ideasCount: number
}

export interface SendDraftReadyParams {
	userId: string
	publicationName: string
	postTitle: string
}

export interface SendPostPublishedParams {
	userId: string
	publicationName: string
	postTitle: string
	postUrl: string
}

/**
 * RPC entrypoint for service-to-service notification calls.
 * Other services bind to this class via `entrypoint: "NotificationsService"`.
 *
 * Each method:
 * 1. Checks user notification preferences
 * 2. Looks up user email
 * 3. Sends the email (if enabled)
 * 4. Never throws — errors are logged and swallowed
 */
export class NotificationsService extends WorkerEntrypoint<NotificationsEnv> {
	async sendNewIdeasNotification(params: SendNewIdeasParams): Promise<void> {
		try {
			const prefs = await this.env.DAL.getOrCreateNotificationPreferences(params.userId)
			if (!prefs.newIdeas) {
				console.log(`[notifications] User ${params.userId} has new-ideas notifications disabled`)
				return
			}

			const user = await this.env.DAL.getUserById(params.userId)
			if (!user) {
				console.warn(`[notifications] User ${params.userId} not found, skipping notification`)
				return
			}

			await sendNewIdeasEmail(this.env, {
				userEmail: user.email,
				userName: user.name,
				publicationName: params.publicationName,
				ideasCount: params.ideasCount,
				webAppUrl: this.env.WEB_APP_URL,
			})
		} catch (err) {
			console.error('[notifications] sendNewIdeasNotification failed:', err)
		}
	}

	async sendDraftReadyNotification(params: SendDraftReadyParams): Promise<void> {
		try {
			const prefs = await this.env.DAL.getOrCreateNotificationPreferences(params.userId)
			if (!prefs.draftReady) {
				console.log(`[notifications] User ${params.userId} has draft-ready notifications disabled`)
				return
			}

			const user = await this.env.DAL.getUserById(params.userId)
			if (!user) {
				console.warn(`[notifications] User ${params.userId} not found, skipping notification`)
				return
			}

			await sendDraftReadyEmail(this.env, {
				userEmail: user.email,
				userName: user.name,
				publicationName: params.publicationName,
				postTitle: params.postTitle,
				webAppUrl: this.env.WEB_APP_URL,
			})
		} catch (err) {
			console.error('[notifications] sendDraftReadyNotification failed:', err)
		}
	}

	async sendPostPublishedNotification(params: SendPostPublishedParams): Promise<void> {
		try {
			const prefs = await this.env.DAL.getOrCreateNotificationPreferences(params.userId)
			if (!prefs.postPublished) {
				console.log(`[notifications] User ${params.userId} has post-published notifications disabled`)
				return
			}

			const user = await this.env.DAL.getUserById(params.userId)
			if (!user) {
				console.warn(`[notifications] User ${params.userId} not found, skipping notification`)
				return
			}

			await sendPostPublishedEmail(this.env, {
				userEmail: user.email,
				userName: user.name,
				publicationName: params.publicationName,
				postTitle: params.postTitle,
				postUrl: params.postUrl,
			})
		} catch (err) {
			console.error('[notifications] sendPostPublishedNotification failed:', err)
		}
	}
}
