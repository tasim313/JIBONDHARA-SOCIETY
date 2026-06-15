'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import type { Editor } from '@tiptap/react'

export interface AutoSaveState {
  isSaving: boolean
  lastSaved: Date | null
  hasUnsavedChanges: boolean
  error: string | null
}

export function useAutoSave(
  editor: Editor | null,
  storageKey: string = 'a4-editor-draft',
  interval: number = 3000
) {
  const [state, setState] = useState<AutoSaveState>({
    isSaving: false,
    lastSaved: null,
    hasUnsavedChanges: false,
    error: null,
  })

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const lastContentRef = useRef<string>('')

  const save = useCallback(() => {
    if (!editor) return

    try {
      setState((prev) => ({ ...prev, isSaving: true, error: null }))

      const json = editor.getJSON()
      const html = editor.getHTML()
      const content = JSON.stringify(json)

      // Only save if content has changed
      if (content === lastContentRef.current) {
        setState((prev) => ({ ...prev, isSaving: false }))
        return
      }

      const draft = {
        json,
        html,
        savedAt: new Date().toISOString(),
        version: 1,
      }

      localStorage.setItem(storageKey, JSON.stringify(draft))
      lastContentRef.current = content

      setState({
        isSaving: false,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        error: null,
      })
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSaving: false,
        error: err instanceof Error ? err.message : 'Failed to save',
      }))
    }
  }, [editor, storageKey])

  // Load saved content
  const load = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey)
      if (!saved) return null

      const draft = JSON.parse(saved)
      lastContentRef.current = JSON.stringify(draft.json)

      setState({
        isSaving: false,
        lastSaved: new Date(draft.savedAt),
        hasUnsavedChanges: false,
        error: null,
      })

      return draft.json
    } catch {
      return null
    }
  }, [storageKey])

  // Clear saved content
  const clear = useCallback(() => {
    localStorage.removeItem(storageKey)
    lastContentRef.current = ''
    setState({
      isSaving: false,
      lastSaved: null,
      hasUnsavedChanges: false,
      error: null,
    })
  }, [storageKey])

  // Set up debounced auto-save
  useEffect(() => {
    if (!editor) return

    const handleUpdate = () => {
      setState((prev) => ({ ...prev, hasUnsavedChanges: true }))

      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }

      timerRef.current = setTimeout(() => {
        save()
      }, interval)
    }

    editor.on('update', handleUpdate)

    return () => {
      editor.off('update', handleUpdate)
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [editor, interval, save])

  // Save on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (state.hasUnsavedChanges) {
        save()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [save, state.hasUnsavedChanges])

  return {
    ...state,
    save,
    load,
    clear,
  }
}