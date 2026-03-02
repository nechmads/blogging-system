import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { toast } from 'sonner'
import { ArrowLeftIcon, CheckIcon, TrashIcon } from '@phosphor-icons/react'
import { Loader } from '@/components/loader/Loader'
import { fetchPublication, fetchComments, approveComment, deleteComment } from '@/lib/api'
import type { PublicationConfig, AdminComment, CommentStatus } from '@/lib/types'

type FilterTab = 'all' | 'pending' | 'approved'

function timeAgo(unixSeconds: number): string {
  const now = Math.floor(Date.now() / 1000)
  const diff = now - unixSeconds
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  const date = new Date(unixSeconds * 1000)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function CommentsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [publication, setPublication] = useState<PublicationConfig | null>(null)
  const [comments, setComments] = useState<AdminComment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('all')

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      setError(null)
      const [pub, data] = await Promise.all([
        fetchPublication(id),
        fetchComments(id),
      ])
      setPublication(pub)
      setComments(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleApprove = async (commentId: string) => {
    try {
      const updated = await approveComment(commentId)
      setComments((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      toast.success('Comment approved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to approve')
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await deleteComment(commentId)
      setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status: 'deleted' as CommentStatus } : c)))
      toast.success('Comment deleted')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete')
    }
  }

  const filteredComments = comments.filter((c) => {
    if (activeFilter === 'pending') return c.status === 'pending'
    if (activeFilter === 'approved') return c.status === 'approved'
    return c.status !== 'deleted'
  })

  const pendingCount = comments.filter((c) => c.status === 'pending').length

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size={32} />
      </div>
    )
  }

  if (!publication) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <p className="text-[var(--color-text-muted)]">Publication not found.</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/publications/${id}`)}
          className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)]"
          aria-label="Back"
        >
          <ArrowLeftIcon size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Comments</h2>
          <p className="text-sm text-[var(--color-text-muted)]">{publication.name}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[var(--color-bg-card)] p-1">
        {(['all', 'pending', 'approved'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveFilter(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === tab
                ? 'bg-[var(--color-bg-primary)] text-[var(--color-text)] shadow-sm'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            {tab === 'pending' && pendingCount > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-100 px-1.5 text-xs font-semibold text-amber-700">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Comments list */}
      {filteredComments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--color-border-default)] p-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">
            {activeFilter === 'pending'
              ? 'No comments pending review.'
              : activeFilter === 'approved'
                ? 'No approved comments yet.'
                : 'No comments yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredComments.map((comment) => (
            <div
              key={comment.id}
              className="rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">{comment.authorName}</span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      on <span className="font-mono">{comment.postSlug}</span>
                    </span>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {timeAgo(comment.createdAt)}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        comment.status === 'pending'
                          ? 'bg-amber-100 text-amber-700'
                          : comment.status === 'approved'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {comment.status}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--color-text)] whitespace-pre-wrap break-words">
                    {comment.content.length > 300
                      ? comment.content.slice(0, 300) + '...'
                      : comment.content}
                  </p>
                  {comment.authorEmail && (
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">{comment.authorEmail}</p>
                  )}
                </div>

                <div className="flex shrink-0 gap-1">
                  {comment.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleApprove(comment.id)}
                      className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-green-50 hover:text-green-600"
                      aria-label="Approve comment"
                      title="Approve"
                    >
                      <CheckIcon size={16} />
                    </button>
                  )}
                  {comment.status !== 'deleted' && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                      aria-label="Delete comment"
                      title="Delete"
                    >
                      <TrashIcon size={16} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
