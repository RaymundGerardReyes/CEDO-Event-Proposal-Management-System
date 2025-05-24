// frontend/pages/index.js
import { useAuth } from '@/contexts/auth-context'; // Adjust the import based on your context path
import { useRouter } from 'next/router';
import { useEffect } from 'react';

const HomePage = () => {
    const router = useRouter();
    const { user, isInitialized } = useAuth(); // Assuming you have a way to get the user and loading state

    useEffect(() => {
        if (isInitialized && user) {
            // Redirect to the appropriate dashboard based on user role
            if (user.role === 'student') {
                router.replace('/student-dashboard');
            } else if (user.role === 'admin') {
                router.replace('/admin-dashboard');
            }
        }
    }, [isInitialized, user, router]);

    return <div>Loading...</div>; // Optional loading state
};

export default HomePage;