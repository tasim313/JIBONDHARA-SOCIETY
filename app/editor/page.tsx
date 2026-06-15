'use client'

import dynamic from 'next/dynamic'

const A4Editor = dynamic(
  () => import('@/components/editor/A4Editor'),
  { ssr: false }
)

export default function EditorPage() {
  return <A4Editor />
}