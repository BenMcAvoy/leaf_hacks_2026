import type { Metadata, Viewport } from "next"
import { Geist, Geist_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { AccessibilityProvider } from "@/components/providers/accessibility-provider"
import { PwaRegister } from "@/components/providers/pwa-register"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'})

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Leaf - Study Smarter",
  description: "AI-powered study app tailored to your learning style.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Leaf",
  },
}

export const viewport: Viewport = {
  themeColor: "#2b3ed1",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", geist.variable)}
    >
      <body>
        <ThemeProvider defaultTheme="dark">
          <AuthProvider>
            <AccessibilityProvider>
              {children}
              <Toaster />
              <PwaRegister />
            </AccessibilityProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
