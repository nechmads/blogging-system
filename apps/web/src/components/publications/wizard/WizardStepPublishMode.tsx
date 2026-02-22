import { useValue } from '@legendapp/state/react'
import { wizardStore$ } from '@/stores/wizard-store'
import type { AutoPublishMode } from '@/lib/types'

const PUBLISH_MODES: {
  value: AutoPublishMode
  label: string
  description: string
  badge?: string
}[] = [
  {
    value: 'ideas-only',
    label: 'Gather Ideas',
    description:
      'The Content Scout finds ideas based on your topics. You decide what to write and when to publish.',
  },
  {
    value: 'draft',
    label: 'Draft Mode',
    description:
      'The Content Scout finds ideas and the AI writes drafts. You review everything and decide what to publish.',
    badge: 'Recommended',
  },
  {
    value: 'full-auto',
    label: 'Auto Publish',
    description:
      'The Content Scout finds ideas, writes posts, and publishes them automatically on your schedule. Best for established publications with clear topic boundaries.',
  },
]

export function WizardStepPublishMode() {
  const autoPublishMode = useValue(wizardStore$.autoPublishMode)
  const cadencePostsPerWeek = useValue(wizardStore$.cadencePostsPerWeek)

  const handleModeChange = (mode: AutoPublishMode) => {
    wizardStore$.autoPublishMode.set(mode)
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">How should your publication work?</h3>
        <p className="mt-1 text-base text-[var(--color-text-muted)]">
          Choose how much control you want over what gets published. You can change this later.
        </p>
      </div>

      <div className="space-y-2">
        {PUBLISH_MODES.map((mode) => (
          <label
            key={mode.value}
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              autoPublishMode === mode.value
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                : 'border-[var(--color-border-default)] hover:bg-[var(--color-bg-card)]'
            }`}
          >
            <input
              type="radio"
              name="wizardPublishMode"
              value={mode.value}
              checked={autoPublishMode === mode.value}
              onChange={() => handleModeChange(mode.value)}
              className="mt-0.5 accent-[var(--color-accent)]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-medium">{mode.label}</span>
                {mode.badge && (
                  <span className="rounded-full bg-[var(--color-accent)] px-2 py-0.5 text-xs font-semibold text-white">
                    {mode.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-base leading-relaxed text-[var(--color-text-muted)]">
                {mode.description}
              </p>
            </div>
          </label>
        ))}
      </div>

      {autoPublishMode !== 'ideas-only' && (
        <div className="rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-4">
          <label className="mb-2 block text-base font-medium">Posts per week</label>
          <input
            type="number"
            min={1}
            max={14}
            value={cadencePostsPerWeek}
            onChange={(e) => {
              const parsed = parseInt(e.target.value, 10)
              if (!Number.isNaN(parsed)) {
                wizardStore$.cadencePostsPerWeek.set(Math.max(1, Math.min(14, parsed)))
              }
            }}
            className="w-24 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          <p className="mt-2 text-base text-[var(--color-text-muted)]">
            {autoPublishMode === 'full-auto'
              ? 'The system will aim to publish this many posts each week.'
              : 'The system will aim to write this many drafts each week.'}
          </p>
        </div>
      )}
    </div>
  )
}
