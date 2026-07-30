import { PrismaClient } from '@prisma/client'
import { generateAccessToken } from '../src/libs/mobileAuth'

import dotenv from 'dotenv'
dotenv.config()

const prisma = new PrismaClient()
const API_URL = 'http://localhost:3000/api'

async function runTests() {
  console.log('--- Starting API Tests ---')

  let user = await prisma.user.findFirst({ where: { role: 'USER' } })
  if (!user) {
    user = await prisma.user.create({
      data: {
        name: 'Test User',
        email: 'test' + Date.now() + '@example.com',
        role: 'USER',
        password: 'password123'
      }
    })
  }
  
  console.log(`Testing as User: ${user.email}`)

  const token = await generateAccessToken({
    id: user.id,
    name: user.name,
    email: user.email!,
    role: user.role
  })

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }

  // 1. Test GET /api/profile
  let res = await fetch(`${API_URL}/profile`, { headers })
  console.log('GET /profile:', res.status, await res.json())

  // 2. Test PUT /api/profile
  res = await fetch(`${API_URL}/profile`, {
    method: 'PUT',
    headers,
    body: JSON.stringify({ name: 'Updated Name ' + Date.now() })
  })
  console.log('PUT /profile:', res.status, await res.json())

  // 3. Test POST /api/addresses
  res = await fetch(`${API_URL}/addresses`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ fullAddress: '123 Test Street, Test City', label: 'Home', isDefault: true })
  })
  const newAddress = await res.json()
  console.log('POST /addresses:', res.status, newAddress)

  // 4. Test GET /api/addresses
  res = await fetch(`${API_URL}/addresses`, { headers })
  console.log('GET /addresses:', res.status, await res.json())

  if (newAddress && newAddress.id) {
    // 5. Test PATCH /api/addresses/[id]
    res = await fetch(`${API_URL}/addresses/${newAddress.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ label: 'Work', isDefault: false })
    })
    console.log(`PATCH /addresses/${newAddress.id}:`, res.status, await res.json())

    // 6. Test DELETE /api/addresses/[id]
    res = await fetch(`${API_URL}/addresses/${newAddress.id}`, {
      method: 'DELETE',
      headers
    })
    console.log(`DELETE /addresses/${newAddress.id}:`, res.status, await res.json())
  }

  console.log('--- Finished API Tests ---')
  process.exit(0)
}

runTests().catch(e => {
  console.error(e)
  process.exit(1)
})
