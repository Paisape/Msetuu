'use client'

import Typography from '@mui/material/Typography'

import OrderTable from '@/components/admin/OrderTable'
import { ORDER_MODULES } from './orderModules'

const OrdersModuleClient = ({ module }: { module: string }) => {
  const config = ORDER_MODULES[module]

  if (!config) {
    return (
      <div className='p-6'>
        <Typography>Unknown order module.</Typography>
      </div>
    )
  }

  return (
    <div className='p-6'>
      <OrderTable
        title={config.title}
        listUrl={config.listUrl}
        patchUrl={config.patchUrl}
        statusOptions={config.statusOptions}
        columns={config.columns}
        searchPlaceholder={config.searchPlaceholder}
        searchFields={config.searchFields}
        detailHref={item => `/apps/mandir-setu/orders/${module}/${item.id}`}
      />
    </div>
  )
}

export default OrdersModuleClient
