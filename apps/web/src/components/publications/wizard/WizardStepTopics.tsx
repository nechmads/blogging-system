import { useState } from 'react'
import { useValue } from '@legendapp/state/react'
import { PlusIcon, XIcon } from '@phosphor-icons/react'
import { wizardStore$, addTopic, removeTopic } from '@/stores/wizard-store'

const TOPIC_EXAMPLES: { name: string; descPlaceholder: string }[] = [
  {
    name: 'AI in Software Engineering',
    descPlaceholder:
      'e.g., "Focus on practical applications of LLMs in code review, testing, and developer tooling rather than theoretical AI research."',
  },
  {
    name: 'US Politics & Policy',
    descPlaceholder:
      'e.g., "Focus on policy analysis and legislative impacts rather than partisan commentary. Cover both domestic and foreign policy."',
  },
  {
    name: 'Movies & TV Reviews',
    descPlaceholder:
      'e.g., "Focus on new releases and streaming originals. Include both mainstream blockbusters and indie films worth watching."',
  },
]

const DEFAULT_DESC_PLACEHOLDER =
  'Help our agent focus on what type of ideas and news to find. For example: \'Focus on practical applications of LLMs in code review, testing, and developer tooling.\''

export function WizardStepTopics() {
  const topics = useValue(wizardStore$.topics)
  const [topicName, setTopicName] = useState('')
  const [topicDesc, setTopicDesc] = useState('')
  const [descPlaceholder, setDescPlaceholder] = useState(DEFAULT_DESC_PLACEHOLDER)

  const handleAdd = () => {
    const name = topicName.trim()
    if (!name) return
    addTopic(name, topicDesc.trim())
    setTopicName('')
    setTopicDesc('')
    setDescPlaceholder(DEFAULT_DESC_PLACEHOLDER)
  }

  const handleSelectExample = (example: typeof TOPIC_EXAMPLES[number]) => {
    setTopicName(example.name)
    setDescPlaceholder(example.descPlaceholder)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-xl font-semibold">What do you want to write about?</h3>
        <p className="mt-1 text-base text-[var(--color-text-muted)]">
          Topics help our ideas agent find relevant news and inspiration for your publication.
        </p>
      </div>

      {/* Topic input */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Topic name, e.g. AI in Software Engineering"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          autoFocus
        />

        <textarea
          placeholder={descPlaceholder}
          value={topicDesc}
          onChange={(e) => setTopicDesc(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-3 py-2 text-base focus:border-[var(--color-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />

        <div className="flex items-center justify-between">
          {topics.length === 0 && !topicName ? (
            <p className="text-base text-[var(--color-text-muted)]">
              Try: {TOPIC_EXAMPLES.map((ex, i) => (
                <span key={ex.name}>
                  {i > 0 && ', '}
                  <button
                    type="button"
                    onClick={() => handleSelectExample(ex)}
                    className="text-[var(--color-accent)] hover:underline"
                  >
                    {ex.name}
                  </button>
                </span>
              ))}
            </p>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleAdd}
            disabled={!topicName.trim()}
            className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-base font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] disabled:opacity-50"
          >
            <PlusIcon size={14} />
            Add topic
          </button>
        </div>
      </div>

      {/* Topic list */}
      {topics.length > 0 && (
        <div className="space-y-2">
          {topics.map((topic) => (
            <div
              key={topic.localId}
              className="flex items-start gap-2 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-card)] p-3"
            >
              <div className="min-w-0 flex-1">
                <span className="text-base font-medium">{topic.name}</span>
                {topic.description && (
                  <p className="mt-0.5 text-base text-[var(--color-text-muted)]">
                    {topic.description}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeTopic(topic.localId)}
                className="shrink-0 rounded-md p-1 text-[var(--color-text-muted)] transition-colors hover:bg-red-50 hover:text-red-500"
                aria-label={`Remove ${topic.name}`}
              >
                <XIcon size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {topics.length === 0 && (
        <p className="rounded-lg border border-dashed border-[var(--color-border-default)] p-4 text-center text-base text-[var(--color-text-muted)]">
          Our ideas agent needs at least one topic to find ideas for you. You can always add more later.
        </p>
      )}
    </div>
  )
}
