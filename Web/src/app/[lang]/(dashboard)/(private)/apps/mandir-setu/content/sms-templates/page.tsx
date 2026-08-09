import SmsTemplatesClient from './SmsTemplatesClient'

export const metadata = {
  title: 'SMS Templates Management - Mandirsetuu Admin',
  description: 'Manage DLT SMS Templates and Textzi Gateway integration settings.'
}

export default function SmsTemplatesPage() {
  return <SmsTemplatesClient />
}
