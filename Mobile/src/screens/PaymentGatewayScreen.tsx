import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert, Text } from 'react-native'

import { Card, GapNotice, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentGateway'>

/**
 * The server-side order-creation call already returned a Razorpay order (id/amount/
 * currency/key). Finishing payment requires the Razorpay Checkout native SDK
 * (`react-native-razorpay`), which isn't installed in this scaffold — wiring it up is
 * a small, mechanical follow-up:
 *   1. `npx expo install react-native-razorpay` (requires a dev build, not Expo Go)
 *   2. Call `RazorpayCheckout.open({ key, amount, currency, order_id: razorpayOrder.id })`
 *   3. On success, call `verifyPayment({ orderType, orderId, razorpayPaymentId, razorpayOrderId, razorpaySignature })`
 * This screen shows the real order total from the server and stops short of faking a
 * payment result, since /api/payment/verify cryptographically checks the signature —
 * there's no client-side shortcut that would actually pass.
 */
export default function PaymentGatewayScreen({ route, navigation }: Props) {
  const { razorpayOrder, orderType, orderId } = route.params
  const [understood, setUnderstood] = useState(false)

  if (!razorpayOrder) {
    return (
      <Screen>
        <ScreenTitle>Payment</ScreenTitle>
        <GapNotice>Payment is not configured on the server (Razorpay keys missing) — this order can&apos;t be paid for yet.</GapNotice>
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenTitle>Payment Gateway</ScreenTitle>
      <Card>
        <Text style={{ fontWeight: '700' }}>Proceed to Pay — ₹{(razorpayOrder.amount / 100).toFixed(2)}</Text>
        <Text style={{ color: '#6b6b6b', marginTop: 4 }}>Order: {orderType} · {orderId}</Text>
      </Card>
      <GapNotice>
        Razorpay Checkout SDK isn&apos;t wired up in this scaffold yet — see the comment at the top of
        PaymentGatewayScreen.tsx for the exact 3 steps needed to finish this screen.
      </GapNotice>
      <PrimaryButton
        label='I understand — view integration notes'
        onPress={() => {
          setUnderstood(true)
          Alert.alert(
            'Integration point',
            'Call RazorpayCheckout.open({...}) here with the razorpayOrder shown above, then POST the result to /api/payment/verify.'
          )
        }}
      />
      {understood && <PrimaryButton label='Back' onPress={() => navigation.navigate('BookingResult', { success: false, message: 'Payment not completed (SDK not integrated).' })} />}
    </Screen>
  )
}
