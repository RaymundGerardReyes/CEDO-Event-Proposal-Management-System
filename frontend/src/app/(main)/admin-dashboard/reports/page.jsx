"use client"

// Force dynamic rendering to prevent SSG issues
export const dynamic = 'force-dynamic';

import { PageHeader } from "@/components/dashboard/admin/page-header";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card";
import { Input } from "@/components/dashboard/admin/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/dashboard/admin/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/dashboard/admin/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/dashboard/admin/ui/tabs";
import {
    ArrowUpDown,
    BarChart,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    Filter,
    PieChart,
    Search,
    Users,
    X,
} from "lucide-react";

import { Suspense, useCallback, useEffect, useState } from "react";



// ===================================================================
// API FUNCTIONS FOR FETCHING REAL DATA
// ===================================================================

// API base URL - adjust according to your backend setup
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Fetch organizations with real data from MySQL database
const fetchOrganizations = async (filters = {}) => {
    try {
        console.log('📊 Frontend: Fetching organizations from API...');

        const queryParams = new URLSearchParams();
        if (filters.category && filters.category !== 'all') queryParams.append('category', filters.category);
        if (filters.search) queryParams.append('search', filters.search);
        if (filters.sort) queryParams.append('sort', filters.sort);
        if (filters.order) queryParams.append('order', filters.order);

        const response = await fetch(`${API_BASE_URL}/proposals/reports/organizations?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Frontend: Organizations fetched successfully:', data);

        return data;
    } catch (error) {
        console.error('❌ Frontend: Error fetching organizations:', error);
        throw error;
    }
};

// Fetch analytics data
const fetchAnalytics = async () => {
    try {
        console.log('📊 Frontend: Fetching analytics from API...');

        const response = await fetch(`${API_BASE_URL}/proposals/reports/analytics`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Frontend: Analytics fetched successfully:', data);

        return data;
    } catch (error) {
        console.error('❌ Frontend: Error fetching analytics:', error);
        throw error;
    }
};



// Fetch comprehensive analytics for selected organization
const fetchOrgAnalytics = async (organizationName) => {
    try {
        console.log('📊 Frontend: Fetching comprehensive analytics for:', organizationName);

        const encodedOrgName = encodeURIComponent(organizationName);
        const response = await fetch(`${API_BASE_URL}/proposals/reports/organizations/${encodedOrgName}/analytics`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('📊 Frontend: Comprehensive analytics fetched:', data);

        return data;
    } catch (error) {
        console.error('❌ Frontend: Error fetching organization analytics:', error);
        throw error;
    }
};

// CSS for animations (replacing framer-motion)
const styles = {
    modalOverlay: {
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.3)",
        backdropFilter: "blur(4px)",
        zIndex: 40,
        opacity: 0,
        animation: "fadeIn 0.3s ease forwards",
    },
    modalContent: {
        position: "relative",
        zIndex: 50,
        width: "100%",
        maxWidth: "4xl",
        margin: "0 auto",
        maxHeight: "90vh",
        overflowY: "auto",
        opacity: 0,
        transform: "scale(0.9)",
        animation: "scaleIn 0.3s ease forwards",
    },
    slideIn: {
        animation: "slideIn 0.3s ease forwards",
    },
}

function ReportsContent() {
    // Client-side check to prevent SSR issues
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    // State for filters and search
    const [searchTerm, setSearchTerm] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("all")
    const [timeFilter, setTimeFilter] = useState("all")
    const [sortBy, setSortBy] = useState("name")
    const [sortOrder, setSortOrder] = useState("asc")


    // State for modals
    const [selectedOrg, setSelectedOrg] = useState(null)
    const [isOrgDialogOpen, setIsOrgDialogOpen] = useState(false)

    // State for organization analytics
    const [orgAnalytics, setOrgAnalytics] = useState(null)
    const [analyticsLoading, setAnalyticsLoading] = useState(false)

    // State for real data from API
    const [organizations, setOrganizations] = useState([])
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    // Fetch organizations with debounced filtering
    const loadOrganizations = useCallback(async () => {
        try {
            setLoading(true)
            setError(null)

            const filters = {
                category: categoryFilter,
                search: searchTerm,
                sort: sortBy,
                order: sortOrder
            }

            console.log('📊 Frontend: Attempting to fetch organizations with filters:', filters)
            const response = await fetchOrganizations(filters)

            if (response.success) {
                setOrganizations(response.organizations || [])
                console.log('📊 Frontend: Organizations loaded successfully:', response.organizations?.length)
            } else {
                throw new Error(response.error || 'Failed to fetch organizations')
            }
        } catch (err) {
            console.error('❌ Frontend: Error loading organizations:', err)

            // Provide more detailed error messages
            let errorMessage = 'Failed to load organizations'
            if (err.message.includes('500')) {
                errorMessage = 'Server error - please check if the database is running and properly configured'
            } else if (err.message.includes('404')) {
                errorMessage = 'Reports API endpoint not found - please check backend configuration'
            } else if (err.message.includes('Failed to fetch')) {
                errorMessage = 'Cannot connect to server - please check if the backend is running'
            } else {
                errorMessage = err.message
            }

            setError(errorMessage)
            setOrganizations([]) // Fallback to empty array
        } finally {
            setLoading(false)
        }
    }, [categoryFilter, searchTerm, sortBy, sortOrder])

    // Load analytics data
    const loadAnalytics = useCallback(async () => {
        try {
            const response = await fetchAnalytics()

            if (response.success) {
                setAnalytics(response.analytics)
                console.log('📊 Frontend: Analytics loaded successfully')
            } else {
                console.warn('⚠️ Frontend: Analytics fetch failed:', response.error)
            }
        } catch (err) {
            console.error('❌ Frontend: Error loading analytics:', err)
        }
    }, [])



    // Initial data load - only run on client side
    useEffect(() => {
        if (mounted) {
            console.log('📊 Frontend: Initial data load')
            loadOrganizations()
            loadAnalytics()
        }
    }, [mounted, loadOrganizations, loadAnalytics])



    // Handle organization click
    const handleOrgClick = useCallback(async (org) => {
        console.log('📊 Frontend: Organization clicked:', org.name)

        try {
            setSelectedOrg(org)
            setIsOrgDialogOpen(true)
            setOrgAnalytics(null)
            setAnalyticsLoading(true)

            const analyticsData = await fetchOrgAnalytics(org.name)

            if (analyticsData && analyticsData.success) {
                console.log('📊 Frontend: Analytics loaded successfully:', analyticsData.source)
                setOrgAnalytics(analyticsData.analytics)

                if (analyticsData.source !== 'database') {
                    console.warn('📊 Frontend: Using fallback data source:', analyticsData.source)
                }
            } else {
                console.warn('📊 Frontend: Analytics request failed, using fallback')
                setOrgAnalytics(generateFallbackAnalytics(org))
            }
        } catch (error) {
            console.error('❌ Frontend: Error in handleOrgClick:', error)
            setOrgAnalytics(generateFallbackAnalytics(org))
        } finally {
            setAnalyticsLoading(false)
        }
    }, [])

    // Generate fallback analytics data for frontend
    const generateFallbackAnalytics = useCallback((org) => {
        return {
            organization: {
                name: org.name,
                type: org.category,
                description: `Analytics for ${org.name}`,
                contact: {
                    name: org.contactPerson || 'N/A',
                    email: org.contactEmail || 'N/A',
                    phone: org.contactPhone || 'N/A'
                },
                firstEventDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
                lastActivity: org.lastActivity || new Date().toISOString()
            },
            summary: {
                totalEvents: org.totalEvents || 0,
                approvedEvents: org.approvedEvents || org.completedEvents || 0,
                pendingEvents: org.pendingEvents || 0,
                rejectedEvents: org.rejectedEvents || 0,
                completedEvents: org.completedEvents || org.approvedEvents || 0,
                cancelledEvents: org.cancelledEvents || 0,
                approvalRate: org.approvalRate || org.completionRate || 0,
                totalAttendance: org.totalAttendance || 0,
                averageAttendance: org.avgAttendance || 0
            },
            performance: {
                score: org.performanceScore || 75,
                activityLevel: org.activityLevel || 'Medium',
                successTrend: org.successTrend || { direction: 'up', label: 'Good', color: 'blue' },
                avgCompletionDays: 15,
                highAttendanceEvents: Math.floor((org.completedEvents || 0) * 0.3)
            }
        }
    }, [])

    // Toggle sort order
    const toggleSort = useCallback((column) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
        } else {
            setSortBy(column)
            setSortOrder("asc")
        }
    }, [sortBy, sortOrder])



    // Show loading state during SSR/initial mount
    if (!mounted) {
        return (
            <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cedo-blue mb-4"></div>
                        <p className="text-lg text-cedo-blue">Loading Reports...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
            <PageHeader title="Reports" subtitle="Track and manage organization activities and events" />

            <Card className="cedo-card mb-6">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <h2 className="cedo-header">Organization Reports</h2>
                            <p className="cedo-subheader">Track volunteer activities and events across all organizations</p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" className="bg-white">
                                <Download className="h-4 w-4 mr-2" />
                                Export Report
                            </Button>
                            <Button className="bg-cedo-blue hover:bg-cedo-blue/90">
                                <Calendar className="h-4 w-4 mr-2" />
                                Generate Monthly Report
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                <Card className="cedo-card">
                    <CardHeader>
                        <CardTitle>Organization Activity Reports</CardTitle>
                        <CardDescription>View and analyze reports from 41 student organizations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs defaultValue="organizations" className="space-y-4">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                                <TabsList>
                                    <TabsTrigger value="organizations">Organizations</TabsTrigger>
                                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                                </TabsList>

                                <div className="flex w-full sm:w-auto gap-2 flex-wrap sm:flex-nowrap">
                                    <div className="relative w-full sm:w-auto">
                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="search"
                                            placeholder="Search organizations..."
                                            className="pl-8 w-full sm:w-[250px]"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-[180px]">
                                            <SelectValue placeholder="Category" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            <SelectItem value="community">Community-Based</SelectItem>
                                            <SelectItem value="institutionalized">Institutionalized</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select value={timeFilter} onValueChange={setTimeFilter}>
                                        <SelectTrigger className="w-[150px]">
                                            <SelectValue placeholder="Time Period" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Time</SelectItem>
                                            <SelectItem value="month">This Month</SelectItem>
                                            <SelectItem value="quarter">This Quarter</SelectItem>
                                            <SelectItem value="year">This Year</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button variant="outline" size="icon">
                                        <Filter className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <TabsContent value="organizations" className="space-y-4 mt-0">
                                <div className="rounded-md border overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <Table>
                                            <TableHeader className="cedo-table-header">
                                                <TableRow>
                                                    <TableHead className="font-semibold text-cedo-blue">
                                                        <div className="flex items-center cursor-pointer" onClick={() => toggleSort("name")}>
                                                            Organization
                                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">Category</TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">
                                                        <div className="flex items-center cursor-pointer" onClick={() => toggleSort("totalEvents")}>
                                                            Total Events
                                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">Completed</TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">Pending</TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">
                                                        <div
                                                            className="flex items-center cursor-pointer"
                                                            onClick={() => toggleSort("completionRate")}
                                                        >
                                                            Completion Rate
                                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">
                                                        <div
                                                            className="flex items-center cursor-pointer"
                                                            onClick={() => toggleSort("lastActivity")}
                                                        >
                                                            Last Activity
                                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="text-right font-semibold text-cedo-blue">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {loading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-6">
                                                            <div className="flex flex-col items-center justify-center">
                                                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedo-blue mb-2"></div>
                                                                <p className="text-sm text-muted-foreground">Loading organizations...</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : error ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-6">
                                                            <div className="flex flex-col items-center justify-center text-red-600">
                                                                <X className="h-10 w-10 mb-2" />
                                                                <h3 className="text-lg font-medium">Error Loading Data</h3>
                                                                <p className="text-sm">{error}</p>
                                                                <Button
                                                                    variant="outline"
                                                                    className="mt-2"
                                                                    onClick={loadOrganizations}
                                                                >
                                                                    Try Again
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : organizations.length > 0 ? (
                                                    organizations.map((org, index) => (
                                                        <TableRow key={`${org.id}-${index}`} className="cedo-table-row">
                                                            <TableCell>
                                                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm font-medium">
                                                                    {org.name}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    className={
                                                                        org.category === "community"
                                                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                                    }
                                                                >
                                                                    {org.category === "community" ? "Community-Based" : "Institutionalized"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm text-center">
                                                                    {org.totalEvents}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-green-500 text-green-600 px-3 py-1.5 rounded-md text-sm text-center">
                                                                    {org.completedEvents}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-amber-500 text-amber-600 px-3 py-1.5 rounded-md text-sm text-center">
                                                                    {org.pendingEvents}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                                    <div
                                                                        className={`h-2.5 rounded-full ${org.completionRate >= 75
                                                                            ? "bg-green-500"
                                                                            : org.completionRate >= 50
                                                                                ? "bg-amber-500"
                                                                                : "bg-red-500"
                                                                            }`}
                                                                        style={{ width: `${org.completionRate}%` }}
                                                                    ></div>
                                                                </div>
                                                                <div className="text-xs text-center mt-1">{org.completionRate}%</div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm">
                                                                    {new Date(org.lastActivity).toLocaleDateString()}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="outline"
                                                                    size="sm"
                                                                    onClick={() => handleOrgClick(org)}
                                                                    className="hover:bg-cedo-blue/5 hover:text-cedo-blue"
                                                                >
                                                                    View Details
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                ) : (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="text-center py-6">
                                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                                <Search className="h-10 w-10 mb-2" />
                                                                <h3 className="text-lg font-medium">No organizations found</h3>
                                                                <p className="text-sm">Try adjusting your filters or search terms</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="analytics" className="space-y-6 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg text-cedo-blue">Events by Category</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="h-60 flex items-center justify-center">
                                                <PieChart className="h-40 w-40 text-cedo-blue opacity-20" />
                                                {/* In a real implementation, this would be a chart component */}
                                            </div>
                                            <div className="flex justify-center gap-4 mt-2">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                                    <span className="text-sm">Community-Based</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                                    <span className="text-sm">Institutionalized</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg text-cedo-blue">Completion Rates</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="h-60 flex items-center justify-center">
                                                <BarChart className="h-40 w-40 text-cedo-blue opacity-20" />
                                                {/* In a real implementation, this would be a chart component */}
                                            </div>
                                            <div className="flex justify-center gap-4 mt-2">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                                    <span className="text-sm">Completed</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                                                    <span className="text-sm">Pending</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-lg text-cedo-blue">Events by Region</CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-2">
                                            <div className="h-60 flex items-center justify-center">
                                                <BarChart className="h-40 w-40 text-cedo-blue opacity-20" />
                                                {/* In a real implementation, this would be a chart component */}
                                            </div>
                                            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
                                                    <span className="text-sm">North</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                                    <span className="text-sm">East</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-amber-500 mr-2"></div>
                                                    <span className="text-sm">South</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
                                                    <span className="text-sm">West</span>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
                                                    <span className="text-sm">Central</span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-lg text-cedo-blue">Overall Statistics</CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-2">
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Total Organizations</p>
                                                        <p className="text-2xl font-bold text-cedo-blue">
                                                            {analytics?.overview?.totalOrganizations || 0}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-blue-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Total Events</p>
                                                        <p className="text-2xl font-bold text-cedo-blue">
                                                            {analytics?.overview?.totalEvents || 0}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                                                        <Calendar className="h-5 w-5 text-purple-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Completed Events</p>
                                                        <p className="text-2xl font-bold text-green-600">
                                                            {analytics?.overview?.completedEvents || 0}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                        <CheckCircle className="h-5 w-5 text-green-500" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-sm text-muted-foreground">Pending Events</p>
                                                        <p className="text-2xl font-bold text-amber-600">
                                                            {analytics?.overview?.pendingEvents || 0}
                                                        </p>
                                                    </div>
                                                    <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                        <Clock className="h-5 w-5 text-amber-500" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-md font-medium text-cedo-blue mb-3">Overall Completion Rate</h3>
                                            <div className="w-full bg-gray-200 rounded-full h-4">
                                                <div
                                                    className="h-4 rounded-full bg-green-500"
                                                    style={{ width: `${analytics?.overview?.overallCompletionRate || 0}%` }}
                                                ></div>
                                            </div>
                                            <div className="flex justify-between text-sm mt-1">
                                                <span>0%</span>
                                                <span className="font-medium">
                                                    {analytics?.overview?.overallCompletionRate || 0}% Complete
                                                </span>
                                                <span>100%</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>

            {/* Organization Details Modal - Using CSS animations instead of framer-motion */}
            {isOrgDialogOpen && selectedOrg && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Blurred background overlay */}
                    <div style={styles.modalOverlay} onClick={() => setIsOrgDialogOpen(false)} />

                    {/* Organization details modal */}
                    <div style={styles.modalContent}>
                        <Card className="border-cedo-blue/20 shadow-lg">
                            <CardHeader className="relative pb-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-4 top-4"
                                    onClick={() => setIsOrgDialogOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                                <CardTitle className="text-xl text-cedo-blue flex items-center gap-2">
                                    {selectedOrg.name}
                                    <Badge
                                        className={
                                            selectedOrg.category === "community"
                                                ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                                                : "bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2"
                                        }
                                    >
                                        {selectedOrg.category === "community" ? "Community-Based" : "Institutionalized"}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-6 pt-4">
                                {analyticsLoading && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedo-blue"></div>
                                        <span className="ml-2 text-gray-600">Loading comprehensive analytics...</span>
                                    </div>
                                )}

                                {!analyticsLoading && (
                                    <div>
                                        {/* Comprehensive Summary Section */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-6">
                                            <div className="flex items-start justify-between mb-4">
                                                <div>
                                                    <h3 className="text-lg font-semibold text-cedo-blue mb-2">Organization Performance Summary</h3>
                                                    <p className="text-sm text-gray-600 max-w-2xl">
                                                        Comprehensive analysis of {selectedOrg.name}'s event management and approval performance
                                                    </p>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className={`px-3 py-1 rounded-full text-xs font-medium ${(selectedOrg.completionRate || selectedOrg.approvalRate || 0) >= 75
                                                        ? 'bg-green-100 text-green-800'
                                                        : (selectedOrg.completionRate || selectedOrg.approvalRate || 0) >= 50
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-red-100 text-red-800'
                                                        }`}>
                                                        {(selectedOrg.completionRate || selectedOrg.approvalRate || 0) >= 75 ? 'Excellent Performance' :
                                                            (selectedOrg.completionRate || selectedOrg.approvalRate || 0) >= 50 ? 'Good Performance' : 'Needs Improvement'}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Key Insights Grid */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Success Rate</p>
                                                            <p className="text-2xl font-bold text-green-600">{selectedOrg.completionRate}%</p>
                                                            <p className="text-xs text-gray-600">
                                                                {selectedOrg.completedEvents} of {selectedOrg.totalEvents} events approved
                                                            </p>
                                                        </div>
                                                        <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                                                            <CheckCircle className="h-6 w-6 text-green-600" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Activity Level</p>
                                                            <p className="text-2xl font-bold text-blue-600">
                                                                {selectedOrg.totalEvents >= 10 ? 'High' : selectedOrg.totalEvents >= 5 ? 'Medium' : 'Low'}
                                                            </p>
                                                            <p className="text-xs text-gray-600">
                                                                {selectedOrg.totalEvents} total events submitted
                                                            </p>
                                                        </div>
                                                        <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <BarChart className="h-6 w-6 text-blue-600" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-xs text-gray-500 uppercase tracking-wide">Current Status</p>
                                                            <p className="text-2xl font-bold text-amber-600">{selectedOrg.pendingEvents}</p>
                                                            <p className="text-xs text-gray-600">
                                                                events awaiting review
                                                            </p>
                                                        </div>
                                                        <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                                                            <Clock className="h-6 w-6 text-amber-600" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Recommendations */}
                                            <div className="bg-white rounded-lg p-4 border border-gray-200">
                                                <h4 className="text-sm font-semibold text-gray-800 mb-2 flex items-center">
                                                    <Users className="h-4 w-4 mr-2 text-cedo-blue" />
                                                    Recommendations & Insights
                                                </h4>
                                                <div className="space-y-2">
                                                    {selectedOrg.completionRate >= 75 ? (
                                                        <p className="text-sm text-green-700 bg-green-50 p-2 rounded">
                                                            ✅ Excellent approval rate! This organization consistently submits high-quality proposals.
                                                        </p>
                                                    ) : selectedOrg.completionRate >= 50 ? (
                                                        <p className="text-sm text-amber-700 bg-amber-50 p-2 rounded">
                                                            ⚠️ Good performance with room for improvement. Consider providing feedback on rejected proposals.
                                                        </p>
                                                    ) : (
                                                        <p className="text-sm text-red-700 bg-red-50 p-2 rounded">
                                                            ❌ Low approval rate. Recommend scheduling a consultation to improve proposal quality.
                                                        </p>
                                                    )}

                                                    {selectedOrg.pendingEvents > 5 && (
                                                        <p className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                                                            📋 High number of pending events. Consider prioritizing review of this organization's submissions.
                                                        </p>
                                                    )}

                                                    {(selectedOrg.rejectedEvents || 0) > 0 && (
                                                        <p className="text-sm text-purple-700 bg-purple-50 p-2 rounded">
                                                            📊 {selectedOrg.rejectedEvents || 0} rejected events. Review common rejection reasons to provide targeted guidance.
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Enhanced Statistics Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Total Events</p>
                                                            <p className="text-2xl font-bold text-cedo-blue">{selectedOrg.totalEvents}</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                                                            <Calendar className="h-5 w-5 text-blue-500" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Approved Events</p>
                                                            <p className="text-2xl font-bold text-green-600">{selectedOrg.completedEvents}</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                                                            <CheckCircle className="h-5 w-5 text-green-500" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Pending Events</p>
                                                            <p className="text-2xl font-bold text-amber-600">{selectedOrg.pendingEvents}</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                                                            <Clock className="h-5 w-5 text-amber-500" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>

                                            <Card>
                                                <CardContent className="p-4">
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="text-sm text-muted-foreground">Rejected Events</p>
                                                            <p className="text-2xl font-bold text-red-600">{selectedOrg.rejectedEvents || 0}</p>
                                                        </div>
                                                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                                                            <X className="h-5 w-5 text-red-500" />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </div>

                                        {/* Contact Information */}
                                        <div className="bg-gray-50 rounded-lg p-4">
                                            <h4 className="text-sm font-semibold text-gray-800 mb-3">Contact Information</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                                <div>
                                                    <span className="text-gray-600">Contact Person:</span>
                                                    <p className="font-medium">{selectedOrg.contactPerson || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Email:</span>
                                                    <p className="font-medium">{selectedOrg.contactEmail || 'N/A'}</p>
                                                </div>
                                                <div>
                                                    <span className="text-gray-600">Phone:</span>
                                                    <p className="font-medium">{selectedOrg.contactPhone || 'N/A'}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}


                            </CardContent>
                        </Card>
                    </div>
                </div>
            )}



            {/* Add CSS animations to replace framer-motion */}
            <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes scaleIn {
          from { 
            opacity: 0;
            transform: scale(0.9);
          }
          to { 
            opacity: 1;
            transform: scale(1);
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .custom-slide-in {
          animation: slideIn 0.3s ease forwards;
        }
      `}</style>
        </div>
    )
}

export default function ReportsPage() {
    return (
        <Suspense fallback={<div>Loading reports...</div>}>
            <ReportsContent />
        </Suspense>
    )
}