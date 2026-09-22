/** Sinh nội dung CSV tối thiểu (RFC 4180, escape dấu phẩy/ngoặc kép/xuống dòng). */
export function buildCsv(headers: string[], rows: (string | number)[][]): string {
  const escape = (value: string | number) => {
    const s = String(value)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }

  return [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
}

/** Kích hoạt tải file CSV phía trình duyệt. */
export function downloadCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const blob = new Blob([buildCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)

  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
