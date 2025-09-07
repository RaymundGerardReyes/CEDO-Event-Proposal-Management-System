/**
 * Event Form Context Tests
 * Tests UUID generation, persistence, and context functionality
 */

import { act, render, screen } from '@testing-library/react';
import { v4 as uuidv4 } from 'uuid';
import { EventFormProvider, useEventForm } from '../../src/app/student-dashboard/submit-event/contexts/EventFormContext';

// Mock localStorage
const localStorageMock = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Test component that uses the context
const TestComponent = () => {
    const {
        eventUuid,
        isUuidGenerated,
        generateEventUuid,
        getShortUuid,
        getFormAge,
        clearEventUuid,
        updateFormStatus
    } = useEventForm();

    return (
        <div>
            <div data-testid="uuid">{eventUuid || 'No UUID'}</div>
            <div data-testid="is-generated">{isUuidGenerated ? 'Generated' : 'Not Generated'}</div>
            <div data-testid="short-uuid">{getShortUuid() || 'No Short UUID'}</div>
            <div data-testid="form-age">{getFormAge() || 'No Age'}</div>
            <button data-testid="generate-btn" onClick={generateEventUuid}>
                Generate UUID
            </button>
            <button data-testid="clear-btn" onClick={clearEventUuid}>
                Clear UUID
            </button>
            <button data-testid="update-status-btn" onClick={() => updateFormStatus('submitted')}>
                Update Status
            </button>
        </div>
    );
};

describe('EventFormContext', () => {
    beforeEach(() => {
        localStorageMock.getItem.mockClear();
        localStorageMock.setItem.mockClear();
        localStorageMock.removeItem.mockClear();
    });

    it('should provide initial state', () => {
        render(
            <EventFormProvider>
                <TestComponent />
            </EventFormProvider>
        );

        expect(screen.getByTestId('uuid')).toHaveTextContent('No UUID');
        expect(screen.getByTestId('is-generated')).toHaveTextContent('Not Generated');
        expect(screen.getByTestId('short-uuid')).toHaveTextContent('No Short UUID');
    });

    it('should generate UUID when generateEventUuid is called', () => {
        render(
            <EventFormProvider>
                <TestComponent />
            </EventFormProvider>
        );

        const generateBtn = screen.getByTestId('generate-btn');

        act(() => {
            generateBtn.click();
        });

        const uuidElement = screen.getByTestId('uuid');
        const shortUuidElement = screen.getByTestId('short-uuid');

        expect(uuidElement.textContent).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
        expect(shortUuidElement.textContent).toHaveLength(8);
        expect(screen.getByTestId('is-generated')).toHaveTextContent('Generated');
        expect(screen.getByTestId('form-age')).toHaveTextContent('Just now');
    });

    it('should clear UUID when clearEventUuid is called', () => {
        render(
            <EventFormProvider>
                <TestComponent />
            </EventFormProvider>
        );

        // First generate a UUID
        act(() => {
            screen.getByTestId('generate-btn').click();
        });

        expect(screen.getByTestId('is-generated')).toHaveTextContent('Generated');

        // Then clear it
        act(() => {
            screen.getByTestId('clear-btn').click();
        });

        expect(screen.getByTestId('uuid')).toHaveTextContent('No UUID');
        expect(screen.getByTestId('is-generated')).toHaveTextContent('Not Generated');
    });

    it('should load existing UUID from localStorage', () => {
        const mockUuid = uuidv4();
        const mockTimestamp = new Date().toISOString();

        localStorageMock.getItem
            .mockReturnValueOnce(mockUuid) // eventFormUuid
            .mockReturnValueOnce(mockTimestamp) // eventFormCreatedAt
            .mockReturnValueOnce('draft'); // eventFormStatus

        render(
            <EventFormProvider>
                <TestComponent />
            </EventFormProvider>
        );

        expect(screen.getByTestId('uuid')).toHaveTextContent(mockUuid);
        expect(screen.getByTestId('is-generated')).toHaveTextContent('Generated');
    });

    it('should update form status', () => {
        render(
            <EventFormProvider>
                <TestComponent />
            </EventFormProvider>
        );

        act(() => {
            screen.getByTestId('update-status-btn').click();
        });

        // Status update should trigger localStorage.setItem
        expect(localStorageMock.setItem).toHaveBeenCalledWith('eventFormStatus', 'submitted');
    });

    it('should provide utility functions', () => {
        render(
            <EventFormProvider>
                <TestComponent />
            </EventFormProvider>
        );

        // Generate UUID first
        act(() => {
            screen.getByTestId('generate-btn').click();
        });

        const uuid = screen.getByTestId('uuid').textContent;
        const shortUuid = screen.getByTestId('short-uuid').textContent;

        expect(shortUuid).toBe(uuid.substring(0, 8));
        expect(screen.getByTestId('form-age')).toHaveTextContent('Just now');
    });
});
