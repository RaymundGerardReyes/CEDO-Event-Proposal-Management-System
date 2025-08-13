import AvatarTestComponent from '../components/AvatarTestComponent';

export default function TestAvatarsPage() {
    return (
        <div className="container mx-auto py-6">
            <div className="mb-6">
                <h1 className="text-3xl font-bold">Avatar System Test</h1>
                <p className="text-muted-foreground">
                    Test page for verifying Google OAuth profile picture integration
                </p>
            </div>
            <AvatarTestComponent />
        </div>
    );
} 