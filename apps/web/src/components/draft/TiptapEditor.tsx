import { useEditor, EditorContent } from '@tiptap/react'
import type { Editor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Image from '@tiptap/extension-image'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useRef, useCallback, useState, useImperativeHandle } from 'react'
import { uploadInlineImage } from '@/lib/api'
import { toast } from 'sonner'
import React from 'react'

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // 5MB

export interface TiptapEditorHandle {
  uploadImage: (file: File) => Promise<void>
  uploading: boolean
}

interface TiptapEditorProps {
  content: string
  onUpdate: (markdown: string) => void
  onUploadingChange?: (uploading: boolean) => void
  className?: string
  sessionId: string
  ref?: React.Ref<TiptapEditorHandle>
}

export const TiptapEditor = React.forwardRef<TiptapEditorHandle, TiptapEditorProps>(
  function TiptapEditor({ content, onUpdate, onUploadingChange, className, sessionId }, ref) {
    const onUpdateRef = useRef(onUpdate)
    onUpdateRef.current = onUpdate
    const isFirstUpdate = useRef(true)
    const editorRef = useRef<Editor | null>(null)
    const [uploading, setUploading] = useState(false)

    const setUploadingWithNotify = useCallback(
      (value: boolean) => {
        setUploading(value)
        onUploadingChange?.(value)
      },
      [onUploadingChange],
    )

    const uploadAndInsertImage = useCallback(
      async (file: File) => {
        const ed = editorRef.current
        if (!ed) return
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
          toast.error('Unsupported image type. Use JPEG, PNG, WebP, or GIF.')
          return
        }
        if (file.size > MAX_IMAGE_SIZE) {
          toast.error('Image exceeds 5MB limit.')
          return
        }

        setUploadingWithNotify(true)
        try {
          const result = await uploadInlineImage(sessionId, file)
          const rawName = file.name.replace(/\.[^.]+$/, '')
          const alt = rawName.length > 100 ? rawName.slice(0, 100) : rawName
          ed.chain()
            .focus()
            .setImage({ src: result.url, alt })
            .run()
        } catch (err) {
          console.error('Image upload failed:', err)
          toast.error('Image upload failed. Please try again.')
        } finally {
          setUploadingWithNotify(false)
        }
      },
      [sessionId, setUploadingWithNotify],
    )

    // Expose upload function to parent via ref
    useImperativeHandle(ref, () => ({
      uploadImage: uploadAndInsertImage,
      uploading,
    }), [uploadAndInsertImage, uploading])

    // Stable ref for use in editorProps closures
    const uploadRef = useRef(uploadAndInsertImage)
    uploadRef.current = uploadAndInsertImage

    const editor = useEditor({
      extensions: [
        StarterKit,
        Placeholder.configure({
          placeholder: 'Start editing your draft...',
        }),
        Image.configure({
          inline: false,
          allowBase64: false,
        }),
        Markdown.configure({
          html: false,
          transformPastedText: true,
          transformCopiedText: true,
        }),
      ],
      content,
      immediatelyRender: false,
      editorProps: {
        handlePaste(_view, event) {
          const items = Array.from(event.clipboardData?.items ?? [])
          const imageItem = items.find(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          )
          if (!imageItem) return false

          const file = imageItem.getAsFile()
          if (!file) return false

          event.preventDefault()
          uploadRef.current(file)
          return true
        },
        handleDrop(_view, event, _slice, moved) {
          if (moved) return false
          const items = Array.from(event.dataTransfer?.items ?? [])
          const imageItem = items.find(
            (item) => item.kind === 'file' && item.type.startsWith('image/'),
          )
          if (!imageItem) return false

          const file = imageItem.getAsFile()
          if (!file) return false

          event.preventDefault()
          uploadRef.current(file)
          return true
        },
      },
      onUpdate: ({ editor: ed }) => {
        if (isFirstUpdate.current) {
          isFirstUpdate.current = false
          return
        }

        const storage = ed.storage as unknown as Record<string, { getMarkdown?: () => string }>
        const md = storage.markdown?.getMarkdown?.() ?? ''

        if (!md && ed.getText().length > 0) return

        onUpdateRef.current(md)
      },
    })

    // Keep editorRef in sync
    useEffect(() => {
      editorRef.current = editor
    }, [editor])

    // Sync content from props when it changes externally (e.g., agent saves a new draft)
    // but only if the editor isn't focused to avoid clobbering mid-typing
    const lastExternalContent = useRef(content)
    useEffect(() => {
      if (!editor || content === lastExternalContent.current) return

      if (!editor.isFocused) {
        lastExternalContent.current = content
        editor.commands.setContent(content)
      }
    }, [content, editor])

    const toggleMark = useCallback(
      (mark: string) => {
        if (!editor) return
        editor.chain().focus().toggleMark(mark).run()
      },
      [editor],
    )

    if (!editor) return null

    return (
      <div className={className}>
        <BubbleMenu editor={editor}>
          <div className="flex items-center gap-0.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-bg-primary)] px-1 py-0.5 shadow-lg">
            <BubbleButton
              active={editor.isActive('bold')}
              onClick={() => toggleMark('bold')}
              title="Bold"
            >
              B
            </BubbleButton>
            <BubbleButton
              active={editor.isActive('italic')}
              onClick={() => toggleMark('italic')}
              title="Italic"
            >
              <em>I</em>
            </BubbleButton>
            <BubbleButton
              active={editor.isActive('code')}
              onClick={() => toggleMark('code')}
              title="Code"
            >
              <code className="text-xs">&lt;/&gt;</code>
            </BubbleButton>
            <BubbleButton
              active={editor.isActive('strike')}
              onClick={() => toggleMark('strike')}
              title="Strikethrough"
            >
              <s>S</s>
            </BubbleButton>
          </div>
        </BubbleMenu>
        <EditorContent
          editor={editor}
          className="prose min-h-[200px] outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[200px] [&_.tiptap_p.is-editor-empty:first-child::before]:text-[var(--color-text-muted)] [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none [&_.tiptap_img]:max-w-full [&_.tiptap_img]:rounded-md [&_.tiptap_img]:my-4 [&_.tiptap_.ProseMirror-selectednode]:ring-2 [&_.tiptap_.ProseMirror-selectednode]:ring-[var(--color-accent)] [&_.tiptap_.ProseMirror-selectednode]:rounded-md"
        />
      </div>
    )
  },
)

function BubbleButton({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`rounded px-2 py-1 text-sm font-medium transition-colors ${
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]'
      }`}
    >
      {children}
    </button>
  )
}
