export const LAT_MIN = 6.5
export const LAT_MAX = 37.5
export const LNG_MIN = 68
export const LNG_MAX = 97.5

export const VIEW_WIDTH = 500
export const VIEW_HEIGHT = 560

export function project(lat: number, lng: number): { x: number; y: number } {
  const x = ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * VIEW_WIDTH
  const y = ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * VIEW_HEIGHT

  return { x, y }
}

export const BOUNDARY: [number, number][] = [
  // 1. Gujarat (westmost tip / Kutch)
  [22.3, 69.0], [22.7, 69.0], [22.9, 69.8], [23.1, 70.1], [23.5, 68.6], [23.8, 68.1], [24.1, 68.2], [24.5, 69.0], [24.6, 70.3], [24.4, 71.0], [24.6, 71.3],

  // 2. Rajasthan border
  [24.9, 71.2], [25.5, 70.4], [26.0, 70.1], [26.6, 70.1], [27.3, 70.3], [27.7, 69.9], [28.2, 70.2], [28.8, 71.5], [29.8, 72.8], [30.4, 73.8],

  // 3. Punjab / Jammu & Kashmir border
  [31.2, 74.0], [31.6, 74.5], [32.0, 74.7], [32.5, 74.2], [32.9, 74.8], [33.5, 74.3], [34.0, 74.0], [34.5, 74.1], [35.0, 74.3], [35.5, 74.8],

  // 4. Ladakh / Northern borders
  [36.2, 74.8], [36.7, 74.8], [37.1, 75.3], [37.1, 75.9], [36.5, 76.5], [36.0, 77.2], [35.5, 77.7], [35.0, 77.9], [34.5, 78.4], [34.2, 79.1], [33.8, 79.2], [33.2, 79.4], [32.7, 79.2], [32.6, 78.8],

  // 5. Himachal Pradesh & Uttarakhand borders
  [32.3, 78.2], [31.8, 78.7], [31.2, 78.6], [31.0, 79.1], [30.8, 80.0], [30.2, 81.0],

  // 6. Nepal border (Uttar Pradesh / Bihar border)
  [28.8, 81.3], [28.5, 82.0], [28.0, 83.0], [27.5, 83.9], [27.2, 84.8], [26.8, 85.5], [26.5, 86.5], [26.5, 87.5], [27.0, 88.1],

  // 7. Sikkim
  [27.3, 88.0], [27.8, 88.1], [28.1, 88.6], [27.6, 88.9], [27.2, 88.8],

  // 8. Bhutan border & Assam/Arunachal border
  [26.9, 89.0], [27.2, 90.0], [27.2, 91.5],

  // 9. Arunachal Pradesh
  [27.8, 91.6], [27.9, 92.5], [28.2, 93.3], [28.6, 94.2], [29.1, 95.0], [29.4, 96.0], [29.3, 96.8], [28.5, 97.4], [27.9, 97.4], [27.3, 97.0],

  // 10. Myanmar border (Nagaland, Manipur, Mizoram)
  [27.0, 96.2], [26.3, 95.3], [25.5, 94.8], [24.5, 94.4], [23.5, 93.5], [22.5, 93.2], [22.0, 92.5],

  // 11. Bangladesh border
  [22.0, 92.2], [22.5, 91.8], [23.2, 91.2], [23.8, 91.2], [24.0, 91.8], [24.5, 92.3], [25.0, 92.2], [25.2, 91.5], [25.2, 90.0], [25.8, 89.8], [26.3, 89.0], [25.5, 88.8], [25.0, 88.2], [24.0, 88.5], [22.8, 88.8], [22.0, 89.0], [21.7, 89.1],

  // 12. East Coast (West Bengal, Odisha, Andhra Pradesh)
  [21.6, 88.2], [21.5, 87.3], [20.8, 86.9], [20.0, 86.3], [19.7, 85.5], [19.0, 84.8], [17.8, 83.3], [16.8, 82.2], [16.1, 81.2], [15.8, 80.8], [14.5, 80.1], [13.4, 80.2], [13.0, 80.2],

  // 13. Tamil Nadu & Kanyakumari (Southmost tip)
  [12.5, 80.2], [11.5, 79.9], [10.3, 79.9], [9.3, 79.0], [9.1, 78.5], [8.5, 77.8], [8.1, 77.3],

  // 14. West Coast (Kerala, Karnataka, Goa, Maharashtra)
  [8.4, 77.0], [9.0, 76.5], [9.8, 76.3], [10.5, 76.0], [11.5, 75.4], [12.2, 75.0], [13.0, 74.8], [14.0, 74.4], [15.0, 74.0], [15.5, 73.8], [16.0, 73.5], [17.0, 73.3], [18.0, 73.0], [19.0, 72.8], [20.0, 72.7], [21.0, 72.5], [21.5, 72.2],

  // 15. Gujarat's Kathiawar Peninsula (back to start)
  [22.0, 72.2], [21.6, 72.4], [21.0, 72.1], [20.8, 71.0], [20.8, 70.3], [21.5, 69.1], [22.3, 69.0]
]

export const BOUNDARY_PATH = BOUNDARY.map(([lat, lng], i) => {
  const { x, y } = project(lat, lng)

  return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
}).join(' ') + ' Z'

export const STATES_CENTERS: { name: string; lat: number; lng: number }[] = [
  { name: 'J & K', lat: 34.1, lng: 74.8 },
  { name: 'Ladakh', lat: 34.3, lng: 77.8 },
  { name: 'HP', lat: 32.0, lng: 77.2 },
  { name: 'Punjab', lat: 31.0, lng: 75.3 },
  { name: 'UK', lat: 30.0, lng: 79.2 },
  { name: 'Haryana', lat: 29.1, lng: 76.1 },
  { name: 'Rajasthan', lat: 26.5, lng: 73.8 },
  { name: 'Gujarat', lat: 22.3, lng: 71.5 },
  { name: 'UP', lat: 26.9, lng: 80.7 },
  { name: 'MP', lat: 23.5, lng: 77.2 },
  { name: 'Bihar', lat: 25.8, lng: 85.5 },
  { name: 'Jharkhand', lat: 23.6, lng: 85.3 },
  { name: 'WB', lat: 23.0, lng: 87.8 },
  { name: 'Chhattisgarh', lat: 21.2, lng: 82.0 },
  { name: 'Odisha', lat: 20.3, lng: 84.5 },
  { name: 'Maharashtra', lat: 19.4, lng: 75.5 },
  { name: 'Telangana', lat: 17.8, lng: 79.0 },
  { name: 'AP', lat: 15.6, lng: 79.5 },
  { name: 'Karnataka', lat: 14.5, lng: 75.7 },
  { name: 'Goa', lat: 15.3, lng: 74.0 },
  { name: 'Kerala', lat: 10.4, lng: 76.5 },
  { name: 'TN', lat: 11.0, lng: 78.6 },
  { name: 'Sikkim', lat: 27.6, lng: 88.4 },
  { name: 'Assam', lat: 26.2, lng: 92.5 },
  { name: 'Arunachal', lat: 28.2, lng: 94.5 },
  { name: 'Tripura', lat: 23.8, lng: 91.8 },
  { name: 'Meghalaya', lat: 25.5, lng: 91.2 }
]

export function getPathD(geometry: any): string {
  if (!geometry) return ''

  if (geometry.type === 'Polygon') {
    return geometry.coordinates
      .map((ring: [number, number][]) => {
        return ring
          .map((coord, idx) => {
            const { x, y } = project(coord[1], coord[0])

            
return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
          })
          .join(' ') + ' Z'
      })
      .join(' ')
  } else if (geometry.type === 'MultiPolygon') {
    return geometry.coordinates
      .map((polygon: [number, number][][]) => {
        return polygon
          .map((ring) => {
            return ring
              .map((coord, idx) => {
                const { x, y } = project(coord[1], coord[0])

                
return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`
              })
              .join(' ') + ' Z'
          })
          .join(' ')
      })
      .join(' ')
  }

  
return ''
}
