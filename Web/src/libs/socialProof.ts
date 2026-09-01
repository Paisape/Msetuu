/**
 * Realistic Social Proof & Dynamic Hourly Counter Engine for Mandirsetuu Offer Pages.
 * Allows realistic simulated progression every hour + name rotations, seamlessly
 * integrating real live bookings.
 */

export const SAMPLE_DEVOTEES: { name: string; city: string }[] = [
  { name: 'SANJAY KUMAR SAXENA', city: 'Surat, Gujarat, India' },
  { name: 'RAJESH SHARMA', city: 'Jaipur, Rajasthan, India' },
  { name: 'ANITA PATIL', city: 'Pune, Maharashtra, India' },
  { name: 'MAHESH VERMA', city: 'Indore, Madhya Pradesh, India' },
  { name: 'PRIYA DESHMUKH', city: 'Nagpur, Maharashtra, India' },
  { name: 'VIJAY AGRAWAL', city: 'Ahmedabad, Gujarat, India' },
  { name: 'SURESH JOSHI', city: 'Varanasi, Uttar Pradesh, India' },
  { name: 'POOJA KULKARNI', city: 'Mumbai, Maharashtra, India' },
  { name: 'RAMESH CHOUDHARY', city: 'Jodhpur, Rajasthan, India' },
  { name: 'SUNITA GUPTA', city: 'Delhi, India' },
  { name: 'DINESH PATEL', city: 'Vadodara, Gujarat, India' },
  { name: 'MEENA SINGH', city: 'Lucknow, Uttar Pradesh, India' },
  { name: 'AMIT MISHRA', city: 'Prayagraj, Uttar Pradesh, India' },
  { name: 'KAVITA SHAH', city: 'Rajkot, Gujarat, India' },
  { name: 'DEEPAK SHINDE', city: 'Nashik, Maharashtra, India' },
  { name: 'VIKRAM RATHORE', city: 'Udaipur, Rajasthan, India' },
  { name: 'SUNIL TIWARI', city: 'Bhopal, Madhya Pradesh, India' },
  { name: 'PRADEEP GAVANDE', city: 'Thane, Maharashtra, India' },
  { name: 'SANGEETA YADAV', city: 'Kanpur, Uttar Pradesh, India' },
  { name: 'MANOJ CHAUHAN', city: 'Haridwar, Uttarakhand, India' },
  { name: 'RAKESH JAIN', city: 'Kota, Rajasthan, India' },
  { name: 'SEEMA BANSAL', city: 'Chandigarh, India' },
  { name: 'ASHOK TRIPATHI', city: 'Ayodhya, Uttar Pradesh, India' },
  { name: 'NEHA SOLANKI', city: 'Bhavnagar, Gujarat, India' },
  { name: 'HARISH PANDEY', city: 'Gorakhpur, Uttar Pradesh, India' },
  { name: 'VANDANA CHAVAN', city: 'Kolhapur, Maharashtra, India' },
  { name: 'GIRISH AGNIHOTRI', city: 'Gwalior, Madhya Pradesh, India' },
  { name: 'ROHIT KASHYAP', city: 'Mathura, Uttar Pradesh, India' }
]

/**
 * Deterministically computes the dynamic counter for the current hour and day in Indian Standard Time (IST).
 * Increases realistically hour-by-hour (averaging 8 - 18 bookings per hour).
 */
export function calculateDynamicCounter(baseCounter: number = 10000, realOrdersCount: number = 0, targetDate?: Date): number {
  const now = targetDate || new Date()
  const istOffsetMs = 5.5 * 60 * 60 * 1000
  const istDate = new Date(now.getTime() + istOffsetMs)

  const istYear = istDate.getUTCFullYear()
  const startOfYear = new Date(Date.UTC(istYear, 0, 1))
  const dayOfYear = Math.floor((istDate.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24))
  const currentHour = istDate.getUTCHours() // 0 to 23
  const currentMinute = istDate.getUTCMinutes() // 0 to 59

  // Sum pseudo-random hourly rates for all completed hours of the day
  let hourlyProgress = 0
  for (let h = 0; h < currentHour; h++) {
    const rateForHour = ((dayOfYear * 13 + h * 7) % 11) + 8 // 8 to 18 per hour
    hourlyProgress += rateForHour
  }

  // Fraction of the current hour
  const thisHourRate = ((dayOfYear * 13 + currentHour * 7) % 11) + 8
  const minuteProgress = Math.floor((currentMinute / 60) * thisHourRate)

  // Daily baseline accumulation + hourly progression + real bookings
  const dailyBase = dayOfYear * 120
  return baseCounter + dailyBase + hourlyProgress + minuteProgress + realOrdersCount
}

/**
 * Merges live real bookings with the sample pool so names rotate continuously.
 */
export function getMergedDevoteeList(realBookings: { name: string; city: string }[] = []): { name: string; city: string }[] {
  if (!realBookings || realBookings.length === 0) {
    return SAMPLE_DEVOTEES
  }

  // Deduplicate and place real bookings at the front
  const realNames = new Set(realBookings.map(b => b.name.toLowerCase().trim()))
  const filteredSample = SAMPLE_DEVOTEES.filter(s => !realNames.has(s.name.toLowerCase().trim()))
  
  return [...realBookings, ...filteredSample]
}
