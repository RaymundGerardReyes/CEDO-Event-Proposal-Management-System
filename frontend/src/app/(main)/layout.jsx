
// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

export default function MainLayout({ children }) {
    return <>{children}</>
}
