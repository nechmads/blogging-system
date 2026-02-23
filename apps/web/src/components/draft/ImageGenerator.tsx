import { useState } from 'react'
import { ImageIcon, SparkleIcon, ArrowClockwiseIcon, CheckCircleIcon, XIcon } from '@phosphor-icons/react'
import { Loader } from '@/components/loader/Loader'
import { generateImagePrompt, generateImages, selectFeaturedImage } from '@/lib/api'
import { AnalyticsManager, AnalyticsEvent } from '@hotmetal/analytics'
import type { GeneratedImage } from '@/lib/types'

type Mode = 'collapsed' | 'prompt' | 'generating' | 'results'

interface ImageGeneratorProps {
  sessionId: string
  hasDraft: boolean
  featuredImageUrl: string | null
  onImageSelected: (url: string) => void
}

export function ImageGenerator({ sessionId, hasDraft, featuredImageUrl, onImageSelected }: ImageGeneratorProps) {
  const [mode, setMode] = useState<Mode>('collapsed')
  const [prompt, setPrompt] = useState('')
  const [generatingPrompt, setGeneratingPrompt] = useState(false)
  const [images, setImages] = useState<GeneratedImage[]>([])
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [promptFromAI, setPromptFromAI] = useState(false)

  const handleAutoPrompt = async () => {
    setGeneratingPrompt(true)
    setError(null)
    try {
      const result = await generateImagePrompt(sessionId)
      setPrompt(result.prompt)
      setPromptFromAI(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate prompt')
    } finally {
      setGeneratingPrompt(false)
    }
  }

  const handleGenerate = async () => {
    if (!prompt.trim()) return
    setMode('generating')
    setError(null)
    setImages([])
    setSelectedImageUrl(null)
    try {
      AnalyticsManager.track(AnalyticsEvent.ImageGenerationStarted, { promptSource: promptFromAI ? 'ai' : 'manual' })
      const result = await generateImages(sessionId, prompt.trim())
      setImages(result.images)
      setMode('results')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images')
      setMode('prompt')
    }
  }

  const handleSelectImage = async () => {
    if (!selectedImageUrl) return
    setSaving(true)
    setError(null)
    try {
      await selectFeaturedImage(sessionId, selectedImageUrl)
      onImageSelected(selectedImageUrl)
      AnalyticsManager.track(AnalyticsEvent.ImageSelected)
      setMode('collapsed')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save selection')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenGenerator = () => {
    setMode('prompt')
    if (!prompt) setError(null)
  }

  // Collapsed state
  if (mode === 'collapsed') {
    if (featuredImageUrl) {
      return (
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] bg-white px-4 py-2 dark:border-[#374151] dark:bg-[#0a0a0a]">
          <img
            src={featuredImageUrl}
            alt="Featured"
            className="h-12 w-12 rounded-md object-cover"
          />
          <span className="text-xs font-medium text-[#6b7280]">Featured Image</span>
          <button
            type="button"
            onClick={handleOpenGenerator}
            className="ml-auto text-xs font-medium text-[#d97706] transition-colors hover:text-[#b45309]"
          >
            Change
          </button>
        </div>
      )
    }

    return (
      <div className="border-b border-[#e5e7eb] bg-white px-4 py-2 dark:border-[#374151] dark:bg-[#0a0a0a]">
        <button
          type="button"
          onClick={handleOpenGenerator}
          disabled={!hasDraft}
          className="flex items-center gap-1.5 text-xs font-medium text-[#6b7280] transition-colors hover:text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-[#fafafa]"
          title={!hasDraft ? 'Create a draft first' : undefined}
        >
          <ImageIcon size={14} />
          Generate Featured Image
        </button>
      </div>
    )
  }

  // Prompt input state
  if (mode === 'prompt') {
    return (
      <div className="space-y-3 border-b border-[#e5e7eb] bg-white px-4 py-3 dark:border-[#374151] dark:bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0a0a0a] dark:text-[#fafafa]">Featured Image</span>
          <button
            type="button"
            onClick={() => setMode('collapsed')}
            className="rounded p-0.5 text-[#6b7280] transition-colors hover:text-[#0a0a0a] dark:hover:text-[#fafafa]"
          >
            <XIcon size={14} />
          </button>
        </div>

        <div className="flex gap-2">
          <textarea
            value={prompt}
            onChange={(e) => { setPrompt(e.target.value); setPromptFromAI(false) }}
            placeholder="Describe the image you want..."
            rows={2}
            className="flex-1 resize-none rounded-lg border border-[#e5e7eb] bg-[#f5f5f5] px-3 py-2 text-xs text-[#0a0a0a] placeholder:text-[#9ca3af] focus:border-[#d97706] focus:outline-none focus:ring-1 focus:ring-[#d97706] dark:border-[#374151] dark:bg-[#111] dark:text-[#fafafa]"
          />
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleAutoPrompt}
            disabled={generatingPrompt || !hasDraft}
            className="flex items-center gap-1 rounded-md border border-[#e5e7eb] px-2.5 py-1.5 text-xs font-medium text-[#6b7280] transition-colors hover:border-[#d97706] hover:text-[#d97706] disabled:opacity-40 dark:border-[#374151]"
          >
            {generatingPrompt ? (
              <Loader size={12} />
            ) : (
              <SparkleIcon size={12} weight="fill" />
            )}
            Auto-generate prompt
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!prompt.trim()}
            className="ml-auto rounded-md bg-[#d97706] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b45309] disabled:opacity-40"
          >
            Generate 4 Options
          </button>
        </div>
      </div>
    )
  }

  // Generating state
  if (mode === 'generating') {
    return (
      <div className="space-y-3 border-b border-[#e5e7eb] bg-white px-4 py-3 dark:border-[#374151] dark:bg-[#0a0a0a]">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-[#0a0a0a] dark:text-[#fafafa]">Featured Image</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square animate-pulse rounded-lg bg-[#e5e7eb] dark:bg-[#374151]"
            />
          ))}
        </div>

        <p className="flex items-center gap-1.5 text-xs text-[#6b7280]">
          <Loader size={12} />
          Generating images...
        </p>
      </div>
    )
  }

  // Results state
  return (
    <div className="space-y-3 border-b border-[#e5e7eb] bg-white px-4 py-3 dark:border-[#374151] dark:bg-[#0a0a0a]">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#0a0a0a] dark:text-[#fafafa]">Featured Image</span>
        <button
          type="button"
          onClick={() => setMode('collapsed')}
          className="rounded p-0.5 text-[#6b7280] transition-colors hover:text-[#0a0a0a] dark:hover:text-[#fafafa]"
        >
          <XIcon size={14} />
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {images.map((img, index) => (
          <button
            key={img.id}
            type="button"
            onClick={() => setSelectedImageUrl(img.url)}
            aria-label={`Select image option ${index + 1} of ${images.length}`}
            className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all ${
              selectedImageUrl === img.url
                ? 'border-[#d97706] ring-1 ring-[#d97706]'
                : 'border-transparent hover:border-[#d97706]/50'
            }`}
          >
            <img
              src={img.url}
              alt={`Generated option ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {selectedImageUrl === img.url && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                <CheckCircleIcon size={24} weight="fill" className="text-white drop-shadow" />
              </div>
            )}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setMode('prompt')}
          className="flex items-center gap-1 text-xs font-medium text-[#6b7280] transition-colors hover:text-[#0a0a0a] dark:hover:text-[#fafafa]"
        >
          Edit Prompt
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          className="flex items-center gap-1 text-xs font-medium text-[#6b7280] transition-colors hover:text-[#0a0a0a] dark:hover:text-[#fafafa]"
        >
          <ArrowClockwiseIcon size={12} />
          Regenerate
        </button>

        <button
          type="button"
          onClick={handleSelectImage}
          disabled={!selectedImageUrl || saving}
          className="ml-auto flex items-center gap-1 rounded-md bg-[#d97706] px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#b45309] disabled:opacity-40"
        >
          {saving ? <Loader size={12} /> : null}
          Use Selected
        </button>
      </div>
    </div>
  )
}
