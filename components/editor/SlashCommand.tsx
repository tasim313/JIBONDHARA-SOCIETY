'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Code, Image, Link, Table,
  Minus, Highlighter, Strikethrough,
} from 'lucide-react'

interface SlashCommandItem {
  title: string
  description: string
  icon: React.ReactNode
  command: (editor: Editor) => void
  category: string
}

const slashCommands: SlashCommandItem[] = [
  {
    title: 'Heading 1',
    description: 'Large heading',
    icon: React.createElement(Heading1, { size: 18 }),
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  {
    title: 'Heading 2',
    description: 'Medium heading',
    icon: React.createElement(Heading2, { size: 18 }),
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  {
    title: 'Heading 3',
    description: 'Small heading',
    icon: React.createElement(Heading3, { size: 18 }),
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  {
    title: 'Bullet List',
    description: 'Create a bullet list',
    icon: React.createElement(List, { size: 18 }),
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleBulletList().run(),
  },
  {
    title: 'Numbered List',
    description: 'Create a numbered list',
    icon: React.createElement(ListOrdered, { size: 18 }),
    category: 'Lists',
    command: (editor) => editor.chain().focus().toggleOrderedList().run(),
  },
  {
    title: 'Blockquote',
    description: 'Add a blockquote',
    icon: React.createElement(Quote, { size: 18 }),
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleBlockquote().run(),
  },
  {
    title: 'Code Block',
    description: 'Add a code block',
    icon: React.createElement(Code, { size: 18 }),
    category: 'Blocks',
    command: (editor) => editor.chain().focus().toggleCodeBlock().run(),
  },
  {
    title: 'Horizontal Rule',
    description: 'Add a horizontal line',
    icon: React.createElement(Minus, { size: 18 }),
    category: 'Blocks',
    command: (editor) => editor.chain().focus().setHorizontalRule().run(),
  },
  {
    title: 'Table',
    description: 'Insert a table',
    icon: React.createElement(Table, { size: 18 }),
    category: 'Media',
    command: (editor) => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },
  {
    title: 'Image',
    description: 'Insert an image',
    icon: React.createElement(Image, { size: 18 }),
    category: 'Media',
    command: (editor) => {
      const url = window.prompt('Enter image URL:')
      if (url) {
        editor.chain().focus().setImage({ src: url }).run()
      }
    },
  },
  {
    title: 'Link',
    description: 'Add a link',
    icon: React.createElement(Link, { size: 18 }),
    category: 'Media',
    command: (editor) => {
      const url = window.prompt('Enter URL:')
      if (url) {
        editor.chain().focus().setLink({ href: url }).run()
      }
    },
  },
]

interface SlashCommandProps {
  editor: Editor
  query: string
  onClose: () => void
  position: { top: number; left: number }
}

export function SlashCommand({ editor, query, onClose, position }: SlashCommandProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)

  const filtered = slashCommands.filter((cmd) =>
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  )

  const selectItem = useCallback(
    (index: number) => {
      const item = filtered[index]
      if (item) {
        // Delete the slash command text
        const { state } = editor
        const { from } = state.selection
        const slashPos = from - query.length - 1
        editor.chain()
          .focus()
          .deleteRange({ from: slashPos, to: from })
          .run()
        item.command(editor)
      }
      onClose()
    },
    [editor, filtered, query, onClose]
  )

  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + filtered.length - 1) % filtered.length)
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % filtered.length)
      } else if (e.key === 'Enter') {
        e.preventDefault()
        selectItem(selectedIndex)
      } else if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [selectedIndex, filtered, selectItem, onClose])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  if (filtered.length === 0) return null

  return (
    <div
      ref={menuRef}
      className="slash-command-menu"
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
      role="listbox"
      aria-label="Slash commands"
    >
      {filtered.map((item, index) => (
        <button
          key={item.title}
          className={`slash-command-item ${index === selectedIndex ? 'active' : ''}`}
          onClick={() => selectItem(index)}
          role="option"
          aria-selected={index === selectedIndex}
        >
          <span className="slash-command-icon">{item.icon}</span>
          <span className="slash-command-text">
            <span className="slash-command-title">{item.title}</span>
            <span className="slash-command-description">{item.description}</span>
          </span>
        </button>
      ))}
    </div>
  )
}

export { slashCommands }