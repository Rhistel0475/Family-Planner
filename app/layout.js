import './globals.css';
import HamburgerMenu from './components/HamburgerMenu';
import BottomNav from './components/BottomNav';
import SetupCheck from './components/SetupCheck';

export const metadata = {
  title: 'Family Planner',
  description: 'A smart family planner starter app deployed on Vercel.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SetupCheck>
          <HamburgerMenu />
          {children}
          <BottomNav />
        </SetupCheck>
      </body>
    </html>
  );
}
