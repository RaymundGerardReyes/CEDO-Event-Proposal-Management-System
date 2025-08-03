import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

// ──────────────────────────────────────────────────────────────────────────────
// Global mocks – UI libraries & hooks that are irrelevant for unit logic
// ──────────────────────────────────────────────────────────────────────────────
jest.mock('lucide-react', () => {
    const React = require('react')
    return new Proxy({}, {
        get: (_, name) => (props) => <svg data-icon={String(name)} {...props} />,
    })
})
// useToast – create the toast spy *inside* the factory so it is available when
// the mock is hoisted.  Tests can still access the same spy via
// `require('@/hooks/use-toast').useToast().toast`.
jest.mock('@/hooks/use-toast', () => {
    const toast = jest.fn()
    return {
        useToast: () => ({ toast }),
    }
})
// Replace rsuite DatePicker by native input so we can fire change events easily
jest.mock('rsuite', () => ({
    DatePicker: ({ value, onChange, ...rest }) => (
        <input
            type="date"
            data-testid="rsuite-date"
            value={value ? new Date(value).toISOString().substring(0, 10) : ''}
            onChange={(e) => onChange && onChange(new Date(e.target.value))}
            {...rest}
        />
    ),
}))
// Stub the CSS import that rsuite component brings in
jest.mock('rsuite/DatePicker/styles/index.css', () => ({}), { virtual: true })

// ──────────────────────────────────────────────────────────────────────────────
// Helpers & default props
// ──────────────────────────────────────────────────────────────────────────────
const defaultFormData = {
    // Section-2 data (required)
    organizationName: 'ACME Corp',
    contactEmail: 'info@acme.com',
    organizationType: 'school-based',
    currentSection: 'schoolEvent',
    // Section-3 minimal
    schoolEventName: '',
}

const mk = (overrides = {}) => ({
    formData: { ...defaultFormData, ...overrides.formData },
    handleInputChange: overrides.handleInputChange || jest.fn(),
    handleFileChange: overrides.handleFileChange || jest.fn(),
    onNext: overrides.onNext || jest.fn(),
    onPrevious: overrides.onPrevious || jest.fn(),
    onWithdraw: overrides.onWithdraw || jest.fn(),
    disabled: overrides.disabled || false,
    validationErrors: overrides.validationErrors || {},
})

// Silence fetch requests – we'll stub different responses per test when needed
beforeAll(() => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
        text: async () => '',
    })
})

afterEach(() => {
    jest.clearAllMocks()
    window.localStorage.clear()
})

// Import CUT **after** mocks so they apply
import { Section3_SchoolEvent } from '../../src/app/main/student-dashboard/submit-event/[draftId]/school-event/page'

// ──────────────────────────────────────────────────────────────────────────────
//    TEST SUITE – 20 focused cases (no placeholders)
// ──────────────────────────────────────────────────────────────────────────────

describe('Section3_SchoolEvent – component behaviour', () => {
    // 1 ─ basic render
    test('renders heading', () => {
        render(<Section3_SchoolEvent {...mk()} />)
        expect(screen.getByText(/School-Based Event Details/i)).toBeInTheDocument()
    })

    // 2 ─ shows read-only banner when disabled
    test('shows read-only banner when disabled', () => {
        render(<Section3_SchoolEvent {...mk({ disabled: true })} />)
        expect(screen.getByText(/Read-only Mode/i)).toBeInTheDocument()
    })

    // 3 ─ start-date change propagates to input value
    test('allows picking a start date', () => {
        render(<Section3_SchoolEvent {...mk()} />)
        const dateInput = screen.getAllByTestId('rsuite-date')[0]
        fireEvent.change(dateInput, { target: { value: '2025-01-15' } })
        expect(dateInput).toHaveValue('2025-01-15')
    })

    // 4 ─ selecting target audience toggles checkbox
    test('can toggle target audience', () => {
        render(<Section3_SchoolEvent {...mk()} />)
        const chk = screen.getByLabelText('1st Year')
        expect(chk).not.toBeChecked()
        fireEvent.click(chk)
        expect(chk).toBeChecked()
    })

    // 5 ─ rejects oversize file (>5 MB) with toast
    test('file >5MB triggers toast and is not accepted', async () => {
        const toastSpy = require('@/hooks/use-toast').useToast().toast
        render(<Section3_SchoolEvent {...mk()} />)
        // 6 MiB fake PDF
        const big = new File([new Array(6 * 1024 * 1024).join('a')], 'big.pdf', {
            type: 'application/pdf',
        })
        const fileInput = screen.getByLabelText(/General Plan of Action/i, { selector: 'input[type="file"]' })
        await act(async () => {
            fireEvent.change(fileInput, { target: { files: [big] } })
        })
        expect(toastSpy).toHaveBeenCalled()
        // preview should still be empty
        expect(screen.queryAllByText('big.pdf').length).toBe(0)
    })

    // 6 ─ rejects invalid file type
    test('invalid file type triggers toast', async () => {
        const toastSpy = require('@/hooks/use-toast').useToast().toast
        render(<Section3_SchoolEvent {...mk()} />)
        const bad = new File(['foo'], 'bad.txt', { type: 'text/plain' })
        const input = screen.getByLabelText(/Project Proposal Document/i, { selector: 'input[type="file"]' })
        await act(async () => {
            fireEvent.change(input, { target: { files: [bad] } })
        })
        expect(toastSpy).toHaveBeenCalled()
    })

    // 7 ─ accepts valid file and shows preview
    test('valid file upload shows filename preview', async () => {
        render(<Section3_SchoolEvent {...mk()} />)
        const good = new File(['%PDF-1.4'], 'plan.pdf', { type: 'application/pdf' })
        const input = screen.getByLabelText(/General Plan of Action/i, { selector: 'input[type="file"]' })
        await act(async () => {
            fireEvent.change(input, { target: { files: [good] } })
        })
        expect(screen.getAllByText('plan.pdf').length).toBeGreaterThanOrEqual(1)
    })

    // 8 ─ save blocked when required fields missing
    test('Save Progress shows validation toast when mandatory fields empty', async () => {
        const toastSpy = require('@/hooks/use-toast').useToast().toast
        render(<Section3_SchoolEvent {...mk()} />)
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
        })
        expect(toastSpy).toHaveBeenCalled()
    })

    // Helpers to fabricate complete local data for positive-path tests
    const fullLocal = {
        schoolEventName: 'Science Fair',
        schoolVenue: 'Gym',
        schoolStartDate: new Date('2025-04-01'),
        schoolEndDate: new Date('2025-04-02'),
        schoolTimeStart: '08:00',
        schoolTimeEnd: '17:00',
        schoolEventType: 'conference',
        schoolEventMode: 'online',
        schoolReturnServiceCredit: '1',
        schoolTargetAudience: ['All Levels'],
    }

    // 9 ─ successful save calls fetch
    test('successful save makes network request', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ success: true, id: 1 }) })
        render(<Section3_SchoolEvent {...mk({ formData: { ...defaultFormData, ...fullLocal } })} />)
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
        })
        expect(global.fetch).toHaveBeenCalled()
    })

    // 10 ─ same-day invalid time range blocked
    test('end time before start time on same day is rejected', async () => {
        const toastSpy = require('@/hooks/use-toast').useToast().toast
        const local = { ...fullLocal, schoolTimeStart: '10:00', schoolTimeEnd: '09:00' }
        render(<Section3_SchoolEvent {...mk({ formData: { ...defaultFormData, ...local } })} />)
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
        })
        expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ title: /Invalid Time Range/i }))
    })

    // 11 ─ end date before start date blocked
    test('end date before start date is rejected', async () => {
        const toastSpy = require('@/hooks/use-toast').useToast().toast
        const local = { ...fullLocal, schoolStartDate: new Date('2025-05-02'), schoolEndDate: new Date('2025-05-01') }
        render(<Section3_SchoolEvent {...mk({ formData: { ...defaultFormData, ...local } })} />)
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save Progress/i }))
        })
        expect(toastSpy).toHaveBeenCalledWith(expect.objectContaining({ title: /Invalid Date Range/i }))
    })

    // 12 ─ download button appears when existing file present
    test('shows Download when file already exists', async () => {
        // Mock the GET files call inside loadExistingFiles()
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ files: { gpoa: { originalName: 'old.pdf' } } }) })
        render(<Section3_SchoolEvent {...mk({ formData: { ...defaultFormData, id: 42 } })} />)
        await waitFor(() => expect(screen.getByText(/Download/i)).toBeInTheDocument())
    })

    // 13 ─ clicking Download triggers fetch
    test('clicking Download fetches file', async () => {
        global.fetch.mockResolvedValueOnce({ ok: true, json: async () => ({ files: { gpoa: { originalName: 'old.pdf' } } }) })
        // second fetch for download
        global.fetch.mockResolvedValueOnce({ ok: true, blob: async () => new Blob(['data']), headers: { get: () => 'attachment; filename="old.pdf"' } })
        render(<Section3_SchoolEvent {...mk({ formData: { ...defaultFormData, id: 42 } })} />)
        const dlBtn = await screen.findByRole('button', { name: /Download/i })
        await act(async () => fireEvent.click(dlBtn))
        expect(global.fetch).toHaveBeenCalledTimes(2)
    })

    // 14 ─ Save & Continue invokes onNext when success
    test('Save & Continue calls onNext(true) after successful save', async () => {
        global.fetch.mockResolvedValue({ ok: true, json: async () => ({ success: true, id: 1 }) })
        const onNext = jest.fn()
        render(<Section3_SchoolEvent {...mk({ formData: { ...defaultFormData, ...fullLocal }, onNext })} />)
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Save & Continue to Section 5/i }))
        })
        expect(onNext).toHaveBeenCalledWith(true)
    })

    // 15 ─ Save & Continue is inert when disabled
    test('disabled component blocks Save & Continue', async () => {
        const onNext = jest.fn()
        render(<Section3_SchoolEvent {...mk({ disabled: true, onNext })} />)
        fireEvent.click(screen.getByRole('button', { name: /Save & Continue/i }))
        expect(onNext).not.toHaveBeenCalled()
    })

    // 16 ─ validation error prop renders inline message
    test('renders field error when validationErrors prop provided', () => {
        render(<Section3_SchoolEvent {...mk({ validationErrors: { schoolEventName: 'Required' } })} />)
        expect(screen.getByText('Required')).toBeInTheDocument()
    })

    // 17 ─ memoisation: re-render with same props does not call handleInputChange again
    test('React.memo prevents unnecessary inputChange calls', () => {
        const spy = jest.fn()
        const props = mk({ handleInputChange: spy })
        const { rerender } = render(<Section3_SchoolEvent {...props} />)
        rerender(<Section3_SchoolEvent {...props} />)
        expect(spy).not.toHaveBeenCalled()
    })

    // 18 ─ removing selected file clears preview
    test('remove file button clears preview name', async () => {
        render(<Section3_SchoolEvent {...mk()} />)
        const good = new File(['abc'], 'plan.pdf', { type: 'application/pdf' })
        const input = screen.getByLabelText(/GPOA/i, { selector: 'input[type="file"]' })
        await act(async () => fireEvent.change(input, { target: { files: [good] } }))
        expect(screen.getAllByText('plan.pdf').length).toBeGreaterThanOrEqual(1)
        const removeBtn = screen.getByRole('button', { name: /Remove/i })
        await act(async () => fireEvent.click(removeBtn))
        expect(screen.queryAllByText('plan.pdf').length).toBe(0)
    })

    // 19 ─ calling onPrevious triggers prop
    test('Back to Section 2 button calls onPrevious', () => {
        const onPrev = jest.fn()
        render(<Section3_SchoolEvent {...mk({ onPrevious: onPrev })} />)
        fireEvent.click(screen.getByRole('button', { name: /Back to Section 2/i }))
        expect(onPrev).toHaveBeenCalled()
    })

    // 20 ─ withdraw button triggers onWithdraw when enabled
    test('Withdraw button calls onWithdraw', () => {
        const onWithdraw = jest.fn()
        render(<Section3_SchoolEvent {...mk({ onWithdraw })} />)
        fireEvent.click(screen.getByRole('button', { name: /Withdraw Proposal/i }))
        expect(onWithdraw).toHaveBeenCalled()
    })
}) 