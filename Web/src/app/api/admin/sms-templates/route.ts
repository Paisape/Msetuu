import { NextResponse } from 'next/server'
import prisma from '@/libs/prisma'
import { requireAdmin, handleApiError } from '@/libs/api-auth'
import { DEFAULT_OTP_TEMPLATE_ID, DEFAULT_OTP_TEMPLATE_CONTENT } from '@/libs/smsTemplates'
import { sendTextziSms, sendOtpSms } from '@/libs/sms'

// GET /api/admin/sms-templates — list all DLT SMS templates
export async function GET() {
  try {
    await requireAdmin()

    let templates = await prisma.smsTemplate.findMany({
      orderBy: { createdAt: 'desc' }
    })

    // If database has no templates yet, auto-seed the default Paisape DLT template
    if (templates.length === 0) {
      const defaultTpl = await prisma.smsTemplate.create({
        data: {
          name: 'Paisape OTP Verification',
          templateId: DEFAULT_OTP_TEMPLATE_ID,
          content: DEFAULT_OTP_TEMPLATE_CONTENT,
          isDefault: true,
          active: true
        }
      })
      templates = [defaultTpl]
    }

    return NextResponse.json({ success: true, templates })
  } catch (err) {
    return handleApiError(err)
  }
}

// POST /api/admin/sms-templates — create or update DLT SMS template or test send
export async function POST(req: Request) {
  try {
    await requireAdmin()
    const body = await req.json()

    // Handle Test SMS sending
    if (body.action === 'TEST_SEND') {
      const { mobile, templateId, message, otp } = body

      if (!mobile) {
        return NextResponse.json({ error: 'Mobile number is required for test send.' }, { status: 400 })
      }

      let result
      if (otp) {
        result = await sendOtpSms(mobile, otp, templateId)
      } else {
        result = await sendTextziSms(mobile, message || DEFAULT_OTP_TEMPLATE_CONTENT, templateId)
      }

      return NextResponse.json(result)
    }

    const { id, name, templateId, content, senderId, active, isDefault } = body

    if (!name || !templateId || !content) {
      return NextResponse.json(
        { error: 'Template Name, DLT Template ID, and Template Content are required.' },
        { status: 400 }
      )
    }

    // If setting as default, clear default flag on other templates
    if (isDefault) {
      await prisma.smsTemplate.updateMany({
        where: { id: { not: id || '' } },
        data: { isDefault: false }
      })
    }

    let template
    if (id) {
      template = await prisma.smsTemplate.update({
        where: { id },
        data: {
          name,
          templateId,
          content,
          senderId: senderId || null,
          active: active !== undefined ? active : true,
          isDefault: isDefault !== undefined ? isDefault : false
        }
      })
    } else {
      template = await prisma.smsTemplate.create({
        data: {
          name,
          templateId,
          content,
          senderId: senderId || null,
          active: active !== undefined ? active : true,
          isDefault: isDefault !== undefined ? isDefault : false
        }
      })
    }

    return NextResponse.json({ success: true, template })
  } catch (err) {
    return handleApiError(err)
  }
}

// DELETE /api/admin/sms-templates?id=... — delete a template
export async function DELETE(req: Request) {
  try {
    await requireAdmin()
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Template ID is required.' }, { status: 400 })
    }

    await prisma.smsTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
