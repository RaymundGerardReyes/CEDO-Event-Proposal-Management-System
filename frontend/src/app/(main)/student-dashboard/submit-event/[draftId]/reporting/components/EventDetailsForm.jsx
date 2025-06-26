/**
 * Event Details Sub-Form Component
 * Handles editable event information in Section 5
 */

import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import DatePickerComponent from "../../../DatePickerComponent.jsx";
import { getEventDetails } from "../utils/helpers.js";
import { FieldStatusIndicator } from "./StatusBadge.jsx";

/**
 * Event details form component
 * @param {Object} props - Component props
 * @param {Object} props.formData - Current form data
 * @param {Object} props.errors - Form validation errors
 * @param {Function} props.onFieldChange - Field change handler
 * @param {boolean} props.disabled - Whether form is disabled
 * @param {boolean} props.isSaving - Whether auto-save is in progress
 * @param {string} props.lastSaved - Last save timestamp
 * @param {string} props.saveError - Save error message
 * @returns {JSX.Element} Event details form
 */
export const EventDetailsForm = ({
    formData = {},
    errors = {},
    onFieldChange,
    disabled = false,
    isSaving = false,
    lastSaved = null,
    saveError = null
}) => {
    // Get event details based on organization type
    const { eventName, eventVenue, eventStartDate, eventEndDate, isSchoolBased } = getEventDetails(formData);

    /**
     * Handle date change with proper formatting
     */
    const handleDateChange = (fieldName, date) => {
        const formattedDate = date ? new Date(date.getTime() - (date.getTimezoneOffset() * 60000)).toISOString().split('T')[0] : null;
        const targetField = isSchoolBased
            ? (fieldName === 'start_date' ? 'schoolStartDate' : 'schoolEndDate')
            : (fieldName === 'start_date' ? 'communityStartDate' : 'communityEndDate');

        onFieldChange(targetField, formattedDate);
    };

    return (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
            <h3 className="font-medium mb-4 text-blue-800">Event Details - Update as Needed</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Organization Name */}
                <div>
                    <Label htmlFor="organizationName" className="flex items-center">
                        Organization Name
                        <span className="text-red-500 ml-1">*</span>
                        <FieldStatusIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            saveError={saveError}
                        />
                    </Label>
                    <Input
                        id="organizationName"
                        name="organizationName"
                        value={formData.organizationName || ""}
                        onChange={(e) => onFieldChange(e.target.name, e.target.value)}
                        placeholder="Enter organization name"
                        className={`mt-1 ${isSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                        disabled={disabled}
                        required
                    />
                    {errors.organizationName && (
                        <p className="text-sm text-red-500 mt-1">{errors.organizationName}</p>
                    )}
                </div>

                {/* Event Name */}
                <div>
                    <Label htmlFor="eventName" className="flex items-center">
                        Event Name
                        <span className="text-red-500 ml-1">*</span>
                        <FieldStatusIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            saveError={saveError}
                        />
                    </Label>
                    <Input
                        id="eventName"
                        name={isSchoolBased ? "schoolEventName" : "communityEventName"}
                        value={eventName || ""}
                        onChange={(e) => onFieldChange(e.target.name, e.target.value)}
                        placeholder="Enter event name"
                        className={`mt-1 ${isSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                        disabled={disabled}
                        required
                    />
                    {errors.eventName && (
                        <p className="text-sm text-red-500 mt-1">{errors.eventName}</p>
                    )}
                </div>

                {/* Event Venue */}
                <div>
                    <Label htmlFor="eventVenue" className="flex items-center">
                        Venue
                        <span className="text-red-500 ml-1">*</span>
                        <FieldStatusIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            saveError={saveError}
                        />
                    </Label>
                    <Input
                        id="eventVenue"
                        name="event_venue"
                        value={eventVenue || ""}
                        onChange={(e) => onFieldChange(e.target.name, e.target.value)}
                        placeholder="Enter event venue"
                        className={`mt-1 ${isSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                        disabled={disabled}
                        required
                    />
                    {errors.eventVenue && (
                        <p className="text-sm text-red-500 mt-1">{errors.eventVenue}</p>
                    )}
                </div>

                {/* Event Status */}
                <div>
                    <Label htmlFor="eventStatus" className="flex items-center">
                        Event Status
                        <span className="text-red-500 ml-1">*</span>
                        <FieldStatusIndicator
                            isSaving={isSaving}
                            lastSaved={lastSaved}
                            saveError={saveError}
                        />
                    </Label>
                    <select
                        id="eventStatus"
                        name="event_status"
                        value={formData.event_status || ""}
                        onChange={(e) => onFieldChange(e.target.name, e.target.value)}
                        className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm mt-1 ${isSaving ? 'ring-2 ring-blue-200' : ''} ${saveError ? 'ring-2 ring-red-200' : ''}`}
                        disabled={disabled}
                        required
                    >
                        <option value="">Select status</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="postponed">Postponed</option>
                    </select>
                    {errors.eventStatus && (
                        <p className="text-sm text-red-500 mt-1">{errors.eventStatus}</p>
                    )}
                </div>

                {/* Start Date */}
                <div>
                    <DatePickerComponent
                        label="Start Date"
                        fieldName="start_date"
                        value={eventStartDate ? new Date(eventStartDate) : null}
                        onChange={(_, date) => handleDateChange('start_date', date)}
                        disabled={disabled}
                        required
                        error={errors.eventDates}
                    />
                </div>

                {/* End Date */}
                <div>
                    <DatePickerComponent
                        label="End Date"
                        fieldName="end_date"
                        value={eventEndDate ? new Date(eventEndDate) : null}
                        onChange={(_, date) => handleDateChange('end_date', date)}
                        disabled={disabled}
                        required
                        error={errors.eventDates}
                    />
                </div>
            </div>

            {/* Date validation error */}
            {errors.eventDates && (
                <p className="text-sm text-red-500 mt-2">{errors.eventDates}</p>
            )}

            {/* Event type indicator */}
            <div className="mt-3 text-xs text-blue-600">
                <p>Event Type: {isSchoolBased ? 'School-Based Event' : 'Community Event'}</p>
                {formData.organizationType && (
                    <p>Organization Type: {formData.organizationType}</p>
                )}
            </div>
        </div>
    );
};

export default EventDetailsForm; 