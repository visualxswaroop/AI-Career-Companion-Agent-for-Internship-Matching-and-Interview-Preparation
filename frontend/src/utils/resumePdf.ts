import { jsPDF } from 'jspdf'

/**
 * Cleanly format and export an ATS-optimized resume to a PDF file.
 */
export function exportResumePdf(resumeText: string, candidateName?: string): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margin = 40
  const contentWidth = pageWidth - margin * 2

  let y = margin + 12

  const lines = resumeText.split('\n')
  let isFirstLine = true
  let extractedName = candidateName || ''

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i].trimEnd()
    if (!rawLine.trim()) {
      y += 6
      continue
    }

    if (rawLine.startsWith('TEMPLATE:')) {
      continue
    }

    const trimmed = rawLine.trim()

    // Header check
    const isSectionHeader =
      /^[A-Z][A-Za-z\s&/]{2,35}$/.test(trimmed) &&
      !trimmed.includes('@') &&
      !trimmed.includes('Phone') &&
      !trimmed.includes('Email') &&
      !trimmed.startsWith('-') &&
      !trimmed.startsWith('•') &&
      !trimmed.startsWith('*') &&
      i > 0

    // Check page overflow
    if (y > pageHeight - margin - 20) {
      doc.addPage()
      y = margin + 12
    }

    // First line is candidate name
    if (isFirstLine) {
      isFirstLine = false
      if (!extractedName && trimmed.length < 50) {
        extractedName = trimmed
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.setTextColor(20, 24, 33)
      doc.text(trimmed, margin, y)
      y += 20
      continue
    }

    if (isSectionHeader) {
      y += 8
      if (y > pageHeight - margin - 35) {
        doc.addPage()
        y = margin + 12
      }
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11.5)
      doc.setTextColor(30, 41, 59)
      doc.text(trimmed.toUpperCase(), margin, y)
      y += 4
      doc.setDrawColor(203, 213, 225)
      doc.setLineWidth(1)
      doc.line(margin, y, margin + contentWidth, y)
      y += 14
    } else {
      const isBullet =
        trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')
      const textToWrap = isBullet
        ? '•  ' + trimmed.replace(/^[-•*]\s*/, '').trim()
        : trimmed

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9.5)
      doc.setTextColor(51, 65, 85)

      const indent = isBullet ? 12 : 0
      const wrapWidth = contentWidth - indent
      const splitLines = doc.splitTextToSize(textToWrap, wrapWidth)

      for (const line of splitLines) {
        if (y > pageHeight - margin - 10) {
          doc.addPage()
          y = margin + 12
        }
        doc.text(line, margin + indent, y)
        y += 13.5
      }
    }
  }

  const safeFilename =
    (extractedName || 'Resume').replace(/[^a-zA-Z0-9_\- ]/g, '').trim() || 'Resume'
  doc.save(`${safeFilename}_ATS.pdf`)
}
