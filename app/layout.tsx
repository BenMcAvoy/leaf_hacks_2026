import type { Metadata, Viewport } from "next"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { AuthProvider } from "@/components/providers/auth-provider"
import { AccessibilityProvider } from "@/components/providers/accessibility-provider"
import { PwaRegister } from "@/components/providers/pwa-register"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Study Flow - Learn Your Way",
  description: "Personalised study packs, quizzes and Study Spheres for every learning style.",
  icons: {
    icon: [
      {
        url: "/brand/study-flow-logo-light.png",
        sizes: "963x993",
        type: "image/png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/brand/study-flow-logo-dark.png",
        sizes: "1254x1254",
        type: "image/png",
        media: "(prefers-color-scheme: dark)",
      },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Study Flow",
  },
}

export const viewport: Viewport = {
  themeColor: "#7c3aed",
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
      className={cn("antialiased", "font-sans")}
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
