'use client'

// React Imports
import { useState } from 'react'

// Next Imports
import Link from 'next/link'

// MUI Imports
import Button from '@mui/material/Button'
import IconButton from '@mui/material/IconButton'
import useMediaQuery from '@mui/material/useMediaQuery'
import useScrollTrigger from '@mui/material/useScrollTrigger'
import type { Theme } from '@mui/material/styles'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import Badge from '@mui/material/Badge'

import { useSession } from 'next-auth/react'

import type { Mode } from '@core/types'

// Component Imports
import Logo from '@components/layout/shared/Logo'
import FrontMenu from './FrontMenu'
import CustomIconButton from '@core/components/mui/IconButton'
import CartDrawer from './CartDrawer'
import { useCart } from '@/contexts/CartContext'


// Util Imports
import { frontLayoutClasses } from '@layouts/utils/layoutClasses'

// Styles Imports
import styles from './styles.module.css'

const Header = ({ mode }: { mode: Mode }) => {
  // States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const { cart, setCartOpen } = useCart()
  const { data: session } = useSession()

  // Hooks
  const isBelowLgScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))

  // Detect window scroll
  const trigger = useScrollTrigger({
    threshold: 0,
    disableHysteresis: true
  })

  const totalItems = cart.reduce((total, item) => total + item.quantity, 0)

  return (
    <header className={classnames(frontLayoutClasses.header, styles.header)}>
      <div className={classnames(frontLayoutClasses.navbar, styles.navbar, { [styles.headerScrolled]: trigger })}>
        <div className={classnames(frontLayoutClasses.navbarContent, styles.navbarContent)}>
          {isBelowLgScreen ? (
            <div className='flex items-center gap-2 sm:gap-4'>
              <IconButton onClick={() => setIsDrawerOpen(true)} className='-mis-2'>
                <i className='tabler-menu-2 text-textPrimary' />
              </IconButton>
              <Link href='/front-pages/landing-page'>
                <Logo isStatic={true} />
              </Link>
              <FrontMenu mode={mode} isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
            </div>
          ) : (
            <div className='flex items-center gap-5'>
              <Link href='/front-pages/landing-page'>
                <Logo isStatic={true} />
              </Link>
              <FrontMenu mode={mode} isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen} />
            </div>
          )}
          <div className='flex items-center gap-2 sm:gap-4'>
            {/* Cart Button */}
            <CustomIconButton onClick={() => setCartOpen(true)} variant='outlined' color='secondary'>
              <Badge badgeContent={totalItems} color='primary'>
                <i className='tabler-shopping-cart text-xl' />
              </Badge>
            </CustomIconButton>

            {session ? (
              <Button
                component={Link}
                variant='contained'
                href={(session.user as any)?.role === 'ADMIN' ? '/apps/mandir-setu' : '/front-pages/my-orders'}
                startIcon={<i className='tabler-user-check text-xl' />}
                className='whitespace-nowrap galaxy-glow-btn'
              >
                Dashboard
              </Button>
            ) : (
              <Button
                component={Link}
                variant='contained'
                href='/login'
                startIcon={<i className='tabler-lock text-xl' />}
                className='whitespace-nowrap'
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
      <CartDrawer />
    </header>
  )
}

export default Header
