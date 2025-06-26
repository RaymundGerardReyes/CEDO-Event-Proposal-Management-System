"use client"

import { Badge } from "@/components/dashboard/student/ui/badge";
import { Button } from "@/components/dashboard/student/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/student/ui/card";
import { Separator } from "@/components/dashboard/student/ui/separator";
import {
    AvatarBasic,
    AvatarGroup,
    AvatarProfile,
    AvatarStatus
} from "@/components/ui/avatar-origin";
import {
    GraduationCap,
    Shield,
    UserCircle,
    Users
} from "lucide-react";

export default function AvatarDemoPage() {
    // Sample user data
    const sampleUsers = [
        { id: 1, name: "John Doe", role: "Student", status: "online" },
        { id: 2, name: "Jane Smith", role: "Admin", status: "away" },
        { id: 3, name: "Bob Wilson", role: "Faculty", status: "online" },
        { id: 4, name: "Alice Brown", role: "Staff", status: "offline" },
        { id: 5, name: "Charlie Davis", role: "Student", status: "busy" },
    ];

    const handleAvatarEdit = () => {
        alert("Avatar edit functionality would be implemented here!");
    };

    return (
        <div className="container mx-auto py-6 space-y-8">
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold text-cedo-blue">
                    Origin UI Avatar Demo
                </h1>
                <p className="text-muted-foreground">
                    Showcasing enhanced avatar components integrated into CEDO Partnership Management System
                </p>
            </div>

            {/* Basic Avatars */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserCircle size={20} />
                        Basic Avatars
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-3">Different Sizes</h3>
                            <div className="flex items-center gap-4">
                                <AvatarBasic size="xs" alt="Extra Small" />
                                <AvatarBasic size="sm" alt="Small" />
                                <AvatarBasic size="md" alt="Medium" />
                                <AvatarBasic size="lg" alt="Large" />
                                <AvatarBasic size="xl" alt="Extra Large" />
                                <AvatarBasic size="2xl" alt="2X Large" />
                            </div>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-medium mb-3">With Initials</h3>
                            <div className="flex items-center gap-4">
                                <AvatarBasic alt="John Doe" size="md" />
                                <AvatarBasic alt="Jane Smith" size="md" />
                                <AvatarBasic alt="Bob Wilson" size="md" />
                                <AvatarBasic alt="Alice Brown" size="md" />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Status Avatars */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Shield size={20} />
                        Status Avatars
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-medium mb-3">Different Status Types</h3>
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <AvatarStatus alt="Online User" status="online" size="lg" />
                                    <p className="text-xs mt-2 text-green-600">Online</p>
                                </div>
                                <div className="text-center">
                                    <AvatarStatus alt="Away User" status="away" size="lg" />
                                    <p className="text-xs mt-2 text-yellow-600">Away</p>
                                </div>
                                <div className="text-center">
                                    <AvatarStatus alt="Busy User" status="busy" size="lg" />
                                    <p className="text-xs mt-2 text-red-600">Busy</p>
                                </div>
                                <div className="text-center">
                                    <AvatarStatus alt="Offline User" status="offline" size="lg" />
                                    <p className="text-xs mt-2 text-gray-600">Offline</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Avatar Groups */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users size={20} />
                        Avatar Groups
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div>
                            <h3 className="font-medium mb-3">Team Members (Max 4)</h3>
                            <AvatarGroup max={4} size="md">
                                {sampleUsers.map((user) => (
                                    <AvatarStatus
                                        key={user.id}
                                        alt={user.name}
                                        status={user.status}
                                    />
                                ))}
                            </AvatarGroup>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-medium mb-3">Large Group (Max 3)</h3>
                            <AvatarGroup max={3} size="lg">
                                {sampleUsers.map((user) => (
                                    <AvatarBasic
                                        key={user.id}
                                        alt={user.name}
                                    />
                                ))}
                            </AvatarGroup>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Profile Avatars */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <GraduationCap size={20} />
                        Profile Avatars
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-6">
                            {/* Student Profile */}
                            <div className="text-center space-y-4">
                                <h3 className="font-medium">Student Profile</h3>
                                <AvatarProfile
                                    name="John Doe"
                                    role="Computer Science Student"
                                    size="2xl"
                                    showEdit={true}
                                    onEdit={handleAvatarEdit}
                                />
                                <div className="flex gap-2 justify-center">
                                    <Badge variant="secondary" className="bg-cedo-blue/10 text-cedo-blue">
                                        <GraduationCap size={12} className="mr-1" />
                                        Student
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Active
                                    </Badge>
                                </div>
                            </div>

                            {/* Admin Profile */}
                            <div className="text-center space-y-4">
                                <h3 className="font-medium">Admin Profile</h3>
                                <AvatarProfile
                                    name="Jane Smith"
                                    role="System Administrator"
                                    size="2xl"
                                    showEdit={true}
                                    onEdit={handleAvatarEdit}
                                />
                                <div className="flex gap-2 justify-center">
                                    <Badge variant="default" className="bg-primary text-primary-foreground">
                                        <Shield size={12} className="mr-1" />
                                        Administrator
                                    </Badge>
                                    <Badge variant="outline" className="text-xs">
                                        Online
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Integration Examples */}
            <Card>
                <CardHeader>
                    <CardTitle>Integration Examples</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Team Collaboration</h3>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <AvatarGroup max={3} size="sm">
                                        {sampleUsers.slice(0, 4).map((user) => (
                                            <AvatarStatus
                                                key={user.id}
                                                alt={user.name}
                                                status={user.status}
                                            />
                                        ))}
                                    </AvatarGroup>
                                    <div>
                                        <p className="font-medium text-sm">Project Alpha Team</p>
                                        <p className="text-xs text-muted-foreground">
                                            {sampleUsers.filter(u => u.status === 'online').length} members online
                                        </p>
                                    </div>
                                </div>
                                <Button variant="outline" size="sm">
                                    View Team
                                </Button>
                            </div>
                        </div>

                        <div className="bg-muted/30 p-4 rounded-lg">
                            <h3 className="font-medium mb-2">Recent Activity</h3>
                            <div className="space-y-3">
                                {sampleUsers.slice(0, 3).map((user) => (
                                    <div key={user.id} className="flex items-center gap-3">
                                        <AvatarStatus
                                            alt={user.name}
                                            status={user.status}
                                            size="sm"
                                        />
                                        <div className="flex-1">
                                            <p className="text-sm font-medium">{user.name}</p>
                                            <p className="text-xs text-muted-foreground">
                                                Updated their profile • 2 hours ago
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Implementation Details</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4 text-sm">
                        <div>
                            <h3 className="font-medium mb-2">Components Available:</h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li><code>AvatarBasic</code> - Simple avatar with initials fallback</li>
                                <li><code>AvatarStatus</code> - Avatar with online/offline status indicator</li>
                                <li><code>AvatarGroup</code> - Multiple avatars with overflow count</li>
                                <li><code>AvatarProfile</code> - Enhanced profile avatar with edit functionality</li>
                            </ul>
                        </div>
                        <Separator />
                        <div>
                            <h3 className="font-medium mb-2">Integration:</h3>
                            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                <li>✅ Admin Profile Page - Enhanced with AvatarProfile and team avatars</li>
                                <li>✅ Student Profile Page - Upgraded with status indicators</li>
                                <li>✅ CSS Variables - Added Origin UI support in globals.css</li>
                                <li>✅ Tailwind Config - Updated to include UI components path</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 