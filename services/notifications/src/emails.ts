import { Resend } from 'resend'
import type { NotificationsEnv } from './env'

function getResend(env: NotificationsEnv): Resend | null {
	if (!env.RESEND_API_KEY) {
		console.warn('[notifications] RESEND_API_KEY not configured, skipping email')
		return null
	}
	return new Resend(env.RESEND_API_KEY)
}

export interface NewIdeasEmailParams {
	userEmail: string
	userName: string
	publicationName: string
	ideasCount: number
	webAppUrl: string
}

export async function sendNewIdeasEmail(
	env: NotificationsEnv,
	params: NewIdeasEmailParams,
): Promise<void> {
	const resend = getResend(env)
	if (!resend) return

	const { userEmail, userName, publicationName, ideasCount, webAppUrl } = params

	try {
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to: userEmail,
			subject: `${ideasCount} new idea${ideasCount === 1 ? '' : 's'} for ${publicationName}`,
			text: [
				`Hi ${userName},`,
				'',
				`Hot Metal's content scout found ${ideasCount} new idea${ideasCount === 1 ? '' : 's'} for ${publicationName}.`,
				'',
				`Review them in the app: ${webAppUrl}`,
				'',
				'— Hot Metal',
				'',
				`Manage your notification preferences: ${webAppUrl}/settings`,
			].join('\n'),
		})
		console.log(`[notifications] Sent new-ideas email (${ideasCount} ideas for ${publicationName})`)
	} catch (err) {
		console.error('[notifications] Failed to send new-ideas email:', err)
	}
}

export interface DraftReadyEmailParams {
	userEmail: string
	userName: string
	publicationName: string
	postTitle: string
	webAppUrl: string
}

export async function sendDraftReadyEmail(
	env: NotificationsEnv,
	params: DraftReadyEmailParams,
): Promise<void> {
	const resend = getResend(env)
	if (!resend) return

	const { userEmail, userName, publicationName, postTitle, webAppUrl } = params

	try {
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to: userEmail,
			subject: `New draft ready: ${postTitle}`,
			text: [
				`Hi ${userName},`,
				'',
				`A new draft has been written for ${publicationName}:`,
				'',
				`  "${postTitle}"`,
				'',
				`Review and edit it in the app: ${webAppUrl}`,
				'',
				'— Hot Metal',
				'',
				`Manage your notification preferences: ${webAppUrl}/settings`,
			].join('\n'),
		})
		console.log(`[notifications] Sent draft-ready email for "${postTitle}"`)
	} catch (err) {
		console.error('[notifications] Failed to send draft-ready email:', err)
	}
}

export interface PostPublishedEmailParams {
	userEmail: string
	userName: string
	publicationName: string
	postTitle: string
	postUrl: string
}

export async function sendPostPublishedEmail(
	env: NotificationsEnv,
	params: PostPublishedEmailParams,
): Promise<void> {
	const resend = getResend(env)
	if (!resend) return

	const { userEmail, userName, publicationName, postTitle, postUrl } = params

	try {
		await resend.emails.send({
			from: env.FROM_EMAIL,
			to: userEmail,
			subject: `Published: ${postTitle}`,
			text: [
				`Hi ${userName},`,
				'',
				`A new post was just auto-published to ${publicationName}:`,
				'',
				`  "${postTitle}"`,
				'',
				`Read it live: ${postUrl}`,
				'',
				'— Hot Metal',
				'',
				`Manage your notification preferences: ${env.WEB_APP_URL}/settings`,
			].join('\n'),
		})
		console.log(`[notifications] Sent post-published email for "${postTitle}"`)
	} catch (err) {
		console.error('[notifications] Failed to send post-published email:', err)
	}
}
