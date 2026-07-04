import '@/styles/globals.css'

import { createHashHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import { routeTree } from './routeTree.gen'

const router = createRouter({
  history: createHashHistory(),
  routeTree,
})

declare module '@tanstack/react-router' {
  // oxlint-disable-next-line typescript/consistent-type-definitions
  interface Register {
    router: typeof router
  }
}

// oxlint-disable-next-line typescript/no-non-null-assertion
const rootElement = document.querySelector('#root')!

if (!rootElement.innerHTML) {
  const root = createRoot(rootElement)

  root.render(
    <StrictMode>
      <RouterProvider router={router} />
    </StrictMode>,
  )
}
