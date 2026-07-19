import ExcelJS from 'exceljs'

// Shared helpers for the "download a sample Excel, fill it in, upload it back" bulk-listing
// import feature (Chadhava / E-Puja / Ecommerce). Keeping the sheet-building and row-parsing
// logic here means every module's import route follows the exact same conventions (header row
// = column keys, first data row = an example, robust cell coercion) instead of re-implementing
// it three times.

export type ImportColumn = {
  key: string
  label: string
  required?: boolean
  example: string | number | boolean
  helperText?: string
}

const MAX_IMPORT_ROWS = 500 // sanity cap — a single accidental paste of a huge sheet shouldn't hang the request

// Builds a downloadable sample workbook: row 1 = human labels, row 2 = machine keys (hidden
// header the parser reads from), row 3 = one filled example row so the admin can see the
// expected format at a glance.
export async function buildSampleWorkbook(sheetName: string, columns: ImportColumn[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet(sheetName)

  sheet.columns = columns.map(col => ({ header: col.label, key: col.key, width: Math.max(col.label.length + 4, 18) }))

  const headerRow = sheet.getRow(1)

  headerRow.font = { bold: true }
  headerRow.eachCell(cell => {
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD1FAE5' } }
  })

  sheet.addRow(Object.fromEntries(columns.map(col => [col.key, col.example])))

  // A short instructions note in the row right after the example, so it's obvious which row is
  // real data vs guidance — kept in the first column only to avoid clutter.
  const notesRow = sheet.addRow({ [columns[0].key]: '↑ Replace the row above with your own data. Add as many rows as needed below.' })

  notesRow.font = { italic: true, color: { argb: 'FF6B7280' } }

  const buffer = await workbook.xlsx.writeBuffer()

  return Buffer.from(buffer)
}

// Parses an uploaded workbook back into plain row objects keyed by each column's `key` (matched
// against the header row's text, case-insensitively) — so the parser doesn't care about column
// order or extra/reordered columns, only that the expected headers exist somewhere in row 1.
export async function parseUploadedWorkbook(buffer: Buffer, columns: ImportColumn[]): Promise<Record<string, unknown>[]> {
  const workbook = new ExcelJS.Workbook()

  await workbook.xlsx.load(buffer as any)

  const sheet = workbook.worksheets[0]

  if (!sheet) return []

  const headerRow = sheet.getRow(1)
  const columnIndexByKey = new Map<string, number>()

  headerRow.eachCell((cell, colNumber) => {
    const text = String(cell.value ?? '').trim().toLowerCase()
    const match = columns.find(col => col.label.toLowerCase() === text || col.key.toLowerCase() === text)

    if (match) columnIndexByKey.set(match.key, colNumber)
  })

  const rows: Record<string, unknown>[] = []

  const lastRow = Math.min(sheet.rowCount, MAX_IMPORT_ROWS + 1)

  for (let rowNumber = 2; rowNumber <= lastRow; rowNumber++) {
    const row = sheet.getRow(rowNumber)

    if (row.actualCellCount === 0) continue

    const values: Record<string, unknown> = {}
    let hasAnyValue = false

    for (const col of columns) {
      const colIndex = columnIndexByKey.get(col.key)
      const raw = colIndex ? row.getCell(colIndex).value : undefined

      const cellValue = typeof raw === 'object' && raw !== null && 'result' in (raw as any) ? (raw as any).result : raw

      if (cellValue !== null && cellValue !== undefined && cellValue !== '') hasAnyValue = true
      values[col.key] = cellValue
    }

    if (hasAnyValue) rows.push(values)
  }

  return rows
}

export function cellToString(value: unknown): string {
  if (value === null || value === undefined) return ''

  return String(value).trim()
}

export function cellToNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)

  return Number.isFinite(num) ? num : null
}

export function cellToBoolean(value: unknown, defaultValue = false): boolean {
  if (value === null || value === undefined || value === '') return defaultValue
  const text = String(value).trim().toLowerCase()

  return ['true', 'yes', '1', 'y'].includes(text)
}
