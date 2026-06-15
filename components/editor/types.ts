import { JSONContent } from '@tiptap/react'

// ============================================================
// A4 Editor Types
// ============================================================

/** A4 page dimensions in mm */
export interface A4Dimensions {
  width: number  // 210mm
  height: number // 297mm
}

/** Page margin configuration */
export interface PageMargins {
  top: number
  right: number
  bottom: number
  left: number
}

/** Editor configuration */
export interface EditorConfig {
  /** A4 page dimensions */
  dimensions: A4Dimensions
  /** Page margins */
  margins: PageMargins
  /** Auto-save interval in milliseconds */
  autoSaveInterval: number
  /** Storage key for localStorage */
  storageKey: string
  /** Enable auto-save */
  enableAutoSave: boolean
  /** Enable slash commands */
  enableSlashCommands: boolean
  /** Enable context menu */
  enableContextMenu: boolean
  /** Enable keyboard shortcuts */
  enableKeyboardShortcuts: boolean
  /** Placeholder text */
  placeholder: string
  /** Initial content */
  initialContent?: JSONContent | string
}

/** Slash command item */
export interface SlashCommandItem {
  description: string
  icon: string
  command: (editor: any) => void
  category: 'formatting' | 'blocks' | 'media' | 'lists'
}

/** Context menu item */
export interface ContextMenuItem {
  label: string
  icon?: string
  shortcut?: string
  action: () => void
  divider?: boolean
  disabled?: boolean
  submenu?: ContextMenuItem[]
}

/** Auto-save state */
export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

/** Export format */
export type ExportFormat = 'pdf' | 'docx' | 'html'

/** Export options */
export interface ExportOptions {
  format: ExportFormat
  filename?: string
  includeStyles?: boolean
  pageSize?: 'a4' | 'letter'
}

/** Editor state */
export interface EditorState {
  content: JSONContent | null
  html: string
  json: JSONContent | null
  wordCount: number
  charCount: number
  pageCount: number
}

/** Keyboard shortcut definition */
export interface KeyboardShortcut {
  key: string
  modifiers: string[]
  description: string
  action: (editor: any) => void
}

/** Font configuration */
export interface FontConfig {
  primary: string
  fallback: string
  bengali: string
  english: string
}

/** Default editor configuration */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  dimensions: {
    width: 210,
    height: 297,
  },
  margins: {
    top: 25,
    right: 25,
    bottom: 25,
    left: 25,
  },
  autoSaveInterval: 3000,
  storageKey: 'a4-editor-draft',
  enableAutoSave: true,
  enableSlashCommands: true,
  enableContextMenu: true,
  enableKeyboardShortcuts: true,
  placeholder: 'Start typing your document here...',
}

/** Default font configuration */
export const DEFAULT_FONT_CONFIG: FontConfig = {
  primary: 'Noto Sans Bengali',
  fallback: 'Noto Sans, Inter, sans-serif',
  bengali: 'Noto Sans Bengali, Hind Siliguri',
  english: 'Inter, Noto Sans, sans-serif',
}
