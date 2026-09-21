import './legacy-compat.css';
import './globals.css';
export const metadata = { title: 'Silt Strider', description: 'Morrowind Build Planner & Challenge Run Generator' };
export default function RootLayout({ children }) {
  return <html lang="en"><body>{children}</body></html>;
}
