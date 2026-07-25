import prisma from '@/libs/prisma'

const EARTH_RADIUS_METERS = 6371000

function toRadians(deg: number): number {
  return (deg * Math.PI) / 180
}

/** Great-circle distance between two lat/lng points, in meters. */
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return EARTH_RADIUS_METERS * c
}

/**
 * Finds the closest admin-configured temple to a coordinate, if any lie within that temple's
 * own `radiusMeters` — this is the entirety of "the system detects which mandir you're at":
 * distance matching against a curated list, not a live reverse-geocoding API.
 */
export async function findNearestTemple(lat: number, lng: number) {
  const temples = await prisma.geotagTemple.findMany()

  let nearest: { id: string; name: string; distanceMeters: number } | null = null

  for (const temple of temples) {
    const distance = haversineDistanceMeters(lat, lng, temple.latitude, temple.longitude)

    if (distance <= temple.radiusMeters && (!nearest || distance < nearest.distanceMeters)) {
      nearest = { id: temple.id, name: temple.name, distanceMeters: distance }
    }
  }

  return nearest
}

/** Reads the current site-wide points-per-approved-tag value, creating the settings row with a default if it doesn't exist yet. */
export async function getPointsPerTag(): Promise<number> {
  const settings = await prisma.geotagSettings.upsert({
    where: { id: 'singleton' },
    update: {},
    create: { id: 'singleton' }
  })

  return settings.pointsPerTag
}
