// --- GLOBAL MOCKS ---
// Expose mockToast for all tests
const mockToast = jest.fn();
jest.mock('@/hooks/use-toast', () => ({
    useToast: () => ({ toast: mockToast })
}));

// frontend/tests/student-dashboard/Section3_SchoolEvent.test.jsx

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import React from 'react';
// Corrected import path to include 'src'
import { Section3_SchoolEvent } from '../../src/app/(main)/student-dashboard/submit-event/Section3_SchoolEvent';

// Mock UI components and icons
jest.mock('@/components/ui/button', () => ({ Button: (props) => <button {...props}>{props.children}</button> }));
jest.mock('@/components/ui/card', () => ({
    Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
    CardHeader: ({ children, ...props }) => <div data-testid="card-header" {...props}>{children}</div>,
    CardTitle: ({ children, ...props }) => <h2 data-testid="card-title" {...props}>{children}</h2>,
    CardDescription: ({ children, ...props }) => <p data-testid="card-description" {...props}>{children}</p>,
    CardContent: ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>,
    CardFooter: ({ children, ...props }) => <div data-testid="card-footer" {...props}>{children}</div>,
}));
jest.mock('@/components/ui/input', () => ({ Input: React.forwardRef((props, ref) => <input ref={ref} data-testid={props.id || 'input'} {...props} />) }));
jest.mock('@/components/ui/label', () => ({ Label: (props) => <label {...props}>{props.children}</label> }));
jest.mock('@/components/ui/checkbox', () => ({
    Checkbox: ({ id, checked, onCheckedChange, disabled, ...props }) => (
        <input
            type="checkbox"
            id={id}
            data-testid={id}
            checked={checked}
            onChange={(e) => onCheckedChange(e.target.checked)}
            disabled={disabled}
            {...props}
        />
    ),
}));
jest.mock('@/components/ui/radio-group', () => ({
    RadioGroup: ({ children, value, onValueChange, disabled, ...props }) => (
        <div data-testid="radio-group" role="radiogroup" {...props}>
            {React.Children.map(children, (child) =>
                React.isValidElement(child)
                    ? React.cloneElement(child, {
                        checked: child.props.value === value,
                        onChange: () => onValueChange && onValueChange(child.props.value),
                        disabled: disabled || child.props.disabled,
                        name: props.id || "radio-group",
                    })
                    : child
            )}
        </div>
    ),
    RadioGroupItem: ({ value, id, checked, onChange, disabled, name, ...props }) => (
        <input
            type="radio"
            id={id}
            data-testid={id}
            value={value}
            checked={checked}
            onChange={onChange}
            disabled={disabled}
            name={name || id}
            {...props}
        />
    ),
}));
jest.mock('@/components/ui/popover', () => ({
    Popover: ({ children }) => <div data-testid="popover">{children}</div>,
    PopoverTrigger: ({ children, asChild }) => asChild ? React.Children.only(children) : <div data-testid="popover-trigger">{children}</div>,
    PopoverContent: ({ children }) => <div data-testid="popover-content">{children}</div>,
}));
jest.mock('@/components/ui/calendar', () => ({
    Calendar: ({ onSelect, selected, disabled, ...props }) => (
        <div data-testid="calendar">
            <button data-testid="calendar-date-button" onClick={() => onSelect(new Date(2024, 0, 20))} disabled={disabled}>
                Select Date (Mocked: Jan 20, 2024)
            </button>
            {selected && <p>Selected: {format(new Date(selected), "MMMM d, yyyy")}</p>}
        </div>
    ),
}));
jest.mock('@/components/ui/alert', () => ({
    Alert: ({ children, ...props }) => <div role="alert" {...props}>{children}</div>,
    AlertTitle: ({ children }) => <h5>{children}</h5>,
    AlertDescription: ({ children }) => <p>{children}</p>,
}));
jest.mock('lucide-react', () => ({
    CalendarIcon: (props) => <svg data-testid="calendar-icon" {...props} />,
    UploadCloud: (props) => <svg data-testid="upload-cloud-icon" {...props} />,
    Paperclip: (props) => <svg data-testid="paperclip-icon" {...props} />,
    X: (props) => <svg data-testid="x-icon" {...props} />,
    AlertCircle: (props) => <svg data-testid="alert-circle-icon" {...props} />,
    InfoIcon: (props) => <svg data-testid="info-icon" {...props} />,
    LockIcon: (props) => <svg data-testid="lock-icon" {...props} />,
}));
jest.mock('@/lib/utils', () => ({
    cn: (...inputs) => inputs.filter(Boolean).join(' '),
}));


describe('Section3_SchoolEvent', () => {
    const mockHandleInputChange = jest.fn();
    const mockHandleFileChange = jest.fn();
    const mockOnNext = jest.fn();
    const mockOnPrevious = jest.fn();
    const mockOnWithdraw = jest.fn();

    const emptyFormData = {
        schoolEventName: "",
        schoolVenue: "",
        schoolStartDate: null,
        schoolEndDate: null,
        schoolTimeStart: "",
        schoolTimeEnd: "",
        schoolEventType: "",
        schoolTargetAudience: [],
        schoolEventMode: "",
        schoolReturnServiceCredit: "",
        schoolGPOAFile: null,
        schoolProposalFile: null,
        organizationName: "TestOrg" // Assuming this might be used internally for filename generation
    };

    const filledFormData = {
        ...emptyFormData,
        schoolEventName: "Annual Science Fair",
        schoolVenue: "University Gymnasium",
        schoolStartDate: new Date(2024, 7, 15).toISOString(), // Store as ISO string like parent might
        schoolEndDate: new Date(2024, 7, 16).toISOString(),   // Store as ISO string
        schoolTimeStart: "09:00",
        schoolTimeEnd: "17:00",
        schoolEventType: "competition",
        schoolTargetAudience: ["All Levels", "Faculty"],
        schoolEventMode: "offline",
        schoolReturnServiceCredit: "2",
        schoolGPOAFile: new File(["gpoa content"], "TestOrg_GPOA.pdf", { type: "application/pdf" }),
        schoolProposalFile: new File(["proposal content"], "TestOrg_PP.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    };

    const defaultProps = {
        formData: emptyFormData,
        handleInputChange: mockHandleInputChange,
        handleFileChange: mockHandleFileChange,
        onNext: mockOnNext,
        onPrevious: mockOnPrevious,
        onWithdraw: mockOnWithdraw,
        disabled: false,
        validationErrors: {},
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = (props) => {
        return render(<Section3_SchoolEvent {...defaultProps} {...props} />);
    };

    // --- Basic Rendering ---
    test('renders correctly with empty formData', () => {
        renderComponent();
        expect(screen.getByText("Section 3 of 5: School-Based Event Details")).toBeInTheDocument();
        expect(screen.getByLabelText(/Event\/Activity Name/i)).toHaveValue("");
    });

    test('renders correctly with pre-filled formData', () => {
        renderComponent({ formData: filledFormData });
        expect(screen.getByLabelText(/Event\/Activity Name/i)).toHaveValue(filledFormData.schoolEventName);
        expect(screen.getByText(format(new Date(filledFormData.schoolStartDate), "MMMM d, yyyy"))).toBeInTheDocument();
        expect(screen.getByTestId('school-event-competition')).toBeChecked();
        expect(screen.getByTestId('school-audience-All Levels')).toBeChecked();
        expect(screen.getByTestId('school-mode-offline')).toBeChecked();
        expect(screen.getByTestId('school-credit-2')).toBeChecked();
        expect(screen.getByText(filledFormData.schoolGPOAFile.name)).toBeInTheDocument();
    });

    test('displays revision requested alert if formData.proposalStatus is "denied"', () => {
        renderComponent({ formData: { ...emptyFormData, proposalStatus: "denied", adminComments: "Needs update." } });
        const alerts = screen.getAllByRole('alert');
        const revisionAlert = alerts.find(a => a.textContent.includes('Revision Requested'));
        expect(revisionAlert).toBeInTheDocument();
        expect(revisionAlert).toHaveTextContent('Needs update.');
    });

    test('displays read-only mode indicator if disabled is true', () => {
        renderComponent({ disabled: true });
        expect(screen.getByText("Read-only Mode")).toBeInTheDocument();
        expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });

    // --- Input Interactions ---
    test('handles text input change', () => {
        renderComponent();
        const eventNameInput = screen.getByLabelText(/Event\/Activity Name/i);
        fireEvent.change(eventNameInput, { target: { name: 'schoolEventName', value: 'New Event' } });
        expect(mockHandleInputChange).toHaveBeenCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ name: 'schoolEventName', value: 'New Event' }) })
        );
    });

    test('handles date change via calendar', () => {
        renderComponent();
        // For Start Date
        const startDateButton = screen.getAllByRole('button', { name: /pick a date/i })[0];
        fireEvent.click(startDateButton); // Open Popover
        const mockDateButton = screen.getAllByTestId('calendar-date-button')[0];
        fireEvent.click(mockDateButton); // Select the mocked date (Jan 20, 2024)

        // The component calls handleDateChange, which then calls handleInputChange with an ISO string
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'schoolStartDate', value: new Date(2024, 0, 20).toISOString() } });
    });

    test('handles target audience checkbox change', () => {
        renderComponent({ formData: { ...emptyFormData, schoolTargetAudience: [] } }); // Ensure it starts empty
        const firstYearCheckbox = screen.getByTestId('school-audience-1st Year');
        fireEvent.click(firstYearCheckbox);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'schoolTargetAudience', value: ['1st Year'] } });

        fireEvent.click(firstYearCheckbox); // Uncheck
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'schoolTargetAudience', value: [] } });
    });

    test('handles radio group change for event type', () => {
        renderComponent();
        const workshopRadio = screen.getByTestId('school-event-workshop-seminar-webinar');
        fireEvent.click(workshopRadio);
        expect(mockHandleInputChange).toHaveBeenCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ name: 'schoolEventType', value: 'workshop-seminar-webinar' }) })
        );
    });

    // --- File Upload ---
    describe('File Uploads', () => {
        const testFileGPOA = new File(['content'], 'TestOrg_GPOA.pdf', { type: 'application/pdf' });
        const testFileProposal = new File(['content'], 'TestOrg_PP.pdf', { type: 'application/pdf' });
        const invalidTypeFile = new File(['content'], 'invalid.txt', { type: 'text/plain' });
        const largeFile = new File([''.padStart(6 * 1024 * 1024, 'a')], 'large.pdf', { type: 'application/pdf' });

        test('handles valid GPOA file upload', async () => {
            renderComponent();
            const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
            fireEvent.change(gpoaInput, { target: { files: [testFileGPOA], name: 'schoolGPOAFile' } });

            await waitFor(() => {
                expect(screen.getByText(testFileGPOA.name)).toBeInTheDocument();
                expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ files: [testFileGPOA], name: 'schoolGPOAFile' }) }));
            });
        });

        test('handles valid Proposal file upload', async () => {
            renderComponent();
            const proposalInput = screen.getByLabelText(/Project Proposal Document/i).closest('div').querySelector('input[type="file"]');
            fireEvent.change(proposalInput, { target: { files: [testFileProposal], name: 'schoolProposalFile' } });

            await waitFor(() => {
                expect(screen.getByText(testFileProposal.name)).toBeInTheDocument();
                expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ files: [testFileProposal], name: 'schoolProposalFile' }) }));
            });
        });

        test('shows error for invalid file type and does not update file', async () => {
            renderComponent();
            const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
            fireEvent.change(gpoaInput, { target: { files: [invalidTypeFile], name: 'schoolGPOAFile' } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({ title: expect.stringMatching(/Invalid file type/i), variant: 'destructive' })
                );
                expect(screen.queryByText(invalidTypeFile.name)).not.toBeInTheDocument();
            });
        });

        test('shows error for oversized file and does not update file', async () => {
            renderComponent();
            const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
            fireEvent.change(gpoaInput, { target: { files: [largeFile], name: 'schoolGPOAFile' } });

            await waitFor(() => {
                expect(mockToast).toHaveBeenCalledWith(
                    expect.objectContaining({ title: expect.stringMatching(/File too large/i), variant: 'destructive' })
                );
                expect(screen.queryByText(largeFile.name)).not.toBeInTheDocument();
            });
        });

        test('removes a selected file when X button is clicked', async () => {
            // Pass a file initially through formData to ensure the remove button is present
            renderComponent({ formData: { ...emptyFormData, schoolGPOAFile: testFileGPOA } });

            await screen.findByText(testFileGPOA.name); // Wait for preview to appear

            const removeButton = screen.getByRole('button', { name: /Remove General Plan of Action/i });
            fireEvent.click(removeButton);

            await waitFor(() => {
                expect(screen.queryByText(testFileGPOA.name)).not.toBeInTheDocument();
                // The component's handleFileRemove calls handleFileChange with an event-like object
                expect(mockHandleFileChange).toHaveBeenCalledWith({ target: { name: 'schoolGPOAFile', files: [] } });
            });
        });
    });

    // --- Error Display ---
    test('displays validationErrors from props', () => {
        const errors = { schoolEventName: 'Event name is required by parent.' };
        renderComponent({ validationErrors: errors });
        expect(screen.getByText('Event name is required by parent.')).toBeInTheDocument();
    });

    // --- Navigation Buttons ---
    test('calls onPrevious when "Back to Section 2" is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /Back to Section 2/i }));
        expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });

    test('calls onWithdraw when "Withdraw Proposal" is clicked (if not disabled)', () => {
        renderComponent({ disabled: false }); // Ensure it's not disabled
        fireEvent.click(screen.getByRole('button', { name: /Withdraw Proposal/i }));
        expect(mockOnWithdraw).toHaveBeenCalledTimes(1);
    });

    test('calls onNext when "Save & Continue to Section 4" is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /Save & Continue to Section 4/i }));
        expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    // --- Disabled State ---
    test('disables all interactive elements when disabled prop is true', () => {
        // Use filledFormData to ensure elements that depend on data (like date picker text) are present
        renderComponent({ formData: filledFormData, disabled: true });

        expect(screen.getByLabelText(/Event\/Activity Name/i)).toBeDisabled();

        // Check a date picker trigger button. The text will be the formatted date.
        const datePickerButton = screen.getAllByRole('button', { name: new RegExp(format(new Date(filledFormData.schoolStartDate), "MMMM d, yyyy"), "i") })[0];
        expect(datePickerButton).toBeDisabled();

        expect(screen.getByTestId('school-event-competition')).toBeDisabled();
        expect(screen.getByTestId('school-audience-All Levels')).toBeDisabled();

        // File inputs are sr-only, their disabled state is on the input itself.
        // The label/clickable area might not have a 'disabled' attribute, but the underlying input should.
        const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
        expect(gpoaInput).toBeDisabled();

        expect(screen.getByRole('button', { name: /Back to Section 2/i })).toBeDisabled();
        expect(screen.queryByRole('button', { name: /Withdraw Proposal/i })).not.toBeInTheDocument(); // Not rendered when disabled
        expect(screen.getByRole('button', { name: /Save & Continue to Section 4/i })).toBeDisabled();
    });

    test('updates file previews if formData file props change externally', () => {
        const initialFile = new File(["initial content"], "initial.pdf", { type: "application/pdf" });
        const { rerender } = renderComponent({ formData: { ...emptyFormData, schoolGPOAFile: initialFile } });
        expect(screen.getByText(initialFile.name)).toBeInTheDocument();

        const updatedFile = new File(["updated content"], "updated.pdf", { type: "application/pdf" });
        // Rerender with the new props
        rerender(<Section3_SchoolEvent {...defaultProps} formData={{ ...emptyFormData, schoolGPOAFile: updatedFile }} />);

        expect(screen.getByText(updatedFile.name)).toBeInTheDocument();
        expect(screen.queryByText(initialFile.name)).not.toBeInTheDocument();
    });
});

// Keeping the second describe block as is, assuming it tests more specific or edge cases.
// Ensure its imports and setup are compatible if it were to be run.
// If it uses the same component, the import path fix would apply there too.
describe('Section3_SchoolEvent - precise and specific cases', () => {
    const mockHandleInputChange = jest.fn();
    const mockHandleFileChange = jest.fn();
    const mockOnNext = jest.fn();
    const mockOnPrevious = jest.fn();
    const mockOnWithdraw = jest.fn();
    // Mock useToast for this describe block as well
    const mockToast = jest.fn();

    const baseFormData = {
        schoolEventName: '',
        schoolVenue: '',
        schoolStartDate: null,
        schoolEndDate: null,
        schoolTimeStart: '',
        schoolTimeEnd: '',
        schoolEventType: '',
        schoolTargetAudience: [],
        schoolEventMode: '',
        schoolReturnServiceCredit: '',
        schoolGPOAFile: null,
        schoolProposalFile: null,
        proposalStatus: undefined, // Explicitly undefined
        adminComments: '',
    };

    const renderComponent = (props) =>
        render(
            <Section3_SchoolEvent
                formData={baseFormData} // Default base
                handleInputChange={mockHandleInputChange}
                handleFileChange={mockHandleFileChange}
                onNext={mockOnNext}
                onPrevious={mockOnPrevious}
                onWithdraw={mockOnWithdraw}
                disabled={false}
                validationErrors={{}}
                {...props} // Override with specific props for the test
            />
        );

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(require('@/hooks/use-toast'), 'useToast').mockReturnValue({ toast: mockToast });
    });
    afterEach(() => jest.restoreAllMocks()); // Or jest.clearAllMocks();

    test('displays admin comments when proposalStatus is denied', () => {
        renderComponent({ formData: { ...baseFormData, proposalStatus: 'denied', adminComments: 'Please revise.' } });
        expect(screen.getByText('Please revise.')).toBeInTheDocument();
    });

    test('displays default denied message if adminComments is empty', () => {
        renderComponent({ formData: { ...baseFormData, proposalStatus: 'denied', adminComments: '' } });
        expect(screen.getByText(/The admin has requested revisions/i)).toBeInTheDocument();
    });

    test('disables all fields and buttons when disabled is true', () => {
        renderComponent({ disabled: true });
        expect(screen.getByLabelText(/Event\/Activity Name/i)).toBeDisabled();
        expect(screen.getByRole('button', { name: /Save & Continue to Section 4/i })).toBeDisabled();
        expect(screen.getByText('Read-only Mode')).toBeInTheDocument();
    });

    test('shows error message for each field with validationErrors', () => {
        const errors = {
            schoolEventName: 'Name error',
            schoolVenue: 'Venue error',
            schoolStartDate: 'Start date error',
            schoolEndDate: 'End date error',
            schoolTimeStart: 'Start time error',
            schoolTimeEnd: 'End time error',
            schoolEventType: 'Type error',
            schoolTargetAudience: 'Audience error',
            schoolEventMode: 'Mode error',
            schoolReturnServiceCredit: 'Credit error',
            schoolGPOAFile: 'GPOA error',
            schoolProposalFile: 'Proposal error',
        };
        renderComponent({ validationErrors: errors });
        Object.values(errors).forEach(msg => {
            expect(screen.getByText(msg)).toBeInTheDocument();
        });
    });

    test('calls handleInputChange with ISO string when selecting a date', () => {
        renderComponent();
        const startDateButton = screen.getAllByRole('button', { name: /pick a date/i })[0];
        fireEvent.click(startDateButton);
        const calendarButton = screen.getAllByTestId('calendar-date-button')[0]; // From mocked calendar
        fireEvent.click(calendarButton); // Clicks the button that calls onSelect with new Date(2024, 0, 20)

        expect(mockHandleInputChange).toHaveBeenCalledWith(
            // The component's handleDateChange converts the Date object to an ISO string
            expect.objectContaining({ target: expect.objectContaining({ name: 'schoolStartDate', value: new Date(2024, 0, 20).toISOString() }) })
        );
    });

    test('calls handleFileUpload and shows file name on valid upload', async () => {
        renderComponent();
        const file = new File(['file'], 'test.pdf', { type: 'application/pdf' });
        const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
        fireEvent.change(gpoaInput, { target: { files: [file], name: 'schoolGPOAFile' } });
        await waitFor(() => {
            expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ name: 'schoolGPOAFile', files: [file] }) }));
            expect(screen.getByText('test.pdf')).toBeInTheDocument();
        });
    });

    test('shows error and does not update preview for invalid file type', async () => {
        renderComponent();
        const file = new File(['bad'], 'bad.txt', { type: 'text/plain' });
        const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
        fireEvent.change(gpoaInput, { target: { files: [file], name: 'schoolGPOAFile' } });
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringMatching(/Invalid file type/i),
                description: expect.stringMatching(/Only PDF, Word, and Excel files are allowed/i),
                variant: 'destructive',
            }));
            expect(screen.queryByText('bad.txt')).not.toBeInTheDocument();
        });
    });

    test('shows error and does not update preview for file > 5MB', async () => {
        renderComponent();
        const file = new File(['a'.repeat(6 * 1024 * 1024)], 'big.pdf', { type: 'application/pdf' });
        const gpoaInput = screen.getByLabelText(/General Plan of Action/i).closest('div').querySelector('input[type="file"]');
        fireEvent.change(gpoaInput, { target: { files: [file], name: 'schoolGPOAFile' } });
        await waitFor(() => {
            expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
                title: expect.stringMatching(/File too large/i),
                description: expect.stringMatching(/Maximum file size is 5MB/i),
                variant: 'destructive',
            }));
            expect(screen.queryByText('big.pdf')).not.toBeInTheDocument();
        });
    });

    test('removes file when X button is clicked', async () => {
        const file = new File(['file'], 'test.pdf', { type: 'application/pdf' });
        renderComponent({ formData: { ...baseFormData, schoolGPOAFile: file } }); // Start with a file
        await screen.findByText('test.pdf'); // Ensure file is initially displayed
        const removeButton = screen.getByRole('button', { name: /Remove General Plan of Action/i });
        fireEvent.click(removeButton);
        await waitFor(() => {
            expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: { name: 'schoolGPOAFile', files: [] } }));
            expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
        });
    });

    test('target audience checkboxes work and call handleInputChange', () => {
        renderComponent(); // Uses baseFormData which has empty schoolTargetAudience
        const checkbox = screen.getByTestId('school-audience-1st Year');
        fireEvent.click(checkbox); // Check it
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'schoolTargetAudience', value: ['1st Year'] } });

        fireEvent.click(checkbox); // Uncheck it
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'schoolTargetAudience', value: [] } });
    });

    test('radio groups work and call handleInputChange', () => {
        renderComponent();
        const radio = screen.getByTestId('school-event-academic-enhancement');
        fireEvent.click(radio);
        expect(mockHandleInputChange).toHaveBeenCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ name: 'schoolEventType', value: 'academic-enhancement' }) })
        );
    });

    test('time input fields work and call handleInputChange', () => {
        renderComponent();
        const startTime = screen.getByLabelText(/Start Time/i);
        fireEvent.change(startTime, { target: { name: 'schoolTimeStart', value: '10:00' } });
        expect(mockHandleInputChange).toHaveBeenCalledWith(
            expect.objectContaining({ target: expect.objectContaining({ name: 'schoolTimeStart', value: '10:00' }) })
        );
    });

    test('file preview updates if formData changes externally', () => {
        const file = new File(['file'], 'test.pdf', { type: 'application/pdf' });
        const { rerender } = renderComponent(); // Initial render with baseFormData (no file)

        // Rerender with new formData that includes the file
        rerender(<Section3_SchoolEvent {...{
            formData: { ...baseFormData, schoolGPOAFile: file },
            handleInputChange: mockHandleInputChange,
            handleFileChange: mockHandleFileChange,
            onNext: mockOnNext,
            onPrevious: mockOnPrevious,
            onWithdraw: mockOnWithdraw,
            disabled: false,
            validationErrors: {},
        }} />);
        expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });

    test('Back, Withdraw, and Next buttons call their handlers', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /Back to Section 2/i }));
        expect(mockOnPrevious).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /Withdraw Proposal/i }));
        expect(mockOnWithdraw).toHaveBeenCalled();

        fireEvent.click(screen.getByRole('button', { name: /Save & Continue to Section 4/i }));
        expect(mockOnNext).toHaveBeenCalled();
    });
});
