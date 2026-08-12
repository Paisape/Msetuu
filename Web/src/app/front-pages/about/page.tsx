import type { Metadata } from 'next'
import Link from 'next/link'

import type { AboutUsData } from '@/app/api/content/about/route'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'About Us | Mandirsetuu - Connecting Devotees to the Divine',
  description: 'Learn about Mandirsetuu, our mission, verified Vedic priests, authentic temple e-pujas, VR darshans, and certified Jyotish astrology services.'
}

const DEFAULT_DATA: AboutUsData = {
  heroTitle: 'Connecting Devotees to the Divine, Anywhere in the World',
  heroSubtitle: 'Mandirsetuu bridges sacred Indian temples, ancient Vedic rituals, authentic Jyotish astrology, and modern digital convenience for millions of devotees globally.',
  heroImage: 'https://images.unsplash.com/photo-1609766857041-ed402ea8069a?q=80&w=1200&auto=format&fit=crop',
  storyTitle: 'Our Sacred Journey & Vision',
  storyParagraph1: 'Founded with a profound reverence for Sanatana Dharma, Mandirsetuu was created to ensure that distance, geographic location, or busy modern schedules never prevent a devotee from participating in sacred temple pujas, receiving holy prasad, or offering chadhava at India’s most revered shrines.',
  storyParagraph2: 'We collaborate directly with verified temple trusts, hereditary Vedic priests, and certified Jyotish Acharyas across Kashi, Ujjain, Haridwar, Ayodhya, Tirupati, and beyond. Every ritual performed through Mandirsetuu follows strict Agama Shastra guidelines, personalized with your name, gotra, and sankalp.',
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

import { getStoredData } from '@/app/api/content/about/route'

async function getAboutData(): Promise<AboutUsData> {
  try {
    return getStoredData()
  } catch (err) {
    console.error('About Page SSR read error:', err)
  }

  return DEFAULT_DATA
}

// Lives under front-pages/ so it automatically inherits the real site chrome (Header, Footer,
// FrontMenu) via front-pages/layout.tsx — it previously sat under the (blank-layout-pages)
// group, which is chrome-free by design for auth/error pages, so About rendered with no
// header/footer at all. Restyled from the old dark-slate/amber palette to the site's actual
// brand (emerald green #006241/#006241, light background) to match every other page.
export default async function AboutUsPage() {
  const content = await getAboutData()

  return (
    <div className='min-h-screen bg-white'>
      {/* Hero */}
      <section className='relative overflow-hidden pt-20 pb-16' style={{ background: 'linear-gradient(180deg,#f0fdf6 0%,#ffffff 100%)' }}>
        <div className='max-w-5xl mx-auto px-6 text-center'>
          <div
            className='inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold mb-6'
            style={{ background: 'rgba(16,185,129,0.1)', color: '#006241', border: '1px solid rgba(16,185,129,0.25)' }}
          >
            <span>🪔</span> The Bridge of Devotion & Faith
          </div>

          <h1 className='text-4xl sm:text-5xl font-bold max-w-3xl mx-auto leading-tight mb-6' style={{ color: '#006241' }}>
            {content.heroTitle}
          </h1>

          <p className='text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10'>
            {content.heroSubtitle}
          </p>

          <div className='flex flex-wrap items-center justify-center gap-4'>
            <Link
              href='/front-pages/epuja'
              className='px-8 py-3.5 rounded-xl font-bold text-white shadow-lg hover:-translate-y-0.5 transition-all duration-300'
              style={{ background: 'linear-gradient(135deg,#006241,#34d399)' }}
            >
              Explore E-Pujas
            </Link>
            <Link
              href='/front-pages/jyotish'
              className='px-8 py-3.5 rounded-xl font-bold transition-all duration-300'
              style={{ color: '#006241', border: '1px solid rgba(16,185,129,0.4)' }}
            >
              Consult Astrologers
            </Link>
          </div>
        </div>
      </section>

      {/* Impact stats */}
      <section className='max-w-6xl mx-auto px-6 -mt-8 relative z-10'>
        <div className='grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6'>
          {content.stats.map((stat, idx) => (
            <div
              key={idx}
              className='p-6 rounded-2xl bg-white text-center shadow-sm hover:shadow-md transition-all duration-300 border border-slate-200/60'
            >
              <div className='text-3xl mb-2'>{stat.icon}</div>
              <div className='text-3xl font-bold mb-1' style={{ color: '#006241' }}>
                {stat.value}
              </div>
              <div className='text-xs sm:text-sm font-medium text-slate-500 uppercase tracking-wider'>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Our story */}
      <section className='py-20 max-w-6xl mx-auto px-6'>
        <div className='grid grid-cols-1 lg:grid-cols-12 gap-12 items-center'>
          <div className='lg:col-span-6 space-y-5'>
            <div
              className='inline-block font-bold text-sm tracking-wider uppercase px-3 py-1 rounded-md'
              style={{ color: '#006241', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              About Mandirsetuu
            </div>
            <h2 className='text-3xl font-bold text-slate-800 leading-tight'>{content.storyTitle}</h2>
            <p className='text-slate-600 leading-relaxed'>{content.storyParagraph1}</p>
            <p className='text-slate-600 leading-relaxed'>{content.storyParagraph2}</p>
            <p className='text-slate-600 leading-relaxed'>{content.storyParagraph3}</p>
          </div>

          <div className='lg:col-span-6 relative'>
            <div className='relative rounded-3xl overflow-hidden shadow-xl border border-slate-200/60'>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={content.heroImage} alt='Sacred Indian Temple Darshan' className='w-full h-[420px] object-cover' />
              <div className='absolute bottom-5 left-5 right-5 p-5 rounded-2xl bg-white/95 backdrop-blur-md shadow-lg'>
                <div className='flex items-center gap-3'>
                  <span className='text-3xl'>🛕</span>
                  <div>
                    <div className='font-bold text-lg' style={{ color: '#006241' }}>Authentic Sacred Shrines</div>
                    <div className='text-slate-500 text-xs'>Direct connection to Kashi, Haridwar, Ayodhya &amp; Tirupati</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className='py-16' style={{ background: 'rgba(16,185,129,0.04)' }}>
        <div className='max-w-6xl mx-auto px-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
            <div className='p-8 rounded-3xl bg-white shadow-sm border border-slate-200/60'>
              <div className='text-4xl mb-4'>🎯</div>
              <h3 className='text-2xl font-bold mb-3' style={{ color: '#006241' }}>{content.missionTitle}</h3>
              <p className='text-slate-600 leading-relaxed'>{content.missionDescription}</p>
            </div>
            <div className='p-8 rounded-3xl bg-white shadow-sm border border-slate-200/60'>
              <div className='text-4xl mb-4'>👁️</div>
              <h3 className='text-2xl font-bold mb-3' style={{ color: '#006241' }}>{content.visionTitle}</h3>
              <p className='text-slate-600 leading-relaxed'>{content.visionDescription}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core pillars */}
      <section className='py-20 max-w-6xl mx-auto px-6'>
        <div className='text-center max-w-2xl mx-auto mb-14'>
          <h2 className='text-3xl sm:text-4xl font-bold mb-4' style={{ color: '#006241' }}>
            Our Core Principles &amp; Sacred Pillars
          </h2>
          <p className='text-slate-500'>Built on a foundation of faith, scriptural authenticity, and unyielding devotion.</p>
        </div>

        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6'>
          {content.pillars.map((pillar, idx) => (
            <div
              key={idx}
              className='p-6 rounded-2xl bg-white border border-slate-200/60 hover:-translate-y-1 hover:shadow-md transition-all duration-300 shadow-sm'
            >
              <div className='text-4xl mb-4'>{pillar.icon}</div>
              <h3 className='text-lg font-bold text-slate-800 mb-2'>{pillar.title}</h3>
              <p className='text-slate-500 text-sm leading-relaxed'>{pillar.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Leadership */}
      <section className='py-20' style={{ background: 'rgba(16,185,129,0.04)' }}>
        <div className='max-w-6xl mx-auto px-6'>
          <div className='text-center max-w-2xl mx-auto mb-16'>
            <div
              className='inline-block font-bold text-sm tracking-wider uppercase px-3 py-1 rounded-md mb-3'
              style={{ color: '#006241', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}
            >
              Leadership &amp; Advisory
            </div>
            <h2 className='text-3xl sm:text-4xl font-bold mb-4' style={{ color: '#006241' }}>
              Guided by Acharyas &amp; Devoted Leaders
            </h2>
            <p className='text-slate-500'>Our team brings together decades of Vedic scholarship, technology expertise, and spiritual devotion.</p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
            {content.team.map((member, idx) => (
              <div key={idx} className='rounded-3xl bg-white overflow-hidden shadow-sm border border-slate-200/60 hover:shadow-md transition-all'>
                <div className='h-64 overflow-hidden'>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={member.image} alt={member.name} className='w-full h-full object-cover' />
                </div>
                <div className='p-6 space-y-1.5'>
                  <h3 className='text-xl font-bold text-slate-800'>{member.name}</h3>
                  <div className='text-xs font-semibold uppercase tracking-wider' style={{ color: '#006241' }}>{member.role}</div>
                  <p className='text-slate-500 text-sm pt-2 leading-relaxed'>{member.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className='py-20 text-center' style={{ background: 'linear-gradient(135deg,#006241 0%,#006241 100%)' }}>
        <div className='max-w-3xl mx-auto px-6'>
          <span className='text-4xl block mb-4'>🙏</span>
          <h2 className='text-3xl sm:text-4xl font-bold text-white mb-6'>Begin Your Sacred Journey with Mandirsetuu</h2>
          <p className='text-white/90 text-lg mb-8 max-w-xl mx-auto'>
            Experience authentic e-pujas, order blessed prasad, or consult with verified Jyotish Acharyas today.
          </p>
          <div className='flex flex-wrap justify-center gap-4'>
            <Link
              href='/front-pages/epuja'
              className='px-8 py-3.5 rounded-xl font-bold bg-white text-emerald-700 shadow-xl hover:-translate-y-0.5 transition-all'
            >
              Book an E-Puja Now
            </Link>
            <Link
              href='/front-pages/contact'
              className='px-8 py-3.5 rounded-xl font-bold text-white border border-white/40 hover:bg-white/10 transition-all'
            >
              Contact Our Seva Team
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
