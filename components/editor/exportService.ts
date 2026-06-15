'use client'

import type { Editor } from '@tiptap/react'

/**
 * Export editor content as HTML
 */
export function exportAsHTML(editor: Editor, filename: string = 'document'): void {
  const html = editor.getHTML()
  const fullHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${filename}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+Bengali:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    body {
      font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
      max-width: 210mm; margin: 0 auto; padding: 25mm;
      line-height: 1.6; color: #1a1a1a;
    }
    h1 { font-size: 2em; margin: 0.67em 0; }
    h2 { font-size: 1.5em; margin: 0.75em 0; }
    h3 { font-size: 1.17em; margin: 0.83em 0; }
    blockquote { border-left: 3px solid #3b82f6; padding-left: 1em; margin-left: 0; color: #555; }
    table { border-collapse: collapse; width: 100%; }
    table td, table th { border: 1px solid #ddd; padding: 8px; }
    table th { background-color: #f5f5f5; font-weight: 600; }
    img { max-width: 100%; height: auto; }
    code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
    pre { background-color: #f3f4f6; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    a { color: #3b82f6; text-decoration: underline; }
    hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
    ul, ol { padding-left: 1.5em; }
    li { margin: 0.25em 0; }
  </style>
</head>
<body>
${html}
</body>
</html>`

  const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
  downloadBlob(blob, `${filename}.html`)
}

/**
 * Export editor content as PDF using html2pdf.js
 */
export async function exportAsPDF(editor: Editor, filename: string = 'document'): Promise<void> {
  const html = editor.getHTML()
  
  // Create an iframe to isolate from parent document's CSS variables (oklch colors)
  const iframe = document.createElement('iframe')
  iframe.style.position = 'fixed'
  iframe.style.left = '-9999px'
  iframe.style.width = '210mm'
  iframe.style.height = '297mm'
  document.body.appendChild(iframe)
  
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
  if (!iframeDoc) {
    document.body.removeChild(iframe)
    return
  }
  
  // Write content to iframe with clean styles
  iframeDoc.open()
  iframeDoc.write(`
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          body {
            font-family: 'Noto Sans Bengali', 'Inter', sans-serif;
            margin: 0;
            padding: 25mm;
            line-height: 1.6;
            color: #1a1a1a;
            background: white;
            width: 210mm;
            box-sizing: border-box;
          }
          h1 { font-size: 2em; margin: 0.67em 0; }
          h2 { font-size: 1.5em; margin: 0.75em 0; }
          h3 { font-size: 1.17em; margin: 0.83em 0; }
          blockquote { border-left: 3px solid #3b82f6; padding-left: 1em; margin-left: 0; color: #555; }
          table { border-collapse: collapse; width: 100%; }
          table td, table th { border: 1px solid #ddd; padding: 8px; }
          table th { background-color: #f5f5f5; font-weight: 600; }
          img { max-width: 100%; height: auto; }
          code { background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-family: monospace; }
          pre { background-color: #f3f4f6; padding: 16px; border-radius: 8px; }
          pre code { background: none; padding: 0; }
          a { color: #3b82f6; text-decoration: underline; }
          hr { border: none; border-top: 1px solid #e5e7eb; margin: 1em 0; }
          ul, ol { padding-left: 1.5em; }
          li { margin: 0.25em 0; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `)
  iframeDoc.close()
  
  try {
    const html2pdfModule = await import('html2pdf.js')
    const html2pdf = html2pdfModule.default
    
    await html2pdf().set({
      margin: 0,
      filename: `${filename}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true, 
        letterRendering: true,
        backgroundColor: 'white',
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    }).from(iframeDoc.body).save()
  } finally {
    document.body.removeChild(iframe)
  }
}

/**
 * Export editor content as DOCX
 */
export async function exportAsDOCX(editor: Editor, filename: string = 'document'): Promise<void> {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = await import('docx')
  const json = editor.getJSON()
  const children = convertNodesToDocx(json.content || [], { Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle })

  const doc = new Document({
    sections: [{
      properties: {
        page: {
          size: { width: 11906, height: 16838 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        },
      },
      children,
    }],
  })

  const blob = await Packer.toBlob(doc)
  downloadBlob(blob, `${filename}.docx`)
}

function convertNodesToDocx(nodes: any[], libs: any): any[] {
  const { Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell, WidthType, BorderStyle } = libs
  const result: any[] = []

  for (const node of nodes) {
    switch (node.type) {
      case 'heading': {
        const level = node.attrs?.level || 1
        const headingMap: Record<number, any> = {
          1: HeadingLevel.HEADING_1, 2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3, 4: HeadingLevel.HEADING_4,
          5: HeadingLevel.HEADING_5, 6: HeadingLevel.HEADING_6,
        }
        result.push(new Paragraph({
          heading: headingMap[level] || HeadingLevel.HEADING_1,
          children: convertInlineNodes(node.content || [], libs),
        }))
        break
      }
      case 'paragraph': {
        const alignment = node.attrs?.textAlign
        const alignmentMap: Record<string, any> = {
          left: AlignmentType.LEFT, center: AlignmentType.CENTER,
          right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED,
        }
        result.push(new Paragraph({
          alignment: alignmentMap[alignment] || AlignmentType.LEFT,
          children: convertInlineNodes(node.content || [], libs),
        }))
        break
      }
      case 'bulletList': {
        for (const item of node.content || []) {
          result.push(new Paragraph({
            bullet: { level: 0 },
            children: convertInlineNodes(item.content || [], libs),
          }))
        }
        break
      }
      case 'orderedList': {
        for (const item of node.content || []) {
          result.push(new Paragraph({
            children: convertInlineNodes(item.content || [], libs),
          }))
        }
        break
      }
      case 'blockquote': {
        for (const child of node.content || []) {
          result.push(...convertNodesToDocx([child], libs))
        }
        break
      }
      case 'table': {
        const rows = (node.content || []).map((row: any) => {
          const cells = (row.content || []).map((cell: any) => {
            return new TableCell({
              children: convertNodesToDocx(cell.content || [], libs),
              width: { size: 100 / (row.content?.length || 1), type: WidthType.PERCENTAGE },
            })
          })
          return new TableRow({ children: cells })
        })
        result.push(new Table({ rows, width: { size: 100, type: WidthType.PERCENTAGE } }))
        break
      }
      case 'horizontalRule': {
        result.push(new Paragraph({
          border: { bottom: { style: BorderStyle.SINGLE, size: 1, color: '999999' } },
          children: [],
        }))
        break
      }
      case 'codeBlock': {
        const codeText = node.content?.map((n: any) => n.text || '').join('\n') || ''
        result.push(new Paragraph({
          children: [new TextRun({ text: codeText, font: 'Courier New', size: 20 })],
        }))
        break
      }
      default: {
        if (node.content) {
          result.push(...convertNodesToDocx(node.content, libs))
        }
        break
      }
    }
  }
  return result
}

function convertInlineNodes(nodes: any[], libs: any): any[] {
  const { TextRun } = libs
  const result: any[] = []

  for (const node of nodes) {
    switch (node.type) {
      case 'text': {
        const marks = node.marks || []
        const opts: any = { text: node.text || '' }
        for (const mark of marks) {
          switch (mark.type) {
            case 'bold': opts.bold = true; break
            case 'italic': opts.italics = true; break
            case 'underline': opts.underline = {}; break
            case 'strike': opts.strike = true; break
            case 'code': opts.font = 'Courier New'; opts.size = 20; break
            case 'textStyle': if (mark.attrs?.color) opts.color = mark.attrs.color; break
          }
        }
        result.push(new TextRun(opts))
        break
      }
      case 'hardBreak':
        result.push(new TextRun({ text: '\n' }))
        break
      default:
        if (node.content) result.push(...convertInlineNodes(node.content, libs))
        break
    }
  }
  return result
}

function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}