import { useEffect } from 'react'
import { useValue } from '@legendapp/state/react'
import { Loader } from '@/components/loader/Loader'
import { wizardStore$, loadStyles } from '@/stores/wizard-store'

export function WizardStepStyle() {
  const styles = useValue(wizardStore$.styles)
  const stylesLoading = useValue(wizardStore$.stylesLoading)
  const stylesLoaded = useValue(wizardStore$.stylesLoaded)
  const selectedStyleId = useValue(wizardStore$.selectedStyleId)
  const customTone = useValue(wizardStore$.customTone)
  const error = useValue(wizardStore$.error)

  useEffect(() => {
    loadStyles()
  }, [])

  const prebuiltStyles = styles.filter((s) => s.isPrebuilt)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">Choose a writing style</h3>
        <p className="mt-1 text-base text-[var(--color-text-muted)]">
          This controls the AI writer's tone and voice when drafting posts.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-base text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300">
          {error}
        </div>
      )}

      {stylesLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader size={24} />
        </div>
      ) : !stylesLoaded && styles.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--color-border-default)] p-6 text-center">
          <p className="text-base text-[var(--color-text-muted)]">Could not load writing styles.</p>
          <button
            type="button"
            onClick={() => loadStyles()}
            className="mt-2 text-base font-medium text-[var(--color-accent)] hover:underline"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="max-h-[320px] space-y-2 overflow-y-auto pr-1">
          {/* None option */}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              selectedStyleId === null
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                : 'border-[var(--color-border-default)] hover:bg-[var(--color-bg-card)]'
            }`}
          >
            <input
              type="radio"
              name="wizardStyle"
              checked={selectedStyleId === null}
              onChange={() => wizardStore$.selectedStyleId.set(null)}
              className="mt-0.5 accent-[var(--color-accent)]"
            />
            <div>
              <span className="text-base font-medium">Default style</span>
              <p className="mt-0.5 text-base text-[var(--color-text-muted)]">
                A balanced, professional tone. Good for most publications.
              </p>
            </div>
          </label>

          {/* Prebuilt styles */}
          {prebuiltStyles.map((style) => (
            <label
              key={style.id}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
                selectedStyleId === style.id
                  ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                  : 'border-[var(--color-border-default)] hover:bg-[var(--color-bg-card)]'
              }`}
            >
              <input
                type="radio"
                name="wizardStyle"
                checked={selectedStyleId === style.id}
                onChange={() => wizardStore$.selectedStyleId.set(style.id)}
                className="mt-0.5 accent-[var(--color-accent)]"
              />
              <div>
                <span className="text-base font-medium">{style.name}</span>
                {style.description && (
                  <p className="mt-0.5 text-base text-[var(--color-text-muted)]">
                    {style.description}
                  </p>
                )}
              </div>
            </label>
          ))}

          {/* Set my own tone */}
          <label
            className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 transition-colors ${
              selectedStyleId === 'custom'
                ? 'border-[var(--color-accent)] bg-[var(--color-accent-light)]'
                : 'border-[var(--color-border-default)] hover:bg-[var(--color-bg-card)]'
            }`}
          >
            <input
              type="radio"
              name="wizardStyle"
              checked={selectedStyleId === 'custom'}
              onChange={() => wizardStore$.selectedStyleId.set('custom')}
              className="mt-0.5 accent-[var(--color-accent)]"
            />
            <div className="flex-1">
              <span className="text-base font-medium">Set my own tone</span>
              <p className="mt-0.5 text-base text-[var(--color-text-muted)]">
                Describe the tone and voice you want in your own words.
              </p>
            </div>
          </label>

          {/* Custom tone textarea — shown below the list when "Set my own tone" is selected */}
          {selectedStyleId === 'custom' && (
            <textarea
              placeholder='e.g., "Conversational and witty, like explaining tech to a smart friend over coffee. Use analogies and keep paragraphs short."'
              value={customTone}
              onChange={(e) => wizardStore$.customTone.set(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
              autoFocus
            />
          )}
        </div>
      )}

      <p className="text-base text-[var(--color-text-muted)]">
        You can create custom styles later from the Styles page.
      </p>
    </div>
  )
}
