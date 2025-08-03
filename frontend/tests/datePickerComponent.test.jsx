import '@testing-library/jest-dom'
import { act, fireEvent, render, screen } from '@testing-library/react'

// ─────────────────────────────────────────────────────────────
// Global mocks                                                 
// ─────────────────────────────────────────────────────────────
// Replace rsuite DatePicker by a plain HTML <input type="date"> so
// we can simulate changes in JSDOM without the heavy dep.
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
// Stub the css import
jest.mock('rsuite/DatePicker/styles/index.css', () => ({}), { virtual: true })

// Import after mocks
import { DatePickerComponent } from '../src/app/main/student-dashboard/submit-event/components'

const baseProps = {
    label: 'Start Date',
    fieldName: 'startDate',
    onChange: jest.fn(),
}

const mk = (overrides = {}) => ({ ...baseProps, ...overrides })

afterEach(() => {
    jest.clearAllMocks()
})

// ─────────────────────────────────────────────────────────────
//                      TEST SUITE (20)                        
// ─────────────────────────────────────────────────────────────

describe('DatePickerComponent', () => {
    // 1 – label renders
    it('renders label text', () => {
        render(<DatePickerComponent {...mk()} />)
        expect(screen.getByText('Start Date')).toBeInTheDocument()
    })

    // 2 – required asterisk visible
    it('shows asterisk when required', () => {
        render(<DatePickerComponent {...mk({ required: true })} />)
        expect(screen.getByText('*')).toBeInTheDocument()
    })

    // 3 – no asterisk when not required
    it('does not show asterisk when required=false', () => {
        render(<DatePickerComponent {...mk({ required: false })} />)
        expect(screen.queryByText('*')).not.toBeInTheDocument()
    })

    // 4 – placeholder default text
    it('uses default placeholder when none provided', () => {
        render(<DatePickerComponent {...mk()} />)
        expect(screen.getByPlaceholderText('Pick a date')).toBeInTheDocument()
    })

    // 5 – custom placeholder honoured
    it('honours custom placeholder', () => {
        render(<DatePickerComponent {...mk({ placeholder: 'Choose' })} />)
        expect(screen.getByPlaceholderText('Choose')).toBeInTheDocument()
    })

    // 6 – initial value rendered as iso date string
    it('renders initial date value', () => {
        const date = new Date('2025-04-01')
        render(<DatePickerComponent {...mk({ value: date })} />)
        expect(screen.getByTestId('rsuite-date')).toHaveValue('2025-04-01')
    })

    // 7 – onChange fires with fieldName & Date when new date selected
    it('calls onChange with fieldName and Date object', () => {
        const onChange = jest.fn()
        render(<DatePickerComponent {...mk({ onChange })} />)
        act(() => {
            fireEvent.change(screen.getByTestId('rsuite-date'), { target: { value: '2025-05-02' } })
        })
        expect(onChange).toHaveBeenCalledWith('startDate', expect.any(Date))
    })

    // 8 – disabled date picker is disabled
    it('disables date picker when disabled prop true', () => {
        render(<DatePickerComponent {...mk({ disabled: true })} />)
        expect(screen.getByTestId('rsuite-date')).toBeDisabled()
    })

    // 9 – onChange not called when disabled
    it('does not fire onChange when disabled', () => {
        const onChange = jest.fn()
        render(<DatePickerComponent {...mk({ disabled: true, onChange })} />)
        fireEvent.change(screen.getByTestId('rsuite-date'), { target: { value: '2025-06-01' } })
        expect(onChange).not.toHaveBeenCalled()
    })

    // 10 – error message renders
    it('shows error message when error prop provided', () => {
        render(<DatePickerComponent {...mk({ error: 'Required field' })} />)
        expect(screen.getByText('Required field')).toBeInTheDocument()
    })

    // 11 – style class contains border-red when error
    it('adds red border class when error present', () => {
        render(<DatePickerComponent {...mk({ error: 'oops' })} />)
        expect(screen.getByTestId('rsuite-date').className).toContain('border-red-500')
    })

    // 12 – updates value when prop changes
    it('updates displayed value when value prop changes', () => {
        const { rerender } = render(<DatePickerComponent {...mk()} />)
        rerender(<DatePickerComponent {...mk({ value: new Date('2025-07-01') })} />)
        expect(screen.getByTestId('rsuite-date')).toHaveValue('2025-07-01')
    })

    // 13 – handleDateChange skips when new date null
    it('does not call onChange when date is null', () => {
        const onChange = jest.fn()
        render(<DatePickerComponent {...mk({ onChange })} />)
        act(() => {
            fireEvent.change(screen.getByTestId('rsuite-date'), { target: { value: '' } })
        })
        expect(onChange).not.toHaveBeenCalled()
    })

    // 14 – width style set to 100%
    it('applies width style 100%', () => {
        render(<DatePickerComponent {...mk()} />)
        expect(screen.getByTestId('rsuite-date').style.width).toBe('100%')
    })

    // 15 – height style 42px
    it('applies height style 42px', () => {
        render(<DatePickerComponent {...mk()} />)
        expect(screen.getByTestId('rsuite-date').style.height).toBe('42px')
    })

    // 16 – custom label accessible via getByLabelText
    it('label associates with input for accessibility', () => {
        render(<DatePickerComponent {...mk()} />)
        expect(screen.getByLabelText('Start Date')).toBeInTheDocument()
    })

    // 17 – passing different fieldName reflected in onChange
    it('passes correct fieldName in onChange', () => {
        const onChange = jest.fn()
        render(<DatePickerComponent {...mk({ fieldName: 'endDate', label: 'End', onChange })} />)
        act(() => {
            fireEvent.change(screen.getByTestId('rsuite-date'), { target: { value: '2025-08-01' } })
        })
        expect(onChange).toHaveBeenCalledWith('endDate', expect.any(Date))
    })

    // 18 – component renders without onChange safely
    it('renders and allows change without onChange prop', () => {
        render(<DatePickerComponent {...mk({ onChange: undefined })} />)
        fireEvent.change(screen.getByTestId('rsuite-date'), { target: { value: '2025-09-09' } })
        // no error thrown – test passes if reached
        expect(screen.getByTestId('rsuite-date')).toHaveValue('2025-09-09')
    })

    // 19 – error prop removed clears message
    it('removes error message when error prop cleared', () => {
        const { rerender } = render(<DatePickerComponent {...mk({ error: 'bad' })} />)
        expect(screen.getByText('bad')).toBeInTheDocument()
        rerender(<DatePickerComponent {...mk({ error: null })} />)
        expect(screen.queryByText('bad')).not.toBeInTheDocument()
    })

    // 20 – multiple instances operate independently
    it('multiple instances maintain separate states', () => {
        const onA = jest.fn()
        const onB = jest.fn()
        render(
            <>
                <DatePickerComponent {...mk({ fieldName: 'A', label: 'A', onChange: onA })} />
                <DatePickerComponent {...mk({ fieldName: 'B', label: 'B', onChange: onB })} />
            </>
        )
        const inputs = screen.getAllByTestId('rsuite-date')
        fireEvent.change(inputs[0], { target: { value: '2026-01-01' } })
        fireEvent.change(inputs[1], { target: { value: '2027-01-01' } })
        expect(onA).toHaveBeenCalledWith('A', expect.any(Date))
        expect(onB).toHaveBeenCalledWith('B', expect.any(Date))
    })
}) 