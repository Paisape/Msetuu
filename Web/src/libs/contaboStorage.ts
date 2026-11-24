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

const encodeKey = (key: string) => key.split('/').map(encodeURIComponent).join('/')

function amzNow() {
  const amzDate = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '')
  return { amzDate, dateStamp: amzDate.slice(0, 8) }
}

export function objectUrl(config: ContaboConfig, key: string): string {
  return `${config.endpoint}/${config.bucket}/${encodeKey(key)}`
}

/** Returns the object key if the URL points at our own bucket, otherwise null (e.g. Google Drive links). */
export function keyFromObjectUrl(config: ContaboConfig, url: string | null | undefined): string | null {
  const prefix = `${config.endpoint}/${config.bucket}/`
  if (!url || !url.startsWith(prefix)) return null
  try {
    return decodeURIComponent(url.slice(prefix.length).split('?')[0])
  } catch {
    return null
  }
}

/** Presigned GET URL (query-string SigV4) so customers can stream a private object directly from storage. */
export function presignGet(config: ContaboConfig, key: string, expiresSec: number, downloadName?: string) {
  const host = new URL(config.endpoint).host
  const canonicalUri = `/${config.bucket}/${encodeKey(key)}`
  const { amzDate, dateStamp } = amzNow()
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`
  const signedHeaders = 'host'

  const query: Record<string, string> = {
    'X-Amz-Algorithm': 'AWS4-HMAC-SHA256',
    'X-Amz-Credential': `${config.accessKey}/${scope}`,
    'X-Amz-Date': amzDate,
    'X-Amz-Expires': String(expiresSec),
    'X-Amz-SignedHeaders': signedHeaders
  }
  if (downloadName) query['response-content-disposition'] = `attachment; filename="${downloadName}"`

  const canonicalQuery = Object.keys(query)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join('&')

  const canonicalHeaders = `host:${host}\n`
  const canonicalRequest = `GET\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\n${signedHeaders}\nUNSIGNED-PAYLOAD`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`
  const signature = crypto
    .createHmac('sha256', getSignatureKey(config.secretKey, dateStamp, config.region, 's3'))
    .update(stringToSign)
    .digest('hex')

  return `${config.endpoint}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`
}

/**
 * Turns a stored videoUrl into a time-limited viewing link. Non-Contabo URLs (old Google Drive
 * links) and old public Contabo objects are returned/handled safely: Drive links pass through
 * untouched, and a signed URL also works for objects that were uploaded public-read.
 */
export async function signVideoUrl(url: string | null | undefined): Promise<string | null | undefined> {
  if (!url) return url
  const config = await getContaboConfig()
  const key = config && keyFromObjectUrl(config, url)
  if (!config || !key) return url
  return presignGet(config, key, 6 * 60 * 60)
}

async function signedRequest(
  config: ContaboConfig,
  method: 'HEAD' | 'GET' | 'DELETE',
  key: string,
  extraHeaders: Record<string, string> = {},
  query: Record<string, string> = {}
) {
  const host = new URL(config.endpoint).host
  // S3 SigV4: For bucket-level operations (like ListObjects), canonical URI must be "/<bucket>" or "/<bucket>/"
  const canonicalUri = key ? `/${config.bucket}/${encodeKey(key)}` : `/${config.bucket}`
  const { amzDate, dateStamp } = amzNow()
  const scope = `${dateStamp}/${config.region}/s3/aws4_request`
  const payloadHash = hash('')
  const canonicalQuery = Object.keys(query)
    .sort()
    .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
    .join('&')

  const signed: Record<string, string> = { host, 'x-amz-content-sha256': payloadHash, 'x-amz-date': amzDate }
  const names = Object.keys(signed).sort()
  const canonicalHeaders = names.map(n => `${n}:${signed[n]}\n`).join('')
  const signedHeaders = names.join(';')

  const canonicalRequest = `${method}\n${canonicalUri}\n${canonicalQuery}\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`
  const stringToSign = `AWS4-HMAC-SHA256\n${amzDate}\n${scope}\n${hash(canonicalRequest)}`
  const signature = crypto
    .createHmac('sha256', getSignatureKey(config.secretKey, dateStamp, config.region, 's3'))
    .update(stringToSign)
    .digest('hex')

  const url = `${config.endpoint}${canonicalUri}${canonicalQuery ? `?${canonicalQuery}` : ''}`

  return fetch(url, {
    method,
    headers: {
      ...extraHeaders,
      'x-amz-date': amzDate,
      'x-amz-content-sha256': payloadHash,
      Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKey}/${scope}, SignedHeaders=${signedHeaders}, Signature=${signature}`
    }
  })
}

/** Size of the object in bytes, or null if it does not exist. */
export async function headObjectSize(config: ContaboConfig, key: string): Promise<number | null> {
  const res = await signedRequest(config, 'HEAD', key)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Contabo HEAD failed with HTTP ${res.status}`)
  return Number(res.headers.get('content-length') || 0)
}

export async function readObjectStart(config: ContaboConfig, key: string, bytes: number): Promise<Buffer> {
  const res = await signedRequest(config, 'GET', key, { Range: `bytes=0-${bytes - 1}` })
  if (!res.ok) throw new Error(`Contabo GET failed with HTTP ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

export async function deleteObject(config: ContaboConfig, key: string): Promise<void> {
  const res = await signedRequest(config, 'DELETE', key)
  if (!res.ok && res.status !== 404) {
    console.error(`[Contabo S3] Delete failed for ${key}: HTTP ${res.status}`)
  }
}

export type ListedObject = { key: string; size: number; lastModified: string }

/** Lists every object under a prefix (all pages). */
export async function listObjects(config: ContaboConfig, prefix: string): Promise<ListedObject[]> {
  const results: ListedObject[] = []
  let token = ''

  do {
    const query: Record<string, string> = { 'list-type': '2', prefix, 'max-keys': '1000' }
    if (token) query['continuation-token'] = token

    // Bucket-level request: empty key gives /bucket as the path
    let res = await signedRequest(config, 'GET', '', {}, query)

    // Fallback: some S3 implementations require trailing slash "/bucket/"
    if (!res.ok && res.status === 403) {
      const retryRes = await signedRequest(config, 'GET', '/', {}, query)
      if (retryRes.ok) {
        res = retryRes
      }
    }

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`[Contabo S3 listObjects error HTTP ${res.status}]:`, errText)
      throw new Error(`Contabo list failed with HTTP ${res.status}: ${errText.slice(0, 300) || res.statusText}`)
    }

    const xml = await res.text()
    for (const m of xml.matchAll(/<Contents>([\s\S]*?)<\/Contents>/g)) {
      const key = m[1].match(/<Key>([\s\S]*?)<\/Key>/)?.[1]
      const size = Number(m[1].match(/<Size>(\d+)<\/Size>/)?.[1] || 0)
      const lastModified = m[1].match(/<LastModified>([^<]*)<\/LastModified>/)?.[1] || ''
      if (key) results.push({ key: key.replace(/&amp;/g, '&'), size, lastModified })
    }
    token = xml.includes('<IsTruncated>true</IsTruncated>')
      ? xml.match(/<NextContinuationToken>([\s\S]*?)<\/NextContinuationToken>/)?.[1] || ''
      : ''
  } while (token)

  return results
}
