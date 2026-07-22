import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

import type { AboutUsData } from '@/app/api/content/about/route'

export const metadata: Metadata = {
  title: 'About Us | Mandir Setu - Connecting Devotees to the Divine',
  description: 'Learn about Mandir Setu, our mission, verified Vedic priests, authentic temple e-pujas, VR darshans, and certified Jyotish astrology services.'
}

const DEFAULT_DATA: AboutUsData = {
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

async function getAboutData(): Promise<AboutUsData> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const res = await fetch(`${baseUrl}/api/content/about`, { cache: 'no-store' })
    if (res.ok) {
      return await res.json()
    }
  } catch (err) {
    console.error('About Page SSR fetch error:', err)
  }
  return DEFAULT_DATA
}

export default async function AboutUsPage() {
  const content = await getAboutData()

  return (
    <div className='min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950'>
      {/* 🌟 HERO BANNER SECTION */}
      <section className='relative overflow-hidden bg-gradient-to-b from-slate-900 via-amber-950/20 to-slate-950 pt-24 pb-20 border-b border-amber-500/20'>
        <div className='absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.12)_0,transparent_70%)] pointer-events-none' />
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center'>
          <div className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm font-semibold mb-6 shadow-inner'>
            <span className='animate-pulse'>🪔</span> The Bridge of Devotion & Faith
          </div>

          <h1 className='text-4xl sm:text-5xl lg:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-amber-400 to-orange-500 max-w-4xl mx-auto leading-tight tracking-tight mb-6'>
            {content.heroTitle}
          </h1>

          <p className='text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed mb-10 font-normal'>
            {content.heroSubtitle}
          </p>

          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Link
              href='/front-pages/epuja'
              className='px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-105 transition-all duration-300'
            >
              Explore E-Pujas 🪔
            </Link>
            <Link
              href='/front-pages/jyotish'
              className='px-8 py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/40 hover:border-amber-400 transition-all duration-300'
            >
              Consult Astrologers 🔮
            </Link>
          </div>
        </div>
      </section>

      {/* 📊 IMPACT STATS COUNTER GRID */}
      <section className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 relative z-20'>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
          {content.stats.map((stat, idx) => (
            <div
              key={idx}
              className='p-6 rounded-2xl bg-slate-900/90 backdrop-blur-xl border border-amber-500/20 shadow-xl hover:border-amber-500/50 transition-all duration-300 text-center group'
            >
              <div className='text-3xl mb-2 group-hover:scale-110 transition-transform duration-300'>{stat.icon}</div>
              <div className='text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500 mb-1'>
                {stat.value}
              </div>
              <div className='text-xs sm:text-sm font-medium text-slate-400 uppercase tracking-wider'>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 📖 OUR STORY SECTION */}
      <section className='py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          <div className='lg:col-span-6 space-y-6'>
            <div className='inline-block text-amber-400 font-bold text-sm tracking-wider uppercase bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20'>
              About Mandir Setu
            </div>
            <h2 className='text-3xl sm:text-4xl font-bold text-amber-100 leading-tight'>
              {content.storyTitle}
            </h2>
            <p className='text-slate-300 leading-relaxed text-base'>
              {content.storyParagraph1}
            </p>
            <p className='text-slate-300 leading-relaxed text-base'>
              {content.storyParagraph2}
            </p>
            <p className='text-slate-300 leading-relaxed text-base'>
              {content.storyParagraph3}
            </p>
          </div>

          <div className='lg:col-span-6 relative'>
            <div className='relative rounded-3xl overflow-hidden border border-amber-500/30 shadow-2xl group'>
              <img
                src={content.heroImage}
                alt='Sacred Indian Temple Darshan'
                className='w-full h-[450px] object-cover group-hover:scale-105 transition-transform duration-700'
              />
              <div className='absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent' />
              <div className='absolute bottom-6 left-6 right-6 p-6 rounded-2xl bg-slate-900/80 backdrop-blur-md border border-amber-500/30'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>🛕</span>
                  <div>
                    <div className='text-amber-300 font-bold text-lg'>Authentic Sacred Shrines</div>
                    <div className='text-slate-400 text-xs'>Direct connection to Kashi, Haridwar, Ayodhya & Tirupati</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 🎯 MISSION & VISION CARDS */}
      <section className='py-16 bg-slate-900/50 border-y border-amber-500/10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            {/* Mission Card */}
            <div className='p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-amber-950/30 border border-amber-500/20 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all'>
              <div className='text-4xl mb-4'>🎯</div>
              <h3 className='text-2xl font-bold text-amber-200 mb-3'>{content.missionTitle}</h3>
              <p className='text-slate-300 leading-relaxed'>{content.missionDescription}</p>
            </div>

            {/* Vision Card */}
            <div className='p-8 rounded-3xl bg-gradient-to-br from-slate-900 to-orange-950/30 border border-orange-500/20 shadow-xl relative overflow-hidden group hover:border-orange-500/40 transition-all'>
              <div className='text-4xl mb-4'>👁️</div>
              <h3 className='text-2xl font-bold text-orange-200 mb-3'>{content.visionTitle}</h3>
              <p className='text-slate-300 leading-relaxed'>{content.visionDescription}</p>
            </div>
          </div>
        </div>
      </section>

      {/* 🪷 CORE PILLARS OF MANDIR SETU */}
      <section className='py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='text-center max-w-3xl mx-auto mb-14'>
          <h2 className='text-3xl sm:text-4xl font-bold text-amber-100 mb-4'>
            Our Core Principles & Sacred Pillars
          </h2>
          <p className='text-slate-400 text-base'>
            Built on a foundation of faith, scriptural authenticity, and unyielding devotion.
          </p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {content.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className='p-6 rounded-2xl bg-slate-900/80 border border-amber-500/20 hover:border-amber-500/50 transition-all duration-300 hover:-translate-y-1 shadow-lg'
            >
              <div className='text-4xl mb-4'>{pillar.icon}</div>
              <h3 className='text-lg font-bold text-amber-200 mb-2'>{pillar.title}</h3>
              <p className='text-slate-400 text-sm leading-relaxed'>{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 👥 LEADERSHIP & SPIRITUAL ADVISORY BOARD */}
      <section className='py-20 bg-slate-900/40 border-t border-amber-500/10'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center max-w-3xl mx-auto mb-16'>
            <div className='inline-block text-amber-400 font-bold text-sm tracking-wider uppercase bg-amber-500/10 px-3 py-1 rounded-md border border-amber-500/20 mb-3'>
              Leadership & Advisory
            </div>
            <h2 className='text-3xl sm:text-4xl font-bold text-amber-100 mb-4'>
              Guided by Acharyas & Devoted Leaders
            </h2>
            <p className='text-slate-400 text-base'>
              Our team brings together decades of Vedic scholarship, technology expertise, and spiritual devotion.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {content.team.map((member, idx) => (
              <div
                key={idx}
                className='rounded-3xl bg-slate-900 border border-amber-500/20 overflow-hidden shadow-xl hover:border-amber-500/50 transition-all group'
              >
                <div className='h-64 overflow-hidden relative'>
                  <img
                    src={member.image}
                    alt={member.name}
                    className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                  />
                  <div className='absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent' />
                </div>
                <div className='p-6 space-y-2'>
                  <h3 className='text-xl font-bold text-amber-200'>{member.name}</h3>
                  <div className='text-xs font-semibold text-amber-400 uppercase tracking-wider'>{member.role}</div>
                  <p className='text-slate-400 text-sm pt-2 leading-relaxed'>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 🔮 FINAL CALL TO ACTION */}
      <section className='py-20 bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/40 border-t border-amber-500/20 text-center relative overflow-hidden'>
        <div className='max-w-4xl mx-auto px-4 relative z-10'>
          <span className='text-4xl block mb-4'>🙏</span>
          <h2 className='text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-400 mb-6'>
            Begin Your Sacred Journey with Mandir Setu
          </h2>
          <p className='text-slate-300 text-lg mb-8 max-w-2xl mx-auto'>
            Experience authentic e-pujas, order blessed prasad, or consult with verified Jyotish Acharyas today.
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              href='/front-pages/epuja'
              className='px-8 py-3.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xl shadow-amber-500/20 hover:scale-105 transition-all'
            >
              Book an E-Puja Now
            </Link>
            <Link
              href='/front-pages/contact'
              className='px-8 py-3.5 rounded-xl font-bold bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30 transition-all'
            >
              Contact Our Seva Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
