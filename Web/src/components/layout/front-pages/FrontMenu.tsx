'use client'

// React Imports
import { useEffect } from 'react'

// Next Imports
import { usePathname } from 'next/navigation'
import Link from 'next/link'

// MUI Imports
import Typography from '@mui/material/Typography'
import Drawer from '@mui/material/Drawer'
import useMediaQuery from '@mui/material/useMediaQuery'
import type { Theme } from '@mui/material/styles'
import IconButton from '@mui/material/IconButton'

// Third-party Imports
import classnames from 'classnames'

// Type Imports
import type { Mode } from '@core/types'

// Hook Imports
import { useIntersection } from '@/hooks/useIntersection'

// Component Imports
import DropdownMenu from './DropdownMenu'

type Props = {
  mode: Mode
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

type WrapperProps = {
  children: React.ReactNode
  isBelowLgScreen: boolean
  className?: string
  isDrawerOpen: boolean
  setIsDrawerOpen: (open: boolean) => void
}

const Wrapper = (props: WrapperProps) => {
  // Props
  const { children, isBelowLgScreen, className, isDrawerOpen, setIsDrawerOpen } = props

  if (isBelowLgScreen) {
    return (
      <Drawer
        variant='temporary'
        anchor='left'
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        ModalProps={{
          keepMounted: true
        }}
        sx={{ '& .MuiDrawer-paper': { width: ['100%', 300] } }}
        className={classnames('p-5', className)}
      >
        <div className='p-4 flex flex-col gap-x-3'>
          <IconButton onClick={() => setIsDrawerOpen(false)} className='absolute inline-end-4 block-start-2'>
            <i className='tabler-x' />
          </IconButton>
          {children}
        </div>
      </Drawer>
    )
  }

  return <div className={classnames('flex items-center flex-wrap gap-x-4 gap-y-3', className)}>{children}</div>
}

const FrontMenu = (props: Props) => {
  // Props
  const { isDrawerOpen, setIsDrawerOpen, mode } = props

  // Hooks
  const pathname = usePathname()
  const isBelowLgScreen = useMediaQuery((theme: Theme) => theme.breakpoints.down('lg'))

  useEffect(() => {
    if (!isBelowLgScreen && isDrawerOpen) {
      setIsDrawerOpen(false)
    }
  }, [isBelowLgScreen])

  const menuItems = [
    { label: 'Home', href: '/front-pages/landing-page' },
    { label: 'Chadhava', href: '/front-pages/chadhava' },
    { label: 'E-Puja', href: '/front-pages/epuja' },
    { label: 'Horoscope', href: '/front-pages/horoscope' },
    { label: 'Numerology', href: '/front-pages/numerology' },
    { label: 'Kundli', href: '/front-pages/kundli' },
    { label: 'Jyotish', href: '/front-pages/jyotish' },
    { label: 'E-commerce', href: '/front-pages/ecommerce' },
    { label: 'Yatra', href: '/front-pages/yatra' }
  ]

  return (
    <Wrapper isBelowLgScreen={isBelowLgScreen} isDrawerOpen={isDrawerOpen} setIsDrawerOpen={setIsDrawerOpen}>
      {menuItems.map((item) => (
        <Typography
          key={item.label}
          color='text.primary'
          component={Link}
          href={item.href}
          className={classnames('text-[14px] font-semibold plb-3 pli-2 hover:text-primary transition-all duration-200', {
            'text-primary font-bold': pathname === item.href
          })}
        >
          {item.label}
        </Typography>
      ))}
    </Wrapper>
  )
}

export default FrontMenu

