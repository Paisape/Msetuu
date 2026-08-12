import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { requireAdmin, handleApiError } from '@/libs/api-auth'

const DATA_FILE = path.join(process.cwd(), 'src', 'data', 'about_us.json')

export interface AboutUsData {
  heroTitle: string
  heroSubtitle: string
  heroImage: string
  storyTitle: string
  storyParagraph1: string
  storyParagraph2: string
  storyParagraph3: string
  missionTitle: string
  missionDescription: string
  visionTitle: string
  visionDescription: string
  stats: { label: string; value: string; icon: string }[]
  pillars: { title: string; description: string; icon: string }[]
  team: { name: string; role: string; bio: string; image: string }[]
  updatedAt?: string
}

const DEFAULT_ABOUT_DATA: AboutUsData = {
  heroTitle: 'Connecting Devotees to the Divine, Anywhere in the World',
  heroSubtitle: 'Mandir Setu bridges sacred Indian temples, ancient Vedic rituals, authentic Jyotish astrology, and modern digital convenience for millions of devotees globally.',
  heroImage: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop',
  storyTitle: 'Our Sacred Journey & Vision',
  storyParagraph1: 'Founded with a profound reverence for Sanatana Dharma, Mandir Setu was created to ensure that distance, geographic location, or busy modern schedules never prevent a devotee from participating in sacred temple pujas, receiving holy prasad, or offering chadhava at India’s most revered shrines.',
  storyParagraph2: 'We collaborate directly with verified temple trusts, hereditary Vedic priests, and certified Jyotish Acharyas across Kashi, Ujjain, Haridwar, Ayodhya, Tirupati, and beyond. Every ritual performed through Mandir Setu follows strict Agama Shastra guidelines, personalized with your name, gotra, and sankalp.',
  storyParagraph3: 'Our technology platform combines high-definition live video streaming, transparent order tracking, authentic prasad delivery, interactive VR 360° temple darshan, and AI-enabled Kundli astrological insights into one unified spiritual ecosystem.',
  missionTitle: 'Our Sacred Mission',
  missionDescription: 'To preserve, honor, and digitize ancient Vedic traditions by providing authentic, transparent, and seamless access to sacred rituals, temple darshans, and certified astrological guidance for devotees around the globe.',
  visionTitle: 'Our Vision',
  visionDescription: 'To become the world’s most trusted digital sanctuary and bridge for spiritual fulfillment, connecting over 10 million devotees to sacred temples and Vedic wisdom by 2030.',
  stats: [
    { label: 'Devotees Served Globally', value: '150,000+', icon: '🙏' },
    { label: 'Verified Temples & Gurus', value: '350+', icon: '🛕' },
    { label: 'Authentic Pujas Conducted', value: '75,000+', icon: '🪔' },
    { label: 'Sacred Prasad Deliveries', value: '60,000+', icon: '📦' }
  ],
  pillars: [
    { title: 'Absolute Vedic Authenticity', description: 'Every puja is performed strictly according to scriptural Agama traditions by verified Vedic Acharyas with personalized Sankalp.', icon: '📜' },
    { title: 'Complete Transparency', description: 'Devotees receive high-definition video recordings, live streaming links, and real-time updates for every booking.', icon: '📽️' },
    { title: 'Global Sacred Access', description: 'No matter where you live in the world, offer chadhava, book e-pujas, and receive blessed prasad at your doorstep.', icon: '🌍' },
    { title: 'Spiritual Compassion & Seva', description: 'A portion of every booking directly supports temple maintenance, cow protection (Gau Seva), and Vedic Veda Pathshalas.', icon: '🪷' }
  ],
  team: [
    {
      name: 'Acharya Pt. Ramesh Shastri',
      role: 'Head of Vedic Rituals & Shastra Advisory',
      bio: 'Over 30 years of experience conducting Vedic Anushthans and Maha Yagnas at Kashi Vishwanath and Haridwar.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=400&auto=format&fit=crop'
    },
    {
      name: 'Dr. Ananya Sharma',
      role: 'Founder & Chief Executive Officer',
      bio: 'Technologist and devoted practitioner committed to leveraging technology to make spiritual experiences accessible to all.',
      image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=400&auto=format&fit=crop'
    },
    {
      name: 'Jyotish Ratna Pt. Alok Kumar',
      role: 'Chief Astrological Consultant',
      bio: 'Gold medalist in Vedic Jyotish & Parashara astrology with over 20,000 personalized Kundli consultations.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400&auto=format&fit=crop'
    }
  ]
}

function getStoredData(): AboutUsData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf8')
      return JSON.parse(content)
    }
  } catch (err) {
    console.error('Failed to read about_us.json:', err)
  }
  return DEFAULT_ABOUT_DATA
}

function saveStoredData(data: AboutUsData) {
  const dir = path.dirname(DATA_FILE)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8')
}

// GET /api/content/about — Return current About Us content
export async function GET() {
  const data = getStoredData()
  return NextResponse.json(data)
}

// POST /api/content/about — Admin updates About Us content
export async function POST(req: Request) {
  try {
    await requireAdmin()

    const body = await req.json()
    const current = getStoredData()

    const updatedData: AboutUsData = {
      ...current,
      ...body,
      updatedAt: new Date().toISOString()
    }

    saveStoredData(updatedData)

    return NextResponse.json({ message: 'About Us content updated successfully.', data: updatedData })
  } catch (err) {
    return handleApiError(err)
  }
}
