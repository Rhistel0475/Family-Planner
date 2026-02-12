export const metadata = {
  title: 'Family Planner',
  description: 'A smart family planner starter app deployed on Vercel.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
