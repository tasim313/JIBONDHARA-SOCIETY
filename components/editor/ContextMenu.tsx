'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type { Editor } from '@tiptap/react'
import {
  Bold, Italic, Underline, Strikethrough, Heading1, Heading2, Heading3,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link, Highlighter, Palette, Type,
  ChevronRight,
} from 'lucide-react'

interface ContextMenuProps {
  editor: Editor
  position: { x: number; y: number }
  onClose: () => void
}

interface MenuItem {
  label: string
  icon?: React.ReactNode
  shortcut?: string
  action?: () => void
  divider?: boolean
  submenu?: MenuItem[]
  disabled?: boolean
}

const colorPalette = [
  '#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff',
  '#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff',
  '#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc',
  '#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd',
  '#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0',
  '#a61c00', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79',
  '#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47',
  '#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130',
]

export function ContextMenu({ editor, position, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null)

  const getMenuItems = useCallback((): MenuItem[] => {
    return [
      {
        label: 'Bold',
        icon: React.createElement(Bold, { size: 16 }),
        shortcut: 'Ctrl+B',
        action: () => editor.chain().focus().toggleBold().run(),
      },
      {
        label: 'Italic',
        icon: React.createElement(Italic, { size: 16 }),
        shortcut: 'Ctrl+I',
        action: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        label: 'Underline',
        icon: React.createElement(Underline, { size: 16 }),
        shortcut: 'Ctrl+U',
        action: () => editor.chain().focus().toggleUnderline().run(),
      },
      {
        label: 'Strikethrough',
        icon: React.createElement(Strikethrough, { size: 16 }),
        action: () => editor.chain().focus().toggleStrike().run(),
      },
      { label: '', divider: true },
      {
        label: 'Heading',
        icon: React.createElement(Heading1, { size: 16 }),
        submenu: [
          {
            label: 'Heading 1',
            icon: React.createElement(Heading1, { size: 16 }),
            action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
          },
          {
            label: 'Heading 2',
            icon: React.createElement(Heading2, { size: 16 }),
            action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
          },
          {
            label: 'Heading 3',
            icon: React.createElement(Heading3, { size: 16 }),
            action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
          },
        ],
      },
      { label: '', divider: true },
      {
        label: 'Text Color',
        icon: React.createElement(Palette, { size: 16 }),
        submenu: colorPalette.slice(0, 20).map((color) => ({
          label: color,
          action: () => editor.chain().focus().setColor(color).run(),
        })),
      },
      {
        label: 'Highlight',
        icon: React.createElement(Highlighter, { size: 16 }),
        submenu: [
          {
            label: 'Yellow',
            action: () => editor.chain().focus().toggleHighlight({ color: '#fff2cc' }).run(),
          },
          {
            label: 'Green',
            action: () => editor.chain().focus().toggleHighlight({ color: '#d9ead3' }).run(),
          },
          {
            label: 'Blue',
            action: () => editor.chain().focus().toggleHighlight({ color: '#c9daf8' }).run(),
          },
          {
            label: 'Red',
            action: () => editor.chain().focus().toggleHighlight({ color: '#f4cccc' }).run(),
          },
          {
            label: 'Remove',
            action: () => editor.chain().focus().unsetHighlight().run(),
          },
        ],
      },
      { label: '', divider: true },
      {
        label: 'Align Left',
        icon: React.createElement(AlignLeft, { size: 16 }),
        action: () => editor.chain().focus().setTextAlign('left').run(),
      },
      {
        label: 'Align Center',
        icon: React.createElement(AlignCenter, { size: 16 }),
        action: () => editor.chain().focus().setTextAlign('center').run(),
      },
      {
        label: 'Align Right',
        icon: React.createElement(AlignRight, { size: 16 }),
        action: () => editor.chain().focus().setTextAlign('right').run(),
      },
      {
        label: 'Justify',
        icon: React.createElement(AlignJustify, { size: 16 }),
        action: () => editor.chain().focus().setTextAlign('justify').run(),
      },
      { label: '', divider: true },
      {
        label: 'Bullet List',
        icon: React.createElement(List, { size: 16 }),
        action: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        label: 'Numbered List',
        icon: React.createElement(ListOrdered, { size: 16 }),
        action: () => editor.chain().focus().toggleOrderedList().run(),
      },
      { label: '', divider: true },
      {
        label: 'Link',
        icon: React.createElement(Link, { size: 16 }),
        action: () => {
          const url = window.prompt('Enter URL:')
          if (url) {
            editor.chain().focus().setLink({ href: url }).run()
          }
        },
      },
    ]
  }, [editor])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [onClose])

  const menuItems = getMenuItems()

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        position: 'fixed',
        top: position.y,
        left: position.x,
        zIndex: 10000,
      }}
      role="menu"
      aria-label="Context menu"
    >
      {menuItems.map((item, index) => {
        if (item.divider) {
          return <div key={`divider-${index}`} className="context-menu-divider" role="separator" />
        }

        return (
          <div
            key={item.label}
            className="context-menu-item-wrapper"
            onMouseEnter={() => item.submenu && setActiveSubmenu(item.label)}
            onMouseLeave={() => item.submenu && setActiveSubmenu(null)}
          >
            <button
              className="context-menu-item"
              onClick={() => {
                if (item.action) {
                  item.action()
                  onClose()
                }
              }}
              role="menuitem"
              disabled={item.disabled}
            >
              {item.icon && <span className="context-menu-icon">{item.icon}</span>}
              <span className="context-menu-label">{item.label}</span>
              {item.shortcut && (
                <span className="context-menu-shortcut">{item.shortcut}</span>
              )}
              {item.submenu && (
                <span className="context-menu-arrow">
                  <ChevronRight size={14} />
                </span>
              )}
            </button>
            {item.submenu && activeSubmenu === item.label && (
              <div className="context-menu-submenu">
                {item.submenu.map((subItem, subIndex) => (
                  <button
                    key={`${subItem.label}-${subIndex}`}
                    className="context-menu-item"
                    onClick={() => {
                      if (subItem.action) {
                        subItem.action()
                        onClose()
                      }
                    }}
                    role="menuitem"
                  >
                    {subItem.icon && <span className="context-menu-icon">{subItem.icon}</span>}
                    <span className="context-menu-label">{subItem.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}