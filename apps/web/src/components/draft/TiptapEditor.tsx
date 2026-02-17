import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Markdown } from 'tiptap-markdown'
import { useEffect, useRef, useCallback } from 'react'

interface TiptapEditorProps {
  content: string
  onUpdate: (markdown: string) => void
  className?: string
}

export function TiptapEditor({ content, onUpdate, className }: TiptapEditorProps) {
  const onUpdateRef = useRef(onUpdate)
  onUpdateRef.current = onUpdate
  const isFirstUpdate = useRef(true)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Start editing your draft...',
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
        transformCopiedText: true,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // Skip the initial onUpdate triggered by setting content
      if (isFirstUpdate.current) {
        isFirstUpdate.current = false
        return
      }

      const storage = editor.storage as unknown as Record<string, { getMarkdown?: () => string }>
      const md = storage.markdown?.getMarkdown?.() ?? ''

      // Guard: don't fire with empty markdown if the document has content
      if (!md && editor.getText().length > 0) return

      onUpdateRef.current(md)
    },
  })

  // Sync content from props when it changes externally (e.g., agent saves a new draft)
  // but only if the editor isn't focused to avoid clobbering mid-typing
  const lastExternalContent = useRef(content)
  useEffect(() => {
    if (!editor || content === lastExternalContent.current) return

    if (!editor.isFocused) {
      lastExternalContent.current = content
      editor.commands.setContent(content)
    }
    // Don't update lastExternalContent when editor is focused —
    // so the sync will be attempted again when focus state or content changes
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
        className="prose min-h-[200px] outline-none [&_.tiptap]:outline-none [&_.tiptap]:min-h-[200px] [&_.tiptap_p.is-editor-empty:first-child::before]:text-[var(--color-text-muted)] [&_.tiptap_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)] [&_.tiptap_p.is-editor-empty:first-child::before]:float-left [&_.tiptap_p.is-editor-empty:first-child::before]:h-0 [&_.tiptap_p.is-editor-empty:first-child::before]:pointer-events-none"
      />
    </div>
  )
}

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
