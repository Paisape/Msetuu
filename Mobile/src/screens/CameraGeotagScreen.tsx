import { useState } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Alert } from 'react-native'

import { submitGeotag } from '../api/orders'
import { Field, GapNotice, PrimaryButton, Screen, ScreenTitle } from '../components/ui'
import type { RootStackParamList } from '../navigation/types'

type Props = NativeStackScreenProps<RootStackParamList, 'CameraGeotag'>

/**
 * A real camera flow needs `expo-image-picker` (not installed in this scaffold) to
 * capture a photo, then POST it to /api/upload/review-media (NOT /api/upload — that
 * one's admin-only, see docs/MOBILE_API_MAPPING.md #7) before calling /api/geotag with
 * the resulting URL. This screen accepts an already-hosted image URL directly so the
 * /api/geotag wiring can be tested without the camera dependency.
 */
export default function CameraGeotagScreen({ navigation }: Props) {
  const [imageUrl, setImageUrl] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!imageUrl) {
      Alert.alert('Add a photo URL', 'Paste a hosted image URL to tag.')

      return
    }

    setSubmitting(true)

    try {
      await submitGeotag(imageUrl, latitude ? Number(latitude) : undefined, longitude ? Number(longitude) : undefined)
      navigation.navigate('TaggedSuccessfully')
    } catch (err) {
      Alert.alert('Tagging failed', err instanceof Error ? err.message : 'Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Screen>
      <ScreenTitle>Tag Yourself at a Temple</ScreenTitle>
      <GapNotice>
        Real camera capture needs the `expo-image-picker` package (not installed here). Paste an already-hosted
        photo URL below to exercise the /api/geotag call in the meantime.
      </GapNotice>
      <Field label='Photo URL' value={imageUrl} onChangeText={setImageUrl} placeholder='https://…' />
      <Field label='Latitude (optional)' value={latitude} onChangeText={setLatitude} keyboardType='numeric' />
      <Field label='Longitude (optional)' value={longitude} onChangeText={setLongitude} keyboardType='numeric' />
      <PrimaryButton label='Submit' onPress={handleSubmit} loading={submitting} />
    </Screen>
  )
}
