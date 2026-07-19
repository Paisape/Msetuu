/**
 * ! getPricingData below is used to fetch the static plan data from the fake-db. If you're using an ORM
 * ! (Object-Relational Mapping) or a database, you can swap the code below with your own database queries.
 * ! It backs the real front-pages/pricing and front-pages/payment routes.
 */

'use server'

// Data Imports
import { db as pricingData } from '@/fake-db/pages/pricing'

export const getPricingData = async () => {
  return pricingData
}
