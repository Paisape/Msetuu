import crypto from 'crypto'
import { getSettingOrEnv } from '@/libs/appSettings'

export interface ContaboConfig {
  endpoint: string
  bucket: string
  accessKey: string
  secretKey: string
  region: string
}

export async function getContaboConfig(): Promise<ContaboConfig | null> {
  const endpoint =
    (await getSettingOrEnv('STORAGE', 'CONTABO_S3_ENDPOINT', 'CONTABO_S3_ENDPOINT')) ||
    'https://usc1.contabostorage.com'
  const bucket =
    (await getSettingOrEnv('STORAGE', 'CONTABO_S3_BUCKET', 'CONTABO_S3_BUCKET')) || 'paisape'
  const accessKey =
    (await getSettingOrEnv('STORAGE', 'CONTABO_S3_ACCESS_KEY', 'CONTABO_S3_ACCESS_KEY')) ||
    process.env.CONTABO_S3_ACCESS_KEY ||
    ''
  const secretKey =
    (await getSettingOrEnv('STORAGE', 'CONTABO_S3_SECRET_KEY', 'CONTABO_S3_SECRET_KEY')) ||
    process.env.CONTABO_S3_SECRET_KEY ||
    ''
  const region =
    (await getSettingOrEnv('STORAGE', 'CONTABO_S3_REGION', 'CONTABO_S3_REGION')) || 'usc1'

  if (!accessKey || !secretKey) {
    return null
  }

  return {
    endpoint: endpoint.replace(/\/+$/, ''),
    bucket,
    accessKey,
    secretKey,
    region
  }
}

function hmac(key: Buffer | string, string: string): Buffer {
  return crypto.createHmac('sha256', key).update(string).digest()
}

function hash(string: string | Buffer): string {
  return crypto.createHash('sha256').update(string).digest('hex')
}

function getSignatureKey(key: string, dateStamp: string, regionName: string, serviceName: string): Buffer {
  const kDate = hmac('AWS4' + key, dateStamp)
  const kRegion = hmac(kDate, regionName)
  const kService = hmac(kRegion, serviceName)
  const kSigning = hmac(kService, 'aws4_request')
  return kSigning
}

/**
 * Upload a file buffer directly to Contabo Object Storage (S3-compatible API)
 */
export async function uploadToContabo(
  fileBuffer: Buffer,
  destinationPath: string,
  contentType: string = 'video/mp4'
): Promise<{ success: boolean; url: string; error?: string }> {
  try {
    const config = await getContaboConfig()
    if (!config) {
      return {
        success: false,
        url: '',
        error: 'Contabo S3 credentials (CONTABO_S3_ACCESS_KEY & CONTABO_S3_SECRET_KEY) are not configured.'
      }
    }

    const cleanDestPath = destinationPath.replace(/^\/+/, '')
    const endpointUrl = new URL(config.endpoint)
    const host = endpointUrl.host

    // Path-style S3 URL: https://usc1.contabostorage.com/paisape/videos/...
    const canonicalUri = `/${config.bucket}/${cleanDestPath}`
    const payloadHash = hash(fileBuffer)

    const now = new Date()
    const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '') // e.g. 20261123T103000Z
    const dateStamp = amzDate.slice(0, 8) // e.g. 20261123

    const service = 's3'
    const algorithm = 'AWS4-HMAC-SHA256'
    const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`

    // Canonical Headers (must be lowercase and sorted alphabetically)
    const canonicalHeaders =
      `content-type:${contentType}\n` +
      `host:${host}\n` +
      `x-amz-content-sha256:${payloadHash}\n` +
      `x-amz-date:${amzDate}\n`
    const signedHeaders = 'content-type;host;x-amz-content-sha256;x-amz-date'

    const canonicalRequest =
      `PUT\n` +
      `${canonicalUri}\n` +
      `\n` +
      `${canonicalHeaders}\n` +
      `${signedHeaders}\n` +
      `${payloadHash}`

    const stringToSign =
      `${algorithm}\n` +
      `${amzDate}\n` +
      `${credentialScope}\n` +
      `${hash(canonicalRequest)}`

    const signingKey = getSignatureKey(config.secretKey, dateStamp, config.region, service)
    const signature = crypto.createHmac('sha256', signingKey).update(stringToSign).digest('hex')

    const authorizationHeader =
      `${algorithm} ` +
      `Credential=${config.accessKey}/${credentialScope}, ` +
      `SignedHeaders=${signedHeaders}, ` +
      `Signature=${signature}`

    const targetUrl = `${config.endpoint}${canonicalUri}`

    const res = await fetch(targetUrl, {
      method: 'PUT',
      headers: {
        Host: host,
        'Content-Type': contentType,
        'x-amz-date': amzDate,
        'x-amz-content-sha256': payloadHash,
        Authorization: authorizationHeader
      },
      body: new Uint8Array(fileBuffer)
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`[Contabo S3] Upload failed HTTP ${res.status}:`, errText)
      return {
        success: false,
        url: targetUrl,
        error: `Contabo S3 error HTTP ${res.status}: ${errText.slice(0, 200) || res.statusText}`
      }
    }

    return {
      success: true,
      url: targetUrl
    }
  } catch (err: any) {
    console.error('[Contabo S3] Exception during upload:', err)
    return {
      success: false,
      url: '',
      error: err.message || 'Failed to upload to Contabo.'
    }
  }
}
