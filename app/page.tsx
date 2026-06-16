'use client'

import React, { useRef, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Download, Printer, MessageCircle, ImageIcon, FileImage } from 'lucide-react'
import { JibondhraraLogo } from '@/components/JibondhraraLogo'
import { Watermark } from '@/components/Watermark'

const A4Editor = dynamic(
  () => import('@/components/editor/A4Editor'),
  { ssr: false }
)

export default function PressReleaseTemplate() {
  const documentRef = useRef<HTMLDivElement>(null)
  const [formData, setFormData] = React.useState({ date: '', headline: '' })
  const [isExporting, setIsExporting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // ─── Helpers ────────────────────────────────────────────────────────

  const preloadLogo = (): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = () => reject(new Error('Failed to load logo'))
      img.src = '/logo.png'
    })
  }

  /**
   * Prepare a clone suitable for export:
   * - KEEPS a watermark but as a visible DOM element in the export
   * - Removes button bar
   * - Replaces <input> and contentEditable <span> elements with plain-text <span> (no browser styling)
   * - Removes overflow-hidden / min-height that clip or inflate content
   */
  const prepareExportClone = (): HTMLElement | null => {
    if (!documentRef.current) return null
    const root = documentRef.current.cloneNode(true) as HTMLElement

    // Remove React watermark from clone (we add our own DOM watermark below)
    const reactWm = root.querySelector<HTMLElement>('[class*="pointer-events-none"]')
    if (reactWm) reactWm.remove()

    // Remove button bar
    const btns = root.querySelector<HTMLElement>('.print\\:hidden')
    if (btns) btns.remove()

    // Remove overflow-hidden that clips content (especially Bengali glyphs)
    // But preserve overflow-hidden on logo container for rounded corners
    root.classList.remove('overflow-hidden')
    root.style.overflow = 'visible'

    // Remove ALL min-height constraints (inflates content height)
    root.querySelectorAll<HTMLElement>('[style]').forEach((el) => {
      const s = el.getAttribute('style') || ''
      if (s.includes('min-height') || s.includes('minHeight')) {
        el.style.removeProperty('min-height')
      }
    })

    // Replace all <input> elements with plain text <span>
    // This removes browser input styling (blue highlight, focus ring, etc.)
    root.querySelectorAll<HTMLInputElement>('input').forEach((input) => {
      const span = root.ownerDocument!.createElement('span')
      span.className = input.className
      span.textContent = (input as HTMLInputElement).value || input.getAttribute('placeholder') || ''
      span.style.cssText = input.getAttribute('style') || ''
      span.style.border = 'none'
      span.style.outline = 'none'
      span.style.background = 'transparent'
      span.style.boxShadow = 'none'
      span.style.appearance = 'none'
      span.style.webkitAppearance = 'none'
      span.style.display = 'inline-block'
      span.style.minWidth = '80px'
      input.parentNode?.replaceChild(span, input)
    })

    // Replace all contentEditable <span> elements with plain text <span>
    // This removes browser contentEditable styling
    root.querySelectorAll<HTMLSpanElement>('span[contenteditable]').forEach((span) => {
      const plainSpan = root.ownerDocument!.createElement('span')
      plainSpan.className = span.className
      plainSpan.textContent = span.textContent || ''
      plainSpan.style.cssText = span.getAttribute('style') || ''
      plainSpan.style.border = 'none'
      plainSpan.style.outline = 'none'
      plainSpan.style.background = 'transparent'
      plainSpan.style.boxShadow = 'none'
      plainSpan.style.display = 'inline-block'
      plainSpan.style.minWidth = '80px'
      span.parentNode?.replaceChild(plainSpan, span)
    })

    // ── Watermark is NOT injected in the DOM clone ───────────────────
    // Instead, it is composited via canvas in the export functions.
    // This ensures the watermark is perfectly centered on EVERY page,
    // regardless of content height. DOM-based watermarks only center
    // relative to content height, not page height.

    return root
  }

  /**
   * Build the complete hex-color-only CSS for the iframe
   */
  const buildIframeCSS = (): string => `
*{margin:0;padding:0;box-sizing:border-box;}
body{width:210mm;background:#fef3c7;font-family:"Noto Sans Bengali","Inter",Arial,sans-serif;padding:0;font-size:14px;line-height:1.5;color:#1a1a1a;}
.flex{display:flex;}.flex-col{flex-direction:column;}.flex-1{flex:1 1 0%;}
.items-center{align-items:center;}.justify-end{justify-content:flex-end;}.justify-center{justify-content:center;}
.gap-2{gap:0.5rem;}.gap-3{gap:0.75rem;}.gap-4{gap:1rem;}
.text-center{text-align:center;}.text-sm{font-size:0.875rem;}
.font-bold{font-weight:700;}.font-semibold{font-weight:600;}
.w-full{width:100%;}.flex-shrink-0{flex-shrink:0;}
.relative{position:relative;}.z-10{z-index:10;}
.object-contain{object-fit:contain;}
/* logo box – 90px with 20px rounded corners */
.logo-box{width:90px;height:90px;border-radius:20px;overflow:hidden;flex-shrink:0;}
.logo-box img{width:100%;height:100%;object-fit:contain;}
/* ProseMirror / Tiptap content */
.ProseMirror{outline:none;white-space:pre-wrap;word-wrap:break-word;padding:0;min-height:auto!important;}
.a4-editor-content{padding:0;font-size:14px;line-height:1.5;color:#1a1a1a;min-height:auto!important;}
.a4-editor-content h1{font-size:2em;font-weight:700;margin:0.67em 0;overflow:visible!important;}
.a4-editor-content h2{font-size:1.5em;font-weight:600;margin:0.75em 0;overflow:visible!important;}
.a4-editor-content h3{font-size:1.25em;font-weight:600;margin:0.83em 0;overflow:visible!important;}
.a4-editor-content p{margin:0 0 0.75em;overflow:visible!important;text-align:justify;line-height:1.7;}
.a4-editor-content strong{font-weight:700;}
.a4-editor-content em{font-style:italic;}
.a4-editor-content u{text-decoration:underline;}
.a4-editor-content ul,.a4-editor-content ol{padding-left:1.5em;margin:0.5em 0;}
.a4-editor-content blockquote{border-left:3px solid #3b82f6;padding-left:1em;margin:1em 0;}
.a4-editor-content table{border-collapse:collapse;width:100%;}
.a4-editor-content td,.a4-editor-content th{border:1px solid #d1d5db;padding:8px;}
.a4-editor-content th{background:#f8fafc;font-weight:600;}
.a4-editor-content img{max-width:100%;}
.a4-editor-content code{background:#f1f5f9;padding:2px 6px;color:#e11d48;}
.a4-editor-content pre{background:#1e293b;color:#e2e8f0;padding:16px;border-radius:8px;}
.a4-editor-content hr{border:none;border-top:1px solid #e2e8f0;margin:1.5em 0;}
.a4-editor-content a{color:#2563eb;}
.a4-editor-content-wrapper{min-height:auto!important;}
.a4-editor-embedded .a4-editor-content{min-height:auto!important;}
.a4-editor-embedded .a4-editor-content-wrapper{min-height:auto!important;}
/* corporate header */
.corp-header{display:flex;align-items:center;gap:1rem;margin-bottom:8px;}
.corp-header-text{flex:1;display:flex;flex-direction:column;justify-content:center;gap:2px;}
.corp-header-text h1{font-family:"Noto Sans Bengali",Arial,sans-serif;font-size:22px;font-weight:700;color:#1b5e20;line-height:1.3;letter-spacing:0.5px;margin-bottom:3px;text-align:center;}
.corp-header-text p{font-family:"Noto Sans Bengali",Arial,sans-serif;font-size:13px;color:#6b7280;line-height:1.4;letter-spacing:0.3px;text-align:center;}
.corp-divider{border-bottom:1px solid #D6D6D6;margin-bottom:10px;}
.corp-date{display:flex;align-items:center;gap:6px;margin-bottom:8px;font-family:"Noto Sans Bengali",Arial,sans-serif;font-size:13px;color:#374151;}
.corp-date strong{font-weight:600;}
.corp-headline{text-align:center;font-weight:700;font-size:14px;color:#111827;font-family:"Noto Sans Bengali",Arial,sans-serif;line-height:1.5;margin-bottom:12px;padding:4px 0;}
`

  /**
   * Core capture pipeline:
   * 1. Clone + prepare DOM (input→span, remove watermark/buttons/min-height)
   * 2. Inject into isolated iframe (no lab()/oklch() CSS = no html2canvas errors)
   * 3. Wait for fonts with document.fonts.ready
   * 4. Capture with html2canvas at scale 3
   * 5. Return the full canvas + page dimensions
   */
  const captureDocument = async () => {
    const clone = prepareExportClone()
    if (!clone) return null

    // Create isolated iframe
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;border:none;'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument!
    iframeDoc.open()
    iframeDoc.write(`<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<style>${buildIframeCSS()}</style>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@300;400;500;600;700&family=Hind+Siliguri:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
</head><body>
${clone.outerHTML}
</body></html>`)
    iframeDoc.close()

    // Wait for fonts to fully load
    await document.fonts.ready
    // Extra settling time for rendering
    await new Promise((r) => setTimeout(r, 500))

    const html2canvas = (await import('html2canvas')).default
    const body = iframeDoc.body

    // Use scrollHeight for natural content height
    const contentHeight = body.scrollHeight

    const canvas = await html2canvas(body, {
      scale: 3,                      // retina-quality
      useCORS: true,
      allowTaint: false,
      backgroundColor: '#fef3c7',
      logging: false,
      height: contentHeight,
      windowHeight: contentHeight,
    })

    document.body.removeChild(iframe)

    // Dimensions
    const A4_W_MM = 210
    const A4_H_MM = 297
    const pxPerMm = canvas.width / A4_W_MM
    const pageHeightPx = A4_H_MM * pxPerMm

    return {
      fullCanvas: canvas,
      pageHeightPx,
      totalContentHeight: canvas.height,
      A4_W_MM,
      A4_H_MM,
    }
  }

  // ── Watermark compositing for export ──────────────────────────────
  // The watermark is drawn on TOP of each page canvas at 12% opacity.
  // This ensures perfect centering on every page, regardless of content.

  const preloadLogoForExport = async (): Promise<HTMLImageElement | null> => {
    try { return await preloadLogo() } catch { return null }
  }

  /** Draw watermark on top of a page canvas */
  const drawWatermarkOnPage = (
    ctx: CanvasRenderingContext2D,
    logoImg: HTMLImageElement | null,
    w: number,
    h: number,
  ) => {
    ctx.save()
    ctx.globalAlpha = 0.12

    // Logo – perfectly centered on the page, larger size
    if (logoImg) {
      const wmSize = Math.min(w * 0.45, h * 0.45)
      const wmX = (w - wmSize) / 2
      const wmY = (h - wmSize) / 2
      ctx.drawImage(logoImg, wmX, wmY, wmSize, wmSize)
    }

    // Bengali text – left side, vertically centered, larger
    ctx.fillStyle = '#b0b0b0'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = 'bold 56px "Noto Sans Bengali","Hind Siliguri",Arial,sans-serif'
    ctx.fillText('জীবনধারা', w * 0.14, h * 0.5)

    // English text – right side, larger
    ctx.font = 'bold 40px "Inter",Arial,sans-serif'
    ctx.fillText('JIBONDHARA', w * 0.86, h * 0.47)
    ctx.fillText('SOCIETY', w * 0.86, h * 0.53)

    ctx.restore()
  }

  /**
   * Compute page count from content height (never produces a trailing blank page)
   */
  const computePages = (totalHeight: number, pageHeight: number): number => {
    const raw = totalHeight / pageHeight
    if (raw <= 1.08) return 1
    return Math.ceil(raw)
  }

  // ─── Export functions ────────────────────────────────────────────────

  const exportPDF = async (): Promise<Blob | null> => {
    const capture = await captureDocument()
    if (!capture) return null
    const { fullCanvas, pageHeightPx, totalContentHeight, A4_W_MM, A4_H_MM } = capture

    // Preload watermark logo
    let logoImg: HTMLImageElement | null = null
    try { logoImg = await preloadLogo() } catch { /* proceed without */ }

    const { default: jsPDF } = await import('jspdf')
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    const totalPages = computePages(totalContentHeight, pageHeightPx)

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        const remaining = totalContentHeight - (p * pageHeightPx)
        if (remaining <= pageHeightPx * 0.05) break
        pdf.addPage()
      }

      const srcY = Math.round(p * pageHeightPx)
      const sliceH = Math.round(Math.min(pageHeightPx, totalContentHeight - srcY))
      if (sliceH <= 5) break

      // Composite canvas
      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = fullCanvas.width
      pageCanvas.height = pageHeightPx
      const ctx = pageCanvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 1. Background
      ctx.fillStyle = '#fef3c7'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

      // 2. Content from fullCanvas
      ctx.drawImage(fullCanvas, 0, srcY, fullCanvas.width, sliceH, 0, 0, fullCanvas.width, pageHeightPx)

      // 3. Watermark ON TOP at low opacity (centered on page, not on content)
      drawWatermarkOnPage(ctx, logoImg, pageCanvas.width, pageHeightPx)

      pdf.addImage(pageCanvas.toDataURL('image/jpeg', 0.95), 'JPEG', 0, 0, A4_W_MM, A4_H_MM)
    }

    return pdf.output('blob')
  }

  const exportImageBlob = async (format: 'image/png' | 'image/jpeg', quality = 1): Promise<Blob | null> => {
    const capture = await captureDocument()
    if (!capture) return null
    const { fullCanvas, pageHeightPx, totalContentHeight } = capture

    // Preload watermark logo
    let logoImg: HTMLImageElement | null = null
    try { logoImg = await preloadLogo() } catch { /* proceed without */ }

    const totalPages = computePages(totalContentHeight, pageHeightPx)
    const pages: Blob[] = []

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        const remaining = totalContentHeight - (p * pageHeightPx)
        if (remaining <= pageHeightPx * 0.05) break
      }

      const srcY = Math.round(p * pageHeightPx)
      const sliceH = Math.round(Math.min(pageHeightPx, totalContentHeight - srcY))
      if (sliceH <= 5) break

      const pageCanvas = document.createElement('canvas')
      pageCanvas.width = fullCanvas.width
      pageCanvas.height = pageHeightPx
      const ctx = pageCanvas.getContext('2d')!
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      // 1. Background
      ctx.fillStyle = '#fef3c7'
      ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

      // 2. Content from fullCanvas
      ctx.drawImage(fullCanvas, 0, srcY, fullCanvas.width, sliceH, 0, 0, fullCanvas.width, pageHeightPx)

      // 3. Watermark ON TOP at low opacity (centered on page, not on content)
      drawWatermarkOnPage(ctx, logoImg, pageCanvas.width, pageHeightPx)

      const blob = await new Promise<Blob | null>((resolve) =>
        pageCanvas.toBlob((b) => resolve(b), format, quality)
      )
      if (blob) pages.push(blob)
    }

    // If multi-page: combine into one tall image
    if (pages.length === 1) return pages[0]

    // Stack images vertically for multi-page
    const totalH = pages.reduce((sum) => sum + pageHeightPx, 0)
    const stacked = document.createElement('canvas')
    stacked.width = fullCanvas.width
    stacked.height = totalH
    const sctx = stacked.getContext('2d')!
    let y = 0
    for (const pageBlob of pages) {
      const img = await createImageBitmap(pageBlob)
      sctx.drawImage(img, 0, y)
      y += img.height
    }
    return new Promise((resolve) => stacked.toBlob((b) => resolve(b), format, quality))
  }

  // ─── UI Handlers ─────────────────────────────────────────────────────

  const handleDownloadPDF = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await exportPDF()
      if (blob) downloadBlob(blob, 'press-release.pdf')
    } catch (err) { console.error('PDF failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleDownloadPNG = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await exportImageBlob('image/png', 1)
      if (blob) downloadBlob(blob, 'press-release.png')
    } catch (err) { console.error('PNG failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleDownloadJPG = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await exportImageBlob('image/jpeg', 1)
      if (blob) downloadBlob(blob, 'press-release.jpg')
    } catch (err) { console.error('JPG failed:', err) }
    finally { setIsExporting(false) }
  }

  const handlePrint = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await exportPDF()
      if (blob) {
        const pdfData = URL.createObjectURL(blob)
        const w = window.open('', '_blank', 'width=800,height=600')
        if (w) {
          w.document.write(`<html><body style="margin:0"><iframe src="${pdfData}" style="width:100%;height:100vh;border:none"></iframe><script>setTimeout(()=>window.print(),500)</script></body></html>`)
          w.document.close()
        } else { URL.revokeObjectURL(pdfData) }
      }
    } catch (err) { console.error('Print failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleWhatsAppShare = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await exportPDF()
      if (blob) {
        if (navigator.share && (navigator as any).canShare) {
          const f = new File([blob], 'press-release.pdf', { type: 'application/pdf' })
          if ((navigator as any).canShare({ files: [f] })) {
            await navigator.share({ files: [f] })
            setIsExporting(false); return
          }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent('Press Release from Jibondhrara Society')}`, '_blank')
        downloadBlob(blob, 'press-release.pdf')
      }
    } catch (err) { console.error('WhatsApp failed:', err) }
    finally { setIsExporting(false) }
  }

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = filename
    document.body.appendChild(a); a.click()
    document.body.removeChild(a); URL.revokeObjectURL(url)
  }

  // ─── Render ──────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 mb-8 justify-end flex-wrap print:hidden">
          <button onClick={handleDownloadPDF} disabled={isExporting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <Download size={18} />{isExporting ? '...' : 'PDF'}
          </button>
          <button onClick={handleDownloadPNG} disabled={isExporting}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <ImageIcon size={18} />{isExporting ? '...' : 'PNG'}
          </button>
          <button onClick={handleDownloadJPG} disabled={isExporting}
            className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <FileImage size={18} />{isExporting ? '...' : 'JPG'}
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <Printer size={18} /> Print
          </button>
          <button onClick={handleWhatsAppShare} disabled={isExporting}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <MessageCircle size={18} />{isExporting ? '...' : 'WhatsApp'}
          </button>
        </div>

        <div ref={documentRef} className="relative bg-amber-50 w-full shadow-lg p-0 overflow-hidden" style={{ width: '210mm', margin: '0 auto', minHeight: '297mm' }}>
          <Watermark />
          <div className="relative z-10 flex flex-col" style={{ padding: '15mm 15mm 18mm 15mm', minHeight: '297mm' }}>
            {/* ── Corporate Header ─────────────────────────────── */}
            <div className="flex items-center gap-4" style={{ marginBottom: '6px' }}>
              <div className="flex-shrink-0"><JibondhraraLogo /></div>
              <div className="flex-1 flex flex-col justify-center" style={{ gap: '3px' }}>
                <h1
                  className="text-center font-bold"
                  style={{
                    color: '#1b5e20',
                    fontFamily: 'var(--font-noto-bengali)',
                    fontSize: '22px',
                    fontWeight: 700,
                    lineHeight: 1.3,
                    letterSpacing: '0.5px',
                    marginBottom: '3px',
                  }}
                >
                  জীবনধারা সোসাইটি (JIBONDHARA SOCIETY)
                </h1>
                <p
                  className="text-center"
                  style={{
                    fontFamily: 'var(--font-noto-bengali)',
                    color: '#6b7280',
                    fontSize: '13px',
                    lineHeight: 1.4,
                    letterSpacing: '0.3px',
                  }}
                >
                  ৯০,হাতেমবাগ রোড়, হাজারীবাগ, ঢাকা। | (90, Hatembag Road, Hazaribagh, Dhaka.)
                </p>
              </div>
            </div>

            {/* ── Subtle Divider ───────────────────────────────── */}
            <div style={{ borderBottom: '1px solid #D6D6D6', marginBottom: '10px' }} />

            {/* ── Date Row (plain text input) ──────────────────── */}
            <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#374151',
                  fontFamily: 'Inter, Arial, sans-serif',
                }}
              >
                Date:
              </span>
              <input
                type="text"
                value={formData.date}
                onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                placeholder="(e.g., January 12, 2024)"
                style={{
                  fontSize: '13px',
                  color: '#374151',
                  fontFamily: 'Inter, Arial, sans-serif',
                  cursor: 'text',
                  lineHeight: 1.5,
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  padding: 0,
                  flex: 1,
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              />
            </div>

            {/* ── Headline (plain text input) ──────────────────── */}
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                name="headline"
                placeholder=""
                value={formData.headline}
                onChange={handleInputChange}
                style={{
                  width: '100%',
                  fontWeight: 700,
                  fontSize: '14px',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  textAlign: 'center',
                  color: '#111827',
                  fontFamily: 'var(--font-noto-bengali)',
                  lineHeight: 1.5,
                  padding: '4px 0',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              />
            </div>

            {/* ── Editor Content ───────────────────────────────── */}
            <div className="flex-1" style={{ minHeight: '200mm' }}>
              <Suspense fallback={<div className="flex items-center justify-center h-64 text-gray-400">Loading...</div>}>
                <A4Editor storageKey="press-release-body"
                  placeholder="Type your body content here... (Type / for commands, right-click for formatting options)" />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}