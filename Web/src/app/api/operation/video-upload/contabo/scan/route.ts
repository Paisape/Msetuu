import { NextResponse } from 'next/server'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { getContaboConfig, listObjects } from '@/libs/contaboStorage'
import { ALLOWED_VIDEO_EXTS, normalizeOrderType, resolveVideoOrder } from '@/libs/videoOrders'
import { attachContaboVideo } from '@/libs/videoAttach'

export const maxDuration = 300

// For videos an admin already uploaded to a Contabo folder with an S3 tool: list the folder and
// attach each file to the order named by its filename. No video data passes through this server.
export async function POST(req: Request) {
  try {
    const admin = await requireAdmin()
    const config = await getContaboConfig()

    if (!config) {
      return NextResponse.json({ success: false, error: 'Contabo S3 credentials are not configured.' }, { status: 500 })
    }

    const body = await req.json()
    const orderType = normalizeOrderType(body.orderType)
    const prefix = String(body.folder || '').trim().replace(/^\/+/, '').replace(/\/*$/, '/')

    if (!prefix.startsWith('videos/') || prefix.includes('..')) {
      return NextResponse.json(
        { success: false, error: 'Folder must be inside the videos/ folder, e.g. videos/campaign/inbox/' },
        { status: 400 }
      )
    }

    const objects = (await listObjects(config, prefix)).filter(
      o => ALLOWED_VIDEO_EXTS[(o.key.split('.').pop() || '').toLowerCase()]
    )

    if (objects.length > 300) {
      return NextResponse.json(
        { success: false, error: `Folder has ${objects.length} videos. Please keep a batch under 300.` },
        { status: 400 }
      )
    }

    const items: { file: string; ok: boolean; orderId?: string; customerName?: string; message: string }[] = []

    for (const obj of objects) {
      const file = obj.key.slice(prefix.length)
      const resolved = await resolveVideoOrder(orderType, file.split('/').pop() || file)

      if (!resolved.ok) {
        items.push({ file, ok: false, message: resolved.error })
        continue
      }

      try {
        const result = await attachContaboVideo({
          config,
          admin,
          req,
          orderType,
          resolved: resolved.data,
          key: obj.key
        })

        items.push({
          file,
          ok: result.ok,
          orderId: resolved.data.order.id,
          customerName: resolved.data.customerName,
          message: !result.ok
            ? result.error
            : result.alreadyAttached
              ? 'Already attached'
              : result.isUpdate
                ? 'Replaced (SMS skipped)'
                : 'Attached, devotee notified'
        })
      } catch (err: any) {
        console.error('[Contabo scan] attach failed:', file, err)
        items.push({ file, ok: false, orderId: resolved.data.order.id, message: err.message || 'Failed to attach' })
      }
    }

    return NextResponse.json({ success: true, total: items.length, items })
  } catch (err) {
    return handleApiError(err)
  }
}
