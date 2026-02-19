import { observable } from '@legendapp/state'
import { toast } from 'sonner'
import {
  createPublication,
  updatePublication,
  createTopic,
  fetchStyles,
} from '@/lib/api'
import type { AutoPublishMode, PublicationConfig, WritingStyle } from '@/lib/types'

let topicIdCounter = 0

export interface WizardTopic {
  localId: string
  serverId?: string // set after server creation — prevents duplicate saves
  name: string
  description: string
}

export const wizardStore$ = observable({
  currentStep: 1,
  saving: false,
  error: null as string | null,

  // Step 1: Basics
  name: '',
  slug: '',
  slugTouched: false,
  description: '',

  // Created publication (set after Step 1 API call)
  publicationId: null as string | null,
  publication: null as PublicationConfig | null,

  // Step 2: Topics
  topics: [] as WizardTopic[],

  // Step 3: Writing Style
  selectedStyleId: null as string | null,
  customTone: '', // "Set my own tone" free-text option
  styles: [] as WritingStyle[],
  stylesLoaded: false,
  stylesLoading: false,

  // Step 4: Publish Mode
  autoPublishMode: 'draft' as AutoPublishMode,
  cadencePostsPerWeek: 3,
})

// --- Simple actions ---

export function resetWizard() {
  topicIdCounter = 0
  wizardStore$.set({
    currentStep: 1,
    saving: false,
    error: null,
    name: '',
    slug: '',
    slugTouched: false,
    description: '',
    publicationId: null,
    publication: null,
    topics: [],
    selectedStyleId: null,
    customTone: '',
    styles: [],
    stylesLoaded: false,
    stylesLoading: false,
    autoPublishMode: 'draft',
    cadencePostsPerWeek: 3,
  })
}

export function prevStep() {
  wizardStore$.currentStep.set((s) => Math.max(s - 1, 1))
}

export function addTopic(name: string, description: string) {
  topicIdCounter++
  const topic: WizardTopic = {
    localId: `wizard-topic-${topicIdCounter}`,
    name,
    description,
  }
  wizardStore$.topics.set((prev) => [...prev, topic])
}

export function removeTopic(localId: string) {
  wizardStore$.topics.set((prev) => prev.filter((t) => t.localId !== localId))
}

export function sanitizeSlug(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

// --- Async step handlers ---

/** Step 1: Create or update publication, then advance to Step 2 */
export async function handleBasicsNext(): Promise<void> {
  if (wizardStore$.saving.get()) return

  const { name, slug, description, publicationId } = wizardStore$.get()
  if (!name.trim() || !slug.trim()) return

  wizardStore$.saving.set(true)
  wizardStore$.error.set(null)
  try {
    if (publicationId) {
      // Going back to Step 1 then forward again — update existing
      const updated = await updatePublication(publicationId, {
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || null,
      })
      wizardStore$.publication.set(updated)
    } else {
      // First time — create new publication
      const pub = await createPublication({
        name: name.trim(),
        slug: slug.trim(),
        description: description.trim() || undefined,
      })
      wizardStore$.publicationId.set(pub.id)
      wizardStore$.publication.set(pub)
    }
    wizardStore$.currentStep.set(2)
  } catch (err) {
    wizardStore$.error.set(err instanceof Error ? err.message : 'Failed to create publication')
  } finally {
    wizardStore$.saving.set(false)
  }
}

/** Step 2: Create only unsaved topics, then advance to Step 3 */
export async function handleTopicsNext(): Promise<void> {
  if (wizardStore$.saving.get()) return

  const { publicationId, topics } = wizardStore$.get()
  if (!publicationId) return

  const unsaved = topics.filter((t) => !t.serverId)

  if (unsaved.length === 0) {
    // All topics already saved (back-nav case) or no topics at all
    wizardStore$.currentStep.set(3)
    return
  }

  wizardStore$.saving.set(true)
  wizardStore$.error.set(null)
  try {
    const results = await Promise.allSettled(
      unsaved.map((t) =>
        createTopic(publicationId, {
          name: t.name,
          description: t.description || undefined,
        }),
      ),
    )

    // Mark successfully created topics with their server IDs
    const updatedTopics = [...topics]
    let unsavedIdx = 0
    for (const result of results) {
      const topic = unsaved[unsavedIdx]
      if (result.status === 'fulfilled') {
        const idx = updatedTopics.findIndex((t) => t.localId === topic.localId)
        if (idx !== -1) {
          updatedTopics[idx] = { ...updatedTopics[idx], serverId: result.value.id }
        }
      }
      unsavedIdx++
    }
    wizardStore$.topics.set(updatedTopics)

    const failures = results.filter((r) => r.status === 'rejected')
    if (failures.length > 0 && failures.length < unsaved.length) {
      toast.warning(`${failures.length} topic(s) failed to save`)
    } else if (failures.length === unsaved.length) {
      toast.error('Failed to save topics — you can add them later in settings')
    }
    wizardStore$.currentStep.set(3)
  } catch {
    toast.error('Failed to save topics')
    wizardStore$.currentStep.set(3)
  } finally {
    wizardStore$.saving.set(false)
  }
}

/** Step 3: Update publication with style, then advance to Step 4 */
export async function handleStyleNext(): Promise<void> {
  if (wizardStore$.saving.get()) return

  const { publicationId, selectedStyleId, customTone } = wizardStore$.get()

  if (!publicationId) {
    wizardStore$.currentStep.set(4)
    return
  }

  // Build the update payload based on what the user chose
  const update: Partial<{ styleId: string | null; writingTone: string | null }> = {}

  if (selectedStyleId === null) {
    // "Default style" chosen — clear any previous overrides
    update.styleId = null
    update.writingTone = null
  } else if (selectedStyleId === 'custom') {
    if (!customTone.trim()) {
      wizardStore$.error.set('Please describe your custom tone, or choose a different style.')
      return
    }
    update.writingTone = customTone.trim()
    update.styleId = null
  } else {
    update.styleId = selectedStyleId
    update.writingTone = null
  }

  wizardStore$.saving.set(true)
  wizardStore$.error.set(null)
  try {
    await updatePublication(publicationId, update)
    wizardStore$.currentStep.set(4)
  } catch {
    toast.error('Failed to save writing style')
    wizardStore$.currentStep.set(4)
  } finally {
    wizardStore$.saving.set(false)
  }
}

/** Step 4: Update publication with publish mode, then advance to Step 5 */
export async function handlePublishModeNext(): Promise<void> {
  if (wizardStore$.saving.get()) return

  const { publicationId, autoPublishMode, cadencePostsPerWeek } = wizardStore$.get()
  if (!publicationId) return

  wizardStore$.saving.set(true)
  try {
    const updated = await updatePublication(publicationId, {
      autoPublishMode,
      ...(autoPublishMode === 'full-auto' ? { cadencePostsPerWeek } : {}),
    })
    wizardStore$.publication.set(updated)
    wizardStore$.currentStep.set(5)
  } catch {
    toast.error('Failed to save publish mode')
    wizardStore$.currentStep.set(5)
  } finally {
    wizardStore$.saving.set(false)
  }
}

/** Lazy-load writing styles (called when Step 3 becomes active) */
export async function loadStyles(): Promise<void> {
  if (wizardStore$.stylesLoaded.get() || wizardStore$.stylesLoading.get()) return

  wizardStore$.stylesLoading.set(true)
  try {
    const data = await fetchStyles()
    wizardStore$.styles.set(data)
    wizardStore$.stylesLoaded.set(true)
  } catch {
    // Don't toast here — WizardStepStyle shows retry UI
  } finally {
    wizardStore$.stylesLoading.set(false)
  }
}
