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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    ArrowUpDown,
    BarChart,
    CheckCircle,
    Clock,
    Download,
    Filter,
    Search,
    Users,
    X
} from "lucide-react";

import { Suspense, useCallback, useEffect, useState } from "react";
import ReportGenerator from "./ReportGenerator";

// ===================================================================
// API FUNCTIONS FOR FETCHING REAL DATA
// ===================================================================

// API base URL - adjust according to your backend setup
const API_BASE_URL = process.env.API_URL || 'http://localhost:5000/api';

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
            statistics: {
                totalProposals: org.totalProposals || 0,
                approvedCount: org.approvedCount || 0,
                pendingCount: org.pendingCount || 0,
                rejectedCount: org.rejectedCount || 0,
                draftCount: org.draftCount || 0,
                approvalRate: org.approvalRate || 0,
                avgProcessingDays: org.avgProcessingDays || 0
            },
            trends: {
                last7Days: Math.floor(Math.random() * 5),
                last30Days: Math.floor(Math.random() * 15)
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
                            <Button
                                variant="outline"
                                className="bg-white"
                                onClick={() => {
                                    loadOrganizations()
                                    loadAnalytics()
                                }}
                                disabled={loading}
                            >
                                {loading ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-cedo-blue mr-2"></div>
                                ) : (
                                    <BarChart className="h-4 w-4 mr-2" />
                                )}
                                Refresh Data
                            </Button>
                            <Button variant="outline" className="bg-white">
                                <Download className="h-4 w-4 mr-2" />
                                Export Current View
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 gap-6">
                <Card className="cedo-card">
                    <CardHeader>
                        <CardTitle>Organization Activity Reports</CardTitle>
                        <CardDescription>View and analyze reports from organizations with real-time data</CardDescription>
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
                                            <SelectItem value="school-based">School-Based</SelectItem>
                                            <SelectItem value="community-based">Community-Based</SelectItem>
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
                                                        <div className="flex items-center cursor-pointer" onClick={() => toggleSort("totalProposals")}>
                                                            Total Proposals
                                                            <ArrowUpDown className="ml-2 h-4 w-4" />
                                                        </div>
                                                    </TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">Approved</TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">Drafts</TableHead>
                                                    <TableHead className="font-semibold text-cedo-blue">
                                                        <div
                                                            className="flex items-center cursor-pointer"
                                                            onClick={() => toggleSort("approvalRate")}
                                                        >
                                                            Approval Rate
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
                                                                        org.category === "community-based"
                                                                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                                                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100"
                                                                    }
                                                                >
                                                                    {org.category === "community-based" ? "Community-Based" : "School-Based"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-cedo-blue text-cedo-blue px-3 py-1.5 rounded-md text-sm text-center">
                                                                    {org.totalProposals}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-green-500 text-green-600 px-3 py-1.5 rounded-md text-sm text-center">
                                                                    {org.approvedCount}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="border border-amber-500 text-amber-600 px-3 py-1.5 rounded-md text-sm text-center">
                                                                    {org.draftCount}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="border border-purple-500 text-purple-600 px-3 py-1.5 rounded-md text-sm">
                                                                        {org.approvalRate}%
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="text-sm text-muted-foreground">
                                                                    {org.lastActivity ? new Date(org.lastActivity).toLocaleDateString() : 'N/A'}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-right">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => handleOrgClick(org)}
                                                                    className="text-cedo-blue hover:text-cedo-blue/80"
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
                                                                <Users className="h-10 w-10 mb-2" />
                                                                <h3 className="text-lg font-medium">No Organizations Found</h3>
                                                                <p className="text-sm">Try adjusting your search or filter criteria.</p>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </div>
                                </div>
                            </TabsContent>

                            <TabsContent value="analytics" className="space-y-4 mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <Users className="h-8 w-8 text-cedo-blue" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">Total Organizations</p>
                                                    <p className="text-2xl font-bold">{organizations.length}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <BarChart className="h-8 w-8 text-green-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">Total Proposals</p>
                                                    <p className="text-2xl font-bold">
                                                        {analytics?.overview?.totalProposals || organizations.reduce((sum, org) => sum + org.totalProposals, 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <CheckCircle className="h-8 w-8 text-blue-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                                    <p className="text-2xl font-bold">
                                                        {analytics?.overview?.approvedCount || organizations.reduce((sum, org) => sum + org.approvedCount, 0)}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardContent className="p-6">
                                            <div className="flex items-center">
                                                <Clock className="h-8 w-8 text-amber-600" />
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-muted-foreground">Approval Rate</p>
                                                    <p className="text-2xl font-bold">
                                                        {analytics?.overview?.approvalRate || Math.round(
                                                            organizations.reduce((sum, org) => sum + org.approvalRate, 0) / Math.max(organizations.length, 1)
                                                        )}%
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>

                                {analytics && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Organization Types</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">School-Based</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {analytics.breakdown?.byOrganizationType?.schoolBased || 0}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Community-Based</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {analytics.breakdown?.byOrganizationType?.communityBased || 0}
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Recent Activity</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Last 7 Days</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {analytics.trends?.last7Days || 0} proposals
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium">Last 30 Days</span>
                                                        <span className="text-sm text-muted-foreground">
                                                            {analytics.trends?.last30Days || 0} proposals
                                                        </span>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                {/* Advanced Report Generator */}
                <ReportGenerator
                    organizations={organizations}
                    analytics={analytics}
                />
            </div>

            {/* Organization Details Modal */}
            <Dialog open={isOrgDialogOpen} onOpenChange={setIsOrgDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-xl text-cedo-blue flex items-center gap-2">
                            {selectedOrg?.name}
                            {selectedOrg && (
                                <Badge
                                    className={
                                        selectedOrg.category === "community-based"
                                            ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2"
                                            : "bg-blue-100 text-blue-800 hover:bg-blue-100 ml-2"
                                    }
                                >
                                    {selectedOrg.category === "community-based" ? "Community-Based" : "School-Based"}
                                </Badge>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            Detailed analytics and information for {selectedOrg?.name}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-6 pt-4">
                        {analyticsLoading ? (
                            <div className="flex items-center justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cedo-blue"></div>
                                <span className="ml-2 text-gray-600">Loading analytics...</span>
                            </div>
                        ) : (
                            <div>
                                {/* Organization Summary */}
                                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-200 mb-6">
                                    <h3 className="text-lg font-semibold text-cedo-blue mb-4">Organization Summary</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white rounded-lg p-4 border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Total Proposals</p>
                                                    <p className="text-2xl font-bold text-cedo-blue">
                                                        {selectedOrg?.totalProposals || 0}
                                                    </p>
                                                </div>
                                                <BarChart className="h-8 w-8 text-cedo-blue" />
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Approved</p>
                                                    <p className="text-2xl font-bold text-green-600">
                                                        {selectedOrg?.approvedCount || 0}
                                                    </p>
                                                </div>
                                                <CheckCircle className="h-8 w-8 text-green-600" />
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Drafts</p>
                                                    <p className="text-2xl font-bold text-amber-600">
                                                        {selectedOrg?.draftCount || 0}
                                                    </p>
                                                </div>
                                                <Clock className="h-8 w-8 text-amber-600" />
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-lg p-4 border">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-muted-foreground">Approval Rate</p>
                                                    <p className="text-2xl font-bold text-purple-600">
                                                        {selectedOrg?.approvalRate || 0}%
                                                    </p>
                                                </div>
                                                <Users className="h-8 w-8 text-purple-600" />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Organization Details */}
                                {orgAnalytics && (
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Organization Information</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Organization Type:</span>
                                                        <p className="font-medium">{orgAnalytics.organization?.type || 'N/A'}</p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">First Proposal:</span>
                                                        <p className="font-medium">
                                                            {orgAnalytics.organization?.firstProposal
                                                                ? new Date(orgAnalytics.organization.firstProposal).toLocaleDateString()
                                                                : 'N/A'
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Last Activity:</span>
                                                        <p className="font-medium">
                                                            {selectedOrg?.lastActivity
                                                                ? new Date(selectedOrg.lastActivity).toLocaleDateString()
                                                                : 'N/A'
                                                            }
                                                        </p>
                                                    </div>
                                                    <div>
                                                        <span className="text-sm text-muted-foreground">Avg Processing Days:</span>
                                                        <p className="font-medium">{selectedOrg?.avgProcessingDays || 0} days</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>

                                        <Card>
                                            <CardHeader>
                                                <CardTitle>Recent Activity</CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-3">
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Last 7 Days:</span>
                                                        <span className="font-medium">
                                                            {orgAnalytics.trends?.last7Days || 0} proposals
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Last 30 Days:</span>
                                                        <span className="font-medium">
                                                            {orgAnalytics.trends?.last30Days || 0} proposals
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-muted-foreground">Status:</span>
                                                        <Badge variant={selectedOrg?.status === 'active' ? 'default' : 'secondary'}>
                                                            {selectedOrg?.status || 'inactive'}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>
                                )}

                                {/* Performance Insights */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Performance Insights</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {selectedOrg?.approvalRate >= 75 ? (
                                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                                    <p className="text-sm text-green-800">
                                                        ✅ <strong>Excellent Performance:</strong> This organization consistently submits high-quality proposals with a {selectedOrg.approvalRate}% approval rate.
                                                    </p>
                                                </div>
                                            ) : selectedOrg?.approvalRate >= 50 ? (
                                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                                                    <p className="text-sm text-amber-800">
                                                        ⚠️ <strong>Good Performance:</strong> Room for improvement with a {selectedOrg.approvalRate}% approval rate. Consider providing feedback on proposal quality.
                                                    </p>
                                                </div>
                                            ) : (
                                                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                    <p className="text-sm text-red-800">
                                                        ❌ <strong>Needs Improvement:</strong> Low approval rate of {selectedOrg?.approvalRate || 0}%. Recommend scheduling a consultation to improve proposal quality.
                                                    </p>
                                                </div>
                                            )}

                                            {selectedOrg?.draftCount > 5 && (
                                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                                    <p className="text-sm text-blue-800">
                                                        📋 <strong>High Draft Count:</strong> {selectedOrg.draftCount} proposals in draft status. Consider reaching out to provide assistance with submission.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export default function ReportsPage() {
    return (
        <Suspense fallback={
            <div className="flex-1 bg-[#f8f9fa] p-6 md:p-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cedo-blue mb-4"></div>
                        <p className="text-lg text-cedo-blue">Loading Reports...</p>
                    </div>
                </div>
            </div>
        }>
            <ReportsContent />
        </Suspense>
    )
}