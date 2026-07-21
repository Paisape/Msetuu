import { useState } from 'react'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import { useAuth } from '../context/AuthContext'
import AartiLyricsScreen from '../screens/AartiLyricsScreen'
import AartisScreen from '../screens/AartisScreen'
import AstrologerListScreen from '../screens/AstrologerListScreen'
import AstrologerProfileScreen from '../screens/AstrologerProfileScreen'
import BookingDetailScreen from '../screens/BookingDetailScreen'
import BookingResultScreen from '../screens/BookingResultScreen'
import CameraGeotagScreen from '../screens/CameraGeotagScreen'
import ChadhavaFormScreen from '../screens/ChadhavaFormScreen'
import ChadhavaListScreen from '../screens/ChadhavaListScreen'
import CitySearchScreen from '../screens/CitySearchScreen'
import DarshanListScreen from '../screens/DarshanListScreen'
import EditProfileScreen from '../screens/EditProfileScreen'
import FAQsScreen from '../screens/FAQsScreen'
import GodGoddessesScreen from '../screens/GodGoddessesScreen'
import HomeScreen from '../screens/HomeScreen'
import HoroscopeScreen from '../screens/HoroscopeScreen'
import JoinWaitlistScreen from '../screens/JoinWaitlistScreen'
import KundaliScreen from '../screens/KundaliScreen'
import MyBookingsScreen from '../screens/MyBookingsScreen'
import NotificationsScreen from '../screens/NotificationsScreen'
import OTPVerificationScreen from '../screens/OTPVerificationScreen'
import PaymentGatewayScreen from '../screens/PaymentGatewayScreen'
import PilgrimServicesScreen from '../screens/PilgrimServicesScreen'
import PujaDetailsScreen from '../screens/PujaDetailsScreen'
import PujaFormScreen from '../screens/PujaFormScreen'
import PujaListScreen from '../screens/PujaListScreen'
import RegisterScreen from '../screens/RegisterScreen'
import ReviewChadhavaBookingScreen from '../screens/ReviewChadhavaBookingScreen'
import ReviewKundliBookingScreen from '../screens/ReviewKundliBookingScreen'
import ReviewPujaBookingScreen from '../screens/ReviewPujaBookingScreen'
import SearchPujaExpertiseScreen from '../screens/SearchPujaExpertiseScreen'
import SessionGapScreen from '../screens/SessionGapScreen'
import SignInScreen from '../screens/SignInScreen'
import SpecializationFilterScreen from '../screens/SpecializationFilterScreen'
import SplashScreen from '../screens/SplashScreen'
import StartSessionScreen from '../screens/StartSessionScreen'
import TaggedSuccessfullyScreen from '../screens/TaggedSuccessfullyScreen'
import YatraScreen from '../screens/YatraScreen'
import type { RootStackParamList } from './types'

const Stack = createNativeStackNavigator<RootStackParamList>()

function AuthStack() {
  const [mode, setMode] = useState<'signIn' | 'register' | 'otp'>('signIn')
  const [pendingEmail, setPendingEmail] = useState('')

  if (mode === 'register') {
    return (
      <RegisterScreen
        onNavigateToLogin={() => setMode('signIn')}
        onRegistered={email => {
          setPendingEmail(email)
          setMode('otp')
        }}
      />
    )
  }

  if (mode === 'otp') {
    return <OTPVerificationScreen email={pendingEmail} onVerified={() => setMode('signIn')} />
  }

  return <SignInScreen onNavigateToRegister={() => setMode('register')} />
}

export default function RootNavigator() {
  const { user, initializing } = useAuth()
  const [splashDone, setSplashDone] = useState(false)

  if (!splashDone) {
    return <SplashScreen onFinished={() => setSplashDone(true)} />
  }

  if (initializing) {
    return null
  }

  if (!user) {
    return <AuthStack />
  }

  return (
    <Stack.Navigator initialRouteName='Home' screenOptions={{ headerTintColor: '#ff6b35' }}>
      <Stack.Screen name='Home' component={HomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name='PilgrimServices' component={PilgrimServicesScreen} options={{ title: 'Pilgrim Services' }} />
      <Stack.Screen name='GodGoddesses' component={GodGoddessesScreen} options={{ title: 'God / Goddesses' }} />
      <Stack.Screen name='CitySearch' component={CitySearchScreen} options={{ title: 'Search City' }} />

      <Stack.Screen name='ChadhavaList' component={ChadhavaListScreen} options={{ title: 'Chadhava' }} />
      <Stack.Screen name='ChadhavaForm' component={ChadhavaFormScreen} options={{ title: 'Chadhava Details' }} />
      <Stack.Screen name='ReviewChadhavaBooking' component={ReviewChadhavaBookingScreen} options={{ title: 'Review Booking' }} />

      <Stack.Screen name='PujaList' component={PujaListScreen} options={{ title: 'Pujas' }} />
      <Stack.Screen name='PujaDetails' component={PujaDetailsScreen} options={{ title: 'Puja Details' }} />
      <Stack.Screen name='PujaForm' component={PujaFormScreen} options={{ title: 'Puja Form' }} />
      <Stack.Screen name='ReviewPujaBooking' component={ReviewPujaBookingScreen} options={{ title: 'Review Booking' }} />

      <Stack.Screen name='BookingResult' component={BookingResultScreen} options={{ headerShown: false }} />
      <Stack.Screen name='PaymentGateway' component={PaymentGatewayScreen} options={{ title: 'Payment' }} />

      <Stack.Screen name='DarshanList' component={DarshanListScreen} options={{ title: 'Darshan' }} />

      <Stack.Screen name='MyBookings' component={MyBookingsScreen} options={{ title: 'My Bookings' }} />
      <Stack.Screen name='BookingDetail' component={BookingDetailScreen} options={{ title: 'Booking' }} />

      <Stack.Screen name='Horoscope' component={HoroscopeScreen} options={{ title: 'Kundali' }} />
      <Stack.Screen name='Kundali' component={KundaliScreen} options={{ title: 'Kundali' }} />
      <Stack.Screen name='ReviewKundliBooking' component={ReviewKundliBookingScreen} options={{ title: 'Review Request' }} />

      <Stack.Screen name='Aartis' component={AartisScreen} options={{ title: 'Aartis & Mantras' }} />
      <Stack.Screen name='AartiLyrics' component={AartiLyricsScreen} options={{ title: 'Aarti' }} />

      <Stack.Screen name='FAQs' component={FAQsScreen} options={{ title: 'FAQs' }} />
      <Stack.Screen name='JoinWaitlist' component={JoinWaitlistScreen} options={{ title: 'Join Waitlist' }} />

      <Stack.Screen name='SearchPujaExpertise' component={SearchPujaExpertiseScreen} options={{ title: 'Shop' }} />
      <Stack.Screen name='Yatra' component={YatraScreen} options={{ title: 'Yatra' }} />
      <Stack.Screen name='Notifications' component={NotificationsScreen} options={{ title: 'Notifications' }} />

      <Stack.Screen name='AstrologerList' component={AstrologerListScreen} options={{ title: 'Astrologers' }} />
      <Stack.Screen name='AstrologerProfile' component={AstrologerProfileScreen} options={{ title: 'Astrologer' }} />
      <Stack.Screen name='StartSession' component={StartSessionScreen} options={{ title: 'Book Consultation' }} />
      <Stack.Screen name='SessionGap' component={SessionGapScreen} options={{ headerShown: false }} />
      <Stack.Screen name='SpecializationFilter' component={SpecializationFilterScreen} options={{ title: 'Filter' }} />

      <Stack.Screen name='EditProfile' component={EditProfileScreen} options={{ title: 'My Profile' }} />
      <Stack.Screen name='CameraGeotag' component={CameraGeotagScreen} options={{ title: 'Tag Visit' }} />
      <Stack.Screen name='TaggedSuccessfully' component={TaggedSuccessfullyScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  )
}
