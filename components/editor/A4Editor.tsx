'use client'

import React, { useState, useCallback, useEffect, useMemo } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { getEditorExtensions } from './editorExtensions'
import { useAutoSave } from './useAutoSave'
import { SlashCommand } from './SlashCommand'
import { ContextMenu } from './ContextMenu'

interface A4EditorProps {
  initialContent?: string
  storageKey?: string
  autoSaveInterval?: number
  placeholder?: string
}

export default function A4Editor({
  initialContent,
  storageKey = 'a4-editor-draft',
  autoSaveInterval = 3000,
  placeholder = 'Start typing your document here...',
}: A4EditorProps) {
  const extensions = useMemo(() => getEditorExtensions(placeholder), [placeholder])

  const editor = useEditor({
    extensions,
    content: initialContent || '',
    editorProps: {
      attributes: {
        class: 'a4-editor-content',
        'aria-label': 'A4 Document Editor',
        role: 'textbox',
        'aria-multiline': 'true',
      },
    },
  })

  // Auto-Save
  const { load } = useAutoSave(editor, storageKey, autoSaveInterval)

  useEffect(() => {
    if (editor && !initialContent) {
      const savedContent = load()
      if (savedContent) {
        editor.commands.setContent(savedContent)
      }
    }
  }, [editor, initialContent, load])

  // Slash Commands
  const [slashCommand, setSlashCommand] = useState<{
    query: string
    position: { top: number; left: number }
  } | null>(null)

  useEffect(() => {
    if (!editor) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === '/' && !slashCommand) {
        const { state } = editor
        const { $from } = state.selection
        const textBefore = $from.parent.textContent.slice(0, $from.parentOffset)
        if (textBefore === '' || textBefore.endsWith(' ')) {
          const { view } = editor
          const coords = view.coordsAtPos($from.pos)
          setSlashCommand({
            query: '',
            position: { top: coords.bottom + 8, left: coords.left },
          })
        }
      }
    }

    const handleUpdate = () => {
      const { state } = editor
      const { $from } = state.selection
      const textBefore = $from.parent.textContent
      const slashIndex = textBefore.lastIndexOf('/')
      if (slashIndex === -1) { setSlashCommand(null); return }
      const query = textBefore.slice(slashIndex + 1)
      if (query.includes(' ')) { setSlashCommand(null); return }
      setSlashCommand((prev) => prev ? { ...prev, query } : null)
    }

    editor.view.dom.addEventListener('keydown', handleKeyDown)
    editor.on('update', handleUpdate)
    return () => {
      editor.view.dom.removeEventListener('keydown', handleKeyDown)
      editor.off('update', handleUpdate)
    }
  }, [editor, slashCommand])

  // Context Menu
  const [contextMenu, setContextMenu] = useState<{
    position: { x: number; y: number }
  } | null>(null)

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    setContextMenu({ position: { x: e.clientX, y: e.clientY } })
  }, [])

  // Keyboard Shortcuts
  useEffect(() => {
    if (!editor) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b': e.preventDefault(); editor.chain().focus().toggleBold().run(); break
          case 'i': e.preventDefault(); editor.chain().focus().toggleItalic().run(); break
          case 'u': e.preventDefault(); editor.chain().focus().toggleUnderline().run(); break
          case '1': if (e.altKey) { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 1 }).run() } break
          case '2': if (e.altKey) { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 2 }).run() } break
          case '3': if (e.altKey) { e.preventDefault(); editor.chain().focus().toggleHeading({ level: 3 }).run() } break
        }
        if (e.shiftKey) {
          switch (e.key.toLowerCase()) {
            case '7': e.preventDefault(); editor.chain().focus().toggleOrderedList().run(); break
            case '8': e.preventDefault(); editor.chain().focus().toggleBulletList().run(); break
          }
        }
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [editor])

  if (!editor) {
    return (
      <div className="a4-editor-loading">
        <div className="a4-editor-spinner" />
        <span>Loading editor...</span>
      </div>
    )
  }

  return (
    <div className="a4-editor-embedded" onContextMenu={handleContextMenu}>
      <EditorContent editor={editor} className="a4-editor-content-wrapper" />

      {slashCommand && (
        <SlashCommand
          editor={editor}
          query={slashCommand.query}
          position={slashCommand.position}
          onClose={() => setSlashCommand(null)}
        />
      )}

      {contextMenu && (
        <ContextMenu
          editor={editor}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
        />
      )}
    </div>
  )
}