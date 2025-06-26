"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { CheckCircle, ExternalLink, Eye, EyeOff, RefreshCw, User, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { userApi } from '../api/user-api';
import UserAvatar from './UserAvatar';

/**
 * Test component to verify Google OAuth profile picture functionality
 * This component demonstrates the enhanced avatar system working correctly
 */
const AvatarTestComponent = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showDebugInfo, setShowDebugInfo] = useState(false);

    // Fetch all users to test avatar display
    const fetchUsers = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await userApi.getAllUsers();
            setUsers(response || []);
        } catch (err) {
            setError(err.message || 'Failed to fetch users');
            console.error('Error fetching users for avatar test:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    // Test different avatar scenarios
    const testScenarios = [
        {
            name: 'Google OAuth User',
            user: {
                id: 'test-google-1',
                name: 'John Doe',
                email: 'john@gmail.com',
                avatar: 'https://lh3.googleusercontent.com/a/ACg8ocKxVxvJGJXhCVc8b9c1d2e3f4g5h6i7j8k9l0m1n2o3p4q5r6s7t8u9v0w1x2y3z4=s96-c',
                google_id: 'google_123456789',
                authProvider: 'google',
                role: 'student'
            }
        },
        {
            name: 'Admin User (Local)',
            user: {
                id: 'test-admin-1',
                name: 'Admin User',
                email: 'admin@example.com',
                avatar: null,
                google_id: null,
                authProvider: 'local',
                role: 'head_admin'
            }
        },
        {
            name: 'User with Broken Avatar',
            user: {
                id: 'test-broken-1',
                name: 'Broken Avatar',
                email: 'broken@example.com',
                avatar: 'https://invalid-url.com/broken-image.jpg',
                google_id: null,
                authProvider: 'local',
                role: 'student'
            }
        }
    ];

    const getAvatarAnalysis = (user) => {
        const analysis = {
            hasAvatar: !!user.avatar,
            isGoogleUser: !!(user.google_id || (user.avatar && user.avatar.includes('googleusercontent.com'))),
            avatarSource: user.avatar ? 'URL provided' : 'No avatar',
            expectedFallback: user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'
        };
        return analysis;
    };

    return (
        <div className="space-y-6 p-4">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                Avatar System Test
                            </CardTitle>
                            <CardDescription>
                                Testing Google OAuth profile picture integration and fallback behavior
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setShowDebugInfo(!showDebugInfo)}
                            >
                                {showDebugInfo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                {showDebugInfo ? 'Hide Debug' : 'Show Debug'}
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchUsers}
                                disabled={loading}
                            >
                                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                                Refresh
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Current User Test */}
                    {currentUser && (
                        <div>
                            <h3 className="text-lg font-semibold mb-3">Current User Avatar</h3>
                            <div className="flex items-center gap-4 p-4 border rounded-lg">
                                <UserAvatar user={currentUser} size="lg" showIndicator={true} />
                                <div className="flex-1">
                                    <p className="font-medium">{currentUser.name}</p>
                                    <p className="text-sm text-muted-foreground">{currentUser.email}</p>
                                    <div className="flex gap-2 mt-2">
                                        <Badge variant={currentUser.google_id ? 'default' : 'secondary'}>
                                            {currentUser.google_id ? 'Google OAuth' : 'Local Account'}
                                        </Badge>
                                        <Badge variant="outline">{currentUser.role}</Badge>
                                    </div>
                                    {showDebugInfo && (
                                        <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                            <p><strong>Avatar URL:</strong> {currentUser.avatar || 'None'}</p>
                                            <p><strong>Google ID:</strong> {currentUser.google_id || 'None'}</p>
                                            <p><strong>Auth Provider:</strong> {currentUser.authProvider || 'Not set'}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Test Scenarios */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Test Scenarios</h3>
                        <div className="grid gap-4">
                            {testScenarios.map((scenario, index) => {
                                const analysis = getAvatarAnalysis(scenario.user);
                                return (
                                    <div key={index} className="flex items-center gap-4 p-4 border rounded-lg">
                                        <UserAvatar user={scenario.user} size="md" showIndicator={true} />
                                        <div className="flex-1">
                                            <p className="font-medium">{scenario.name}</p>
                                            <p className="text-sm text-muted-foreground">{scenario.user.email}</p>
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant={analysis.isGoogleUser ? 'default' : 'secondary'}>
                                                    {analysis.isGoogleUser ? 'Google' : 'Local'}
                                                </Badge>
                                                <Badge variant="outline">{scenario.user.role}</Badge>
                                                {analysis.hasAvatar ? (
                                                    <Badge variant="success">
                                                        <CheckCircle className="h-3 w-3 mr-1" />
                                                        Has Avatar
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="destructive">
                                                        <XCircle className="h-3 w-3 mr-1" />
                                                        No Avatar
                                                    </Badge>
                                                )}
                                            </div>
                                            {showDebugInfo && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                                    <p><strong>Avatar Source:</strong> {analysis.avatarSource}</p>
                                                    <p><strong>Expected Fallback:</strong> {analysis.expectedFallback}</p>
                                                    <p><strong>Is Google User:</strong> {analysis.isGoogleUser ? 'Yes' : 'No'}</p>
                                                    {scenario.user.avatar && (
                                                        <p><strong>Avatar URL:</strong>
                                                            <a
                                                                href={scenario.user.avatar}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline ml-1"
                                                            >
                                                                View <ExternalLink className="h-3 w-3 inline" />
                                                            </a>
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <Separator />

                    {/* Real Users from Database */}
                    <div>
                        <h3 className="text-lg font-semibold mb-3">Database Users ({users.length})</h3>
                        {error && (
                            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 mb-4">
                                <p className="font-medium">Error loading users:</p>
                                <p className="text-sm">{error}</p>
                            </div>
                        )}
                        {loading ? (
                            <div className="flex items-center justify-center p-8">
                                <RefreshCw className="h-6 w-6 animate-spin mr-2" />
                                Loading users...
                            </div>
                        ) : (
                            <div className="grid gap-4">
                                {users.slice(0, 10).map((user) => { // Limit to first 10 for performance
                                    const analysis = getAvatarAnalysis(user);
                                    return (
                                        <div key={user.id} className="flex items-center gap-4 p-4 border rounded-lg">
                                            <UserAvatar user={user} size="md" showIndicator={true} />
                                            <div className="flex-1">
                                                <p className="font-medium">{user.name}</p>
                                                <p className="text-sm text-muted-foreground">{user.email}</p>
                                                <div className="flex gap-2 mt-2">
                                                    <Badge variant={analysis.isGoogleUser ? 'default' : 'secondary'}>
                                                        {analysis.isGoogleUser ? 'Google' : 'Local'}
                                                    </Badge>
                                                    <Badge variant="outline">{user.role}</Badge>
                                                    <Badge variant={user.is_approved ? 'success' : 'destructive'}>
                                                        {user.is_approved ? 'Approved' : 'Pending'}
                                                    </Badge>
                                                </div>
                                                {showDebugInfo && (
                                                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                                                        <p><strong>User ID:</strong> {user.id}</p>
                                                        <p><strong>Avatar URL:</strong> {user.avatar || 'None'}</p>
                                                        <p><strong>Google ID:</strong> {user.google_id || 'None'}</p>
                                                        <p><strong>Created:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                                {users.length === 0 && !loading && (
                                    <div className="text-center p-8 text-muted-foreground">
                                        No users found in the database.
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default AvatarTestComponent; 