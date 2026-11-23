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

function executeS3Put(
  config: ContaboConfig,
  fileBuffer: Buffer,
  cleanDestPath: string,
  contentType: string,
  includeAcl: boolean
) {
  const endpointUrl = new URL(config.endpoint)
  const host = endpointUrl.host
  const canonicalUri = `/${config.bucket}/${cleanDestPath}`
  const payloadHash = hash(fileBuffer)

  const now = new Date()
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '')
  const dateStamp = amzDate.slice(0, 8)

  const service = 's3'
  const algorithm = 'AWS4-HMAC-SHA256'
  const credentialScope = `${dateStamp}/${config.region}/${service}/aws4_request`

  let canonicalHeaders =
    `content-type:${contentType}\n` +
    `host:${host}\n`
  let signedHeaders = 'content-type;host;'

  if (includeAcl) {
    canonicalHeaders += `x-amz-acl:public-read\n`
    signedHeaders += 'x-amz-acl;'
  }

  canonicalHeaders +=
    `x-amz-content-sha256:${payloadHash}\n` +
    `x-amz-date:${amzDate}\n`
  signedHeaders += 'x-amz-content-sha256;x-amz-date'

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

  const headers: Record<string, string> = {
    Host: host,
    'Content-Type': contentType,
    'x-amz-date': amzDate,
    'x-amz-content-sha256': payloadHash,
    Authorization: authorizationHeader
  }
  if (includeAcl) {
    headers['x-amz-acl'] = 'public-read'
  }

  return { targetUrl, headers }
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

    // 1. Try upload with x-amz-acl: public-read (makes video streamable for devotees)
    let { targetUrl, headers } = executeS3Put(config, fileBuffer, cleanDestPath, contentType, true)
    let res = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: new Uint8Array(fileBuffer)
    })

    // 2. If bucket policy rejects ACL header (AccessControlListNotSupported), fallback without ACL
    if (!res.ok && (res.status === 400 || res.status === 403)) {
      const errPeek = await res.clone().text().catch(() => '')
      if (errPeek.includes('AccessControlList') || errPeek.includes('InvalidArgument') || errPeek.includes('ACL')) {
        const fallback = executeS3Put(config, fileBuffer, cleanDestPath, contentType, false)
        targetUrl = fallback.targetUrl
        res = await fetch(targetUrl, {
          method: 'PUT',
          headers: fallback.headers,
          body: new Uint8Array(fileBuffer)
        })
      }
    }

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
