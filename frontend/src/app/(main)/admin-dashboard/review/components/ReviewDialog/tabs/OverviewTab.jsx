/**
 * OverviewTab - Overview Content for Review Dialog
 * 
 * This component displays the proposal overview information
 * including submission details, organization information, and documentation.
 * Properly mapped to the database schema.
 */

import { Avatar, AvatarFallback } from "@/components/dashboard/admin/ui/avatar";
import { Badge } from "@/components/dashboard/admin/ui/badge";
import { Button } from "@/components/dashboard/admin/ui/button";
import { Label } from "@/components/dashboard/admin/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Calendar, Clock, DollarSign, Download, FileText, MapPin, RefreshCw, Target, Users } from "lucide-react";
import { useEffect, useState } from "react";

const OverviewTab = ({ proposal }) => {
    const [downloadingFile, setDownloadingFile] = useState(null);
    const [mongoFiles, setMongoFiles] = useState({});
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [filesFetched, setFilesFetched] = useState(false);
    const { toast } = useToast();

    if (!proposal) return null;

    // Helper function to safely get values with fallbacks
    const getValue = (value, fallback = 'N/A') => {
        return value && value !== '' ? value : fallback;
    };

    // Helper function to format dates
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return 'Invalid Date';
        }
    };

    // Helper function to format time from 24-hour to 12-hour format
    const formatTime = (timeString) => {
        if (!timeString) return 'N/A';
        try {
            const [hours, minutes] = timeString.split(':');
            let h = parseInt(hours, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            h = h % 12;
            h = h || 12; // Convert hour '0' to '12'
            return `${h}:${minutes} ${ampm}`;
        } catch (error) {
            console.error('Error formatting time:', timeString, error);
            return timeString;
        }
    };

    // Handle file downloads via MongoDB unified API
    const handleDownload = async (fileName, fileType) => {
        if (!fileName || fileName === 'N/A') {
            toast({
                title: "Download Error",
                description: "No file available for download",
                variant: "destructive"
            });
            return;
        }

        setDownloadingFile(`${fileType}_${fileName}`);

        try {
            const backendUrl = process.env.API_URL || 'http://localhost:5000';
            const response = await fetch(
                `${backendUrl}/api/mongodb-unified/admin/proposals/download/${proposal.id}/${fileType}`,
                {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );

            if (!response.ok) {
                throw new Error(`Download failed: ${response.status}`);
            }

            // Create blob and download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            toast({
                title: "Download Started",
                description: `${fileName} is being downloaded`,
                variant: "success"
            });
        } catch (error) {
            console.error('Download error:', error);
            toast({
                title: "Download Failed",
                description: `Failed to download ${fileName}: ${error.message}`,
                variant: "destructive"
            });
        } finally {
            setDownloadingFile(null);
        }
    };

    // ✅ Updated: Get file information with priority on fresh MongoDB data
    const getFileInfo = (fileType) => {
        // PRIORITY 1: Fresh MongoDB data fetched directly from API
        if (mongoFiles && mongoFiles[fileType]) {
            return {
                name: mongoFiles[fileType].name || mongoFiles[fileType].filename,
                available: true,
                source: 'mongodb-fresh',
                id: mongoFiles[fileType].id || mongoFiles[fileType]._id
            };
        }

        // PRIORITY 2: MongoDB data from proposal props (cached)
        if (proposal.files && proposal.files[fileType]) {
            return {
                name: proposal.files[fileType].name,
                available: true,
                source: proposal.files[fileType].source || 'mongodb-cached',
                id: proposal.files[fileType].id
            };
        }

        // PRIORITY 3: Fallback to direct database field names for backward compatibility
        const fileFieldMap = {
            'school_gpoa': 'school_gpoa_file_name',
            'school_proposal': 'school_proposal_file_name',
            'community_gpoa': 'community_gpoa_file_name',
            'community_proposal': 'community_proposal_file_name',
            'accomplishment_report': 'accomplishment_report_file_name',
            'pre_registration': 'pre_registration_file_name',
            'final_attendance': 'final_attendance_file_name'
        };

        const fieldName = fileFieldMap[fileType];
        const fileName = fieldName ? proposal[fieldName] : null;

        return {
            name: fileName || null,
            available: Boolean(fileName && fileName !== 'N/A'),
            source: 'legacy'
        };
    };

    // Parse JSON fields safely
    const parseJsonField = (jsonString) => {
        if (!jsonString) return [];
        try {
            const parsed = JSON.parse(jsonString);
            return Array.isArray(parsed) ? parsed : [parsed];
        } catch (error) {
            return [];
        }
    };

    const schoolTargetAudience = parseJsonField(proposal.school_target_audience);
    const communityTargetAudience = parseJsonField(proposal.community_target_audience);

    const fileDisplayConfig = [
        {
            title: 'School Event Files',
            color: 'blue',
            condition: proposal.organization_type === 'school-based',
            files: [
                { key: 'school_gpoa', label: 'GPOA' },
                { key: 'school_proposal', label: 'Proposal' }
            ]
        },
        {
            title: 'Community Event Files',
            color: 'purple',
            condition: proposal.organization_type === 'community-based',
            files: [
                { key: 'community_gpoa', label: 'GPOA' },
                { key: 'community_proposal', label: 'Proposal' }
            ]
        },
        {
            title: 'Accomplishment Report',
            color: 'green',
            files: [
                { key: 'accomplishment_report', label: 'Report' }
            ]
        },
        {
            title: 'Additional Documentation',
            color: 'amber',
            files: [
                { key: 'pre_registration', label: 'Pre-Registration' },
                { key: 'final_attendance', label: 'Final Attendance' }
            ]
        }
    ];

    // ✅ Enhanced: Check if any files are available from any source
    const hasAnyFiles = () => {
        return fileDisplayConfig.some(section => {
            if (section.condition === false) return false;
            return section.files.some(file => getFileInfo(file.key).available);
        });
    };

    // ✅ NEW: Fetch file metadata directly from MongoDB unified API
    const fetchMongoFiles = async () => {
        if (!proposal.id) return;

        setLoadingFiles(true);
        try {
            const backendUrl = process.env.API_URL || 'http://localhost:5000';
            console.log(`🔍 Fetching MongoDB files for proposal ${proposal.id}...`);

            // ✅ Use the new admin-specific endpoint 
            const response = await fetch(`${backendUrl}/api/mongodb-unified/admin/proposals/${proposal.id}/files`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                console.log('📁 MongoDB files fetched:', data);

                if (data.success && data.files && Object.keys(data.files).length > 0) {
                    // ✅ Enhanced console log to show the exact object received
                    console.log('✅ Setting mongoFiles state with:', JSON.stringify(data.files, null, 2));
                    setMongoFiles(data.files);
                    console.log(`✅ Found ${Object.keys(data.files).length} files in MongoDB for proposal ${proposal.id}`);

                    toast({
                        title: "Files Loaded Successfully",
                        description: `Found ${Object.keys(data.files).length} files from MongoDB (${data.source})`,
                        variant: "default"
                    });
                } else {
                    console.log('📄 No files found in MongoDB for this proposal');
                    setMongoFiles({});

                    // Only show toast if we explicitly expected files
                    if (proposal.files && Object.keys(proposal.files).length > 0) {
                        toast({
                            title: "Files Updated",
                            description: "No files found in MongoDB. Using cached data.",
                            variant: "default"
                        });
                    }
                }
            } else if (response.status === 404) {
                console.log('📄 No files found in MongoDB for this proposal (404)');
                setMongoFiles({});
                // Don't show error toast for 404, just use cached data
            } else {
                console.warn(`⚠️ MongoDB files fetch returned ${response.status}`);
                // Fallback to existing proposal data
                setMongoFiles(proposal.files || {});

                toast({
                    title: "File Loading Issue",
                    description: `Server returned ${response.status}. Using cached data.`,
                    variant: "destructive"
                });
            }
        } catch (error) {
            console.error('❌ Error fetching MongoDB files:', error);
            // Fallback to existing proposal data
            setMongoFiles(proposal.files || {});

            toast({
                title: "Connection Error",
                description: "Could not connect to MongoDB. Showing cached data.",
                variant: "default"
            });
        } finally {
            setLoadingFiles(false);
            setFilesFetched(true);
        }
    };

    // ✅ Fetch MongoDB files when component mounts or proposal changes
    useEffect(() => {
        if (proposal?.id && !filesFetched) {
            fetchMongoFiles();
        }
    }, [proposal?.id]);

    // ✅ Manual refresh function for files
    const refreshFiles = () => {
        setFilesFetched(false);
        fetchMongoFiles();
    };

    return (
        <div className="space-y-6">
            {/* Submission Overview Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-cedo-blue rounded-full mr-3"></div>
                        Submission Overview
                    </h3>
                </div>
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <Target className="h-3 w-3" />
                                Proposal ID
                            </Label>
                            <p className="mt-2 text-base font-semibold text-gray-900">
                                #{getValue(proposal.id)}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <Calendar className="h-3 w-3" />
                                Submission Date
                            </Label>
                            <p className="mt-2 text-base text-gray-900">
                                {formatDate(proposal.submitted_at || proposal.created_at)}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Title
                            </Label>
                            <p className="mt-2 text-base text-gray-900 font-medium">
                                {getValue(proposal.title)}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Category
                            </Label>
                            <p className="mt-2 text-base text-gray-900">
                                {getValue(proposal.category)}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Status
                            </Label>
                            <Badge
                                variant="outline"
                                className={`mt-2 font-medium ${proposal.proposal_status === 'approved' ? 'bg-green-100 text-green-800 border-green-300' :
                                    proposal.proposal_status === 'pending' ? 'bg-yellow-100 text-yellow-800 border-yellow-300' :
                                        proposal.proposal_status === 'denied' ? 'bg-red-100 text-red-800 border-red-300' :
                                            'bg-gray-100 text-gray-800 border-gray-300'
                                    }`}
                            >
                                {getValue(proposal.proposal_status, 'pending').charAt(0).toUpperCase() +
                                    getValue(proposal.proposal_status, 'pending').slice(1)}
                            </Badge>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                <DollarSign className="h-3 w-3" />
                                Budget
                            </Label>
                            <p className="mt-2 text-base text-gray-900 font-medium">
                                {proposal.budget ? `₱${parseFloat(proposal.budget).toLocaleString()}` : 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Organization Information Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-cedo-blue rounded-full mr-3"></div>
                        Organization Information
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Organization Name
                        </Label>
                        <p className="mt-2 text-lg font-semibold text-gray-900">
                            {getValue(proposal.organization_name)}
                        </p>
                    </div>

                    {proposal.organization_description && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Description
                            </Label>
                            <p className="mt-2 text-base text-gray-900 leading-relaxed">
                                {getValue(proposal.organization_description)}
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Organization Type
                            </Label>
                            <p className="mt-2 text-base text-gray-900 capitalize">
                                {getValue(proposal.organization_type)}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Contact Person
                            </Label>
                            <div className="flex items-center gap-3 mt-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="text-xs bg-cedo-blue text-white font-medium">
                                        {proposal.contact_name ?
                                            proposal.contact_name.split(' ').map(n => n[0]).join('').toUpperCase() :
                                            'UN'
                                        }
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="text-base text-gray-900 font-medium">
                                        {getValue(proposal.contact_name)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {getValue(proposal.contact_email)}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {getValue(proposal.contact_phone)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Event Information Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <div className="w-2 h-2 bg-purple-500 rounded-full mr-3"></div>
                        Event Information
                    </h3>
                </div>
                <div className="p-6 space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                            Event Name
                        </Label>
                        <p className="mt-2 text-lg font-semibold text-gray-900">
                            {getValue(proposal.event_name)}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <MapPin className="h-3 w-3" />
                                    Venue
                                </Label>
                                <p className="mt-2 text-base text-gray-900">
                                    {getValue(proposal.event_venue)}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <Calendar className="h-3 w-3" />
                                    Event Dates
                                </Label>
                                <p className="mt-2 text-base text-gray-900">
                                    {formatDate(proposal.event_start_date)} - {formatDate(proposal.event_end_date)}
                                </p>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                    <Clock className="h-3 w-3" />
                                    Event Times
                                </Label>
                                <p className="mt-2 text-base text-gray-900">
                                    {formatTime(proposal.event_start_time)} - {formatTime(proposal.event_end_time)}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                    Event Mode
                                </Label>
                                <p className="mt-2 text-base text-gray-900 capitalize">
                                    {getValue(proposal.event_mode)}
                                </p>
                            </div>

                            {proposal.organization_type === 'school-based' && (
                                <>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            School Event Type
                                        </Label>
                                        <p className="mt-2 text-base text-gray-900 capitalize">
                                            {getValue(proposal.school_event_type)}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Return Service Credit
                                        </Label>
                                        <p className="mt-2 text-base text-gray-900">
                                            {getValue(proposal.school_return_service_credit)}
                                        </p>
                                    </div>

                                    {schoolTargetAudience.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <Users className="h-3 w-3" />
                                                Target Audience
                                            </Label>
                                            <p className="mt-2 text-base text-gray-900">
                                                {schoolTargetAudience.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}

                            {proposal.organization_type === 'community-based' && (
                                <>
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            Community Event Type
                                        </Label>
                                        <p className="mt-2 text-base text-gray-900 capitalize">
                                            {getValue(proposal.community_event_type)}
                                        </p>
                                    </div>

                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                        <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                            SDP Credits
                                        </Label>
                                        <p className="mt-2 text-base text-gray-900">
                                            {getValue(proposal.community_sdp_credits)}
                                        </p>
                                    </div>

                                    {communityTargetAudience.length > 0 && (
                                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
                                                <Users className="h-3 w-3" />
                                                Target Audience
                                            </Label>
                                            <p className="mt-2 text-base text-gray-900">
                                                {communityTargetAudience.join(', ')}
                                            </p>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {proposal.objectives && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                            <Label className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
                                Objectives
                            </Label>
                            <p className="mt-2 text-base text-gray-900 leading-relaxed">
                                {getValue(proposal.objectives)}
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Documentation and Files Card */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-3"></div>
                            Documentation & Files
                            {loadingFiles && (
                                <RefreshCw className="h-4 w-4 ml-2 animate-spin text-green-600" />
                            )}
                        </h3>
                        <div className="flex items-center gap-2">
                            {filesFetched && (
                                <span className="text-xs text-gray-500">
                                    {Object.keys(mongoFiles).length > 0 ?
                                        `${Object.keys(mongoFiles).length} files from MongoDB` :
                                        'Using cached data'
                                    }
                                </span>
                            )}
                            {/* Debug info - remove in production */}
                            {process.env.NODE_ENV === 'development' && (
                                <span className="text-xs text-blue-500 bg-blue-50 px-2 py-1 rounded">
                                    Debug: Fetched Keys: [{Object.keys(mongoFiles).join(', ')}] |
                                    Props Keys: [{Object.keys(proposal.files || {}).join(', ')}] |
                                    ID: {proposal.id}
                                </span>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={refreshFiles}
                                disabled={loadingFiles}
                                className="text-green-700 hover:text-green-800"
                                title="Refresh file data from MongoDB"
                            >
                                <RefreshCw className={`h-4 w-4 ${loadingFiles ? 'animate-spin' : ''}`} />
                            </Button>
                        </div>
                    </div>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {fileDisplayConfig.map(section => {
                            // Section-level condition (e.g., for organization type)
                            if (section.condition === false) {
                                return null;
                            }

                            // Find which files in this section are available
                            const availableFiles = section.files.filter(file => getFileInfo(file.key).available);

                            // If no files in this section are available, don't render the section
                            if (availableFiles.length === 0) {
                                return null;
                            }

                            const colorVariants = {
                                blue: 'bg-blue-50 border-blue-100 text-blue-700',
                                purple: 'bg-purple-50 border-purple-100 text-purple-700',
                                green: 'bg-green-50 border-green-100 text-green-700',
                                amber: 'bg-amber-50 border-amber-100 text-amber-700',
                            };

                            return (
                                <div key={section.title} className={`${colorVariants[section.color]} p-4 rounded-lg border`}>
                                    <Label className={`text-xs font-semibold uppercase tracking-wide mb-3 block ${colorVariants[section.color]}`}>
                                        {section.title}
                                    </Label>
                                    <div className="space-y-3">
                                        {availableFiles.map(fileConfig => {
                                            const fileInfo = getFileInfo(fileConfig.key);
                                            return (
                                                <div key={fileConfig.key} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                                                    <div className="flex items-center gap-3">
                                                        <FileText className="h-5 w-5 text-gray-500" />
                                                        <span className="text-base text-gray-900 font-medium">
                                                            {fileConfig.label}: {fileInfo.name}
                                                        </span>
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="flex items-center gap-2"
                                                        onClick={() => handleDownload(fileInfo.name, fileConfig.key)}
                                                        disabled={downloadingFile === `${fileConfig.key}_${fileInfo.name}`}
                                                    >
                                                        <Download className="h-4 w-4" />
                                                        {downloadingFile === `${fileConfig.key}_${fileInfo.name}` ? 'Downloading...' : 'Download'}
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}

                        {/* Show message if no files are available across all sections */}
                        {!hasAnyFiles() && (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <FileText className="h-8 w-8 text-gray-400" />
                                </div>
                                <h4 className="text-lg font-medium text-gray-900 mb-2">
                                    No Documentation Available
                                </h4>
                                <p className="text-gray-600">
                                    No files have been uploaded for this proposal yet.
                                </p>
                            </div>
                        )}

                        {/* Completion Status */}
                        {proposal.form_completion_percentage && (
                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                <Label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                                    Form Completion
                                </Label>
                                <div className="flex items-center gap-2 mt-2">
                                    <div className="flex-1 bg-blue-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                            style={{ width: `${proposal.form_completion_percentage}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-sm font-medium text-blue-700">
                                        {proposal.form_completion_percentage}%
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Admin Comments */}
            {(proposal.admin_comments || proposal.adminComments || proposal.details?.adminComments) && (
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-red-50 to-red-100/50 px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <div className="w-2 h-2 bg-red-500 rounded-full mr-3"></div>
                            Admin Comments
                        </h3>
                    </div>
                    <div className="p-6">
                        <div className="bg-red-50 p-4 rounded-lg border border-red-100">
                            <p className="text-base text-gray-900 leading-relaxed">
                                {proposal.admin_comments || proposal.adminComments || proposal.details?.adminComments}
                            </p>
                            {proposal.reviewed_at && (
                                <p className="text-sm text-gray-600 mt-2">
                                    Reviewed on {formatDate(proposal.reviewed_at)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default OverviewTab; 