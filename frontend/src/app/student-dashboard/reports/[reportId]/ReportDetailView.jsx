"use client";

/**
 * Report Detail View Component - Client Component
 * Displays complete report data in a clean, professional format
 */

import {
    AlertCircle,
    ArrowLeft,
    Building,
    Calendar,
    CheckCircle,
    Clock,
    Download,
    ExternalLink,
    FileText,
    Mail,
    MapPin,
    Phone,
    User,
    Users
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";

/**
 * Status Badge Component
 */
const StatusBadge = ({ status, type = "proposal" }) => {
    const getStatusConfig = (status, type) => {
        if (type === "proposal") {
            switch (status) {
                case "approved":
                    return { color: "bg-green-100 text-green-800", icon: CheckCircle };
                case "pending":
                    return { color: "bg-yellow-100 text-yellow-800", icon: Clock };
                case "denied":
                    return { color: "bg-red-100 text-red-800", icon: AlertCircle };
                default:
                    return { color: "bg-gray-100 text-gray-800", icon: Clock };
            }
        } else {
            switch (status) {
                case "completed":
                    return { color: "bg-green-100 text-green-800", icon: CheckCircle };
                case "cancelled":
                    return { color: "bg-red-100 text-red-800", icon: AlertCircle };
                case "postponed":
                    return { color: "bg-yellow-100 text-yellow-800", icon: Clock };
                default:
                    return { color: "bg-gray-100 text-gray-800", icon: Clock };
            }
        }
    };

    const { color, icon: Icon } = getStatusConfig(status, type);

    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
            <Icon className="w-3 h-3 mr-1" />
            {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown'}
        </span>
    );
};

/**
 * File Download Component
 */
const FileDownloadCard = ({ file, fileType, reportId }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [downloadError, setDownloadError] = useState(null);

    const handleDownload = async () => {
        if (!file?.downloadUrl) {
            setDownloadError("Download URL not available");
            return;
        }

        setIsDownloading(true);
        setDownloadError(null);

        try {
            console.log('🔍 Download: Starting download for:', file.originalName || file.filename);
            console.log('🔗 Download: URL:', file.downloadUrl);

            // Get authentication token with multiple fallbacks
            let token = null;

            // Try cookie first
            const cookies = document.cookie.split('; ');
            const tokenCookie = cookies.find(row => row.startsWith('cedo_token='));
            if (tokenCookie) {
                token = tokenCookie.split('=')[1];
            }

            // Fallback to localStorage
            if (!token) {
                token = localStorage.getItem('cedo_token') || localStorage.getItem('token');
            }

            if (!token) {
                throw new Error('Authentication token not found. Please log in again.');
            }

            console.log('🔑 Download: Using authentication token');

            // Make the download request
            const response = await fetch(file.downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Include cookies for additional auth
            });

            console.log('📡 Download: Response status:', response.status, response.statusText);

            if (!response.ok) {
                let errorMessage = `Download failed: ${response.status}`;

                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (e) {
                    // If response is not JSON, use status text
                    errorMessage = `Download failed: ${response.status} ${response.statusText}`;
                }

                throw new Error(errorMessage);
            }

            // Create blob and download
            console.log('💾 Download: Creating file blob...');
            const blob = await response.blob();

            if (blob.size === 0) {
                throw new Error('Downloaded file is empty');
            }

            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = file.originalName || file.filename || `${fileType}_${reportId}`;
            a.style.display = 'none';
            document.body.appendChild(a);
            a.click();

            // Clean up
            setTimeout(() => {
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            }, 100);

            console.log('✅ Download: File downloaded successfully');

        } catch (error) {
            console.error('❌ Download error:', error);
            setDownloadError(error.message);

            // Additional debugging for 404 errors
            if (error.message.includes('404')) {
                console.error('🔍 Debug: 404 error details:', {
                    fileUrl: file.downloadUrl,
                    fileType: fileType,
                    reportId: reportId,
                    fileName: file.originalName || file.filename
                });
            }
        } finally {
            setIsDownloading(false);
        }
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return 'Unknown size';
        const kb = bytes / 1024;
        const mb = kb / 1024;
        return mb >= 1 ? `${mb.toFixed(2)} MB` : `${kb.toFixed(2)} KB`;
    };

    const getFileTypeIcon = (fileType) => {
        switch (fileType) {
            case "accomplishmentReport":
                return "📋";
            case "preRegistrationList":
                return "📝";
            case "finalAttendanceList":
                return "✅";
            default:
                return "📄";
        }
    };

    const getFileTypeLabel = (fileType) => {
        switch (fileType) {
            case "accomplishmentReport":
                return "Accomplishment Report";
            case "preRegistrationList":
                return "Pre-Registration List";
            case "finalAttendanceList":
                return "Final Attendance List";
            default:
                return "Document";
        }
    };

    if (!file) {
        return (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <FileText className="mx-auto h-8 w-8 text-gray-400" />
                <p className="mt-2 text-sm text-gray-500">
                    {getFileTypeLabel(fileType)} not uploaded
                </p>
            </div>
        );
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center">
                        <span className="text-2xl mr-3">{getFileTypeIcon(fileType)}</span>
                        <div>
                            <h4 className="text-sm font-medium text-gray-900">
                                {getFileTypeLabel(fileType)}
                            </h4>
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                {file.originalName || file.filename}
                            </p>
                            {file.size && (
                                <p className="text-xs text-gray-400">
                                    {formatFileSize(file.size)}
                                </p>
                            )}
                        </div>
                    </div>

                    {downloadError && (
                        <div className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                            {downloadError}
                        </div>
                    )}
                </div>

                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className={`inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white ${isDownloading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                        }`}
                >
                    {isDownloading ? (
                        <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                            Downloading...
                        </>
                    ) : (
                        <>
                            <Download className="h-3 w-3 mr-2" />
                            Download
                        </>
                    )}
                </button>
            </div>
        </div>
    );
};

/**
 * Main Report Detail View Component
 */
export default function ReportDetailView({ reportData, reportId }) {
    const formatDate = (dateString) => {
        if (!dateString) return 'Not specified';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const formatTime = (timeString) => {
        if (!timeString) return 'Not specified';
        return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <Link
                            href={`/student-dashboard/submit-event/${reportId}/overview`}
                            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
                        >
                            <ArrowLeft className="h-4 w-4 mr-1" />
                            Back to Dashboard
                        </Link>
                    </div>

                    <div className="flex items-center space-x-3">
                        <StatusBadge status={reportData.proposalStatus} type="proposal" />
                        <StatusBadge status={reportData.eventStatus} type="event" />
                    </div>
                </div>

                <div className="mt-4">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {reportData.eventName || 'Accomplishment Report'}
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">
                        Report ID: {reportId} • {reportData.organizationName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Event Details */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Event Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <Building className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Organization</p>
                                        <p className="text-sm text-gray-600">{reportData.organizationName}</p>
                                        <p className="text-xs text-gray-500 capitalize">{reportData.organizationType}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <MapPin className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Venue</p>
                                        <p className="text-sm text-gray-600">{reportData.eventVenue || 'Not specified'}</p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Users className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Attendance</p>
                                        <p className="text-sm text-gray-600">
                                            {reportData.attendanceCount ? `${reportData.attendanceCount} participants` : 'Not recorded'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-start">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Event Dates</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDate(reportData.eventStartDate)} - {formatDate(reportData.eventEndDate)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <Clock className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Event Times</p>
                                        <p className="text-sm text-gray-600">
                                            {formatTime(reportData.eventStartTime)} - {formatTime(reportData.eventEndTime)}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start">
                                    <ExternalLink className="h-5 w-5 text-gray-400 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Event Mode</p>
                                        <p className="text-sm text-gray-600 capitalize">
                                            {reportData.eventMode || 'Not specified'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Description */}
                    {reportData.reportDescription && (
                        <div className="bg-white shadow rounded-lg p-6">
                            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Notes</h2>
                            <div className="prose max-w-none">
                                <p className="text-gray-700 whitespace-pre-wrap">
                                    {reportData.reportDescription}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* File Downloads */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Uploaded Documents</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FileDownloadCard
                                file={reportData.files.accomplishmentReport}
                                fileType="accomplishmentReport"
                                reportId={reportId}
                            />
                            <FileDownloadCard
                                file={reportData.files.preRegistrationList}
                                fileType="preRegistrationList"
                                reportId={reportId}
                            />
                            <FileDownloadCard
                                file={reportData.files.finalAttendanceList}
                                fileType="finalAttendanceList"
                                reportId={reportId}
                            />
                        </div>

                        {/* Upload Guidelines */}
                        <div className="mt-6 bg-gray-50 p-4 rounded-md">
                            <h4 className="font-medium text-gray-800 mb-2">File Information</h4>
                            <ul className="text-sm text-gray-600 space-y-1">
                                <li>• All files are securely stored and can be downloaded at any time</li>
                                <li>• Files are automatically scanned for security before storage</li>
                                <li>• If you cannot download a file, please contact support</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Contact Information */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>

                        <div className="space-y-3">
                            <div className="flex items-center">
                                <User className="h-4 w-4 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Contact Person</p>
                                    <p className="text-sm text-gray-600">{reportData.contactName || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Mail className="h-4 w-4 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Email</p>
                                    <p className="text-sm text-gray-600">{reportData.contactEmail || 'Not provided'}</p>
                                </div>
                            </div>

                            <div className="flex items-center">
                                <Phone className="h-4 w-4 text-gray-400 mr-3" />
                                <div>
                                    <p className="text-sm font-medium text-gray-900">Phone</p>
                                    <p className="text-sm text-gray-600">{reportData.contactPhone || 'Not provided'}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Report Metadata */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Information</h3>

                        <div className="space-y-3 text-sm">
                            <div>
                                <p className="font-medium text-gray-900">Report ID</p>
                                <p className="text-gray-600">{reportId}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-900">Submitted</p>
                                <p className="text-gray-600">{formatDate(reportData.createdAt)}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-900">Last Updated</p>
                                <p className="text-gray-600">{formatDate(reportData.updatedAt)}</p>
                            </div>

                            <div>
                                <p className="font-medium text-gray-900">Event Type</p>
                                <p className="text-gray-600 capitalize">{reportData.eventType || 'Not specified'}</p>
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="bg-white shadow rounded-lg p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions</h3>

                        <div className="space-y-3">
                            <Link
                                href={`/student-dashboard/submit-event/${reportId}/reporting`}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <FileText className="h-4 w-4 mr-2" />
                                Edit Report
                            </Link>

                            <button
                                onClick={() => window.print()}
                                className="w-full inline-flex justify-center items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Print Report
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
} 