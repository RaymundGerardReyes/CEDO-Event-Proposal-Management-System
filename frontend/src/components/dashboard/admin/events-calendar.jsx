// frontend/src/components/dashboard/admin/events-calendar.jsx

"use client"

import moment from 'moment'
import { useCallback, useMemo, useState } from 'react'
import { Calendar, momentLocalizer } from 'react-big-calendar'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import { CalendarDebug } from './calendar-debug'

const localizer = momentLocalizer(moment)

export function EventsCalendar({ events, onEventSelect }) {
    // Calendar state management
    const [currentDate, setCurrentDate] = useState(new Date())
    const [currentView, setCurrentView] = useState('month')

    // Navigation handlers
    const handleNavigate = useCallback((action) => {
        console.log('Navigation action:', action) // Debug log
        if (action === 'PREV') {
            setCurrentDate(prevDate => {
                const newDate = new Date(prevDate)
                if (currentView === 'month') {
                    newDate.setMonth(newDate.getMonth() - 1)
                } else if (currentView === 'week') {
                    newDate.setDate(newDate.getDate() - 7)
                } else if (currentView === 'day') {
                    newDate.setDate(newDate.getDate() - 1)
                }
                return newDate
            })
        } else if (action === 'NEXT') {
            setCurrentDate(prevDate => {
                const newDate = new Date(prevDate)
                if (currentView === 'month') {
                    newDate.setMonth(newDate.getMonth() + 1)
                } else if (currentView === 'week') {
                    newDate.setDate(newDate.getDate() + 7)
                } else if (currentView === 'day') {
                    newDate.setDate(newDate.getDate() + 1)
                }
                return newDate
            })
        } else if (action === 'TODAY') {
            setCurrentDate(new Date())
        }
    }, [currentView])

    const handleViewChange = useCallback((view) => {
        console.log('View change:', view) // Debug log
        setCurrentView(view)
    }, [])

    // Transform events data to react-big-calendar format
    const calendarEvents = useMemo(() => {
        return events.map(event => ({
            id: event.id,
            title: event.title,
            start: new Date(event.date),
            end: new Date(event.date),
            resource: {
                ...event,
                category: event.category,
                location: event.location,
                organizer: event.organizer,
                attendees: event.attendees,
                maxAttendees: event.maxAttendees,
                status: event.status,
                description: event.description,
                time: event.time
            }
        }))
    }, [events])

    // Custom event component
    const EventComponent = ({ event }) => {
        const getCategoryColor = (category) => {
            switch (category) {
                case 'leadership': return '#3B82F6' // blue
                case 'technology': return '#8B5CF6' // purple
                case 'cultural': return '#10B981' // green
                case 'academic': return '#F59E0B' // orange
                case 'community': return '#6B7280' // gray
                default: return '#6B7280'
            }
        }

        return (
            <div
                className="text-xs p-1 rounded cursor-pointer hover:opacity-80 transition-opacity"
                style={{
                    backgroundColor: getCategoryColor(event.resource.category),
                    color: 'white',
                    fontWeight: '500'
                }}
                title={`${event.title} - ${event.resource.time} at ${event.resource.location}`}
            >
                <div className="truncate font-medium">{event.title}</div>
                <div className="text-xs opacity-90">{event.resource.time}</div>
            </div>
        )
    }

    // Custom toolbar component
    const CustomToolbar = ({ label }) => {
        return (
            <div className="flex items-center justify-between mb-4 p-4 bg-white/60 rounded-xl border border-gray-200/60">
                <div className="flex items-center gap-4">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleNavigate('PREV')
                        }}
                        className="p-2 rounded-lg bg-cedo-blue/10 text-cedo-blue hover:bg-cedo-blue/20 transition-colors focus:outline-none focus:ring-2 focus:ring-cedo-blue/50"
                        type="button"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleNavigate('TODAY')
                        }}
                        className="px-4 py-2 rounded-lg bg-cedo-blue text-white hover:bg-cedo-blue/90 transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-cedo-blue/50"
                        type="button"
                    >
                        Today
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleNavigate('NEXT')
                        }}
                        className="p-2 rounded-lg bg-cedo-blue/10 text-cedo-blue hover:bg-cedo-blue/20 transition-colors focus:outline-none focus:ring-2 focus:ring-cedo-blue/50"
                        type="button"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>

                <h2 className="text-lg font-bold text-cedo-blue">{label}</h2>

                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewChange('month')
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cedo-blue/50 ${currentView === 'month'
                            ? 'bg-cedo-blue text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        type="button"
                    >
                        Month
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewChange('week')
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cedo-blue/50 ${currentView === 'week'
                            ? 'bg-cedo-blue text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        type="button"
                    >
                        Week
                    </button>
                    <button
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleViewChange('day')
                        }}
                        className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-cedo-blue/50 ${currentView === 'day'
                            ? 'bg-cedo-blue text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        type="button"
                    >
                        Day
                    </button>
                </div>
            </div>
        )
    }

    // Custom event style getter
    const eventStyleGetter = (event) => {
        const getCategoryColor = (category) => {
            switch (category) {
                case 'leadership': return '#3B82F6'
                case 'technology': return '#8B5CF6'
                case 'cultural': return '#10B981'
                case 'academic': return '#F59E0B'
                case 'community': return '#6B7280'
                default: return '#6B7280'
            }
        }

        return {
            style: {
                backgroundColor: getCategoryColor(event.resource.category),
                borderColor: getCategoryColor(event.resource.category),
                color: 'white',
                borderRadius: '6px',
                border: 'none',
                fontSize: '12px',
                fontWeight: '500'
            }
        }
    }

    return (
        <div className="h-full relative">
            {/* Debug Component - Remove in production */}
            <CalendarDebug
                currentView={currentView}
                currentDate={currentDate}
                onViewChange={handleViewChange}
                onNavigate={handleNavigate}
            />

            <style jsx global>{`
        .rbc-calendar {
          border-radius: 1rem;
          overflow: hidden;
          background: white;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        
        .rbc-header {
          background: linear-gradient(135deg, #001a56 0%, #003d82 100%);
          color: white;
          font-weight: 600;
          padding: 12px 8px;
          border: none;
        }
        
        .rbc-month-view {
          border: none;
        }
        
        .rbc-date-cell {
          padding: 8px;
          border: 1px solid #e5e7eb;
        }
        
        .rbc-off-range-bg {
          background: #f9fafb;
        }
        
        .rbc-today {
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
        }
        
        .rbc-event {
          border-radius: 6px;
          border: none;
          font-size: 12px;
          font-weight: 500;
          padding: 2px 4px;
        }
        
        .rbc-event:hover {
          opacity: 0.8;
          transform: scale(1.02);
          transition: all 0.2s ease;
        }
        
        .rbc-toolbar {
          display: none !important;
        }
        
        .rbc-btn-group {
          display: none !important;
        }
        
        .rbc-month-row {
          border: none;
        }
        
        .rbc-day-bg {
          border: 1px solid #e5e7eb;
        }
        
        .rbc-day-bg:hover {
          background: #f8fafc;
        }
        
        .rbc-time-view .rbc-header {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-time-view .rbc-time-gutter {
          background: #f8fafc;
        }
        
        .rbc-time-view .rbc-time-content {
          border-left: 1px solid #e5e7eb;
        }
        
        .rbc-time-view .rbc-timeslot-group {
          border-bottom: 1px solid #f1f5f9;
        }
        
        .rbc-time-view .rbc-time-slot {
          border-top: 1px solid #f1f5f9;
        }
        
        /* Ensure custom toolbar buttons work properly */
        .events-calendar .rbc-toolbar button {
          pointer-events: auto !important;
          z-index: 10 !important;
        }
        
        /* Fix any potential z-index issues */
        .events-calendar {
          position: relative;
          z-index: 1;
        }
        
        /* Ensure proper button focus states */
        .events-calendar button:focus {
          outline: 2px solid #3B82F6 !important;
          outline-offset: 2px !important;
        }
      `}</style>

            <Calendar
                key={`${currentView}-${currentDate.getTime()}`}
                localizer={localizer}
                events={calendarEvents}
                startAccessor="start"
                endAccessor="end"
                style={{ height: '100%', minHeight: '600px' }}
                components={{
                    event: EventComponent,
                    toolbar: CustomToolbar
                }}
                eventPropGetter={eventStyleGetter}
                onSelectEvent={onEventSelect}
                views={['month', 'week', 'day']}
                view={currentView}
                onView={handleViewChange}
                date={currentDate}
                onNavigate={handleNavigate}
                popup
                showMultiDayTimes
                step={60}
                timeslots={1}
                className="events-calendar"
            />
        </div>
    )
}
