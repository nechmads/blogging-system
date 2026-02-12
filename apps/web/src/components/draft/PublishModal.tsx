import { useEffect, useState } from 'react'
import { CheckCircleIcon, GlobeIcon, ImageIcon, LinkedinLogoIcon, SparkleIcon } from '@phosphor-icons/react'
import { Modal } from '@/components/modal/Modal'
import { Loader } from '@/components/loader/Loader'
import { generateSeo, publishDraft } from '@/lib/api'

type Outlet = 'blog' | 'linkedin'

interface PublishModalProps {
  isOpen: boolean
  onClose: () => void
  sessionId: string
  draftTitle: string | null
  featuredImageUrl?: string | null
  onPublished: (postId: string) => void
}

function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function PublishModal({ isOpen, onClose, sessionId, draftTitle, featuredImageUrl, onPublished }: PublishModalProps) {
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet>('blog')
  const [slug, setSlug] = useState('')
  const [author, setAuthor] = useState('Shahar')
  const [tags, setTags] = useState('')
  const [excerpt, setExcerpt] = useState('')
  const [hook, setHook] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [generatingSeo, setGeneratingSeo] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [published, setPublished] = useState(false)

  // Auto-generate slug + SEO fields when modal opens
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setPublished(false)
      setPublishing(false)
      setHook('')
      setExcerpt('')
      setTags('')
      setSlug('')
      return
    }

    if (draftTitle) {
      setSlug(slugify(draftTitle))
    }

    // Generate SEO suggestions in the background
    let cancelled = false
    setGeneratingSeo(true)

    generateSeo(sessionId)
      .then((seo) => {
        if (cancelled) return
        if (seo.hook) setHook(seo.hook)
        if (seo.excerpt) setExcerpt(seo.excerpt)
        if (seo.tags) setTags(seo.tags)
      })
      .catch(() => {
        // SEO generation is best-effort — don't block the user
      })
      .finally(() => {
        if (!cancelled) setGeneratingSeo(false)
      })

    return () => {
      cancelled = true
    }
  }, [isOpen, sessionId, draftTitle])

  const handlePublish = async () => {
    if (publishing || !slug.trim()) return
    setPublishing(true)
    setError(null)

    try {
      const result = await publishDraft(sessionId, {
        slug: slug.trim(),
        author: author.trim() || undefined,
        tags: tags.trim() || undefined,
        excerpt: excerpt.trim() || undefined,
        hook: hook.trim() || undefined,
      })

      setPublished(true)
      onPublished(result.postId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const outlets: { id: Outlet; label: string; icon: React.ReactNode; available: boolean }[] = [
    { id: 'blog', label: 'Blog', icon: <GlobeIcon size={20} />, available: true },
    { id: 'linkedin', label: 'LinkedIn', icon: <LinkedinLogoIcon size={20} />, available: false },
  ]

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="space-y-5 p-5">
        {published ? (
          // Success state
          <div className="flex flex-col items-center py-4 text-center">
            <CheckCircleIcon size={48} weight="fill" className="text-green-500" />
            <h3 className="mt-3 text-lg font-semibold">Published!</h3>
            <p className="mt-1 text-sm text-[#6b7280]">
              Your post has been published to the blog.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-lg bg-[#d97706] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b45309]"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-semibold">Publish Draft</h3>

            {/* Outlet selector */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6b7280]">Publish to</label>
              <div className="flex gap-2">
                {outlets.map((outlet) => (
                  <button
                    key={outlet.id}
                    type="button"
                    onClick={() => outlet.available && setSelectedOutlet(outlet.id)}
                    disabled={!outlet.available}
                    className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                      selectedOutlet === outlet.id
                        ? 'border-[#d97706] bg-[#d97706]/10 text-[#d97706]'
                        : outlet.available
                          ? 'border-[#e5e7eb] text-[#0a0a0a] hover:border-[#d97706]/50 dark:border-[#374151] dark:text-[#fafafa]'
                          : 'border-[#e5e7eb] text-[#6b7280] opacity-50 dark:border-[#374151]'
                    }`}
                  >
                    {outlet.icon}
                    {outlet.label}
                    {!outlet.available && (
                      <span className="text-[10px] font-normal">Soon</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Featured Image preview */}
            <div>
              <label className="mb-1.5 block text-xs font-medium text-[#6b7280]">Featured Image</label>
              {featuredImageUrl ? (
                <div className="flex items-center gap-3">
                  <img
                    src={featuredImageUrl}
                    alt="Featured"
                    className="h-20 w-20 rounded-lg object-cover"
                  />
                  <span className="text-xs text-[#6b7280]">Image selected</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-[#e5e7eb] px-3 py-2.5 dark:border-[#374151]">
                  <ImageIcon size={16} className="text-[#9ca3af]" />
                  <span className="text-xs text-[#9ca3af]">No featured image — add one from the draft panel</span>
                </div>
              )}
            </div>

            {/* Blog-specific fields */}
            {selectedOutlet === 'blog' && (
              <div className="space-y-3">
                <div>
                  <label htmlFor="publish-slug" className="mb-1 block text-xs font-medium text-[#6b7280]">
                    Slug
                  </label>
                  <input
                    id="publish-slug"
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="my-blog-post"
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#6b7280] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706] dark:border-[#374151] dark:bg-[#1a1a1a] dark:text-[#fafafa]"
                  />
                </div>

                <div>
                  <label htmlFor="publish-author" className="mb-1 block text-xs font-medium text-[#6b7280]">
                    Author
                  </label>
                  <input
                    id="publish-author"
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#6b7280] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706] dark:border-[#374151] dark:bg-[#1a1a1a] dark:text-[#fafafa]"
                  />
                </div>

                <div>
                  <label htmlFor="publish-tags" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
                    Tags <span className="font-normal text-[#9ca3af]">(comma-separated)</span>
                    {generatingSeo && <Loader size={10} />}
                  </label>
                  <input
                    id="publish-tags"
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={generatingSeo ? 'Generating...' : 'tech, ai, writing'}
                    className="w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#6b7280] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706] dark:border-[#374151] dark:bg-[#1a1a1a] dark:text-[#fafafa]"
                  />
                </div>

                <div>
                  <label htmlFor="publish-hook" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
                    Hook
                    {generatingSeo && <Loader size={10} />}
                    {!generatingSeo && hook && (
                      <span className="flex items-center gap-0.5 text-[#d97706]">
                        <SparkleIcon size={10} weight="fill" />
                        <span className="text-[10px]">AI</span>
                      </span>
                    )}
                  </label>
                  <textarea
                    id="publish-hook"
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder={generatingSeo ? 'Generating...' : 'A short opening to grab readers...'}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#6b7280] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706] dark:border-[#374151] dark:bg-[#1a1a1a] dark:text-[#fafafa]"
                  />
                </div>

                <div>
                  <label htmlFor="publish-excerpt" className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#6b7280]">
                    Excerpt
                    {generatingSeo && <Loader size={10} />}
                    {!generatingSeo && excerpt && (
                      <span className="flex items-center gap-0.5 text-[#d97706]">
                        <SparkleIcon size={10} weight="fill" />
                        <span className="text-[10px]">AI</span>
                      </span>
                    )}
                  </label>
                  <textarea
                    id="publish-excerpt"
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    placeholder={generatingSeo ? 'Generating...' : 'A brief summary for SEO and previews...'}
                    rows={3}
                    className="w-full resize-none rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0a0a0a] placeholder:text-[#6b7280] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706] dark:border-[#374151] dark:bg-[#1a1a1a] dark:text-[#fafafa]"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-[#e5e7eb] px-4 py-2 text-sm font-medium text-[#0a0a0a] transition-colors hover:bg-[#f5f5f5] dark:border-[#374151] dark:text-[#fafafa] dark:hover:bg-[#1a1a1a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !slug.trim()}
                className="flex items-center gap-1.5 rounded-lg bg-[#d97706] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#b45309] disabled:opacity-50"
              >
                {publishing ? (
                  <>
                    <Loader size={14} />
                    Publishing...
                  </>
                ) : (
                  'Publish'
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}
