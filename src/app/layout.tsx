import type {Metadata} from 'next';
// Import Inter font
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter', // Define CSS variable for Inter
});


export const metadata: Metadata = {
  title: 'Voice Interviewer',
  description: 'Practice your interviews with AI feedback',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning> {/* Add suppressHydrationWarning for theme switching */}
      {/* Apply Inter font variable to the body */}
      <body className={`${inter.variable} font-sans antialiased`}> {/* Use font-sans utility */}
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  );
}
