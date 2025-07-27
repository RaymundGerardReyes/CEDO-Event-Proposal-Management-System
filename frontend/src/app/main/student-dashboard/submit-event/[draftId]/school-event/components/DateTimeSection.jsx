import DatePickerComponent from "@/app/main/student-dashboard/submit-event/components/DatePickerComponent";
import { Input } from "@/components/dashboard/student/ui/input";
import { Label } from "@/components/dashboard/student/ui/label";
import { InfoIcon } from "lucide-react";
import { getFieldClasses } from "../../../validation";

/**
 * Date & Time Section Component
 */
export const DateTimeSection = ({
    localFormData,
    handleLocalInputChange,
    handleDateChange,
    validationErrors,
    disabled
}) => {
    const renderFieldError = (fieldName) => {
        if (!validationErrors[fieldName]) return null;
        return (
            <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                {validationErrors[fieldName]}
            </p>
        );
    };

    return (
        <fieldset className="space-y-4 p-4 border rounded-lg dark:border-gray-700 shadow-sm bg-white dark:bg-gray-800/30">
            <legend className="text-sm font-semibold px-2 text-gray-700 dark:text-gray-300 -ml-2">
                Date & Time
            </legend>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div className="space-y-2">
                    <DatePickerComponent
                        label="Start Date"
                        value={localFormData.event_start_date ? new Date(localFormData.event_start_date) : null}
                        onChange={handleDateChange}
                        fieldName="event_start_date"
                        disabled={disabled}
                        required
                        error={validationErrors["event_start_date"]}
                    />
                    {renderFieldError("event_start_date")}
                </div>
                <div className="space-y-2">
                    <DatePickerComponent
                        label="End Date"
                        value={localFormData.event_end_date ? new Date(localFormData.event_end_date) : null}
                        onChange={handleDateChange}
                        fieldName="event_end_date"
                        disabled={disabled}
                        required
                        error={validationErrors["event_end_date"]}
                    />
                    {renderFieldError("event_end_date")}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="event_start_time" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                        Start Time <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                        id="event_start_time"
                        name="event_start_time"
                        type="time"
                        value={localFormData.event_start_time || ""}
                        onChange={handleLocalInputChange}
                        className={getFieldClasses("event_start_time", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                        disabled={disabled}
                        required
                    />
                    {renderFieldError("event_start_time")}
                </div>
                <div className="space-y-2">
                    <Label htmlFor="event_end_time" className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                        End Time <span className="text-red-500 ml-0.5">*</span>
                    </Label>
                    <Input
                        id="event_end_time"
                        name="event_end_time"
                        type="time"
                        value={localFormData.event_end_time || ""}
                        onChange={handleLocalInputChange}
                        className={getFieldClasses("event_end_time", validationErrors, "dark:bg-gray-700 dark:border-gray-600 focus:ring-cedo-blue dark:focus:ring-cedo-gold")}
                        disabled={disabled}
                        required
                    />
                    {renderFieldError("event_end_time")}
                </div>
            </div>
            {/* Validation helper */}
            <div className="mt-3 p-4 border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/30 rounded-md flex items-start gap-3">
                <InfoIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                    <p className="font-semibold mb-1">Date &amp; Time Guidelines</p>
                    <ul className="list-disc list-inside space-y-1 text-xs">
                        <li><strong>End Date</strong> must be <em>on or after</em> the Start Date.</li>
                        <li>If the event starts and ends on the <strong>same day</strong>, the <em>End Time</em> must be <em>after</em> the Start Time.</li>
                        <li>For <strong>multi-day</strong> events, any Start/End time combination is allowed.</li>
                    </ul>
                </div>
            </div>
        </fieldset>
    );
}; 