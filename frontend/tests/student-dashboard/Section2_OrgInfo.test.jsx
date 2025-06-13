// frontend/tests/student-dashboard/Section2_OrgInfo.test.jsx

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import Section2_OrgInfo from '../../app/(main)/student-dashboard/submit-event/Section2_OrgInfo'; // Adjust path as needed

// Mock child components if they are complex or have side effects not relevant to this component's tests
jest.mock('@/components/ui/button', () => ({ Button: (props) => <button {...props} /> }));
jest.mock('@/components/ui/card', () => ({
  Card: ({ children, ...props }) => <div data-testid="card" {...props}>{children}</div>,
  CardHeader: ({ children, ...props }) => <div data-testid="card-header" {...props}>{children}</div>,
  CardTitle: ({ children, ...props }) => <h2 data-testid="card-title" {...props}>{children}</h2>,
  CardDescription: ({ children, ...props }) => <p data-testid="card-description" {...props}>{children}</p>,
  CardContent: ({ children, ...props }) => <div data-testid="card-content" {...props}>{children}</div>,
}));
jest.mock('@/components/ui/checkbox', () => ({ Checkbox: (props) => <input type="checkbox" data-testid={props.id || 'checkbox'} {...props} checked={props.checked} onChange={(e) => props.onCheckedChange(e.target.checked)} /> }));
jest.mock('@/components/ui/input', () => ({ Input: (props) => <input data-testid={props.id || 'input'} {...props} /> }));
jest.mock('@/components/ui/label', () => ({ Label: (props) => <label {...props} /> }));
jest.mock('@/components/ui/textarea', () => ({ Textarea: (props) => <textarea data-testid={props.id || 'textarea'} {...props} /> }));


describe('Section2_OrgInfo', () => {
  const mockOnChange = jest.fn();
  const mockOnNext = jest.fn();
  const mockOnPrevious = jest.fn();
  const mockOnWithdraw = jest.fn();

  const initialFormData = {
    organizationName: 'Test Org',
    organizationTypes: ['school-based'],
    organizationDescription: 'A test organization.',
    contactName: 'John Doe',
    contactEmail: 'john.doe@example.com',
    contactPhone: '1234567890',
  };

  const defaultProps = {
    formData: {},
    onChange: mockOnChange,
    onNext: mockOnNext,
    onPrevious: mockOnPrevious,
    onWithdraw: mockOnWithdraw,
    errors: {},
    disabled: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (props) => {
    return render(<Section2_OrgInfo {...defaultProps} {...props} />);
  };

  test('renders correctly with initial empty formData', () => {
    renderComponent();
    expect(screen.getByText('Organization Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/Organization Name/i)).toHaveValue('');
    expect(screen.getByTestId('school-based')).not.toBeChecked();
    expect(screen.getByTestId('community-based')).not.toBeChecked();
  });

  test('renders correctly with pre-filled formData', () => {
    renderComponent({ formData: initialFormData });
    expect(screen.getByLabelText(/Organization Name/i)).toHaveValue(initialFormData.organizationName);
    expect(screen.getByTestId('school-based')).toBeChecked();
    expect(screen.getByTestId('community-based')).not.toBeChecked();
    expect(screen.getByLabelText(/Organization Description/i)).toHaveValue(initialFormData.organizationDescription);
    expect(screen.getByLabelText(/Contact Person/i)).toHaveValue(initialFormData.contactName);
    expect(screen.getByLabelText(/Email/i)).toHaveValue(initialFormData.contactEmail);
    expect(screen.getByLabelText(/Phone Number/i)).toHaveValue(initialFormData.contactPhone);
  });

  test('updates local form data and calls onChange when text input changes', () => {
    renderComponent();
    const orgNameInput = screen.getByLabelText(/Organization Name/i);
    fireEvent.change(orgNameInput, { target: { name: 'organizationName', value: 'New Org Name' } });
    expect(orgNameInput).toHaveValue('New Org Name');
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ organizationName: 'New Org Name' }));
  });

  test('updates local form data and calls onChange when checkbox changes', () => {
    renderComponent();
    const schoolBasedCheckbox = screen.getByTestId('school-based');
    fireEvent.click(schoolBasedCheckbox); // MUI Checkbox might need `fireEvent.click` on label or specific part
                                      // but here we use a simple input mock
    expect(schoolBasedCheckbox).toBeChecked();
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ organizationTypes: ['school-based'] }));

    fireEvent.click(schoolBasedCheckbox); // Uncheck
    expect(schoolBasedCheckbox).not.toBeChecked();
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ organizationTypes: [] }));
  });
  
  test('toggles organization types correctly', () => {
    renderComponent({ formData: { organizationTypes: ['school-based'] } });
    const schoolBasedCheckbox = screen.getByTestId('school-based');
    const communityBasedCheckbox = screen.getByTestId('community-based');

    expect(schoolBasedCheckbox).toBeChecked();
    expect(communityBasedCheckbox).not.toBeChecked();

    fireEvent.click(communityBasedCheckbox); // Check community-based
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ organizationTypes: ['school-based', 'community-based'] }));
    
    fireEvent.click(schoolBasedCheckbox); // Uncheck school-based
    expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({ organizationTypes: ['community-based'] }));
  });


  test('calls onPrevious and onChange with current data when "Previous" button is clicked', () => {
    renderComponent({ formData: initialFormData });
    const previousButton = screen.getByRole('button', { name: /Previous/i });
    fireEvent.click(previousButton);
    expect(mockOnChange).toHaveBeenCalledWith(initialFormData); // or the current localFormData if changed
    expect(mockOnPrevious).toHaveBeenCalledTimes(1);
  });

  test('calls onWithdraw when "Withdraw" button is clicked', () => {
    renderComponent();
    const withdrawButton = screen.getByRole('button', { name: /Withdraw/i });
    fireEvent.click(withdrawButton);
    expect(mockOnWithdraw).toHaveBeenCalledTimes(1);
  });

  describe('Form Validation and Submission (handleNext)', () => {
    test('shows validation errors and does not call onNext if required fields are empty', () => {
      renderComponent();
      const nextButton = screen.getByRole('button', { name: /Save & Continue/i });
      fireEvent.submit(nextButton); // or fireEvent.click(nextButton) if it's not type="submit" directly on form

      expect(screen.getByText('Organization name is required')).toBeInTheDocument();
      expect(screen.getByText('At least one organization type must be selected')).toBeInTheDocument();
      expect(screen.getByText('Contact name is required')).toBeInTheDocument();
      expect(screen.getByText('Contact email is required')).toBeInTheDocument();
      expect(mockOnNext).not.toHaveBeenCalled();
      expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        validationErrors: expect.objectContaining({
          organizationName: "Organization name is required",
          organizationTypes: "At least one organization type must be selected",
          contactName: "Contact name is required",
          contactEmail: "Contact email is required",
        })
      }));
    });

    test('shows invalid email error', () => {
      renderComponent({
        formData: {
          organizationName: 'Org',
          organizationTypes: ['school-based'],
          contactName: 'Test User',
          contactEmail: 'invalid-email',
        }
      });
      const nextButton = screen.getByRole('button', { name: /Save & Continue/i });
      fireEvent.submit(nextButton);

      expect(screen.getByText('Invalid email format')).toBeInTheDocument();
      expect(mockOnNext).not.toHaveBeenCalled();
       expect(mockOnChange).toHaveBeenCalledWith(expect.objectContaining({
        validationErrors: expect.objectContaining({ contactEmail: "Invalid email format" })
      }));
    });

    test('calls onNext, clears parent errors via onChange if form is valid', () => {
      renderComponent({ formData: initialFormData }); // Use fully valid data
      const nextButton = screen.getByRole('button', { name: /Save & Continue/i });
      fireEvent.submit(nextButton);

      // First onChange call to sync localFormData
      expect(mockOnChange).toHaveBeenCalledWith(initialFormData);
      // Second onChange call to clear validationErrors in parent
      expect(mockOnChange).toHaveBeenCalledWith({ validationErrors: {} });
      expect(mockOnNext).toHaveBeenCalledTimes(1);
      expect(screen.queryByText('Organization name is required')).not.toBeInTheDocument(); // No errors shown
    });
  });

  test('disables all inputs and buttons when "disabled" prop is true', () => {
    renderComponent({ formData: initialFormData, disabled: true });

    expect(screen.getByLabelText(/Organization Name/i)).toBeDisabled();
    expect(screen.getByTestId('school-based')).toBeDisabled();
    expect(screen.getByTestId('community-based')).toBeDisabled();
    expect(screen.getByLabelText(/Organization Description/i)).toBeDisabled();
    expect(screen.getByLabelText(/Contact Person/i)).toBeDisabled();
    expect(screen.getByLabelText(/Email/i)).toBeDisabled();
    expect(screen.getByLabelText(/Phone Number/i)).toBeDisabled();

    expect(screen.getByRole('button', { name: /Previous/i })).toBeDisabled();
    // Withdraw button is conditionally rendered based on !disabled. So it should not be there.
    expect(screen.queryByRole('button', { name: /Withdraw/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Save & Continue/i })).toBeDisabled();
  });
  
  test('updates localFormData when formData prop changes', () => {
    const { rerender } = renderComponent({ formData: { organizationName: 'Old Name' } });
    expect(screen.getByLabelText(/Organization Name/i)).toHaveValue('Old Name');

    const newFormData = { ...initialFormData, organizationName: 'New Name From Prop' };
    rerender(<Section2_OrgInfo {...defaultProps} formData={newFormData} />);
    
    expect(screen.getByLabelText(/Organization Name/i)).toHaveValue('New Name From Prop');
  });

   test('clears organizationTypes error locally when a checkbox is selected', () => {
    renderComponent({ formData: { organizationTypes: [] } }); // Start with no types selected
    
    // Trigger validation to show the error
    const nextButton = screen.getByRole('button', { name: /Save & Continue/i });
    fireEvent.submit(nextButton);
    expect(screen.getByText('At least one organization type must be selected')).toBeInTheDocument();
    
    // Now select a checkbox
    const schoolBasedCheckbox = screen.getByTestId('school-based');
    fireEvent.click(schoolBasedCheckbox);
    
    // The local error message for organizationTypes should disappear after interaction leading to valid state for that field.
    // Note: The parent `errors` prop isn't directly cleared by this action,
    // but the local display of the error for this specific field should be managed.
    // We re-validate to check localErrors state after change.
    // This specific test checks if the error message is removed from the DOM after fixing the issue.
    // A more direct test of `localErrors` state would require exposing it or testing its effects.
    // For now, we check if the visual error text is gone.
    // It might require another submit click to clear the *displayed* error if errors are only shown on submit.
    // The component currently clears localErrors.organizationTypes upon checkbox change *if* it existed.

    // Let's check if the error for organizationTypes is removed from localErrors
    // This requires inspecting the mockOnChange arguments or the component's internal state (not ideal for RTL)
    // For this test, we'll assume that if the checkbox is clicked and an `onChange` is called,
    // the component's internal logic for clearing `localErrors.organizationTypes` (if it was set) works.
    // The more robust check is that on the *next* submit, the error for this field won't be there if fixed.

    // Simulate filling other required fields to pass validation after fixing checkbox
    fireEvent.change(screen.getByLabelText(/Organization Name/i), { target: { name: 'organizationName', value: 'Valid Name' } });
    fireEvent.change(screen.getByLabelText(/Contact Person/i), { target: { name: 'contactName', value: 'Valid Contact' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { name: 'contactEmail', value: 'valid@email.com' } });
    
    // Submit again
    fireEvent.submit(nextButton);

    expect(screen.queryByText('At least one organization type must be selected')).not.toBeInTheDocument();
    expect(mockOnNext).toHaveBeenCalled(); // Should proceed if other fields are also valid
  });

});