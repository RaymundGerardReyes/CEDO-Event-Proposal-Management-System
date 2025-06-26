// frontend/tests/student-dashboard/Section4_CommunityEvent.test.jsx

import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { format } from 'date-fns';
import React from 'react';
// Adjust the import path according to your project structure
import Section4_CommunityEvent from '../../src/app/(main)/student-dashboard/submit-event/[draftId]/community-event/Section4_CommunityEvent';

// Mock UI components and hooks
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
jest.mock('@/components/ui/label', () => ({ Label: (props) => <label {...props} htmlFor={props.htmlFor}>{props.children}</label> })); // Added htmlFor
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
                React.isValidElement(child) && child.type.displayName === "RadioGroupItem" // Check if it's a RadioGroupItem
                    ? React.cloneElement(child, {
                        name: props.id || "radio-group",
                        currentValue: value,
                        onItemChange: onValueChange,
                        groupDisabled: disabled,
                    })
                    : child
            )}
        </div>
    ),
    RadioGroupItem: React.forwardRef(({ value, id, currentValue, onItemChange, groupDisabled, disabled, ...props }, ref) => {
        RadioGroupItem.displayName = "RadioGroupItem"; // For the check above
        return (
            <input
                ref={ref}
                type="radio"
                id={id}
                data-testid={id}
                value={value}
                checked={value === currentValue}
                onChange={() => onItemChange && onItemChange(value)}
                disabled={groupDisabled || disabled}
                name={props.name || id}
                {...props}
            />
        );
    })
}));
jest.mock('@/components/ui/popover', () => ({
    Popover: ({ children }) => <div data-testid="popover">{children}</div>,
    PopoverTrigger: ({ children, asChild }) => asChild ? React.Children.only(children) : <div data-testid="popover-trigger">{children}</div>,
    PopoverContent: ({ children }) => <div data-testid="popover-content">{children}</div>,
}));
jest.mock('@/components/ui/calendar', () => ({
    Calendar: ({ onSelect, selected, disabled, ...props }) => (
        <div data-testid="calendar">
            <button data-testid="calendar-date-button" onClick={() => onSelect(new Date(2024, 5, 10))} disabled={disabled}>
                Select Date (Mocked: Jun 10, 2024)
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
    Upload: (props) => <svg data-testid="upload-icon" {...props} />,
    InfoIcon: (props) => <svg data-testid="info-icon" {...props} />,
    LockIcon: (props) => <svg data-testid="lock-icon" {...props} />,
    AlertCircle: (props) => <svg data-testid="alert-circle-icon" {...props} />,
}));


describe('Section4_CommunityEvent', () => {
    const mockHandleInputChange = jest.fn();
    const mockHandleFileChange = jest.fn();
    const mockHandleCheckboxChange = jest.fn(); // Prop exists, so mock it
    const mockOnSubmit = jest.fn();
    const mockOnPrevious = jest.fn();
    const mockOnWithdraw = jest.fn();

    const emptyFormData = {
        organizationName: "TestCommunityOrg",
        communityEventName: "",
        communityVenue: "",
        communityStartDate: null,
        communityEndDate: null,
        communityTimeStart: "",
        communityTimeEnd: "",
        communityEventType: "",
        communityTargetAudience: [],
        communityEventMode: "",
        communitySDPCredits: "",
        communityGPOAFile: null,
        communityProposalFile: null,
        proposalStatus: undefined,
        adminComments: "",
    };

    const filledFormData = {
        ...emptyFormData,
        communityEventName: "Annual Community Fair",
        communityVenue: "Town Plaza",
        communityStartDate: new Date(2024, 7, 15), // Aug 15, 2024
        communityEndDate: new Date(2024, 7, 16),   // Aug 16, 2024
        communityTimeStart: "09:00",
        communityTimeEnd: "17:00",
        communityEventType: "seminar",
        communityTargetAudience: ["All Levels", "Alumni"],
        communityEventMode: "offline",
        communitySDPCredits: "1",
        communityGPOAFile: new File(["gpoa data"], "TestCommunityOrg_gpoa.pdf", { type: "application/pdf" }),
        communityProposalFile: new File(["proposal data"], "TestCommunityOrg_pp.docx", { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" }),
    };

    const defaultProps = {
        formData: emptyFormData,
        handleInputChange: mockHandleInputChange,
        handleFileChange: mockHandleFileChange,
        handleCheckboxChange: mockHandleCheckboxChange,
        onSubmit: mockOnSubmit,
        onPrevious: mockOnPrevious,
        onWithdraw: mockOnWithdraw,
        disabled: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    const renderComponent = (props) => {
        return render(<Section4_CommunityEvent {...defaultProps} {...props} />);
    };

    // Test Suite 1: Basic Rendering and Initial State
    test('1. Renders correctly with default empty formData', () => {
        renderComponent();
        expect(screen.getByText("Section 4 of 5: Community-Based Event Details")).toBeInTheDocument();
        expect(screen.getByLabelText(/Event\/Activity Name/i)).toHaveValue("");
        expect(screen.getByLabelText(/Venue \(Platform or Address\)/i)).toHaveValue("");
        // Check that file upload areas show "Click to upload file"
        expect(screen.getAllByText("Click to upload file")).toHaveLength(2);
    });

    test('2. Renders correctly with pre-filled formData', () => {
        renderComponent({ formData: filledFormData });
        expect(screen.getByLabelText(/Event\/Activity Name/i)).toHaveValue(filledFormData.communityEventName);
        expect(screen.getByLabelText(/Venue \(Platform or Address\)/i)).toHaveValue(filledFormData.communityVenue);
        expect(screen.getByText(format(filledFormData.communityStartDate, "PPP"))).toBeInTheDocument();
        expect(screen.getByText(format(filledFormData.communityEndDate, "PPP"))).toBeInTheDocument();
        expect(screen.getByLabelText(/Time Start/i)).toHaveValue(filledFormData.communityTimeStart);
        expect(screen.getByLabelText(/Time End/i)).toHaveValue(filledFormData.communityTimeEnd);
        expect(screen.getByLabelText('Seminar/Webinar')).toBeChecked(); // Radio button
        expect(screen.getByLabelText('All Levels')).toBeChecked(); // Checkbox
        expect(screen.getByLabelText('Alumni')).toBeChecked(); // Checkbox
        expect(screen.getByLabelText('Offline')).toBeChecked(); // Radio button
        expect(screen.getByLabelText('1')).toBeChecked(); // Radio button for SDP credits
        expect(screen.getByText(filledFormData.communityGPOAFile.name)).toBeInTheDocument();
        expect(screen.getByText(filledFormData.communityProposalFile.name)).toBeInTheDocument();
    });

    test('3. Displays "Revision Requested" alert with adminComments', () => {
        const comments = "Please provide more details on the budget.";
        renderComponent({ formData: { ...emptyFormData, proposalStatus: "denied", adminComments: comments } });
        expect(screen.getByRole('alert', { name: /Revision Requested/i })).toBeInTheDocument();
        expect(screen.getByText(comments)).toBeInTheDocument();
    });

    test('4. Displays default "Revision Requested" message if adminComments are empty', () => {
        renderComponent({ formData: { ...emptyFormData, proposalStatus: "denied", adminComments: "" } });
        expect(screen.getByRole('alert', { name: /Revision Requested/i })).toBeInTheDocument();
        expect(screen.getByText(/The admin has requested revisions to your event proposal/i)).toBeInTheDocument();
    });

    test('5. Displays "Read-only" mode indicator when disabled', () => {
        renderComponent({ disabled: true });
        expect(screen.getByText("Read-only")).toBeInTheDocument();
        expect(screen.getByTestId("lock-icon")).toBeInTheDocument();
    });

    // Test Suite 2: Input Interactions
    test('6. Handles communityEventName input change', () => {
        renderComponent();
        const input = screen.getByLabelText(/Event\/Activity Name/i);
        fireEvent.change(input, { target: { name: 'communityEventName', value: 'New Name' } });
        expect(mockHandleInputChange).toHaveBeenCalledWith(expect.objectContaining({ target: { name: 'communityEventName', value: 'New Name' } }));
    });

    test('7. Handles communityVenue input change', () => {
        renderComponent();
        const input = screen.getByLabelText(/Venue \(Platform or Address\)/i);
        fireEvent.change(input, { target: { name: 'communityVenue', value: 'New Venue' } });
        expect(mockHandleInputChange).toHaveBeenCalledWith(expect.objectContaining({ target: { name: 'communityVenue', value: 'New Venue' } }));
    });

    test('8. Handles communityStartDate change via Calendar', () => {
        renderComponent();
        const datePickerButton = screen.getAllByRole('button', { name: /Select date/i })[0];
        fireEvent.click(datePickerButton); // Open popover for start date
        const mockedDateButton = screen.getByTestId('calendar-date-button'); // Button inside mocked Calendar
        fireEvent.click(mockedDateButton); // Selects Jun 10, 2024 from mock
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communityStartDate', value: new Date(2024, 5, 10) } });
    });

    test('9. Handles communityEndDate change via Calendar', () => {
        renderComponent();
        const datePickerButton = screen.getAllByRole('button', { name: /Select date/i })[1];
        fireEvent.click(datePickerButton); // Open popover for end date
        const mockedDateButton = screen.getByTestId('calendar-date-button');
        fireEvent.click(mockedDateButton);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communityEndDate', value: new Date(2024, 5, 10) } });
    });

    test('10. Handles communityTimeStart input change', () => {
        renderComponent();
        const input = screen.getByLabelText(/Time Start/i);
        fireEvent.change(input, { target: { name: 'communityTimeStart', value: '11:00' } });
        expect(mockHandleInputChange).toHaveBeenCalledWith(expect.objectContaining({ target: { name: 'communityTimeStart', value: '11:00' } }));
    });

    test('11. Handles communityTimeEnd input change', () => {
        renderComponent();
        const input = screen.getByLabelText(/Time End/i);
        fireEvent.change(input, { target: { name: 'communityTimeEnd', value: '18:00' } });
        expect(mockHandleInputChange).toHaveBeenCalledWith(expect.objectContaining({ target: { name: 'communityTimeEnd', value: '18:00' } }));
    });

    test('12. Handles communityEventType radio group change', () => {
        renderComponent();
        const radioItem = screen.getByLabelText('Leadership Training');
        fireEvent.click(radioItem);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communityEventType', value: 'leadership' } });
    });

    // Test Suite 3: Target Audience Checkbox Interactions
    test('13. Handles communityTargetAudience checkbox selection (add)', () => {
        renderComponent({ formData: { ...emptyFormData, communityTargetAudience: [] } });
        const checkbox = screen.getByLabelText('1st Year');
        fireEvent.click(checkbox);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communityTargetAudience', value: ['1st Year'] } });
    });

    test('14. Handles communityTargetAudience checkbox deselection (remove)', () => {
        renderComponent({ formData: { ...emptyFormData, communityTargetAudience: ['1st Year', '2nd Year'] } });
        const checkbox = screen.getByLabelText('1st Year');
        fireEvent.click(checkbox);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communityTargetAudience', value: ['2nd Year'] } });
    });

    // Test Suite 4: Event Mode & SDP Credits Radio Group Interactions
    test('15. Handles communityEventMode radio group change', () => {
        renderComponent();
        const radioItem = screen.getByLabelText('Online');
        fireEvent.click(radioItem);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communityEventMode', value: 'online' } });
    });

    test('16. Handles communitySDPCredits radio group change', () => {
        renderComponent();
        const radioItem = screen.getByLabelText('2');
        fireEvent.click(radioItem);
        expect(mockHandleInputChange).toHaveBeenCalledWith({ target: { name: 'communitySDPCredits', value: '2' } });
    });

    // Test Suite 5: File Upload and Validation (communityGPOAFile)
    const gpoaFileLabelText = /Attach General Plan of Action \(GPOA\)/i;
    const validGPOAFile = new File(["gpoa"], "TestCommunityOrg_gpoa.pdf", { type: "application/pdf" });
    const invalidTypeGPOAFile = new File(["gpoa"], "TestCommunityOrg_gpoa.txt", { type: "text/plain" });
    const invalidNameGPOAFile = new File(["gpoa"], "TestCommunityOrg_wrong.pdf", { type: "application/pdf" });
    const oversizedGPOAFile = new File(['a'.repeat(11 * 1024 * 1024)], "TestCommunityOrg_gpoa_large.pdf", { type: "application/pdf" });

    test('17. Handles valid communityGPOAFile upload', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { name: 'communityGPOAFile', files: [validGPOAFile] } });
        await waitFor(() => {
            expect(screen.getByText(validGPOAFile.name)).toBeInTheDocument();
            expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ name: 'communityGPOAFile', files: [validGPOAFile] }) }));
            expect(screen.queryByText(/File must be PDF, Word, or Excel format/i)).not.toBeInTheDocument();
        });
    });

    test('18. Shows error for invalid communityGPOAFile type', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { name: 'communityGPOAFile', files: [invalidTypeGPOAFile] } });
        await waitFor(() => {
            expect(screen.getByText(/File must be PDF, Word, or Excel format/i)).toBeInTheDocument();
            expect(mockHandleFileChange).not.toHaveBeenCalled();
        });
    });

    test('19. Shows error for incorrect communityGPOAFile naming (missing "gpoa")', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { name: 'communityGPOAFile', files: [invalidNameGPOAFile] } });
        await waitFor(() => {
            expect(screen.getByText(/File name must include 'GPOA'/i)).toBeInTheDocument();
            expect(mockHandleFileChange).not.toHaveBeenCalled();
        });
    });

    test('20. Shows error for oversized communityGPOAFile', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { name: 'communityGPOAFile', files: [oversizedGPOAFile] } });
        await waitFor(() => {
            expect(screen.getByText(/File size must be less than 10MB/i)).toBeInTheDocument();
            expect(mockHandleFileChange).not.toHaveBeenCalled();
        });
    });

    test('21. Clears communityGPOAFile error on subsequent valid upload', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]');
        // First, upload invalid file
        fireEvent.change(fileInput, { target: { name: 'communityGPOAFile', files: [invalidTypeGPOAFile] } });
        await waitFor(() => expect(screen.getByText(/File must be PDF, Word, or Excel format/i)).toBeInTheDocument());
        // Then, upload valid file
        fireEvent.change(fileInput, { target: { name: 'communityGPOAFile', files: [validGPOAFile] } });
        await waitFor(() => {
            expect(screen.queryByText(/File must be PDF, Word, or Excel format/i)).not.toBeInTheDocument();
            expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ files: [validGPOAFile] }) }));
        });
    });

    // Test Suite 6: File Upload and Validation (communityProposalFile)
    const proposalFileLabelText = /Attach Project Proposal/i;
    const validProposalFile = new File(["pp"], "TestCommunityOrg_pp.pdf", { type: "application/pdf" });
    const invalidNameProposalFile = new File(["pp"], "TestCommunityOrg_proposal.pdf", { type: "application/pdf" });

    test('22. Handles valid communityProposalFile upload', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(proposalFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { name: 'communityProposalFile', files: [validProposalFile] } });
        await waitFor(() => {
            expect(screen.getByText(validProposalFile.name)).toBeInTheDocument();
            expect(mockHandleFileChange).toHaveBeenCalledWith(expect.objectContaining({ target: expect.objectContaining({ name: 'communityProposalFile', files: [validProposalFile] }) }));
        });
    });

    test('23. Shows error for incorrect communityProposalFile naming (missing "pp")', async () => {
        renderComponent();
        const fileInput = screen.getByLabelText(proposalFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(fileInput, { target: { name: 'communityProposalFile', files: [invalidNameProposalFile] } });
        await waitFor(() => {
            expect(screen.getByText(/File name must include 'PP'/i)).toBeInTheDocument();
            expect(mockHandleFileChange).not.toHaveBeenCalled();
        });
    });

    // Test Suite 7: Navigation Buttons
    test('24. Calls onPrevious when "Back" button is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /Back/i }));
        expect(mockOnPrevious).toHaveBeenCalledTimes(1);
    });

    test('25. Calls onWithdraw when "Withdraw" button is clicked', () => {
        renderComponent(); // disabled is false by default
        fireEvent.click(screen.getByRole('button', { name: /Withdraw/i }));
        expect(mockOnWithdraw).toHaveBeenCalledTimes(1);
    });

    test('26. Calls onSubmit when "Submit Proposal for Approval" button is clicked', () => {
        renderComponent();
        fireEvent.click(screen.getByRole('button', { name: /Submit Proposal for Approval/i }));
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    });

    // Test Suite 8: Disabled State
    test('27. Disables all interactive elements when disabled prop is true', () => {
        renderComponent({ formData: filledFormData, disabled: true });
        expect(screen.getByLabelText(/Event\/Activity Name/i)).toBeDisabled();
        expect(screen.getByLabelText(/Venue \(Platform or Address\)/i)).toBeDisabled();
        expect(screen.getAllByRole('button', { name: new RegExp(format(filledFormData.communityStartDate, "PPP"), "i") })[0]).toBeDisabled();
        expect(screen.getByLabelText(/Time Start/i)).toBeDisabled();
        expect(screen.getByLabelText('Seminar/Webinar')).toBeDisabled(); // Radio
        expect(screen.getByLabelText('All Levels')).toBeDisabled(); // Checkbox
        expect(screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]')).toBeDisabled();
        expect(screen.getByRole('button', { name: /Back/i })).toBeDisabled();
        expect(screen.queryByRole('button', { name: /Withdraw/i })).not.toBeInTheDocument(); // Withdraw button is not rendered when disabled
        expect(screen.getByRole('button', { name: /Submit Proposal for Approval/i })).toBeDisabled();
    });

    test('28. File inputs are not interactive when disabled', () => {
        renderComponent({ disabled: true });
        const gpoaInput = screen.getByLabelText(gpoaFileLabelText).querySelector('input[type="file"]');
        fireEvent.change(gpoaInput, { target: { name: 'communityGPOAFile', files: [validGPOAFile] } });
        expect(mockHandleFileChange).not.toHaveBeenCalled(); // Should not process if disabled
    });

    test('29. Date pickers do not trigger change when disabled', () => {
        renderComponent({ disabled: true });
        const datePickerButton = screen.getAllByRole('button', { name: /Select date/i })[0];
        fireEvent.click(datePickerButton); // Attempt to open popover
        // In a real browser, the popover might not open. Here, we check if the callback is prevented.
        // The mocked calendar's button click won't be reachable if the popover trigger is truly disabled.
        // We primarily check that handleInputChange is not called.
        expect(mockHandleInputChange).not.toHaveBeenCalled();
    });

    test('30. Radio group changes do not trigger when disabled', () => {
        renderComponent({ disabled: true });
        const radioItem = screen.getByLabelText('Online'); // For Event Mode
        fireEvent.click(radioItem);
        expect(mockHandleInputChange).not.toHaveBeenCalled();
    });

    test('31. Checkbox changes do not trigger when disabled', () => {
        renderComponent({ disabled: true });
        const checkbox = screen.getByLabelText('Leaders'); // For Target Audience
        fireEvent.click(checkbox);
        expect(mockHandleInputChange).not.toHaveBeenCalled();
    });


});
