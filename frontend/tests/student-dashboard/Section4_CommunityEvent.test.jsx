/// <reference types="vitest" />
// tests/student-dashboard/Section4_CommunityEvent.test.jsx
//
// File-level summary:
// - Unit tests for Section4_CommunityEvent (community event form step)
// - All UI components, icons, hooks, and utilities are mocked for isolation and to prevent Rollup/Vite parse errors
// - useParams is mocked to always return a valid [draftId] to prevent destructuring errors
// - Follows best practices for robust, maintainable React/Vitest tests

// --- CRITICAL: Mock useParams before any React code ---
vi.mock('next/navigation', () => ({
    useParams: () => ({ draftId: 'test-draft-id' }),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

// Custom hooks
vi.mock('@/app/main/student-dashboard/submit-event/[draftId]/hooks/useDraft', () => ({
    useDraft: () => ({
        draft: { draftId: 'test-draft-id', payload: {}, status: 'draft', updatedAt: Date.now() },
        patch: vi.fn(),
        loading: false,
        error: null,
    }),
}));
vi.mock('@/hooks/useToast', () => ({
    useToast: () => ({ toast: vi.fn() }),
}));

// Utility
vi.mock('@/lib/utils', () => ({
    cn: (...args) => args.filter(Boolean).join(' '),
}));

// Validation helpers
vi.mock('../../validation', () => ({
    getFieldClasses: () => '',
    hasFieldError: () => false,
}));

// Date picker
vi.mock('../../../components/DatePickerComponent', () => ({
    default: ({ label, value, onChange }) => (
        <div>
            <label>{label}</label>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(null, e.target.value)}
            />
        </div>
    ),
}));

// UI components
vi.mock('@/components/ui/alert', () => ({
    Alert: (props) => <div {...props}>{props.children}</div>,
    AlertTitle: (props) => <div>{props.children}</div>,
    AlertDescription: (props) => <div>{props.children}</div>,
}));
vi.mock('@/components/ui/button', () => ({
    Button: (props) => <button {...props}>{props.children}</button>,
}));
vi.mock('@/components/ui/card', () => ({
    Card: (props) => <div data-testid="card" {...props}>{props.children}</div>,
    CardHeader: (props) => <div {...props}>{props.children}</div>,
    CardTitle: (props) => <div {...props}>{props.children}</div>,
    CardDescription: (props) => <div {...props}>{props.children}</div>,
    CardContent: (props) => <div {...props}>{props.children}</div>,
    CardFooter: (props) => <div {...props}>{props.children}</div>,
}));
vi.mock('@/components/ui/checkbox', () => ({
    Checkbox: (props) => <input type="checkbox" {...props} />,
}));
vi.mock('@/components/ui/input', () => ({
    Input: (props) => <input {...props} />,
}));
vi.mock('@/components/ui/label', () => ({
    Label: (props) => <label {...props}>{props.children}</label>,
}));
vi.mock('@/components/ui/radio-group', () => ({
    RadioGroup: (props) => <div {...props}>{props.children}</div>,
    RadioGroupItem: (props) => <input type="radio" {...props} />,
}));
vi.mock('@/components/ui/skeleton', () => ({
    Skeleton: (props) => <div className="animate-pulse rounded-md bg-muted w-full h-96" {...props} />,
}));
vi.mock('@/components/ui/textarea', () => ({
    Textarea: (props) => <textarea {...props} />,
}));
vi.mock('@/components/ui/select', () => ({
    Select: (props) => <select {...props} />,
    SelectTrigger: (props) => <div {...props}>{props.children}</div>,
    SelectValue: () => null,
    SelectContent: (props) => <div {...props}>{props.children}</div>,
    SelectItem: (props) => <option {...props}>{props.children}</option>,
}));

// Icons
vi.mock('lucide-react', () => ({
    InfoIcon: () => <svg data-testid="info-icon" />,
    LockIcon: () => <svg data-testid="lock-icon" />,
    Paperclip: () => <svg data-testid="paperclip-icon" />,
    UploadCloud: () => <svg data-testid="uploadcloud-icon" />,
    X: () => <svg data-testid="x-icon" />,
}));

// Default test props with more complete data
const defaultProps = {
    formData: {
        id: '123',
        organizationType: 'community',
        communityEventName: '',
        communityVenue: '',
        communityStartDate: '',
        communityEndDate: '',
    },
    updateFormData: vi.fn(),
    onSubmit: vi.fn(),
    onPrevious: vi.fn(),
    disabled: false,
    sectionsComplete: {},
}

// Clean up after each test
afterEach(() => {
    vi.clearAllMocks()
})

describe('<Section4_CommunityEvent />', () => {
    it('renders component with empty formData', () => {
        render(<Section4_CommunityEvent {...defaultProps} />)
        expect(screen.getByTestId('card')).toBeInTheDocument()
        expect(screen.getByText(/Community Event Details/i)).toBeInTheDocument()
    })

    it('renders all required form fields', () => {
        render(<Section4_CommunityEvent {...defaultProps} />)
        expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Venue/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/Start Date/i)).toBeInTheDocument()
        expect(screen.getByLabelText(/End Date/i)).toBeInTheDocument()
    })

    it('handles form input changes', async () => {
        const updateFormData = vi.fn()
        render(<Section4_CommunityEvent {...defaultProps} updateFormData={updateFormData} />)

        const eventNameInput = screen.getByLabelText(/Event Name/i)
        fireEvent.change(eventNameInput, { target: { value: 'Test Community Event' } })

        await waitFor(() => {
            expect(updateFormData).toHaveBeenCalledWith(expect.objectContaining({
                communityEventName: 'Test Community Event'
            }))
        })
    })

    it('validates required fields', async () => {
        render(<Section4_CommunityEvent {...defaultProps} />)
        const submitButton = screen.getByText(/Next/i)

        fireEvent.click(submitButton)

        await waitFor(() => {
            expect(screen.getByText(/Event name is required/i)).toBeInTheDocument()
            expect(screen.getByText(/Venue is required/i)).toBeInTheDocument()
        })
    })

    it('disables all inputs when disabled prop is true', () => {
        render(<Section4_CommunityEvent {...defaultProps} disabled={true} />)
        const inputs = screen.getAllByRole('textbox')
        inputs.forEach(input => {
            expect(input).toBeDisabled()
        })
    })
})
