import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { parseUploadedWorkbook, cellToString, cellToNumber, cellToBoolean } from '@/libs/bulkImport'
import { CHADHAVA_IMPORT_COLUMNS } from '@/libs/bulkImportColumns'

const MAX_TEXT_LEN = 2000

// POST /api/chadhava/listings/import — admin uploads a filled-in copy of the sample Excel
// (multipart/form-data, field "file"). Every row is validated independently — a bad row is
// reported and skipped rather than aborting the whole batch, so a typo in row 40 doesn't cost
// the admin the 39 good rows above it.
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = await parseUploadedWorkbook(buffer, CHADHAVA_IMPORT_COLUMNS)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the uploaded file.' }, { status: 400 })
    }

    let created = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2 // account for the header row
      const row = rows[i]

      const title = cellToString(row.title).slice(0, MAX_TEXT_LEN)
      const description = cellToString(row.description).slice(0, MAX_TEXT_LEN)
      const location = cellToString(row.location).slice(0, MAX_TEXT_LEN) || null
      const image = cellToString(row.image).slice(0, MAX_TEXT_LEN)
      const price = cellToNumber(row.price)
      const offerPrice = cellToNumber(row.offerPrice)
      const gstPercentage = cellToNumber(row.gstPercentage)
      const gstInclusive = cellToBoolean(row.gstInclusive, true)

      if (!title || !image) {
        errors.push({ row: rowNumber, error: 'Title and Image URL are required.' })
        continue
      }

      if (price === null || price <= 0) {
        errors.push({ row: rowNumber, error: 'Sale Price must be a positive number.' })
        continue
      }

      try {
        await prisma.chadhavaListing.create({
          data: {
            title,
            description,
            location,
            image,
            price,
            offerPrice: offerPrice && offerPrice > 0 ? offerPrice : null,
            gstPercentage: gstPercentage ?? 0,
            gstInclusive
          }
        })
        created++
      } catch (err) {
        errors.push({ row: rowNumber, error: err instanceof Error ? err.message : 'Failed to save this row.' })
      }
    }

    return NextResponse.json({ created, totalRows: rows.length, errors })
  } catch (err) {
    return handleApiError(err)
  }
}
