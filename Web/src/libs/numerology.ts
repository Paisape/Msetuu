// Numerology is pure arithmetic on a birth date and name — no external API is needed (and no
// reliable free numerology API/service was found during research for this feature; the sources
// the user pointed at either don't offer a numerology endpoint or are unrelated astronomy/ephemeris
// APIs). Computing it locally means zero signup, zero rate limits, and zero uptime risk.

// Reduce a number to a single digit (1-9), preserving Master Numbers 11, 22, 33 along the way —
// standard numerology convention.
function reduceNumber(input: number): number {
  let n = Math.abs(Math.trunc(input))

  while (n > 9 && n !== 11 && n !== 22 && n !== 33) {
    n = String(n)
      .split('')
      .reduce((sum, digit) => sum + Number(digit), 0)
  }

  return n
}

// Life Path Number — derived from the full birth date.
export function getLifePathNumber(dob: Date): number {
  const day = dob.getUTCDate()
  const month = dob.getUTCMonth() + 1
  const year = dob.getUTCFullYear()

  return reduceNumber(reduceNumber(day) + reduceNumber(month) + reduceNumber(year))
}

// Birthday Number — just the day of birth, reduced.
export function getBirthdayNumber(dob: Date): number {
  return reduceNumber(dob.getUTCDate())
}

// Pythagorean letter-to-number mapping used for Destiny/Expression and Soul Urge numbers.
const PYTHAGOREAN_MAP: Record<string, number> = {
  a: 1, j: 1, s: 1,
  b: 2, k: 2, t: 2,
  c: 3, l: 3, u: 3,
  d: 4, m: 4, v: 4,
  e: 5, n: 5, w: 5,
  f: 6, o: 6, x: 6,
  g: 7, p: 7, y: 7,
  h: 8, q: 8, z: 8,
  i: 9, r: 9
}

const VOWELS = new Set(['a', 'e', 'i', 'o', 'u'])

// Helper to split a full name into parts (words) and process them
function getWords(name: string): string[] {
  return name.toLowerCase().split(/\s+/).filter(word => word.length > 0)
}

function wordToLetters(word: string): string[] {
  return word.replace(/[^a-z]/g, '').split('')
}

// Destiny / Expression Number — every letter in the full name.
export function getDestinyNumber(fullName: string): number {
  const words = getWords(fullName)
  
  const wordValues = words.map(word => {
    const letters = wordToLetters(word)
    const sum = letters.reduce((total, ch) => total + (PYTHAGOREAN_MAP[ch] || 0), 0)
    return reduceNumber(sum)
  })
  
  return reduceNumber(wordValues.reduce((a, b) => a + b, 0))
}

// Soul Urge Number — vowels only.
export function getSoulUrgeNumber(fullName: string): number {
  const words = getWords(fullName)
  
  const wordValues = words.map(word => {
    const letters = wordToLetters(word).filter(ch => VOWELS.has(ch))
    const sum = letters.reduce((total, ch) => total + (PYTHAGOREAN_MAP[ch] || 0), 0)
    return reduceNumber(sum)
  })
  
  return reduceNumber(wordValues.reduce((a, b) => a + b, 0))
}

// Personality Number — consonants only.
export function getPersonalityNumber(fullName: string): number {
  const words = getWords(fullName)
  
  const wordValues = words.map(word => {
    const letters = wordToLetters(word).filter(ch => !VOWELS.has(ch))
    const sum = letters.reduce((total, ch) => total + (PYTHAGOREAN_MAP[ch] || 0), 0)
    return reduceNumber(sum)
  })
  
  return reduceNumber(wordValues.reduce((a, b) => a + b, 0))
}

export type NumerologyProfile = {
  lifePathNumber: number
  birthdayNumber: number
  destinyNumber: number
  soulUrgeNumber: number
  personalityNumber: number
}

export function getNumerologyProfile(fullName: string, dob: Date): NumerologyProfile {
  return {
    lifePathNumber: getLifePathNumber(dob),
    birthdayNumber: getBirthdayNumber(dob),
    destinyNumber: getDestinyNumber(fullName),
    soulUrgeNumber: getSoulUrgeNumber(fullName),
    personalityNumber: getPersonalityNumber(fullName)
  }
}
