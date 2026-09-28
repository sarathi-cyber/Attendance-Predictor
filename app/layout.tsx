import './globals.css';
import type { Metadata } from 'next';
export const metadata: Metadata = { title:'The Attendance Predictor', description:'Plan attendance before it becomes a problem.' };
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en"><body>{children}</body></html>; }
