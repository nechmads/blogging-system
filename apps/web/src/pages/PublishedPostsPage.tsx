import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { ArrowLeftIcon, ArrowSquareOutIcon, PencilSimpleIcon } from '@phosphor-icons/react'
import { Loader } from '@/components/loader/Loader'
import { formatRelativeTime } from '@/lib/format'
import { fetchPublication, fetchPublishedPosts, editPublishedPost } from '@/lib/api'
import type { PublicationConfig } from '@/lib/types'

interface PublishedPost {
  id: string
  title: string
  slug: string
  createdAt: string
  author: string
}

export function PublishedPostsPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [publication, setPublication] = useState<PublicationConfig | null>(null)
  const [posts, setPosts] = useState<PublishedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      setError(null)
      const [pub, publishedPosts] = await Promise.all([
        fetchPublication(id),
        fetchPublishedPosts(id).catch(() => [] as PublishedPost[]),
      ])
      setPublication(pub)
      setPosts(publishedPosts)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleEdit = async (postId: string) => {
    if (!id || editingPostId) return
    setEditingPostId(postId)
    try {
      const session = await editPublishedPost(id, postId)
      navigate(`/writing/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create edit session')
      setEditingPostId(null)
    }
  }

  const getPostUrl = (postSlug: string) => {
    if (!publication) return '#'
    return `https://${publication.slug}.hotmetalapp.com/${postSlug}`
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader size={32} />
      </div>
    )
  }

  if (error || !publication) {
    return (
      <div className="mx-auto max-w-3xl p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error || 'Publication not found'}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl p-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => navigate(`/publications/${id}`)}
          className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)]"
          aria-label="Back to publication"
        >
          <ArrowLeftIcon size={18} />
        </button>
        <div>
          <h2 className="text-xl font-bold">Published Posts</h2>
          <p className="text-xs text-[var(--color-text-muted)]">{publication.name}</p>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--color-text-muted)]">No published posts yet</p>
        </div>
      ) : (
        <div className="mt-6 space-y-1">
          {posts.map((post) => (
            <div
              key={post.id}
              className="group flex items-center gap-3 rounded-lg px-3 py-3 transition-colors hover:bg-[var(--color-bg-card)]"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {post.title || 'Untitled post'}
                </p>
                <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                  {post.author && <span>{post.author} &middot; </span>}
                  {formatRelativeTime(Math.floor(new Date(post.createdAt).getTime() / 1000))}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <a
                  href={getPostUrl(post.slug)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-accent)]"
                  title="View published post"
                >
                  <ArrowSquareOutIcon size={16} />
                </a>
                <button
                  type="button"
                  onClick={() => handleEdit(post.id)}
                  disabled={editingPostId === post.id}
                  className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-primary)] hover:text-[var(--color-accent)] disabled:opacity-50"
                  title="Edit post"
                >
                  {editingPostId === post.id ? (
                    <Loader size={16} />
                  ) : (
                    <PencilSimpleIcon size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
