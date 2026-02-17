import './globals.css';
import { Permanent_Marker } from 'next/font/google';
import HamburgerMenu from './components/HamburgerMenu';
import BottomNav from './components/BottomNav';
import SetupCheck from './components/SetupCheck';
import { ThemeProvider } from './providers/ThemeProvider';

const markerFont = Permanent_Marker({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-handwritten',
  display: 'swap'
});

export const metadata = {
  title: 'Family Planner',
  description: 'A smart family planner starter app deployed on Vercel.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={markerFont.variable}>
      <body>
        <SetupCheck>
          <ThemeProvider>
            <HamburgerMenu />
            {children}
            <BottomNav />
          </ThemeProvider>
        </SetupCheck>
      </body>
    </html>
  );
}
