'use client'

import React, { useRef, useState, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { Download, Printer, MessageCircle } from 'lucide-react'
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

  const getPdfBlob = async (): Promise<Blob | null> => {
    if (!documentRef.current) return null

    // Helper: replace modern CSS color functions with hex equivalents
    const sanitizeCSS = (css: string): string => {
      return css
        .replace(/oklch\([^)]+\)/g, 'transparent')
        .replace(/lab\([^)]+\)/g, 'transparent')
        .replace(/lch\([^)]+\)/g, 'transparent')
        .replace(/oklab\([^)]+\)/g, 'transparent')
        .replace(/color\([^)]+\)/g, 'transparent')
    }

    // Build clean HTML: clone the document, keep all classes/styles but sanitize CSS
    const buildPreservedHTML = (): string => {
      const clone = documentRef.current!.cloneNode(true) as HTMLElement
      
      // Remove watermark (div with absolute + pointer-events-none + flex items-center justify-center)
      const wm = clone.querySelector('[class*="pointer-events-none"]')
      if (wm) wm.remove()
      
      // Remove buttons (print:hidden class elements)
      const buttonsContainer = clone.querySelector('.print\\:hidden')
      if (buttonsContainer) buttonsContainer.remove()
      
      // Sanitize all inline styles that contain modern color functions
      clone.querySelectorAll('[style]').forEach((el) => {
        const e = el as HTMLElement
        const style = e.getAttribute('style') || ''
        if (style && (style.includes('oklch') || style.includes('lab(') || style.includes('lch(') || style.includes('oklab(') || style.includes('color('))) {
          e.setAttribute('style', sanitizeCSS(style))
        }
      })
      
      return clone.outerHTML
    }

    // Create isolated iframe
    const iframe = document.createElement('iframe')
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentDocument!
    iframeDoc.open()
    iframeDoc.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<!-- Include the same Tailwind-like CSS but with hex colors only -->
<style>
*{margin:0;padding:0;box-sizing:border-box;}
body{width:210mm;min-height:297mm;background:#fef3c7;font-family:"Noto Sans Bengali","Inter",sans-serif;padding:0;font-size:14px;line-height:1.8;color:#1a1a1a;}
.min-h-screen{min-height:100vh;}.bg-gray-100{background:#f3f4f6;}.p-8{padding:2rem;}
.max-w-4xl{max-width:56rem;}.mx-auto{margin-left:auto;margin-right:auto;}
.flex{display:flex;}.flex-col{flex-direction:column;}.flex-1{flex:1 1 0%;}
.items-center{align-items:center;}.justify-end{justify-content:flex-end;}
.gap-2{gap:0.5rem;}.gap-3{gap:0.75rem;}.gap-6{gap:1.5rem;}
.mb-8{margin-bottom:2rem;}.mb-6{margin-bottom:1.5rem;}.mb-4{margin-bottom:1rem;}.mb-1{margin-bottom:0.25rem;}
.p-12{padding:3rem;}.pb-4{padding-bottom:1rem;}
.border-b{border-bottom-width:1px;border-bottom-style:solid;}.border-gray-400{border-color:#9ca3af;}.border-gray-300{border-color:#d1d5db;}
.text-center{text-align:center;}.text-xl{font-size:1.25rem;}.text-xs{font-size:0.75rem;}.text-sm{font-size:0.875rem;}
.font-bold{font-weight:700;}.font-semibold{font-weight:600;}
.text-gray-700{color:#374151;}.text-gray-900{color:#111827;}
.w-full{width:100%;}.flex-shrink-0{flex-shrink:0;}
.relative{position:relative;}.z-10{z-index:10;}.overflow-hidden{overflow:hidden;}
.shadow-lg{box-shadow:0 4px 6px -1px rgba(0,0,0,0.1),0 2px 4px -1px rgba(0,0,0,0.06);}
.bg-transparent{background:transparent;}.border-0{border-width:0;}
input{border:none;border-bottom:1px solid #9ca3af;width:100%;background:transparent;padding:4px 0;font-size:0.875rem;outline:none;}
input:focus{border-bottom-color:#16a34a;}.py-1{padding-top:0.25rem;padding-bottom:0.25rem;}.py-2{padding-top:0.5rem;padding-bottom:0.5rem;}
.flex-wrap{flex-wrap:wrap;}
.rounded-lg{border-radius:0.5rem;}
/* Hide buttons in PDF */
.print\\\\:hidden{display:none!important;}
/* Editor content styles */
.a4-editor-content{padding:0;font-size:14px;line-height:1.8;color:#1a1a1a;}
.a4-editor-content h1{font-size:2em;font-weight:700;margin:0.67em 0;}
.a4-editor-content h2{font-size:1.5em;font-weight:600;margin:0.75em 0;}
.a4-editor-content h3{font-size:1.25em;font-weight:600;margin:0.83em 0;}
.a4-editor-content p{margin:0 0 0.75em;}
.a4-editor-content strong{font-weight:700;}.a4-editor-content em{font-style:italic;}
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
</style></head><body>
${buildPreservedHTML()}
</body></html>`)
    iframeDoc.close()
    await new Promise((resolve) => setTimeout(resolve, 100))

    // Inject html2pdf.js from CDN into the iframe
    await new Promise<void>((resolve, reject) => {
      const script = iframeDoc.createElement('script')
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js'
      script.onload = () => resolve()
      script.onerror = () => reject(new Error('Failed to load html2pdf'))
      iframeDoc.head.appendChild(script)
    })
    await new Promise((resolve) => setTimeout(resolve, 300))

    const iframeWin = iframe.contentWindow as any
    if (!iframeWin.html2pdf) throw new Error('html2pdf not available')

    const opt = {
      margin: 0,
      filename: 'press-release.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: {
        scale: 2,
        useCORS: true,
        letterRendering: true,
        backgroundColor: '#fef3c7',
        logging: false,
      },
      jsPDF: {
        unit: 'mm',
        format: 'a4',
        orientation: 'portrait' as const,
      },
    }

    try {
      const blob = await iframeWin.html2pdf().set(opt).from(iframeDoc.body).outputPdf('blob')
      return blob as Blob
    } catch (err) {
      console.error('PDF error:', err)
      return null
    } finally {
      document.body.removeChild(iframe)
    }
  }

  const handleDownloadPDF = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await getPdfBlob()
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'press-release.pdf'
        document.body.appendChild(a); a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err) { console.error('Download failed:', err) }
    finally { setIsExporting(false) }
  }

  const handlePrint = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await getPdfBlob()
      if (blob) {
        const pdfData = URL.createObjectURL(blob)
        const w = window.open('', '_blank', 'width=800,height=600')
        if (w) {
          w.document.write(`<html><body style="margin:0"><iframe src="${pdfData}" style="width:100%;height:100vh;border:none"></iframe><script>setTimeout(()=>window.print(),500)</script></body></html>`)
          w.document.close()
        }
      }
    } catch (err) { console.error('Print failed:', err) }
    finally { setIsExporting(false) }
  }

  const handleWhatsAppShare = async () => {
    if (isExporting) return
    setIsExporting(true)
    try {
      const blob = await getPdfBlob()
      if (blob) {
        if (navigator.share && navigator.canShare) {
          const f = new File([blob], 'press-release.pdf', { type: 'application/pdf' })
          if (navigator.canShare({ files: [f] })) {
            await navigator.share({ files: [f] })
            setIsExporting(false); return
          }
        }
        window.open(`https://wa.me/?text=${encodeURIComponent('Press Release from Jibondhrara Society')}`, '_blank')
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = 'press-release.pdf'
        document.body.appendChild(a); a.click()
        document.body.removeChild(a); URL.revokeObjectURL(url)
      }
    } catch (err) { console.error('WhatsApp share failed:', err) }
    finally { setIsExporting(false) }
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex gap-3 mb-8 justify-end flex-wrap print:hidden">
          <button onClick={handleDownloadPDF} disabled={isExporting}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <Download size={18} />{isExporting ? 'Exporting...' : 'Download PDF'}
          </button>
          <button onClick={handlePrint}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <Printer size={18} /> Print
          </button>
          <button onClick={handleWhatsAppShare} disabled={isExporting}
            className="flex items-center gap-2 bg-[#25D366] hover:bg-[#1da851] disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold transition text-sm">
            <MessageCircle size={18} />{isExporting ? 'Exporting...' : 'Share on WhatsApp'}
          </button>
        </div>

        <div ref={documentRef} className="relative bg-amber-50 w-full shadow-lg p-0 overflow-hidden" style={{ width: '210mm', margin: '0 auto' }}>
          <Watermark />
          <div className="relative z-10 flex flex-col p-12" style={{ minHeight: '297mm' }}>
            <div className="flex gap-6 mb-6 border-b border-gray-400 pb-4">
              <div className="flex-shrink-0"><JibondhraraLogo /></div>
              <div className="flex-1">
                <h1 className="text-center text-xl font-bold mb-1" style={{ color: '#1b5e20', fontFamily: 'var(--font-noto-bengali)' }}>জীবনধারা সোসাইটি (JIBONDHARA SOCIETY)</h1>
                <p className="text-center text-xs text-gray-700" style={{ fontFamily: 'var(--font-noto-bengali)' }}>৯০,হাতেমবাগ রোড়, হাজারীবাগ, ঢাকা। | (90, Hatembag Road, Hazaribagh, Dhaka.)</p>
              </div>
            </div>
            <div className="mb-6 flex items-center gap-2">
              <label className="text-sm font-semibold text-gray-700">Date:</label>
              <input type="text" name="date" placeholder="(e.g., February 24, 2024)" value={formData.date} onChange={handleInputChange}
                className="flex-1 text-sm bg-transparent border-0 border-b border-gray-400 focus:border-green-600 focus:outline-none py-1 text-gray-700" />
            </div>
            <div className="mb-4">
              <input type="text" name="headline" placeholder="" value={formData.headline} onChange={handleInputChange}
                className="w-full font-bold text-sm bg-transparent border-0 border-b border-gray-300 focus:border-green-600 focus:outline-none py-2 text-center text-gray-900" />
            </div>
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