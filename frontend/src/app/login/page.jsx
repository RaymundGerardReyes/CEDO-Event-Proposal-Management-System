import { redirect } from 'next/navigation';

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

export default function LoginPage() {
    redirect('/sign-in');
} 