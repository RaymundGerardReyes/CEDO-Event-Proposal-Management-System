import { Label } from "@/components/ui/label";
import { useEffect, useState } from 'react';
import { DatePicker } from 'rsuite';
import 'rsuite/DatePicker/styles/index.css';

const DatePickerComponent = ({
    label,
    value,
    onChange,
    disabled = false,
    error = null,
    required = false,
    fieldName,
    placeholder = "Pick a date"
}) => {

    // Internal fallback state so the component can be used uncontrolled (e.g. tests
    // that omit onChange).
    const [internalDate, setInternalDate] = useState(value || null);

    // Keep internal state in sync when parent updates the controlled value.
    useEffect(() => {
        if (value !== undefined) {
            setInternalDate(value);
        }
    }, [value]);

    const handleDateChange = (date) => {
        if (disabled || !date) return;

        if (onChange) {
            onChange(fieldName, date);
        } else {
            // Uncontrolled usage – maintain our own state so the input retains value
            setInternalDate(date);
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor={fieldName} className="font-semibold text-gray-800 dark:text-gray-200 flex items-center">
                {label} {required && <span className="text-red-500 ml-0.5">*</span>}
            </Label>
            <DatePicker
                id={fieldName}
                value={internalDate}
                onChange={handleDateChange}
                format="MMMM d, yyyy"
                placeholder={placeholder}
                disabled={disabled}
                cleanable={true}
                oneTap={false}
                size="md"
                appearance="default"
                placement="bottomStart"
                style={{
                    width: '100%',
                    height: '42px',
                }}
                className={`w-full ${error ? 'border-red-500' : ''}`}
            />
            {error && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-500">
                    {error}
                </p>
            )}
        </div>
    );
};

export default DatePickerComponent; 