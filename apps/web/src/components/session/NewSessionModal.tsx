import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { Modal } from '@/components/modal/Modal'
import { createSession, fetchPublications } from '@/lib/api'
import type { PublicationConfig } from '@/lib/types'

interface NewSessionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function NewSessionModal({ isOpen, onClose }: NewSessionModalProps) {
  const navigate = useNavigate()
  const [newTitle, setNewTitle] = useState('')
  const [selectedPublicationId, setSelectedPublicationId] = useState('')
  const [publications, setPublications] = useState<PublicationConfig[]>([])
  const [publicationsLoaded, setPublicationsLoaded] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pubsFetchFailed, setPubsFetchFailed] = useState(false)

  // Load publications when modal opens
  useEffect(() => {
    if (!isOpen) return
    setPublicationsLoaded(false)
    setPubsFetchFailed(false)
    setError(null)
    fetchPublications()
      .then((pubs) => {
        setPublications(pubs)
        setSelectedPublicationId(pubs.length === 1 ? pubs[0].id : '')
        setPublicationsLoaded(true)
      })
      .catch(() => {
        setPubsFetchFailed(true)
        setPublicationsLoaded(true)
      })
  }, [isOpen])

  const handleClose = () => {
    setNewTitle('')
    setSelectedPublicationId('')
    setPublicationsLoaded(false)
    setError(null)
    onClose()
  }

  const handleCreate = async () => {
    if (creating) return
    setCreating(true)
    setError(null)
    try {
      const session = await createSession({
        title: newTitle.trim() || undefined,
        publicationId: selectedPublicationId || undefined,
      })
      handleClose()
      navigate(`/writing/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create session')
    } finally {
      setCreating(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="space-y-4 p-5">
        <h3 className="text-lg font-semibold">New Writing Session</h3>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
            {error}
          </div>
        )}

        <input
          type="text"
          placeholder="Session title (optional)"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate()
          }}
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          autoFocus
        />

        {!publicationsLoaded && (
          <p className="text-xs text-[var(--color-text-muted)]">Loading publications...</p>
        )}

        {pubsFetchFailed && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Could not load publications. You can still create a session without one.
          </p>
        )}

        {publicationsLoaded && publications.length > 1 && (
          <div>
            <label
              htmlFor="pub-select"
              className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]"
            >
              Publication
            </label>
            <select
              id="pub-select"
              value={selectedPublicationId}
              onChange={(e) => setSelectedPublicationId(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-sm focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
            >
              <option value="">None</option>
              {publications.map((pub) => (
                <option key={pub.id} value={pub.id}>
                  {pub.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Links this session to a publication's writing style and settings.
            </p>
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg border border-[var(--color-border-default)] px-4 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-card)]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {creating ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>
    </Modal>
  )
}
