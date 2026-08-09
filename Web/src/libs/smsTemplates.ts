/**
 * DLT SMS Template Master
 * TypeScript helper for retrieving and compiling DLT compliant SMS templates.
 * Project: Paisape / MandirSetu
 */

export const DEFAULT_OTP_TEMPLATE_ID = '1177178593496518428'
export const DEFAULT_OTP_TEMPLATE_CONTENT =
  'Welcome to Paisape. Use OTP {#num#} to verify your Paisape account. This OTP is valid for 10 minutes. Do not share this OTP with anyone. - Paisape -Paisape'

export interface DltTemplate {
  template_id: string
  name: string
  content: string
  variables?: string[]
}

export const DLT_TEMPLATES: Record<string, DltTemplate> = {
  [DEFAULT_OTP_TEMPLATE_ID]: {
    template_id: DEFAULT_OTP_TEMPLATE_ID,
    name: 'Paisape OTP Verification',
    content: DEFAULT_OTP_TEMPLATE_CONTENT,
    variables: ['{#num#}']
  }
}

/**
 * Renders the OTP SMS content replacing {#num#} placeholder
 * 
 * @param otp The numeric or string OTP
 * @param customContent Optional custom template text override
 */
export function renderOtpSms(otp: string | number, customContent?: string): string {
  const content = customContent || DEFAULT_OTP_TEMPLATE_CONTENT
  return content.replace(/\{#num#\}/g, String(otp))
}

/**
 * Replace custom template variables in template content
 * e.g. renderTemplateVars("Hello {#name#}, your order {#orderId#} is confirmed", { name: "Ramesh", orderId: "1001" })
 */
export function renderTemplateVars(templateContent: string, vars: Record<string, string>): string {
  let result = templateContent
  for (const [key, value] of Object.entries(vars)) {
    const placeholder = key.startsWith('{') ? key : `{#${key}#}`
    result = result.replaceAll(placeholder, value)
  }
  return result
}
