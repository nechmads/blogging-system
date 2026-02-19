import { useValue } from '@legendapp/state/react'
import { wizardStore$, sanitizeSlug } from '@/stores/wizard-store'

export function WizardStepBasics() {
  const name = useValue(wizardStore$.name)
  const slug = useValue(wizardStore$.slug)
  const slugTouched = useValue(wizardStore$.slugTouched)
  const description = useValue(wizardStore$.description)
  const error = useValue(wizardStore$.error)

  const handleNameChange = (value: string) => {
    wizardStore$.name.set(value)
    if (!slugTouched) {
      wizardStore$.slug.set(sanitizeSlug(value))
    }
  }

  const handleSlugChange = (value: string) => {
    wizardStore$.slugTouched.set(true)
    wizardStore$.slug.set(sanitizeSlug(value))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Create your publication</h3>
        <p className="mt-1 text-base text-[var(--color-text-muted)]">
          A publication is your blog or content channel. Give it a name and tell us what it's about.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-base text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      <div>
        <label className="mb-1 block text-base font-medium">Name</label>
        <input
          type="text"
          placeholder="e.g., Looking Ahead"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          autoFocus
        />
      </div>

      <div>
        <label className="mb-1 block text-base font-medium">Slug</label>
        <input
          type="text"
          placeholder="looking-ahead"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 font-mono text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        <p className="mt-1 text-base text-[var(--color-text-muted)]">
          Used in your publication URL
        </p>
      </div>

      <div>
        <label className="mb-1 block text-base font-medium">
          Description
        </label>
        <textarea
          placeholder="What does this publication cover? This helps our ideas agent understand your focus."
          value={description}
          onChange={(e) => wizardStore$.description.set(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
      </div>
    </div>
  )
}
