import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { parseUploadedWorkbook, cellToString, cellToNumber, cellToBoolean } from '@/libs/bulkImport'
import { PRODUCT_IMPORT_COLUMNS } from '@/libs/bulkImportColumns'

const MAX_TEXT_LEN = 2000

// POST /api/ecommerce/products/import — admin uploads a filled-in copy of the sample Excel
// (multipart/form-data, field "file"). Every row is validated independently — a bad row is
// reported and skipped rather than aborting the whole batch.
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = await parseUploadedWorkbook(buffer, PRODUCT_IMPORT_COLUMNS)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the uploaded file.' }, { status: 400 })
    }

    let created = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2
      const row = rows[i]

      const name = cellToString(row.name).slice(0, MAX_TEXT_LEN)
      const category = cellToString(row.category).slice(0, MAX_TEXT_LEN)
      const description = cellToString(row.description).slice(0, MAX_TEXT_LEN)
      const image = cellToString(row.image).slice(0, MAX_TEXT_LEN)
      const price = cellToNumber(row.price)
      const offerPrice = cellToNumber(row.offerPrice)
      const gstPercentage = cellToNumber(row.gstPercentage)
      const gstInclusive = cellToBoolean(row.gstInclusive, true)
      const planet = cellToString(row.planet).slice(0, MAX_TEXT_LEN) || null
      const purpose = cellToString(row.purpose).slice(0, MAX_TEXT_LEN) || null
      const isBestSeller = cellToBoolean(row.isBestSeller, false)

      if (!name || !category || !description || !image) {
        errors.push({ row: rowNumber, error: 'Name, Category, Description and Image URL are required.' })
        continue
      }

      if (price === null || price <= 0) {
        errors.push({ row: rowNumber, error: 'Sale Price must be a positive number.' })
        continue
      }

      try {
        await prisma.product.create({
          data: {
            name,
            category,
            description,
            image,
            price,
            offerPrice: offerPrice && offerPrice > 0 ? offerPrice : null,
            gstPercentage: gstPercentage ?? 0,
            gstInclusive,
            planet,
            purpose,
            isBestSeller
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
