import { NextResponse } from 'next/server'

import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { parseUploadedWorkbook, cellToString, cellToNumber } from '@/libs/bulkImport'
import { EPUJA_IMPORT_COLUMNS } from '@/libs/bulkImportColumns'

const MAX_TEXT_LEN = 4000

// POST /api/epuja/listings/import — admin uploads a filled-in copy of the sample Excel
// (multipart/form-data, field "file"). Every row is validated independently — a bad row is
// reported and skipped rather than aborting the whole batch. Package prices are optional; a
// row with any of the three package-price columns filled in gets those packages created
// alongside the listing (same shape as the "Manage Packages" admin dialog produces).
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const rows = await parseUploadedWorkbook(buffer, EPUJA_IMPORT_COLUMNS)

    if (rows.length === 0) {
      return NextResponse.json({ error: 'No data rows found in the uploaded file.' }, { status: 400 })
    }

    let created = 0
    const errors: { row: number; error: string }[] = []

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2
      const row = rows[i]

      const title = cellToString(row.title).slice(0, MAX_TEXT_LEN)
      const category = cellToString(row.category).slice(0, MAX_TEXT_LEN)
      const description = cellToString(row.description).slice(0, MAX_TEXT_LEN)
      const image = cellToString(row.image).slice(0, MAX_TEXT_LEN)
      const price = cellToNumber(row.price)
      const templeName = cellToString(row.templeName).slice(0, MAX_TEXT_LEN) || null
      const templeLocation = cellToString(row.templeLocation).slice(0, MAX_TEXT_LEN) || null
      const significance = cellToString(row.significance).slice(0, MAX_TEXT_LEN) || null

      const benefitsRaw = cellToString(row.benefits)

      const benefits = benefitsRaw
        ? benefitsRaw.split(';').map(b => b.trim()).filter(Boolean).join('\n')
        : null

      const singlePrice = cellToNumber(row.packageSinglePrice)
      const couplePrice = cellToNumber(row.packageCouplePrice)
      const familyPrice = cellToNumber(row.packageFamilyPrice)

      if (!title || !category || !description || !image) {
        errors.push({ row: rowNumber, error: 'Title, Category, Description and Image URL are required.' })
        continue
      }

      if (price === null || price <= 0) {
        errors.push({ row: rowNumber, error: 'Base Price must be a positive number.' })
        continue
      }

      const packages: { type: string; price: number }[] = []

      if (singlePrice && singlePrice > 0) packages.push({ type: 'Single', price: singlePrice })
      if (couplePrice && couplePrice > 0) packages.push({ type: 'Couple', price: couplePrice })
      if (familyPrice && familyPrice > 0) packages.push({ type: 'Family', price: familyPrice })

      try {
        await prisma.pujaListing.create({
          data: {
            title,
            category,
            description,
            image,
            price,
            templeName,
            templeLocation,
            significance,
            benefits,
            packages: { create: packages }
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
