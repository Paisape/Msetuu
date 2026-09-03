/**
 * Social Proof & Booking Counter Engine for Mandirsetuu Offer Pages.
 * Accurately calculates: Start Counter Offset (Configured in Admin) + Real Completed Orders.
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
 * Calculates the exact real counter: Base Start Number (configured by Admin) + Real Completed Orders in DB.
 */
export function calculateDynamicCounter(baseCounter: number = 0, realOrdersCount: number = 0): number {
  return Number(baseCounter || 0) + Number(realOrdersCount || 0)
}

/**
 * Merges real live bookings with sample devotee pool for continuous rotation.
 * Real bookings from DB are always prioritized at the top of the queue.
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
