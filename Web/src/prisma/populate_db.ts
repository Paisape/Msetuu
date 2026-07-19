import prisma from '../libs/prisma'

async function main() {
  console.log('Populating database under updated schema with 2 products/listings and 2 orders for each section...')

  // 1. Get or create a test user
  const userEmail = 'testdevotee@mandirsetu.com'

  const user = await prisma.user.upsert({
    where: { email: userEmail },
    update: {},
    create: {
      name: 'Test Devotee',
      email: userEmail,
      role: 'USER'
    }
  })

  console.log(`User ready: ${user.email} (ID: ${user.id})`)

  // 2. Chadhava Listings & Orders
  console.log('Adding Chadhava data...')

  const c1 = await prisma.chadhavaListing.upsert({
    where: { id: 'test-chadhava-1' },
    update: {},
    create: {
      id: 'test-chadhava-1',
      title: 'Maha Bhog offering to Baba Vishwanath',
      description: 'Sacred sweets and dry fruits offered at Kashi Vishwanath.',
      image: '/images/devotional/kashi.jpg',
      price: 501,
      offerPrice: 450,
      location: 'Kashi'
    }
  })

  const c2 = await prisma.chadhavaListing.upsert({
    where: { id: 'test-chadhava-2' },
    update: {},
    create: {
      id: 'test-chadhava-2',
      title: 'Swarna Sindoor Shringar Offering',
      description: 'Auspicious vermillion and flower offering for Hanuman ji.',
      image: '/images/devotional/siddhivinayak.jpg',
      price: 751,
      offerPrice: 699,
      location: 'Ayodhya'
    }
  })

  // 2 Chadhava Orders
  await prisma.chadhavaOrder.upsert({
    where: { id: 'order-chadhava-1' },
    update: {},
    create: {
      id: 'order-chadhava-1',
      userId: user.id,
      chadhavaListingId: c1.id,
      name: 'Rohan Sharma',
      gender: 'Male',
      dob: new Date('1995-05-15'),
      birthPlace: 'Delhi',
      comment: 'Praying for career growth',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  })

  await prisma.chadhavaOrder.upsert({
    where: { id: 'order-chadhava-2' },
    update: {},
    create: {
      id: 'order-chadhava-2',
      userId: user.id,
      chadhavaListingId: c2.id,
      name: 'Aditi Verma',
      gender: 'Female',
      dob: new Date('1998-09-21'),
      birthPlace: 'Mumbai',
      comment: 'Praying for family good health',
      paymentStatus: 'PAID',
      status: 'PENDING'
    }
  })

  // 3. E-Puja Listings, Packages, & Orders
  console.log('Adding E-Puja data...')

  const p1 = await prisma.pujaListing.upsert({
    where: { id: 'test-puja-1' },
    update: {},
    create: {
      id: 'test-puja-1',
      title: 'Maha Rudrabhishek Puja',
      description: 'Shiva ritual for health, prosperity and peace.',
      image: '/images/devotional/mahakaleshwar.jpg',
      price: 1500,
      category: 'Mahadev'
    }
  })

  const p2 = await prisma.pujaListing.upsert({
    where: { id: 'test-puja-2' },
    update: {},
    create: {
      id: 'test-puja-2',
      title: 'Siddhivinayak Ganesha Havan',
      description: 'Havan dedicated to Lord Ganesha for obstacle removal.',
      image: '/images/devotional/siddhivinayak.jpg',
      price: 1100,
      category: 'Ganesha'
    }
  })

  // Packages for Puja 1
  const pkg1_single = await prisma.pujaPackage.upsert({
    where: { id: 'test-pkg-1-single' },
    update: {},
    create: { id: 'test-pkg-1-single', pujaListingId: p1.id, type: 'Single', price: 1500 }
  })

  const pkg1_family = await prisma.pujaPackage.upsert({
    where: { id: 'test-pkg-1-family' },
    update: {},
    create: { id: 'test-pkg-1-family', pujaListingId: p1.id, type: 'Family', price: 3500 }
  })

  // Packages for Puja 2
  const pkg2_single = await prisma.pujaPackage.upsert({
    where: { id: 'test-pkg-2-single' },
    update: {},
    create: { id: 'test-pkg-2-single', pujaListingId: p2.id, type: 'Single', price: 1100 }
  })

  const pkg2_couple = await prisma.pujaPackage.upsert({
    where: { id: 'test-pkg-2-couple' },
    update: {},
    create: { id: 'test-pkg-2-couple', pujaListingId: p2.id, type: 'Couple', price: 2100 }
  })

  // 2 Puja Orders
  await prisma.pujaOrder.upsert({
    where: { id: 'order-puja-1' },
    update: {},
    create: {
      id: 'order-puja-1',
      userId: user.id,
      pujaListingId: p1.id,
      pujaPackageId: pkg1_single.id,
      name: 'Rohan Sharma',
      gender: 'Male',
      dob: new Date('1995-05-15'),
      birthPlace: 'Delhi',
      comment: 'Vedic Rudrabhishek sankalp',
      paymentStatus: 'PAID',
      status: 'PENDING'
    }
  })

  await prisma.pujaOrder.upsert({
    where: { id: 'order-puja-2' },
    update: {},
    create: {
      id: 'order-puja-2',
      userId: user.id,
      pujaListingId: p2.id,
      pujaPackageId: pkg2_couple.id,
      name: 'Amit and Priya Mehta',
      gender: 'Couple',
      dob: new Date('1990-12-05'),
      birthPlace: 'Pune',
      comment: 'New business blessings',
      paymentStatus: 'PAID',
      status: 'COMPLETED',
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4'
    }
  })

  // 4. Astrologers & Bookings
  console.log('Adding Astrologer & Booking data...')

  const astro1 = await prisma.astrologer.upsert({
    where: { id: 'test-astro-1' },
    update: {},
    create: {
      id: 'test-astro-1',
      name: 'Acharya Rashmi Sen',
      bio: '12+ Years Exp in Lal Kitab remedies.',
      image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2',
      rating: 4.8,
      specialties: 'Lal Kitab, Vastu Consulting, Numerology',
      price30: 750,
      price60: 1200,
      gstPercentage: 18,
      gstInclusive: true
    }
  })

  const astro2 = await prisma.astrologer.upsert({
    where: { id: 'test-astro-2' },
    update: {},
    create: {
      id: 'test-astro-2',
      name: 'Pandit Ramesh Dwivedi',
      bio: '20+ Years Exp in KP Astrology.',
      image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e',
      rating: 5.0,
      specialties: 'KP Astrology System, Janam Kundli Milan',
      price30: 1200,
      price60: 2000,
      gstPercentage: 18,
      gstInclusive: true
    }
  })

  // 2 Bookings
  await prisma.consultationBooking.upsert({
    where: { id: 'booking-astro-1' },
    update: {},
    create: {
      id: 'booking-astro-1',
      userId: user.id,
      astrologerId: astro1.id,
      category: 'Marriage & Matchmaking',
      durationMins: 30,
      slotTime: new Date(Date.now() + 86400000 * 2), // 2 days later
      paymentStatus: 'PAID',
      status: 'CONFIRMED',
      comment: 'Matchmaking query',
      amountPaid: 750,
      gstPercentage: 18,
      gstInclusive: true
    }
  })

  await prisma.consultationBooking.upsert({
    where: { id: 'booking-astro-2' },
    update: {},
    create: {
      id: 'booking-astro-2',
      userId: user.id,
      astrologerId: astro2.id,
      category: 'Career & Promotion',
      durationMins: 60,
      slotTime: new Date(Date.now() + 86400000 * 3), // 3 days later
      paymentStatus: 'PAID',
      status: 'PENDING',
      comment: 'Job change timing'
    }
  })

  // 5. Kundli Listings & Orders
  console.log('Adding Kundli Listing & Order data...')

  const kl1 = await prisma.kundliListing.upsert({
    where: { id: 'test-kundli-list-1' },
    update: {},
    create: {
      id: 'test-kundli-list-1',
      title: 'Premium Janam Kundli',
      delivery: 'Physical Hardcopy + PDF Scans',
      price: 1501,
      offerPrice: 1100,
      description: 'Comprehensive 80+ page handcrafted horoscope notebook detailed by certified pandits.',
      image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf'
    }
  })

  const kl2 = await prisma.kundliListing.upsert({
    where: { id: 'test-kundli-list-2' },
    update: {},
    create: {
      id: 'test-kundli-list-2',
      title: 'Lagna Patrika & Kundli',
      delivery: 'Special Marriage Match Booklet',
      price: 1101,
      offerPrice: 851,
      description: 'Lagna birth chart and planetary transitions analysis optimized for marriage alignment.',
      image: 'https://images.unsplash.com/photo-1609137144813-91147a242f2b'
    }
  })

  const kl3 = await prisma.kundliListing.upsert({
    where: { id: 'test-kundli-list-3' },
    update: {},
    create: {
      id: 'test-kundli-list-3',
      title: 'Detailed Varshphal (Annual Forecast)',
      delivery: 'PDF Scans via Email',
      price: 699,
      offerPrice: 499,
      description: 'Detailed month-by-month annual astrological analysis for career, health, and relationships.',
      image: 'https://images.unsplash.com/photo-1605649487212-47bdab064df7'
    }
  })

  await prisma.kundliOrder.upsert({
    where: { id: 'order-kundli-1' },
    update: {},
    create: {
      id: 'order-kundli-1',
      userId: user.id,
      name: 'Vijay Verma',
      gender: 'Male',
      dob: new Date('1994-08-12'),
      timeOfBirth: '08:45 AM',
      birthPlace: 'Jaipur, Rajasthan',
      comment: 'Premium Hardcopy Kundli',
      kundliType: kl1.title,
      paymentStatus: 'PAID',
      status: 'SHARED_WITH_PANDIT'
    }
  })

  await prisma.kundliOrder.upsert({
    where: { id: 'order-kundli-2' },
    update: {},
    create: {
      id: 'order-kundli-2',
      userId: user.id,
      name: 'Neha Kapoor',
      gender: 'Female',
      dob: new Date('1996-11-25'),
      timeOfBirth: '14:20 PM',
      birthPlace: 'Delhi, India',
      comment: 'Marriage compatibility check',
      kundliType: kl2.title,
      paymentStatus: 'PAID',
      status: 'PENDING'
    }
  })

  // 6. Products (Remedial Store) & Orders
  console.log('Adding E-Commerce Product & Order data...')

  const prod1 = await prisma.product.upsert({
    where: { id: 'test-prod-1' },
    update: {},
    create: {
      id: 'test-prod-1',
      name: 'Pure Silver Shree Yantra Ring',
      category: 'Gemstones',
      price: 2499,
      offerPrice: 1899,
      image: '/images/devotional/rammandir.jpg',
      description: 'Blessed silver ring with Shree Yantra symbol to attract fortune.',
      isBestSeller: true,
      purpose: 'Wealth & Prosperity',
      planet: 'Venus'
    }
  })

  const prod2 = await prisma.product.upsert({
    where: { id: 'test-prod-2' },
    update: {},
    create: {
      id: 'test-prod-2',
      name: 'Parad (Mercury) Shivling idol',
      category: 'Brass Idols',
      price: 1500,
      offerPrice: 1250,
      image: '/images/devotional/kedarnath.jpg',
      description: 'Authentic Mercury Shivling blessed for mental clarity and health.',
      purpose: 'Health & Concentration',
      planet: 'Jupiter'
    }
  })

  // 2 Product Orders
  await prisma.productOrder.upsert({
    where: { id: 'order-prod-1' },
    update: {},
    create: {
      id: 'order-prod-1',
      userId: user.id,
      productId: prod1.id,
      quantity: 1,
      totalAmount: 1899,
      paymentStatus: 'PAID',
      shippingAddress: 'House 14, Saket, New Delhi - 110017',
      status: 'SHIPPED'
    }
  })

  await prisma.productOrder.upsert({
    where: { id: 'order-prod-2' },
    update: {},
    create: {
      id: 'order-prod-2',
      userId: user.id,
      productId: prod2.id,
      quantity: 2,
      totalAmount: 2500,
      paymentStatus: 'PAID',
      shippingAddress: 'Flat 402, Sector 21, Noida - 201301',
      status: 'PENDING'
    }
  })

  // 7. Yatra Bookings (2 Bookings)
  console.log('Adding Yatra Booking data...')
  await prisma.yatraBooking.upsert({
    where: { id: 'booking-yatra-1' },
    update: {},
    create: {
      id: 'booking-yatra-1',
      userId: user.id,
      name: 'Rohan Sharma',
      contactNumber: '9999988888',
      cityOfDeparture: 'Delhi',
      yatraDestination: 'Char Dham Yatra (Yamunotri, Gangotri, Kedarnath, Badrinath)',
      totalTravelers: 3,
      travelDate: new Date('2026-09-10'),
      comment: 'Need ground floor rooms for parents',
      status: 'CONFIRMED'
    }
  })

  await prisma.yatraBooking.upsert({
    where: { id: 'booking-yatra-2' },
    update: {},
    create: {
      id: 'booking-yatra-2',
      userId: user.id,
      name: 'Kamlesh Patel',
      contactNumber: '7777766666',
      cityOfDeparture: 'Ahmedabad',
      yatraDestination: 'Dwarkadhish & Somnath Jyotirlinga Yatra',
      totalTravelers: 2,
      travelDate: new Date('2026-10-05'),
      status: 'PENDING'
    }
  })

  console.log('All 2-2 entries populated successfully under new schema!')
}

main()
  .catch(err => {
    console.error(err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
