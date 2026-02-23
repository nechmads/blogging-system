import { useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { CheckCircleIcon, CopyIcon, EyeIcon, PencilSimpleIcon, RocketLaunchIcon } from '@phosphor-icons/react'
import { MemoizedMarkdown } from '@/components/memoized-markdown'
import { Loader } from '@/components/loader/Loader'
import { DraftVersionSelector } from './DraftVersionSelector'
import { PublishModal } from './PublishModal'
import { ImageGenerator } from './ImageGenerator'
import { SourcesList } from './SourcesList'
import { fetchDrafts, fetchDraft, updateDraft } from '@/lib/api'
import type { Draft, DraftContent } from '@/lib/types'
import { TiptapEditor } from './TiptapEditor'
import React from 'react'

const AUTOSAVE_DELAY = 2000
const MAX_CONTENT_SIZE = 512 * 1024 // 512KB

type SaveStatus = 'idle' | 'saving' | 'saved' | 'unsaved'

export interface DraftPanelHandle {
  refresh: () => void
}

interface DraftPanelProps {
  sessionId: string
  cmsPostId?: string | null
  initialFeaturedImageUrl?: string | null
  publicationId?: string | null
  ref?: React.Ref<DraftPanelHandle>
}

export const DraftPanel = React.forwardRef<DraftPanelHandle, DraftPanelProps>(
  function DraftPanel({ sessionId, cmsPostId, initialFeaturedImageUrl, publicationId }, ref) {

    const [drafts, setDrafts] = useState<Draft[]>([])
    const [selectedVersion, setSelectedVersion] = useState<number | null>(null)
    const [content, setContent] = useState<DraftContent | null>(null)
    const [loading, setLoading] = useState(true)
    const [loadingContent, setLoadingContent] = useState(false)
    const [showToast, setShowToast] = useState<string | null>(null)
    const [showPublishModal, setShowPublishModal] = useState(false)
    const [publishedPostId, setPublishedPostId] = useState<string | null>(null)
    const [featuredImageUrl, setFeaturedImageUrl] = useState<string | null>(initialFeaturedImageUrl ?? null)

    // Edit mode state
    const [editing, setEditing] = useState(false)
    const [editableTitle, setEditableTitle] = useState('')
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
    const pendingMarkdownRef = useRef<string | null>(null)
    const pendingTitleRef = useRef<string | null>(null)
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const savingRef = useRef(false)

    // Refs to avoid reactive deps in loadDrafts/doSave (prevents infinite re-render loop)
    const draftsRef = useRef<Draft[]>([])
    const editingRef = useRef(false)
    const selectedVersionRef = useRef<number | null>(null)
    useEffect(() => { draftsRef.current = drafts }, [drafts])
    useEffect(() => { editingRef.current = editing }, [editing])
    useEffect(() => { selectedVersionRef.current = selectedVersion }, [selectedVersion])

    const canEdit = !!content

    // --- Save helpers ---

    const doSave = useCallback(async (markdown: string, title?: string): Promise<boolean> => {
      if (savingRef.current) return false
      if (markdown.length > MAX_CONTENT_SIZE) {
        setSaveStatus('unsaved')
        return false
      }
      savingRef.current = true
      setSaveStatus('saving')
      try {
        const updated = await updateDraft(sessionId, markdown, title, selectedVersionRef.current ?? undefined)
        setContent((prev) => prev ? { ...prev, content: updated.content, title: updated.title, word_count: updated.word_count } : prev)
        setSaveStatus('saved')
        pendingMarkdownRef.current = null
        pendingTitleRef.current = null
        setTimeout(() => setSaveStatus((s) => s === 'saved' ? 'idle' : s), 2000)
        return true
      } catch {
        setSaveStatus('unsaved')
        return false
      } finally {
        savingRef.current = false
      }
    }, [sessionId])

    const flushSave = useCallback(async (): Promise<boolean> => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
      if (pendingMarkdownRef.current !== null || pendingTitleRef.current !== null) {
        const md = pendingMarkdownRef.current ?? content?.content ?? ''
        return doSave(md, pendingTitleRef.current ?? undefined)
      }
      return true
    }, [doSave, content])

    const loadDrafts = useCallback(async () => {
      try {
        const data = await fetchDrafts(sessionId)
        const hadNewDraft = data.length > draftsRef.current.length
        setDrafts(data)
        if (data.length > 0) {
          setSelectedVersion((prev) => {
            if (prev === null || hadNewDraft) {
              return data[data.length - 1].version
            }
            return prev
          })

          // Agent created a new draft while user was editing — flush and exit edit mode
          if (hadNewDraft && editingRef.current) {
            await flushSave()
            setEditing(false)
          }
        }
      } catch {
        // Drafts may not exist yet (404) — show empty state
      } finally {
        setLoading(false)
      }
    }, [sessionId, flushSave])

    useEffect(() => {
      loadDrafts()
    }, [loadDrafts])

    useEffect(() => {
      if (selectedVersion === null) return
      let cancelled = false
      setLoadingContent(true)

      fetchDraft(sessionId, selectedVersion)
        .then((data) => {
          if (!cancelled) {
            setContent(data)
            setEditableTitle(data.title ?? '')
          }
        })
        .catch(() => {
          if (!cancelled) setContent(null)
        })
        .finally(() => {
          if (!cancelled) setLoadingContent(false)
        })

      return () => {
        cancelled = true
      }
    }, [sessionId, selectedVersion])

    useImperativeHandle(ref, () => ({
      refresh: loadDrafts,
    }))

    const scheduleSave = useCallback(() => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null
        if (pendingMarkdownRef.current !== null || pendingTitleRef.current !== null) {
          const md = pendingMarkdownRef.current ?? content?.content ?? ''
          doSave(md, pendingTitleRef.current ?? undefined)
        }
      }, AUTOSAVE_DELAY)
    }, [doSave, content])

    const handleEditorUpdate = useCallback((markdown: string) => {
      pendingMarkdownRef.current = markdown
      setSaveStatus('unsaved')
      scheduleSave()
    }, [scheduleSave])

    const handleTitleChange = useCallback((newTitle: string) => {
      setEditableTitle(newTitle)
      pendingTitleRef.current = newTitle
      setSaveStatus('unsaved')
      scheduleSave()
    }, [scheduleSave])

    // Flush pending save on unmount
    const contentRef = useRef(content)
    useEffect(() => { contentRef.current = content }, [content])
    useEffect(() => {
      return () => {
        if (debounceTimerRef.current) {
          clearTimeout(debounceTimerRef.current)
        }
        if (pendingMarkdownRef.current !== null || pendingTitleRef.current !== null) {
          const md = pendingMarkdownRef.current ?? contentRef.current?.content ?? ''
          doSave(md, pendingTitleRef.current ?? undefined)
        }
      }
    }, [doSave])

    // --- Toggle edit mode ---

    const handleToggleEdit = useCallback(async () => {
      if (editing) {
        // Switching to view mode — flush any pending save first
        await flushSave()
        setEditing(false)
        setSaveStatus('idle')
      } else {
        setEditing(true)
      }
    }, [editing, flushSave])

    // Exit edit mode when navigating to a different version
    const handleVersionSelect = useCallback(async (version: number) => {
      if (editing) {
        await flushSave()
        setEditing(false)
        setSaveStatus('idle')
      }
      setSelectedVersion(version)
    }, [editing, flushSave])

    // --- Other handlers ---

    const handleCopy = async () => {
      if (!content) return
      try {
        const text = content.title ? `# ${content.title}\n\n${content.content}` : content.content
        await navigator.clipboard.writeText(text)
        setShowToast('Copied to clipboard')
      } catch {
        setShowToast('Failed to copy')
      }
      setTimeout(() => setShowToast(null), 2000)
    }

    const handlePublish = () => {
      if (!content) return
      setShowPublishModal(true)
    }

    const handlePublished = (postId: string) => {
      setPublishedPostId(postId)
    }

    if (loading) {
      return (
        <div className="flex h-full items-center justify-center bg-[#f5f5f5] dark:bg-[#111]">
          <Loader size={24} />
        </div>
      )
    }

    return (
      <div className="relative flex h-full flex-col bg-[#f5f5f5] dark:bg-[#111]">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] bg-white px-4 py-2 dark:border-[#374151] dark:bg-[#0a0a0a]">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <span className="shrink-0 text-sm font-semibold text-[#0a0a0a] dark:text-[#fafafa]">Draft</span>
            <DraftVersionSelector
              drafts={drafts}
              selectedVersion={selectedVersion}
              onSelect={handleVersionSelect}
            />
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {/* Save status indicator */}
            {editing && saveStatus !== 'idle' && (
              <span className={`text-xs ${
                saveStatus === 'saving' ? 'text-[#6b7280]' :
                saveStatus === 'saved' ? 'text-green-600' :
                'text-amber-600'
              }`}>
                {saveStatus === 'saving' ? 'Saving...' :
                 saveStatus === 'saved' ? 'Saved' :
                 'Unsaved'}
              </span>
            )}
            {/* Edit/View toggle */}
            {canEdit && (
              <button
                type="button"
                onClick={handleToggleEdit}
                className={`flex items-center gap-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  editing
                    ? 'bg-[var(--color-accent-light)] text-[var(--color-accent)]'
                    : 'text-[#6b7280] hover:bg-[#e5e7eb] hover:text-[#0a0a0a] dark:hover:bg-[#374151]'
                }`}
                aria-label={editing ? 'Switch to view mode' : 'Edit draft'}
              >
                {editing ? (
                  <>
                    <EyeIcon size={14} />
                    View
                  </>
                ) : (
                  <>
                    <PencilSimpleIcon size={14} />
                    Edit
                  </>
                )}
              </button>
            )}
            <div className="h-4 w-px bg-[#e5e7eb] dark:bg-[#374151]" />
            <button
              type="button"
              onClick={handleCopy}
              disabled={!content}
              className="rounded-md p-1.5 text-[#6b7280] transition-colors hover:bg-[#e5e7eb] hover:text-[#0a0a0a] disabled:opacity-30 dark:hover:bg-[#374151]"
              aria-label="Copy draft"
            >
              <CopyIcon size={16} />
            </button>
            {(publishedPostId || cmsPostId) && (
              <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                <CheckCircleIcon size={14} weight="fill" />
              </span>
            )}
            <button
              type="button"
              onClick={handlePublish}
              disabled={!content}
              className="flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-[#6b7280] transition-colors hover:bg-[#e5e7eb] hover:text-[#0a0a0a] disabled:opacity-30 dark:hover:bg-[#374151]"
            >
              <RocketLaunchIcon size={14} />
              {publishedPostId || cmsPostId ? 'Publish Again' : 'Publish'}
            </button>
          </div>
        </div>

        {/* Image Generator */}
        <ImageGenerator
          sessionId={sessionId}
          hasDraft={!!content}
          featuredImageUrl={featuredImageUrl}
          onImageSelected={setFeaturedImageUrl}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loadingContent ? (
            <div className="flex items-center justify-center py-8">
              <Loader size={20} />
            </div>
          ) : content ? (
            <>
              <div className="prose mx-auto max-w-prose rounded-xl bg-white p-8 shadow-sm dark:bg-[#1a1a1a]">
                {editing ? (
                  <>
                    <input
                      type="text"
                      value={editableTitle}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      placeholder="Post title..."
                      aria-label="Post title"
                      className="mb-4 w-full border-none bg-transparent p-0 text-3xl font-bold leading-tight text-[#0a0a0a] placeholder:text-[#d1d5db] focus:outline-none dark:text-[#fafafa] dark:placeholder:text-[#4b5563]"
                    />
                    <TiptapEditor
                      content={content.content}
                      onUpdate={handleEditorUpdate}
                    />
                  </>
                ) : (
                  <>
                    {content.title && (
                      <h1 className="mb-4 text-3xl font-bold leading-tight">{content.title}</h1>
                    )}
                    <MemoizedMarkdown
                      content={content.content}
                      id={`draft-${content.version}`}
                    />
                  </>
                )}
              </div>
              <SourcesList citationsJson={content.citations} />
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <p className="font-semibold text-[#0a0a0a] dark:text-[#fafafa]">No drafts yet</p>
              <p className="mt-1 text-sm text-[#6b7280]">
                Chat with the AI to generate your first draft.
              </p>
            </div>
          )}
        </div>

        {/* Toast */}
        {showToast && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-lg bg-[#0a0a0a] px-3 py-1.5 text-xs text-white shadow-lg">
            {showToast}
          </div>
        )}

        {/* Publish Modal */}
        <PublishModal
          isOpen={showPublishModal}
          onClose={() => setShowPublishModal(false)}
          sessionId={sessionId}
          draftTitle={content?.title ?? null}
          draftVersion={selectedVersion}
          featuredImageUrl={featuredImageUrl}
          sessionPublicationId={publicationId}
          cmsPostId={cmsPostId}
          onPublished={handlePublished}
          isRepublish={!!publishedPostId}
        />
      </div>
    )
  }
)
