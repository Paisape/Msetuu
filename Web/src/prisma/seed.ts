import bcrypt from 'bcryptjs'

import prisma from '../libs/prisma'

async function main() {
  const adminEmail = 'admin@mandirsetuu.com'
  const adminPassword = 'Admin@12345'

  // Delete the old admin user if it exists to prevent login using the old email
  await prisma.user.deleteMany({
    where: { email: 'admin@mandirsetu.com' }
  })

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: 'Mandirsetuu Admin',
      email: adminEmail,
      password: await bcrypt.hash(adminPassword, 12),
      role: 'ADMIN',
      emailVerified: new Date()
    }
  })

  console.log(`Admin user ready: ${admin.email} / ${adminPassword} (change this password after first login)`)

  await prisma.chadhavaListing.upsert({
    where: { id: 'seed-chadhava-shringar' },
    update: {},
    create: {
      id: 'seed-chadhava-shringar',
      title: 'Kashi Vishwanath Temple',
      description: 'Rudrabhishek Shringar & Bhog Chadhava',
      location: 'Varanasi, UP',
      image: '/images/devotional/kashi.jpg',
      price: 1101,
      offerPrice: 999,
      gstPercentage: 5,
      gstInclusive: true
    }
  })

  await prisma.chadhavaListing.upsert({
    where: { id: 'seed-chadhava-siddhivinayak' },
    update: {},
    create: {
      id: 'seed-chadhava-siddhivinayak',
      title: 'Siddhivinayak Temple',
      description: 'Modak Bhog & Durva Offering',
      location: 'Mumbai, Maharashtra',
      image: '/images/devotional/siddhivinayak.jpg',
      price: 501,
      gstPercentage: 5,
      gstInclusive: true
    }
  })

  await prisma.chadhavaListing.upsert({
    where: { id: 'seed-chadhava-mahakaleshwar' },
    update: {},
    create: {
      id: 'seed-chadhava-mahakaleshwar',
      title: 'Mahakaleshwar Jyotirlinga',
      description: 'Bhasma Aarti Abhishek & Shringar',
      location: 'Ujjain, MP',
      image: '/images/devotional/mahakaleshwar.jpg',
      price: 2101,
      offerPrice: 1899,
      gstPercentage: 5,
      gstInclusive: true
    }
  })

  // Extra devotional dummy listing so the "Sacred Chadhava Offerings" page has more than
  // 3 cards out of the box.
  await prisma.chadhavaListing.upsert({
    where: { id: 'seed-chadhava-rammandir' },
    update: {},
    create: {
      id: 'seed-chadhava-rammandir',
      title: 'Maha Bhog & Prasad Offering',
      description: 'Laddoo and peda offering to Lord Krishna. Prasad delivered to your doorstep.',
      location: 'Banke Bihari Temple, Vrindavan',
      image: '/images/devotional/rammandir.jpg',
      price: 851,
      gstPercentage: 5,
      gstInclusive: true
    }
  })

  const homeBanners: { id: string; title: string; subtitle: string; buttonText: string; buttonLink: string; order: number }[] = [
    {
      id: 'seed-banner-shyam',
      title: 'ITTAR & PRASAD at Shree Shyam Temple',
      subtitle:
        'Aapka Chadhava, Shyam Baba ke Sir par. Send holy Prasad, genuine Ittar, and peacock feathers directly to Khatu Shyam temple.',
      buttonText: 'Book Shyam Chadhava',
      buttonLink: '/front-pages/chadhava',
      order: 0
    },
    {
      id: 'seed-banner-hero',
      title: 'Connect with Auspicious Divinity',
      subtitle:
        'Book E-Pujas, offer Chadhava at sacred ancient temples, consult verified Vedic Astrologers, and order handcrafted Janam Kundli with ease.',
      buttonText: 'Book an E-Puja Now',
      buttonLink: '/front-pages/epuja',
      order: 1
    },
    {
      id: 'seed-banner-kundli',
      title: 'Vedic Janam Kundli & Astrology Consulting',
      subtitle:
        'Get detailed lifetime horoscope analyses prepared by certified pandits and obtain legal, business or relationship remedies.',
      buttonText: 'Order Handcrafted Kundli',
      buttonLink: '/front-pages/kundli',
      order: 2
    }
  ]

  for (const banner of homeBanners) {
    await prisma.banner.upsert({
      where: { id: banner.id },
      update: {},
      create: {
        id: banner.id,
        page: 'home',
        title: banner.title,
        subtitle: banner.subtitle,
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
        buttonText: banner.buttonText,
        buttonLink: banner.buttonLink,
        order: banner.order,
        active: true
      }
    })
  }

  const shopPurposes = ['Wealth', 'Love', 'Protection', 'Zodiac', 'Courage', 'Peace', 'Luck', 'Gifting']

  for (const [index, label] of shopPurposes.entries()) {
    await prisma.shopPurpose.upsert({
      where: { id: `seed-purpose-${label.toLowerCase()}` },
      update: {},
      create: {
        id: `seed-purpose-${label.toLowerCase()}`,
        label,
        image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
        order: index
      }
    })
  }

  await prisma.pujaListing.upsert({
    where: { id: 'seed-puja-mrityunjaya' },
    update: {},
    create: {
      id: 'seed-puja-mrityunjaya',
      title: 'Maha Mrityunjaya Homa',
      category: 'Mahadev',
      description: 'Powerful Vedic ritual dedicated to Lord Shiva to pray for health, longevity, and ward off negative energies.',
      image: '/images/devotional/mahakaleshwar.jpg',
      price: 2100,
      packages: {
        connectOrCreate: [
          {
            where: { id: 'seed-puja-mrityunjaya-single' },
            create: { id: 'seed-puja-mrityunjaya-single', type: 'Single', price: 2100, offerPrice: 1899, gstPercentage: 5, gstInclusive: true }
          },
          {
            where: { id: 'seed-puja-mrityunjaya-couple' },
            create: { id: 'seed-puja-mrityunjaya-couple', type: 'Couple', price: 3500, gstPercentage: 5, gstInclusive: true }
          },
          {
            where: { id: 'seed-puja-mrityunjaya-family' },
            create: { id: 'seed-puja-mrityunjaya-family', type: 'Family', price: 5100, gstPercentage: 5, gstInclusive: true }
          }
        ]
      }
    }
  })

  // Extra devotional dummy E-Puja listings so the "Interactive E-Puja Portals" page has more
  // than one category to browse out of the box.
  const extraPujaListings = [
    {
      id: 'seed-puja-ganesha',
      title: 'Ganesha Atharvashirsha & Abhishek',
      category: 'Ganesha',
      description: 'Performed at ancient Ganesha shrine to receive wisdom, clear business blockages, and get dynamic success.',
      image: '/images/devotional/siddhivinayak.jpg',
      price: 1100,
      packages: [
        { id: 'seed-puja-ganesha-single', type: 'Single', price: 1100 },
        { id: 'seed-puja-ganesha-couple', type: 'Couple', price: 1800 },
        { id: 'seed-puja-ganesha-family', type: 'Family', price: 2700 }
      ]
    },
    {
      id: 'seed-puja-lakshmi',
      title: 'Kanakadhara Stotram & Lakshmi Havan',
      category: 'Lakshmi',
      description: 'Wealth enhancement ritual to invoke Goddess Lakshmi and attract financial growth and stable fortune.',
      image: '/images/devotional/kashi.jpg',
      price: 1500,
      packages: [
        { id: 'seed-puja-lakshmi-single', type: 'Single', price: 1500, offerPrice: 1299 },
        { id: 'seed-puja-lakshmi-couple', type: 'Couple', price: 2500 },
        { id: 'seed-puja-lakshmi-family', type: 'Family', price: 3600 }
      ]
    },
    {
      id: 'seed-puja-durga',
      title: 'Navgrah Shanti Homa',
      category: 'Durga',
      description: 'Pacify negative astrological impacts of all 9 planetary deities and align health and peace charts.',
      image: '/images/devotional/rammandir.jpg',
      price: 1800,
      packages: [
        { id: 'seed-puja-durga-single', type: 'Single', price: 1800 },
        { id: 'seed-puja-durga-couple', type: 'Couple', price: 3000 },
        { id: 'seed-puja-durga-family', type: 'Family', price: 4500 }
      ]
    }
  ]

  for (const puja of extraPujaListings) {
    await prisma.pujaListing.upsert({
      where: { id: puja.id },
      update: {},
      create: {
        id: puja.id,
        title: puja.title,
        category: puja.category,
        description: puja.description,
        image: puja.image,
        price: puja.price,
        packages: {
          connectOrCreate: puja.packages.map(pkg => ({
            where: { id: pkg.id },
            create: { id: pkg.id, type: pkg.type, price: pkg.price, offerPrice: pkg.offerPrice ?? null, gstPercentage: 5, gstInclusive: true }
          }))
        }
      }
    })
  }

  const kundliListings = [
    {
      id: 'seed-kundli-premium',
      title: 'Premium Janam Kundli',
      delivery: 'Physical Hardcopy + PDF Scans',
      price: 1501,
      offerPrice: 1299,
      description:
        'Comprehensive 80+ page handcrafted horoscope notebook detailed by certified pandits mapping major periods and remedies.',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'seed-kundli-lagna',
      title: 'Lagna Patrika & Kundli',
      delivery: 'Special Marriage Match Booklet',
      price: 1101,
      offerPrice: null as number | null,
      description: 'Lagna birth chart and planetary transitions analysis optimized for marriage alignment and dosha consultations.',
      image: 'https://images.unsplash.com/photo-1609137144813-91147a242f2b?auto=format&fit=crop&q=80&w=400'
    },
    {
      id: 'seed-kundli-varshphal',
      title: 'Varshphal (Annual Progress) Kundli',
      delivery: 'E-Scan PDF + Pocket Printout',
      price: 851,
      offerPrice: null as number | null,
      description: 'Focused solar return analysis mapping the next 12 months of health, finance, and career progressions.',
      image: 'https://images.unsplash.com/photo-1590004953392-5aba2e72269a?auto=format&fit=crop&q=80&w=400'
    }
  ]

  for (const kundli of kundliListings) {
    await prisma.kundliListing.upsert({
      where: { id: kundli.id },
      update: {},
      create: {
        id: kundli.id,
        title: kundli.title,
        delivery: kundli.delivery,
        description: kundli.description,
        image: kundli.image,
        price: kundli.price,
        offerPrice: kundli.offerPrice,
        gstPercentage: 5,
        gstInclusive: true
      }
    })
  }

  await prisma.astrologer.upsert({
    where: { id: 'seed-astrologer-anuj' },
    update: {},
    create: {
      id: 'seed-astrologer-anuj',
      name: 'Pandit Anuj Shastri',
      bio: '15+ years of experience in Vedic chart readings.',
      image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
      rating: 4.9,
      specialties: 'Vedic Astrology, Kundli Milan, Career Guidance'
    }
  })

  // price = sale/MRP (shown struck through), offerPrice = discounted price actually charged.
  // Gemstone/bracelet jewelry in India is typically taxed at 3% GST.
  const products = [
    {
      id: 'seed-product-rudraksha',
      name: 'Energized 5 Mukhi Rudraksha Mala',
      category: 'Rudraksha',
      price: 899,
      offerPrice: 499,
      description: '108 beads Panchmukhi Rudraksha Mala.',
      isBestSeller: true,
      purpose: 'Protection',
      rating: 4.9,
      reviewsCount: 1204
    },
    {
      id: 'seed-product-dhan-yog-bracelet',
      name: 'Metal Dhan Yog Bracelet for Women',
      category: 'Bracelets',
      price: 1400,
      offerPrice: 899,
      description: 'Wealth and prosperity bracelet, crafted for daily wear.',
      isBestSeller: true,
      purpose: 'Wealth',
      rating: 5.0,
      reviewsCount: 1654
    },
    {
      id: 'seed-product-dhan-yog-lab',
      name: 'Dhan Yog Bracelet (Lab Certified)',
      category: 'Bracelets',
      price: 1999,
      offerPrice: 699,
      description: 'Lab-certified gemstone bracelet for wealth attraction.',
      isBestSeller: true,
      purpose: 'Wealth',
      rating: 5.0,
      reviewsCount: 1621
    },
    {
      id: 'seed-product-zodiac-bracelet',
      name: 'Gemini (Mithun Rashi) Zodiac Green Aventurine & Milky Quartz Bracelet',
      category: 'Bracelets',
      price: 2800,
      offerPrice: 899,
      description: 'Zodiac-specific gemstone bracelet for luck and courage.',
      isBestSeller: true,
      purpose: 'Zodiac',
      rating: 4.8,
      reviewsCount: 1968
    },
    {
      id: 'seed-product-silver-dhan-yog',
      name: 'Metal Dhan Yog Bracelet - Silver',
      category: 'Bracelets',
      price: 1700,
      offerPrice: 999,
      description: 'Silver-finish protection and success bracelet.',
      isBestSeller: true,
      purpose: 'Protection',
      rating: 4.9,
      reviewsCount: 741
    }
  ]

  for (const product of products) {
    await prisma.product.upsert({
      where: { id: product.id },
      update: {},
      create: {
        ...product,
        gstPercentage: 3,
        gstInclusive: true,
        image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5'
      }
    })
  }

  await prisma.darshanTemple.upsert({
    where: { id: 'seed-darshan-kashi' },
    update: {},
    create: {
      id: 'seed-darshan-kashi',
      name: 'Kashi Vishwanath Temple',
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
      qrCodeUrl: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7',
      model3dUrl: 'https://example.com/darshan/kashi-vishwanath-3d'
    }
  })

  // Seed some initial approved reviews
  await prisma.review.upsert({
    where: { userId_orderType_orderId: { userId: admin.id, orderType: 'EPUJA', orderId: 'seed-order-epuja-1' } },
    update: {},
    create: {
      userId: admin.id,
      customerName: 'Aarav Sharma',
      orderType: 'EPUJA',
      orderId: 'seed-order-epuja-1',
      targetId: 'seed-epuja-kashi-mahapuja',
      targetTitle: 'Kashi Vishwanath Temple Mahapuja',
      rating: 5,
      comment: 'Mandirsetuu made my e-puja experience so seamless. The priest performed the rituals exactly as requested, and I received the video recording on time.',
      status: 'APPROVED'
    }
  })

  await prisma.review.upsert({
    where: { userId_orderType_orderId: { userId: admin.id, orderType: 'ECOMMERCE', orderId: 'seed-order-ecommerce-1' } },
    update: {},
    create: {
      userId: admin.id,
      customerName: 'Priya Patel',
      orderType: 'ECOMMERCE',
      orderId: 'seed-order-ecommerce-1',
      targetId: 'seed-product-rudraksha',
      targetTitle: '5 Mukhi Rudraksha Mala',
      rating: 5,
      comment: 'The gemstone consultation was incredibly detailed and helpful. Highly recommend their authentic services.',
      status: 'APPROVED'
    }
  })

  await prisma.review.upsert({
    where: { userId_orderType_orderId: { userId: admin.id, orderType: 'CHADHAVA', orderId: 'seed-order-chadhava-1' } },
    update: {},
    create: {
      userId: admin.id,
      customerName: 'Vikram Singh',
      orderType: 'CHADHAVA',
      orderId: 'seed-order-chadhava-1',
      targetId: 'seed-chadhava-siddhivinayak',
      targetTitle: 'Siddhivinayak Temple Chadhava',
      rating: 5,
      comment: 'Siddhivinayak temple chadhava was done beautifully. Got the prasadam delivered safely to my home.',
      status: 'APPROVED'
    }
  })

  // Seed default mantras
  await prisma.mantra.upsert({
    where: { id: 'seed-mantra-gayatri' },
    update: {},
    create: {
      id: 'seed-mantra-gayatri',
      title: 'Gayatri Mantra',
      subtitle: 'Sacred chant for wisdom, light, and spiritual enlightenment.',
      fileUrl: '/audio/mantras/sounovamusic-gayatri-mantra-493174.mp3',
      duration: '4:57',
      deity: 'Goddess Gayatri'
    }
  })

  await prisma.mantra.upsert({
    where: { id: 'seed-mantra-mahamrityunjaya' },
    update: {},
    create: {
      id: 'seed-mantra-mahamrityunjaya',
      title: 'Mahamrityunjaya Mantra',
      subtitle: 'Powerful verse dedicated to Lord Shiva for healing and protection.',
      fileUrl: '/audio/mantras/mahamrityunjaya.mp3',
      duration: '0:31',
      deity: 'Lord Shiva'
    }
  })

  await prisma.mantra.upsert({
    where: { id: 'seed-mantra-hanuman' },
    update: {},
    create: {
      id: 'seed-mantra-hanuman',
      title: 'Om Hanumate Namaha',
      subtitle: 'Auspicious chant for strength, courage, and removing obstacles.',
      fileUrl: '/audio/mantras/kalsstockmedia-om-hanumate-namaha-short-audio-447279.mp3',
      duration: '0:50',
      deity: 'Lord Hanuman'
    }
  })

  await prisma.mantra.upsert({
    where: { id: 'seed-mantra-shiva-dhun' },
    update: {},
    create: {
      id: 'seed-mantra-shiva-dhun',
      title: 'Shiv Dhun (Monday)',
      subtitle: 'Devotional Shiva dhun perfect for peace and Monday prayers.',
      fileUrl: '/audio/mantras/Monday.mp3',
      duration: '2:52',
      deity: 'Lord Shiva'
    }
  })

  console.log('Seed data ready.')
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
