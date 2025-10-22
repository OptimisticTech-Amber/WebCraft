import { ClerkProvider } from '@clerk/nextjs'
import React from 'react'
import { dark } from '@clerk/themes'

const Layout = ({ children }: { children: React.ReactNode }) => {
  return (
    <main className='flex items-center justify-center h-full'>
    <ClerkProvider appearance={{ baseTheme: dark }}>{children}</ClerkProvider>
    </main>
  )
}

export default Layout