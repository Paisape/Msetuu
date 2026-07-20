// Next Imports
import { useParams } from 'next/navigation'

// MUI Imports
import { useTheme } from '@mui/material/styles'

// Third-party Imports
import PerfectScrollbar from 'react-perfect-scrollbar'

// Type Imports
import type { getDictionary } from '@/utils/getDictionary'
import type { VerticalMenuContextProps } from '@menu/components/vertical-menu/Menu'

// Component Imports
import { Menu, SubMenu, MenuItem, MenuSection } from '@menu/vertical-menu'

// import { GenerateVerticalMenu } from '@components/GenerateMenu'

// Hook Imports
import useVerticalNav from '@menu/hooks/useVerticalNav'

// Styled Component Imports
import StyledVerticalNavExpandIcon from '@menu/styles/vertical/StyledVerticalNavExpandIcon'

// Style Imports
import menuItemStyles from '@core/styles/vertical/menuItemStyles'
import menuSectionStyles from '@core/styles/vertical/menuSectionStyles'

// Menu Data Imports
// import menuData from '@/data/navigation/verticalMenuData'

type RenderExpandIconProps = {
  open?: boolean
  transitionDuration?: VerticalMenuContextProps['transitionDuration']
}

type Props = {
  dictionary: Awaited<ReturnType<typeof getDictionary>>
  scrollMenu: (container: any, isPerfectScrollbar: boolean) => void
}

const RenderExpandIcon = ({ open, transitionDuration }: RenderExpandIconProps) => (
  <StyledVerticalNavExpandIcon open={open} transitionDuration={transitionDuration}>
    <i className='tabler-chevron-right' />
  </StyledVerticalNavExpandIcon>
)

const VerticalMenu = ({ dictionary, scrollMenu }: Props) => {
  // Hooks
  const theme = useTheme()
  const verticalNavOptions = useVerticalNav()
  const params = useParams()

  // Vars
  const { isBreakpointReached, transitionDuration } = verticalNavOptions
  const { lang: locale } = params

  const ScrollWrapper = isBreakpointReached ? 'div' : PerfectScrollbar

  return (
    // eslint-disable-next-line lines-around-comment
    /* Custom scrollbar instead of browser scroll, remove if you want browser scroll only */
    <ScrollWrapper
      {...(isBreakpointReached
        ? {
            className: 'bs-full overflow-y-auto overflow-x-hidden',
            onScroll: container => scrollMenu(container, false)
          }
        : {
            options: { wheelPropagation: false, suppressScrollX: true },
            onScrollY: container => scrollMenu(container, true)
          })}
    >
      {/* Incase you also want to scroll NavHeader to scroll with Vertical Menu, remove NavHeader from above and paste it below this comment */}
      {/* Vertical Menu */}
      <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >

        <MenuSection label='Mandir Setu'>
          <MenuItem href={`/${locale}/apps/mandir-setu`} icon={<i className='tabler-building-temple' />}>
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
        </MenuSection>
      </Menu>
      {/* <Menu
        popoutMenuOffset={{ mainAxis: 23 }}
        menuItemStyles={menuItemStyles(verticalNavOptions, theme)}
        renderExpandIcon={({ open }) => <RenderExpandIcon open={open} transitionDuration={transitionDuration} />}
        renderExpandedMenuItemIcon={{ icon: <i className='tabler-circle text-xs' /> }}
        menuSectionStyles={menuSectionStyles(verticalNavOptions, theme)}
      >
        <GenerateVerticalMenu menuData={menuData(dictionary)} />
      </Menu> */}
    </ScrollWrapper>
  )
}

export default VerticalMenu
