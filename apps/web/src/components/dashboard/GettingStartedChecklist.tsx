import { useCallback, useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useValue } from '@legendapp/state/react'
import { toast } from 'sonner'
import {
  CheckCircleIcon,
  CircleIcon,
  CaretUpIcon,
  CaretDownIcon,
  XIcon,
  ArrowRightIcon,
} from '@phosphor-icons/react'
import { Loader } from '@/components/loader/Loader'
import { checklistStore$ } from '@/stores/checklist-store'
import {
  fetchTopics,
  fetchIdeas,
  fetchIdeasCount,
  fetchSessionsByPublication,
  fetchPublishedPosts,
  triggerScout,
  createSession,
} from '@/lib/api'
import { scoutStore$, startScoutPolling } from '@/stores/scout-store'
import type { PublicationConfig, Topic, Idea } from '@/lib/types'

interface ChecklistData {
  topics: Topic[]
  ideas: Idea[]
  sessionCount: number
  postCount: number
}

interface GettingStartedChecklistProps {
  publication: PublicationConfig
}

export function GettingStartedChecklist({ publication }: GettingStartedChecklistProps) {
  const navigate = useNavigate()
  const collapsed = useValue(checklistStore$.collapsed)
  const dismissed = useValue(checklistStore$.dismissed)
  const scoutPolling = useValue(scoutStore$.polling)

  const [data, setData] = useState<ChecklistData | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchFailed, setFetchFailed] = useState(false)
  const [runningScout, setRunningScout] = useState(false)
  const [creatingSession, setCreatingSession] = useState(false)
  const [showDismissConfirm, setShowDismissConfirm] = useState(false)

  const pubId = publication.id
  const loadChecklistData = useCallback(async () => {
    setLoading(true)
    try {
      setFetchFailed(false)
      const [topics, ideas, sessions, posts] = await Promise.all([
        fetchTopics(pubId),
        fetchIdeas(pubId),
        fetchSessionsByPublication(pubId),
        fetchPublishedPosts(pubId),
      ])
      setData({
        topics,
        ideas,
        sessionCount: sessions.length,
        postCount: posts.length,
      })
    } catch {
      setFetchFailed(true)
    } finally {
      setLoading(false)
    }
  }, [pubId])

  useEffect(() => {
    if (dismissed || collapsed) {
      setLoading(false)
      return
    }
    loadChecklistData()
  }, [dismissed, collapsed, loadChecklistData])

  // Re-fetch when scout polling finishes (new ideas detected)
  const prevPollingRef = useRef(scoutPolling)
  useEffect(() => {
    if (prevPollingRef.current && !scoutPolling && !dismissed && !collapsed) {
      loadChecklistData()
    }
    prevPollingRef.current = scoutPolling
  }, [scoutPolling, dismissed, collapsed, loadChecklistData])

  if (dismissed) return null
  if (fetchFailed) return null

  const handleToggleCollapse = () => {
    if (!collapsed) {
      setData(null)
    }
    checklistStore$.collapsed.set(!collapsed)
  }

  const handleDismiss = () => {
    checklistStore$.dismissed.set(true)
    setShowDismissConfirm(false)
  }

  const handleRunScout = async () => {
    if (runningScout) return
    setRunningScout(true)
    try {
      const currentCount = await fetchIdeasCount(publication.id)
      await triggerScout(publication.id)
      startScoutPolling(publication.id, currentCount)
      toast.success('Ideas agent is running! New ideas will appear shortly.')
    } catch {
      toast.error('Failed to start the ideas agent')
    } finally {
      setRunningScout(false)
    }
  }

  const handleStartWriting = async () => {
    if (creatingSession) return
    setCreatingSession(true)
    try {
      const session = await createSession({ publicationId: publication.id })
      navigate(`/writing/${session.id}`)
    } catch {
      toast.error('Failed to create writing session')
    } finally {
      setCreatingSession(false)
    }
  }

  // Build steps from data
  const hasTopics = (data?.topics.length ?? 0) > 0
  const hasIdeas = (data?.ideas.length ?? 0) > 0
  const hasReviewedIdea = data?.ideas.some((i) => i.status === 'reviewed' || i.status === 'promoted') ?? false
  const hasSession = (data?.sessionCount ?? 0) > 0
  const hasPublished = (data?.postCount ?? 0) > 0

  const steps = [
    {
      key: 'create',
      label: 'Create your publication',
      complete: true,
    },
    {
      key: 'topics',
      label: 'Add at least one topic',
      complete: hasTopics,
      action: !hasTopics
        ? { type: 'link' as const, to: `/publications/${publication.id}/settings`, label: 'Add topics' }
        : undefined,
    },
    {
      key: 'scout',
      label: 'Run the ideas agent',
      complete: hasIdeas,
      action: !hasIdeas && hasTopics
        ? { type: 'handler' as const, handler: handleRunScout, label: 'Run now', loading: runningScout }
        : undefined,
    },
    {
      key: 'review',
      label: 'Review your first idea',
      complete: hasReviewedIdea,
      action: !hasReviewedIdea && hasIdeas
        ? { type: 'link' as const, to: '/ideas', label: 'Go to ideas' }
        : undefined,
    },
    {
      key: 'write',
      label: 'Write your first post',
      complete: hasSession,
      action: !hasSession && hasReviewedIdea
        ? { type: 'handler' as const, handler: handleStartWriting, label: 'Start writing', loading: creatingSession }
        : undefined,
    },
    {
      key: 'publish',
      label: 'Publish!',
      complete: hasPublished,
    },
  ]

  const completedCount = steps.filter((s) => s.complete).length

  return (
    <>
      <section className="mt-6 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">
              Getting Started
            </h3>
            {!loading && (
              <span className="text-sm text-[var(--color-text-muted)]">
                {completedCount}/{steps.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleToggleCollapse}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)]"
              aria-label={collapsed ? 'Expand checklist' : 'Collapse checklist'}
            >
              {collapsed ? <CaretDownIcon size={16} /> : <CaretUpIcon size={16} />}
            </button>
            <button
              type="button"
              onClick={() => setShowDismissConfirm(true)}
              className="rounded-md p-1.5 text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-bg-card)]"
              aria-label="Dismiss checklist"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>

        {/* Collapsible body */}
        {!collapsed && (
          <div className="mt-4">
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader size={20} />
              </div>
            ) : (
              <>
                {/* Progress bar */}
                <div className="h-2 overflow-hidden rounded-full bg-[var(--color-bg-card)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-accent)] transition-all duration-500"
                    style={{ width: `${(completedCount / steps.length) * 100}%` }}
                  />
                </div>

                <div className="mt-4 space-y-1">
                  {steps.map((step) => (
                    <div
                      key={step.key}
                      className="flex items-center gap-3 rounded-lg px-2 py-2"
                    >
                      {/* Status icon */}
                      {step.complete ? (
                        <CheckCircleIcon
                          size={20}
                          weight="fill"
                          className="shrink-0 text-green-600 dark:text-green-400"
                        />
                      ) : (
                        <CircleIcon
                          size={20}
                          className="shrink-0 text-[var(--color-text-muted)]"
                        />
                      )}

                      {/* Label */}
                      <span
                        className={`flex-1 text-sm ${
                          step.complete
                            ? 'text-[var(--color-text-muted)]'
                            : 'font-medium'
                        }`}
                      >
                        {step.label}
                      </span>

                      {/* Action */}
                      {step.action && step.action.type === 'link' && (
                        <Link
                          to={step.action.to}
                          className="flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)]"
                        >
                          {step.action.label}
                          <ArrowRightIcon size={14} />
                        </Link>
                      )}
                      {step.action && step.action.type === 'handler' && (
                        <button
                          type="button"
                          onClick={step.action.handler}
                          disabled={step.action.loading}
                          className="flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--color-accent)] transition-colors hover:text-[var(--color-accent-hover)] disabled:opacity-50"
                        >
                          {step.action.loading ? (
                            <Loader size={14} />
                          ) : (
                            <>
                              {step.action.label}
                              <ArrowRightIcon size={14} />
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* All complete message */}
                {completedCount === steps.length && (
                  <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 px-3 py-2 dark:bg-green-900/20">
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      You're all set!
                    </span>
                    <button
                      type="button"
                      onClick={handleDismiss}
                      className="text-sm font-medium text-green-700 underline transition-colors hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      Dismiss checklist
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* Dismiss confirmation */}
      {showDismissConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] p-5 shadow-lg">
            <h4 className="text-base font-semibold">Hide getting started guide?</h4>
            <p className="mt-2 text-sm text-[var(--color-text-muted)]">
              The checklist will be permanently hidden. You can still access all features from the sidebar.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDismissConfirm(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-bg-card)]"
              >
                Keep it
              </button>
              <button
                type="button"
                onClick={handleDismiss}
                className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
              >
                Hide permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
