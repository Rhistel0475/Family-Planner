import './globals.css';
import HamburgerMenu from './components/HamburgerMenu';
import BottomNav from './components/BottomNav';
import SetupCheck from './components/SetupCheck';
import { ThemeProvider } from './providers/ThemeProvider';
import { SessionProvider } from './providers/SessionProvider';

export const metadata = {
  title: 'Family Planner',
  description: 'A smart family planner starter app deployed on Vercel.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <SetupCheck>
            <ThemeProvider>
              <HamburgerMenu />
              {children}
              <BottomNav />
            </ThemeProvider>
          </SetupCheck>
        </SessionProvider>
      </body>
    </html>
  );
}
