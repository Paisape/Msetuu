import { useCallback, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Text } from 'react-native'

import { getMyOrders } from '../api/orders'
import type { MyOrder } from '../api/types'
import { Card, EmptyView, ErrorView, LoadingView, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'MyBookings'>

export default function MyBookingsScreen({ navigation }: Props) {
  const { user } = useAuth()
  const [orders, setOrders] = useState<MyOrder[] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    if (!user) return
    setError(null)
    getMyOrders()
      .then(setOrders)
      .catch(err => setError(err instanceof Error ? err.message : 'Failed to load'))
  }, [user])

  useFocusEffect(load)

  if (!user) {
    return (
      <Screen>
        <ScreenTitle>My Bookings</ScreenTitle>
        <Card style={{ paddingVertical: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: '#ff6b35', marginBottom: 8 }}>Sign In Required</Text>
          <Text style={{ color: '#6b6b6b', textAlign: 'center', marginBottom: 16 }}>
            Please sign in to view your booked Pujas, Chadhavas, and Consultations.
          </Text>
          <PrimaryButton label='Sign In / Register' onPress={() => navigation.navigate('SignIn')} />
        </Card>
      </Screen>
    )
  }

  if (error) return <ErrorView message={error} onRetry={load} />
  if (!orders) return <LoadingView />

  return (
    <Screen>
      <ScreenTitle>My Bookings</ScreenTitle>
      {orders.length === 0 && <EmptyView message="You haven't booked anything yet." />}
      {orders.map(order => (
        <Card key={`${order.type}-${order.id}`} onPress={() => navigation.navigate('BookingDetail', { type: order.type, id: order.id, label: order.label })}>
          <Text style={{ fontWeight: '700' }}>{order.label}</Text>
          <Text style={{ color: '#6b6b6b', marginTop: 2 }}>{order.type} · {order.status}</Text>
          <Text style={{ color: '#ff6b35', fontWeight: '700', marginTop: 4 }}>
            ₹{order.amount} · {order.paymentStatus}
          </Text>
        </Card>
      ))}
    </Screen>
  )
}

