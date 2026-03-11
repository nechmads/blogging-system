import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { CopyIcon, TrashIcon, PlusIcon, CheckIcon } from '@phosphor-icons/react'
import { fetchApiKeys, createApiKey, revokeApiKey, type ApiKeyInfo, type ApiKeyCreateResult } from '@/lib/api'
import { Loader } from '@/components/loader/Loader'
import { Modal } from '@/components/modal/Modal'

function formatDate(epoch: number): string {
	return new Date(epoch * 1000).toLocaleDateString(undefined, {
		year: 'numeric',
		month: 'short',
		day: 'numeric',
	})
}

function formatLastUsed(epoch: number | null): string {
	if (!epoch) return 'Never used'
	const diff = Date.now() - epoch * 1000
	const minutes = Math.floor(diff / 60000)
	if (minutes < 1) return 'Just now'
	if (minutes < 60) return `${minutes}m ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours}h ago`
	const days = Math.floor(hours / 24)
	if (days < 30) return `${days}d ago`
	return formatDate(epoch)
}

export function ApiKeys() {
	const [keys, setKeys] = useState<ApiKeyInfo[]>([])
	const [loading, setLoading] = useState(true)
	const [creating, setCreating] = useState(false)
	const [label, setLabel] = useState('')
	const [showCreateForm, setShowCreateForm] = useState(false)
	const [newKey, setNewKey] = useState<ApiKeyCreateResult | null>(null)
	const [copied, setCopied] = useState(false)
	const [revokeTarget, setRevokeTarget] = useState<ApiKeyInfo | null>(null)
	const [revoking, setRevoking] = useState(false)

	const loadKeys = useCallback(async () => {
		try {
			const data = await fetchApiKeys()
			setKeys(data)
		} catch {
			toast.error('Failed to load API keys')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		loadKeys()
	}, [loadKeys])

	const handleCreate = async () => {
		setCreating(true)
		try {
			const result = await createApiKey(label.trim() || undefined)
			setNewKey(result)
			setShowCreateForm(false)
			setLabel('')
			loadKeys()
		} catch {
			toast.error('Failed to create API key')
		} finally {
			setCreating(false)
		}
	}

	const handleCopy = async () => {
		if (!newKey) return
		try {
			await navigator.clipboard.writeText(newKey.rawToken)
			setCopied(true)
			toast.success('API key copied to clipboard')
			setTimeout(() => setCopied(false), 2000)
		} catch {
			toast.error('Failed to copy to clipboard')
		}
	}

	const handleRevoke = async () => {
		if (!revokeTarget) return
		setRevoking(true)
		try {
			await revokeApiKey(revokeTarget.id)
			setKeys((prev) => prev.filter((k) => k.id !== revokeTarget.id))
			toast.success('API key revoked')
			setRevokeTarget(null)
		} catch {
			toast.error('Failed to revoke API key')
		} finally {
			setRevoking(false)
		}
	}

	if (loading) {
		return (
			<div className="flex items-center justify-center py-8">
				<Loader size={20} />
			</div>
		)
	}

	return (
		<div className="space-y-3">
			{/* New key reveal banner */}
			{newKey && (
				<div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-700 dark:bg-amber-950/30">
					<p className="mb-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
						Your new API key — copy it now, it won't be shown again
					</p>
					<div className="flex items-center gap-2">
						<code className="flex-1 overflow-x-auto rounded-lg bg-white px-3 py-2 font-mono text-sm text-[var(--color-text-primary)] dark:bg-black/30">
							{newKey.rawToken}
						</code>
						<button
							type="button"
							onClick={handleCopy}
							className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)]"
						>
							{copied ? <CheckIcon size={14} /> : <CopyIcon size={14} />}
							{copied ? 'Copied' : 'Copy'}
						</button>
					</div>
					<button
						type="button"
						onClick={() => setNewKey(null)}
						className="mt-2 text-xs text-amber-700 underline hover:no-underline dark:text-amber-400"
					>
						Dismiss
					</button>
				</div>
			)}

			{/* Existing keys */}
			{keys.map((key) => (
				<div
					key={key.id}
					className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4"
				>
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
								{key.label || 'Untitled key'}
							</h3>
							<p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
								hm_****{key.lastFour} &middot; Created {formatDate(key.createdAt)} &middot; {formatLastUsed(key.lastUsedAt)}
							</p>
						</div>
						<button
							type="button"
							onClick={() => setRevokeTarget(key)}
							className="flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
						>
							<TrashIcon size={14} />
							Revoke
						</button>
					</div>
				</div>
			))}

			{/* Empty state */}
			{keys.length === 0 && !newKey && (
				<div className="rounded-xl border border-dashed border-[var(--color-border-default)] p-6 text-center">
					<p className="text-sm text-[var(--color-text-muted)]">
						No API keys yet. Create one to let agents and integrations access your account.
					</p>
				</div>
			)}

			{/* Create form */}
			{showCreateForm ? (
				<div className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4">
					<label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
						Label (optional)
					</label>
					<input
						type="text"
						value={label}
						onChange={(e) => setLabel(e.target.value)}
						placeholder="e.g. My AI agent, CI/CD pipeline"
						maxLength={100}
						className="mb-3 w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none focus:border-[var(--color-accent)]"
						onKeyDown={(e) => {
							if (e.key === 'Enter') handleCreate()
						}}
					/>
					<div className="flex gap-2">
						<button
							type="button"
							onClick={handleCreate}
							disabled={creating}
							className="flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
						>
							{creating ? <Loader size={12} /> : <PlusIcon size={14} />}
							{creating ? 'Creating...' : 'Create key'}
						</button>
						<button
							type="button"
							onClick={() => { setShowCreateForm(false); setLabel('') }}
							className="rounded-lg border border-[var(--color-border-default)] px-3 py-1.5 text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-card)]"
						>
							Cancel
						</button>
					</div>
				</div>
			) : (
				<button
					type="button"
					onClick={() => setShowCreateForm(true)}
					className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-[var(--color-border-default)] py-3 text-sm font-medium text-[var(--color-text-muted)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-accent)]"
				>
					<PlusIcon size={16} />
					Create new API key
				</button>
			)}

			{/* Revoke confirmation modal */}
			<Modal isOpen={!!revokeTarget} onClose={() => setRevokeTarget(null)}>
				<div className="space-y-4 p-5">
					<h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
						Revoke API key?
					</h3>
					<p className="text-sm text-[var(--color-text-muted)]">
						This will permanently disable <strong>{revokeTarget?.label || 'this key'}</strong> (hm_****{revokeTarget?.lastFour}).
						Any agents or integrations using it will lose access immediately.
					</p>
					<div className="flex justify-end gap-2">
						<button
							type="button"
							onClick={() => setRevokeTarget(null)}
							className="rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-card)]"
						>
							Cancel
						</button>
						<button
							type="button"
							onClick={handleRevoke}
							disabled={revoking}
							className="flex items-center gap-1.5 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
						>
							{revoking ? (
								<>
									<Loader size={14} />
									Revoking...
								</>
							) : (
								'Revoke key'
							)}
						</button>
					</div>
				</div>
			</Modal>
		</div>
	)
}
