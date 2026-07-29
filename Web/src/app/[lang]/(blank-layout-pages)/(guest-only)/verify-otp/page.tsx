import type { Metadata } from 'next'

import VerifyEmail from '@views/VerifyEmail'

import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Verify Email',
  description: 'Verify your account email'
}

const VerifyEmailPage = async () => {
  const mode = await getServerMode()

  return <VerifyEmail mode={mode} />
}

export default VerifyEmailPage
