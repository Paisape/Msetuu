import { existsSync, readFileSync } from 'node:fs'
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { NextResponse } from 'next/server'
import AdmZip from 'adm-zip'
import sharp from 'sharp'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

// POST /api/vr/upload-tour — Uploads/Replaces and unzips a 3DVista/TDV 3D Tour ZIP package + Auto-generates thumbnail
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const targetId = formData.get('targetId') as string | null
    const rawTitle = formData.get('title') as string | null
    const rawSlug = formData.get('slug') as string | null
    const description = formData.get('description') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No 3D tour zip file provided.' }, { status: 400 })
    }

    const fileName = file.name.toLowerCase()
    if (!fileName.endsWith('.zip')) {
      return NextResponse.json({ error: 'Please upload a valid .zip file.' }, { status: 400 })
    }

    // Convert file to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const zipBuffer = Buffer.from(arrayBuffer)

    // Load zip using AdmZip
    const zip = new AdmZip(zipBuffer)
    const zipEntries = zip.getEntries()

    if (!zipEntries || zipEntries.length === 0) {
      return NextResponse.json({ error: 'The zip file is empty.' }, { status: 400 })
    }

    // Check if replacing an existing tour
    let existingItem = null
    if (targetId) {
      existingItem = await prisma.vrMedia.findUnique({ where: { id: targetId } })
    } else if (rawSlug) {
      existingItem = await prisma.vrMedia.findUnique({ where: { slug: rawSlug } })
    }

    let finalSlug = ''

    if (existingItem) {
      finalSlug = existingItem.slug
    } else {
      // Generate clean new unique slug
      const baseSlugName = (rawSlug || rawTitle || file.name.replace(/\.zip$/i, ''))
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') || `tour-${Date.now()}`

      finalSlug = baseSlugName
      let count = 1
      while (await prisma.vrMedia.findUnique({ where: { slug: finalSlug } })) {
        finalSlug = `${baseSlugName}-${count++}`
      }
    }

    // Destination directory: public/uploads/tours/[slug]
    const destDir = path.join(process.cwd(), 'public', 'uploads', 'tours', finalSlug)

    // Clean old files in folder if replacing
    if (existingItem && existsSync(destDir)) {
      try {
        await rm(destDir, { recursive: true, force: true })
      } catch (err) {
        console.warn('Could not clean previous tour dir:', err)
      }
    }

    await mkdir(destDir, { recursive: true })

    // Extract all files
    zip.extractAllTo(destDir, true)

    // Detect root entry file (index.htm or index.html)
    let entryFile = 'index.htm'
    if (existsSync(path.join(destDir, 'index.htm'))) {
      entryFile = 'index.htm'
    } else if (existsSync(path.join(destDir, 'index.html'))) {
      entryFile = 'index.html'
    } else {
      // Look for any .htm/.html in subdirectories if zipped inside a root folder
      const foundHtml = zipEntries.find(e => !e.isDirectory && (e.entryName.endsWith('.htm') || e.entryName.endsWith('.html')))
      if (foundHtml) {
        entryFile = foundHtml.entryName
      }
    }

    // Detect or extract title from HTML if not provided
    let extractedTitle = rawTitle?.trim() || existingItem?.title
    if (!extractedTitle) {
      try {
        const htmlPath = path.join(destDir, entryFile)
        if (existsSync(htmlPath)) {
          const htmlContent = readFileSync(htmlPath, 'utf8')
          const titleMatch = /<title[^>]*>([^<]+)<\/title>/i.exec(htmlContent)
          if (titleMatch && titleMatch[1]) {
            extractedTitle = titleMatch[1].trim()
          }
        }
      } catch (err) {
        console.warn('Could not parse title from html:', err)
      }
    }

    if (!extractedTitle) {
      extractedTitle = file.name.replace(/\.zip$/i, '').replace(/[-_]+/g, ' ')
    }

    // ---------------------------------------------------------------------------
    // THUMBNAIL DETECTION & AUTOMATIC GENERATION USING SHARP
    // ---------------------------------------------------------------------------
    let detectedThumbPath = ''
    const generatedThumbFilename = 'generated_thumb.webp'
    const generatedThumbFullPath = path.join(destDir, generatedThumbFilename)

    // 1. Check for standard thumbnail in zip entries
    const rootThumbEntry = zipEntries.find(e => 
      !e.isDirectory && [
        'thumbnail.png',
        'thumbnail.jpg',
        'thumbnail.webp',
        'misc/icon512.png',
        'misc/icon192.png'
      ].includes(e.entryName.toLowerCase())
    )

    if (rootThumbEntry) {
      detectedThumbPath = `/uploads/tours/${finalSlug}/${rootThumbEntry.entryName}`
    } else {
      // 2. Look for best candidate image in zip entries
      const imageEntries = zipEntries.filter(e => 
        !e.isDirectory && 
        ['.jpg', '.jpeg', '.webp', '.png'].includes(path.extname(e.name).toLowerCase()) &&
        !e.entryName.includes('skin/') &&
        !e.entryName.includes('lib/') &&
        !e.entryName.includes('cursor')
      )

      let bestEntry = imageEntries.find(e => e.entryName.toLowerCase().includes('_hd_t.jpg'))
      if (!bestEntry) {
        bestEntry = imageEntries.find(e => e.entryName.toLowerCase().includes('_t.webp') || e.entryName.toLowerCase().includes('_t.jpg'))
      }
      if (!bestEntry) {
        bestEntry = imageEntries.find(e => e.entryName.includes('/f/') && e.entryName.endsWith('.webp'))
      }
      if (!bestEntry && imageEntries.length > 0) {
        imageEntries.sort((a, b) => b.header.size - a.header.size)
        bestEntry = imageEntries[0]
      }

      if (bestEntry) {
        const sourceImagePath = path.join(destDir, bestEntry.entryName)
        if (existsSync(sourceImagePath)) {
          try {
            await sharp(sourceImagePath)
              .resize(800, 480, { fit: 'cover', position: 'center' })
              .webp({ quality: 85 })
              .toFile(generatedThumbFullPath)

            detectedThumbPath = `/uploads/tours/${finalSlug}/${generatedThumbFilename}`
          } catch (err) {
            console.warn('[upload-tour] Sharp thumbnail generation failed, using direct source:', err)
            detectedThumbPath = `/uploads/tours/${finalSlug}/${bestEntry.entryName}`
          }
        }
      }
    }

    const mediaUrl = `/uploads/tours/${finalSlug}/${entryFile}`

    let vrItem
    if (existingItem) {
      // Overwrite / Update existing record
      vrItem = await prisma.vrMedia.update({
        where: { id: existingItem.id },
        data: {
          title: extractedTitle,
          description: description !== null ? description : existingItem.description,
          mediaUrl: mediaUrl,
          thumbnailUrl: detectedThumbPath || existingItem.thumbnailUrl,
          mediaType: 'VR_360_IMAGE',
          updatedAt: new Date()
        }
      })
    } else {
      // Create new VrMedia record
      vrItem = await prisma.vrMedia.create({
        data: {
          slug: finalSlug,
          title: extractedTitle,
          description: description || 'Interactive 3D Virtual Temple Tour with 360° panoramic sanctum views and sacred chants.',
          mediaType: 'VR_360_IMAGE',
          mediaUrl: mediaUrl,
          thumbnailUrl: detectedThumbPath || null,
          active: true,
          viewsCount: 0
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: existingItem
        ? `3D Virtual Tour "${vrItem.title}" replaced and updated successfully with generated thumbnail!`
        : `3D Virtual Tour "${vrItem.title}" extracted, thumbnail generated, and hosted successfully!`,
      item: vrItem,
      experienceUrl: `/front-pages/vr/${vrItem.slug}`,
      directTourUrl: mediaUrl,
      thumbnailUrl: vrItem.thumbnailUrl,
      isReplacement: !!existingItem
    })
  } catch (err) {
    return handleApiError(err)
  }
}
