import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
	fetchNotificationPreferences,
	updateNotificationPreferences,
	type NotificationPreferences as Prefs,
} from '@/lib/api'
import { Loader } from '@/components/loader/Loader'

interface NotificationToggle {
	key: keyof Prefs
	label: string
	description: string
}

const NOTIFICATION_TYPES: NotificationToggle[] = [
	{
		key: 'newIdeas',
		label: 'New ideas found',
		description: 'When the content scout finds new ideas for your publication',
	},
	{
		key: 'draftReady',
		label: 'Draft ready for review',
		description: 'When a new draft is auto-written and waiting for your review',
	},
	{
		key: 'postPublished',
		label: 'Post auto-published',
		description: 'When a post is automatically published to your blog',
	},
]

export function NotificationPreferences() {
	const [prefs, setPrefs] = useState<Prefs | null>(null)
	const [loading, setLoading] = useState(true)
	const [savingKey, setSavingKey] = useState<keyof Prefs | null>(null)

	const loadPrefs = useCallback(async () => {
		try {
			const data = await fetchNotificationPreferences()
			setPrefs(data)
		} catch {
			toast.error('Failed to load notification preferences')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadPrefs()
	}, [loadPrefs])

	const handleToggle = async (key: keyof Prefs) => {
		if (!prefs || savingKey) return

		const newValue = !prefs[key]
		setSavingKey(key)

		// Optimistic update
		setPrefs((prev) => (prev ? { ...prev, [key]: newValue } : prev))

		try {
			const updated = await updateNotificationPreferences({ [key]: newValue })
			setPrefs(updated)
		} catch {
			// Revert on failure
			setPrefs((prev) => (prev ? { ...prev, [key]: !newValue } : prev))
			toast.error('Failed to update notification preference')
		} finally {
			setSavingKey(null)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader size={20} />
			</div>
		)
	}

	if (!prefs) return null

	return (
		<div className="space-y-3">
			{NOTIFICATION_TYPES.map((notif) => (
				<div
					key={notif.key}
					className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4"
				>
					<div className="flex items-center justify-between">
						<div className="mr-4">
							<h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
								{notif.label}
							</h3>
							<p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
								{notif.description}
							</p>
						</div>
						<button
							type="button"
							role="switch"
							aria-checked={prefs[notif.key]}
							aria-label={`${notif.label} notifications`}
							disabled={savingKey !== null}
							onClick={() => handleToggle(notif.key)}
							className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-accent)] disabled:cursor-not-allowed disabled:opacity-50 ${
								prefs[notif.key]
									? 'bg-[var(--color-accent)]'
									: 'bg-[var(--color-border-default)]'
							}`}
						>
							<span
								className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
									prefs[notif.key] ? 'translate-x-6' : 'translate-x-1'
								}`}
							/>
						</button>
					</div>
				</div>
			))}
		</div>
	)
}
