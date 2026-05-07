import { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/contexts/theme-context';

export const metadata: Metadata = {
  title: 'ElevIQ: A GenAI-Powered Personal Finance Assistant',
  description: 'GenAI-powered personal finance management application',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100">
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
