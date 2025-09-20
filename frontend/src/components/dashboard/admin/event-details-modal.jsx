// frontend/src/components/dashboard/admin/event-details-modal.jsx

"use client"

import { Badge } from "@/components/dashboard/admin/ui/badge"
import { Button } from "@/components/dashboard/admin/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/dashboard/admin/ui/card"
import {
    Calendar,
    Clock,
    MapPin,
    Tag,
    User,
    Users,
    X
} from "lucide-react"

export function EventDetailsModal({ event, isOpen, onClose }) {
    if (!isOpen || !event) return null

    const getCategoryColor = (category) => {
        switch (category) {
            case 'leadership': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'technology': return 'bg-purple-100 text-purple-800 border-purple-200'
            case 'cultural': return 'bg-green-100 text-green-800 border-green-200'
            case 'academic': return 'bg-orange-100 text-orange-800 border-orange-200'
            case 'community': return 'bg-gray-100 text-gray-800 border-gray-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    const getStatusColor = (status) => {
        switch (status) {
            case 'upcoming': return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'completed': return 'bg-green-100 text-green-800 border-green-200'
            default: return 'bg-gray-100 text-gray-800 border-gray-200'
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <Card className="border border-gray-200/60 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm">
                    <CardHeader className="p-6 sm:p-8 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 border-b border-gray-200/60">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <CardTitle className="text-xl sm:text-2xl font-bold text-cedo-blue mb-3">
                                    {event.title}
                                </CardTitle>
                                <div className="flex flex-wrap gap-2 mb-4">
                                    <Badge className={`px-3 py-1 text-sm ${getCategoryColor(event.category)}`}>
                                        {event.category}
                                    </Badge>
                                    <Badge className={`px-3 py-1 text-sm ${getStatusColor(event.status)}`}>
                                        {event.status}
                                    </Badge>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent className="p-6 sm:p-8 space-y-6">
                        {/* Event Description */}
                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                            <p className="text-gray-600 leading-relaxed">{event.description}</p>
                        </div>

                        {/* Event Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                    <div className="p-2 rounded-lg bg-cedo-blue/10">
                                        <Calendar className="h-4 w-4 text-cedo-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Date</p>
                                        <p className="text-sm text-gray-600">{event.date.toLocaleDateString('en-US', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        })}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                    <div className="p-2 rounded-lg bg-cedo-blue/10">
                                        <Clock className="h-4 w-4 text-cedo-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Time</p>
                                        <p className="text-sm text-gray-600">{event.time}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                    <div className="p-2 rounded-lg bg-cedo-blue/10">
                                        <MapPin className="h-4 w-4 text-cedo-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Location</p>
                                        <p className="text-sm text-gray-600">{event.location}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-white/60 rounded-lg border border-gray-200/60">
                                    <div className="p-2 rounded-lg bg-cedo-blue/10">
                                        <Users className="h-4 w-4 text-cedo-blue" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">Attendance</p>
                                        <p className="text-sm text-gray-600">
                                            {event.status === 'completed'
                                                ? `${event.attendees} attended`
                                                : `${event.attendees}/${event.maxAttendees} registered`
                                            }
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Organizer Information */}
                        <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-cedo-blue/5 to-cedo-blue/10 rounded-lg border border-cedo-blue/20">
                            <div className="p-2 rounded-lg bg-cedo-blue/10">
                                <User className="h-4 w-4 text-cedo-blue" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Organized by</p>
                                <p className="text-sm text-cedo-blue font-semibold">{event.organizer}</p>
                            </div>
                        </div>

                        {/* Event Tags */}
                        {event.tags && event.tags.length > 0 && (
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Tags</h3>
                                <div className="flex flex-wrap gap-2">
                                    {event.tags.map((tag, index) => (
                                        <Badge key={index} variant="outline" className="px-3 py-1 text-sm border-gray-300 text-gray-600">
                                            <Tag className="h-3 w-3 mr-1" />
                                            {tag}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Feedback for Completed Events */}
                        {event.feedback && (
                            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                                <div className="flex items-start gap-3">
                                    <div className="p-2 rounded-lg bg-green-100">
                                        <Tag className="h-4 w-4 text-green-600" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-green-900 mb-1">Event Feedback</h3>
                                        <p className="text-sm text-green-700 italic">"{event.feedback}"</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200/60">
                            <Button
                                variant="outline"
                                onClick={onClose}
                                className="flex-1 border-gray-300 text-gray-600 hover:border-cedo-blue hover:text-cedo-blue"
                            >
                                Close
                            </Button>
                            {event.status === 'upcoming' && (
                                <Button className="flex-1 bg-cedo-blue hover:bg-cedo-blue/90 text-white">
                                    Register for Event
                                </Button>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
