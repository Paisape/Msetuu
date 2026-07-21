import { useEffect, useState } from 'react'
import { Image, Text, View } from 'react-native'

import { getCategories } from '../api/content'
import { getProducts } from '../api/orders'
import type { Category, Product } from '../api/types'
import { Card, EmptyView, Field, LoadingView, Screen, ScreenTitle, SectionTitle } from '../components/ui'

export default function SearchPujaExpertiseScreen() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[] | null>(null)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined)

  useEffect(() => {
    getCategories('ecommerce')
      .then(setCategories)
      .catch(() => setCategories([]))
  }, [])

  useEffect(() => {
    getProducts({ category: activeCategory })
      .then(setProducts)
      .catch(() => setProducts([]))
  }, [activeCategory])

  const filtered = (products ?? []).filter(p => p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <Screen>
      <ScreenTitle>Search Category</ScreenTitle>
      <Field label='Search products' value={query} onChangeText={setQuery} placeholder='Search category' />

      <SectionTitle>Categories</SectionTitle>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categories.map(cat => (
          <Card key={cat.id} onPress={() => setActiveCategory(cat.name === activeCategory ? undefined : cat.name)}>
            <Text style={{ fontWeight: cat.name === activeCategory ? '700' : '500' }}>{cat.name}</Text>
          </Card>
        ))}
      </View>

      <SectionTitle>Products</SectionTitle>
      {!products ? (
        <LoadingView />
      ) : filtered.length === 0 ? (
        <EmptyView message='No products found.' />
      ) : (
        filtered.map(product => (
          <Card key={product.id}>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Image source={{ uri: product.image }} style={{ width: 56, height: 56, borderRadius: 8, backgroundColor: '#eee' }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '700' }}>{product.name}</Text>
                <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 4 }}>₹{product.offerPrice ?? product.price}</Text>
              </View>
            </View>
          </Card>
        ))
      )}
    </Screen>
  )
}
