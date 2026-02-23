import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useValue } from '@legendapp/state/react'
import { toast } from 'sonner'
import {
  CheckCircleIcon,
  MagnifyingGlassIcon,
  PencilLineIcon,
} from '@phosphor-icons/react'
import { Loader } from '@/components/loader/Loader'
import { wizardStore$, resetWizard } from '@/stores/wizard-store'
import { triggerScout, createSession, fetchIdeasCount } from '@/lib/api'
import { startScoutPolling } from '@/stores/scout-store'
import { AnalyticsManager, AnalyticsEvent } from '@hotmetal/analytics'
import type { PublicationConfig } from '@/lib/types'

interface WizardStepCompleteProps {
  onClose: () => void
  onCreated?: (pub: PublicationConfig) => void
}

export function WizardStepComplete({ onClose, onCreated }: WizardStepCompleteProps) {
  const navigate = useNavigate()
  const name = useValue(wizardStore$.name)
  const topics = useValue(wizardStore$.topics)
  const selectedStyleId = useValue(wizardStore$.selectedStyleId)
  const customTone = useValue(wizardStore$.customTone)
  const styles = useValue(wizardStore$.styles)
  const autoPublishMode = useValue(wizardStore$.autoPublishMode)
  const cadencePostsPerWeek = useValue(wizardStore$.cadencePostsPerWeek)
  const publicationId = useValue(wizardStore$.publicationId)
  const publication = useValue(wizardStore$.publication)

  const [runningScout, setRunningScout] = useState(false)
  const [startingSession, setStartingSession] = useState(false)

  const selectedStyle = selectedStyleId && selectedStyleId !== 'custom'
    ? styles.find((s) => s.id === selectedStyleId)
    : null

  const handleRunScout = async () => {
    if (!publicationId || runningScout) return
    setRunningScout(true)
    try {
      const currentCount = await fetchIdeasCount(publicationId)
      await triggerScout(publicationId)
      startScoutPolling(publicationId, currentCount)
      toast.success('Ideas agent is running! New ideas will appear shortly.')
      AnalyticsManager.track(AnalyticsEvent.ScoutTriggered, { publicationId, source: 'wizard-complete' })
      if (publication && onCreated) onCreated(publication)
      resetWizard()
      onClose()
      navigate(`/publications/${publicationId}`)
    } catch {
      toast.error('Failed to start the ideas agent')
    } finally {
      setRunningScout(false)
    }
  }

  const handleStartWriting = async () => {
    if (!publicationId || startingSession) return
    setStartingSession(true)
    try {
      const session = await createSession({ publicationId })
      AnalyticsManager.track(AnalyticsEvent.SessionCreated, { publicationId, source: 'wizard-complete' })
      if (publication && onCreated) onCreated(publication)
      resetWizard()
      onClose()
      navigate(`/writing/${session.id}`)
    } catch {
      toast.error('Failed to create writing session')
    } finally {
      setStartingSession(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
          <CheckCircleIcon
            size={32}
            weight="fill"
            className="text-green-600 dark:text-green-400"
          />
        </div>
        <h3 className="text-xl font-semibold">You're all set!</h3>
        <p className="mt-1 text-base text-[var(--color-text-muted)]">
          Your publication <strong>{name}</strong> is ready to go.
        </p>
      </div>

      {/* Summary */}
      <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4">
        <div className="space-y-2 text-base">
          <SummaryRow label="Topics" value={
            topics.length > 0
              ? `${topics.length} topic${topics.length !== 1 ? 's' : ''}`
              : 'None yet'
          } />
          <SummaryRow label="Writing style" value={
            selectedStyleId === 'custom' && customTone.trim()
              ? 'Custom tone'
              : selectedStyle ? selectedStyle.name : 'Default'
          } />
          <SummaryRow label="Publish mode" value={
            autoPublishMode === 'full-auto'
              ? `Auto Publish (${cadencePostsPerWeek}/week)`
              : autoPublishMode === 'draft'
                ? `Draft (${cadencePostsPerWeek}/week, you review and publish)`
                : 'Gather Ideas (you decide what to write)'
          } />
        </div>
      </div>

      {/* CTAs */}
      <div className="space-y-3">
        {topics.length > 0 && (
          <button
            type="button"
            onClick={handleRunScout}
            disabled={runningScout || startingSession}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            {runningScout ? (
              <Loader size={16} />
            ) : (
              <MagnifyingGlassIcon size={16} />
            )}
            {runningScout ? 'Starting Scout...' : 'Find me ideas now'}
          </button>
        )}

        <button
          type="button"
          onClick={handleStartWriting}
          disabled={runningScout || startingSession}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-base font-medium transition-colors disabled:opacity-50 ${
            topics.length > 0
              ? 'border border-[var(--color-accent)] text-[var(--color-accent)] hover:bg-[var(--color-accent-light)]'
              : 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)]'
          }`}
        >
          {startingSession ? (
            <Loader size={16} />
          ) : (
            <PencilLineIcon size={16} />
          )}
          {startingSession ? 'Creating session...' : 'Write my first post'}
        </button>
      </div>

      <p className="text-center text-base leading-relaxed text-[var(--color-text-muted)]">
        {topics.length > 0
          ? 'Our ideas agent will search for ideas based on your topics. Review them in the Ideas page and promote the best ones to writing sessions.'
          : 'Add topics in your publication settings to enable the ideas agent.'}
      </p>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  )
}
