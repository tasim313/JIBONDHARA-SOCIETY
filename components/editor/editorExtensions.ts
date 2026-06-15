import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Underline } from '@tiptap/extension-underline'
import { Placeholder } from '@tiptap/extension-placeholder'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Image } from '@tiptap/extension-image'
import { Link } from '@tiptap/extension-link'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { TextAlign } from '@tiptap/extension-text-align'
import { Typography } from '@tiptap/extension-typography'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'

export function getEditorExtensions(placeholder?: string) {
  return [
    StarterKit.configure({
      heading: {
        levels: [1, 2, 3, 4, 5, 6],
      },
      bulletList: {
        keepMarks: true,
        keepAttributes: false,
      },
      orderedList: {
        keepMarks: true,
        keepAttributes: false,
      },
      codeBlock: {
        HTMLAttributes: {
          class: 'editor-code-block',
        },
      },
      blockquote: {
        HTMLAttributes: {
          class: 'editor-blockquote',
        },
      },
      paragraph: {
        HTMLAttributes: {
          class: 'editor-paragraph',
        },
      },
    }),
    TextStyle,
    Color,
    Highlight.configure({
      multicolor: true,
    }),
    Underline,
    Placeholder.configure({
      placeholder: placeholder || 'Start typing your document here...',
    }),
    Table.configure({
      resizable: true,
      HTMLAttributes: {
        class: 'editor-table',
      },
    }),
    TableRow,
    TableCell,
    TableHeader,
    Image.configure({
      HTMLAttributes: {
        class: 'editor-image',
      },
    }),
    Link.configure({
      openOnClick: false,
      HTMLAttributes: {
        class: 'editor-link',
        rel: 'noopener noreferrer',
        target: '_blank',
      },
    }),
    HorizontalRule,
    TaskList,
    TaskItem.configure({
      nested: true,
    }),
    Subscript,
    Superscript,
    TextAlign.configure({
      types: ['heading', 'paragraph'],
    }),
    Typography,
    Dropcursor.configure({
      color: '#3b82f6',
      width: 2,
    }),
    Gapcursor,
  ]
}