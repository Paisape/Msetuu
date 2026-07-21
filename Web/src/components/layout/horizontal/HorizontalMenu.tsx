// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import HorizontalNav, { Menu, SubMenu, MenuItem } from '@menu/horizontal-menu'
import VerticalNavContent from './VerticalNavContent'

// import { GenerateHorizontalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledHorizontalNavExpandIcon from '@menu/styles/horizontal/StyledHorizontalNavExpandIcon'
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/horizontal/menuItemStyles'
import menuRootStyles from '@core/styles/horizontal/menuRootStyles'
import verticalNavigationCustomStyles from '@core/styles/vertical/navigationCustomStyles'
import verticalMenuItemStyles from '@core/styles/vertical/menuItemStyles'
import verticalMenuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/horizontalMenuData'

type RenderExpandIconProps = {
  level?: number
}

type RenderVerticalExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

const RenderExpandIcon = ({ level }: RenderExpandIconProps) => (
  <StyledHorizontalNavExpandIcon level={level}>
    <i className='tabler-chevron-right' />
  </StyledHorizontalNavExpandIcon>
)

const RenderVerticalExpandIcon = ({ open, transitionDuration }: RenderVerticalExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const HorizontalMenu = ({ dictionary }: { dictionary: Awaited<ReturnType<typeof getDictionary>> }) => {
  // Hooks
  const verticalNavOptions = useVerticalNav()
  const theme = useTheme()
  const params = useParams()

  // Vars
  const { transitionDuration } = verticalNavOptions
  const { lang: locale } = params

  return (
    <HorizontalNav
      switchToVertical
      verticalNavContent={VerticalNavContent}
      verticalNavProps={{
        customStyles: verticalNavigationCustomStyles(verticalNavOptions, theme),
        backgroundColor: 'var(--mui-palette-background-paper)'
      }}
    >
      <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <SubMenu label='Mandirsetuu' icon={<i className='tabler-building-temple' />}>
          <MenuItem href={`/${locale}/apps/mandir-setu`} icon={<i className='tabler-smart-home' />}>
            Dashboard
          </MenuItem>
          <SubMenu label='Orders' icon={<i className='tabler-shopping-cart' />}>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/chadhava`}>Chadhava Orders</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/epuja`}>E-Puja Orders</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/jyotish`}>Jyotish Consultations</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/kundli`}>Kundli Requests</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/ecommerce`}>Ecommerce Orders</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/yatra`}>Yatra Orders</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/orders/offer`}>Offer Orders</MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/apps/mandir-setu/customers`} icon={<i className='tabler-users' />}>
            Customers
          </MenuItem>
          <MenuItem href={`/${locale}/apps/mandir-setu/notifications`} icon={<i className='tabler-bell' />}>
            Notifications Broadcast
          </MenuItem>
          <SubMenu label='Accounts' icon={<i className='tabler-receipt-2' />}>
            <SubMenu label='Invoice'>
              <MenuItem href={`/${locale}/apps/mandir-setu/accounts/invoices`}>List</MenuItem>
              <MenuItem href={`/${locale}/apps/mandir-setu/accounts/invoices/cancelled`}>Cancelled</MenuItem>
              <MenuItem href={`/${locale}/apps/mandir-setu/accounts/refunds`}>Refund List</MenuItem>
            </SubMenu>
          </SubMenu>
          <SubMenu label='Operation' icon={<i className='tabler-video' />}>
            <MenuItem href={`/${locale}/apps/mandir-setu/operation/video-upload`}>Video Upload</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/operation/geotag`}>Geo-Tagged Photos</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/operation/vr-hosting`}>VR & Video Hosting</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/offers`}>Special Offers</MenuItem>
          </SubMenu>
          <SubMenu label='Content Management' icon={<i className='tabler-photo-edit' />}>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/banners`}>Banners</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/shop-purposes`}>Shop Purposes</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/chadhava-listings`}>Chadhava Listings</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/epuja-listings`}>E-Puja Listings</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/products`}>Products</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/categories`}>Categories</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/kundli-listings`}>Kundli Listings</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/astrologers`}>Astrologers</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/jyotish-time-slots`}>Jyotish Time Slots</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/darshan-temples`}>Darshan Temples</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/faqs`}>FAQs</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/how-it-works`}>How It Works</MenuItem>
            <MenuItem href={`/${locale}/apps/mandir-setu/content/reviews`}>Reviews</MenuItem>
          </SubMenu>
          <MenuItem href={`/${locale}/apps/mandir-setu/config`} icon={<i className='tabler-settings' />}>
            Settings
          </MenuItem>
        </SubMenu>

      </Menu>
      {/* <Menu
        rootStyles={menuRootStyles(theme)}
        renderExpandIcon={({ level }) => <RenderExpandIcon level={level} />}
        menuItemStyles={menuItemStyles(theme, 'tabler-circle')}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        popoutMenuOffset={{
          mainAxis: ({ level }) => (level && level > 0 ? 14 : 12),
          alignmentAxis: 0
        }}
        verticalMenuProps={{
          menuItemStyles: verticalMenuItemStyles(verticalNavOptions, theme),
          renderExpandIcon: ({ open }) => (
            <RenderVerticalExpandIcon open={open} transitionDuration={transitionDuration} />
          ),
          renderExpandedMenuItemIcon: { icon: <i className='tabler-circle text-xs' /> },
          menuSectionStyles: verticalMenuSectionStyles(verticalNavOptions, theme)
        }}
      >
        <GenerateHorizontalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </HorizontalNav>
  )
}

export default HorizontalMenu
