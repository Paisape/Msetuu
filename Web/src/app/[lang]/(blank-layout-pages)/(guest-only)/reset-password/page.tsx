import type { Metadata } from 'next'

import ResetPassword from '@views/ResetPassword'

import { getServerMode } from '@core/utils/serverHelpers'

export const metadata: Metadata = {
  title: 'Reset Password',
  description: 'Reset your account password'
}

const ResetPasswordPage = async () => {
  const mode = await getServerMode()

  return <ResetPassword mode={mode} />
}

export default ResetPasswordPage
