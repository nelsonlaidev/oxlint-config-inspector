import { createRootRoute, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Inspector } from '@/components/inspector'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ThemeProvider } from '@/contexts/theme'

function RootLayout() {
  return (
    <ThemeProvider>
      <TooltipProvider>
        <Inspector>
          <Outlet />
        </Inspector>
        <TanStackRouterDevtools />
      </TooltipProvider>
    </ThemeProvider>
  )
}

export const Route = createRootRoute({ component: RootLayout })
