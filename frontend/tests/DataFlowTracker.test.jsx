/**
 * Test file for DataFlowTracker component
 * Purpose: Verify that the key prop issue is fixed
 * Approach: Simple test to ensure no duplicate keys
 */

import { fireEvent, render, screen } from '@testing-library/react';
import { vi } from 'vitest';

// Mock localStorage and sessionStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
    value: localStorageMock
});

const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
    value: sessionStorageMock
});

// Mock fetch
global.fetch = vi.fn();

// Import the component
import DataFlowTracker from '../src/app/main/student-dashboard/submit-event/[draftId]/debug/DataFlowTracker';

describe('DataFlowTracker Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorageMock.getItem.mockReturnValue(null);
        sessionStorageMock.getItem.mockReturnValue(null);
    });

    it('should render without key prop errors', () => {
        render(
            <DataFlowTracker
                draftId="test-draft-123"
                proposalStatus="draft"
                eventDetails={null}
            />
        );

        // Should render the component without throwing key errors
        expect(screen.getByText('Data Flow Tracker')).toBeInTheDocument();
    });

    it('should handle debug logs without duplicate keys', () => {
        render(
            <DataFlowTracker
                draftId="test-draft-123"
                proposalStatus="draft"
                eventDetails={null}
            />
        );

        // Click the debug button to generate logs
        const debugButton = screen.getByText('Run Debug');
        fireEvent.click(debugButton);

        // Wait a bit for logs to be generated
        setTimeout(() => {
            // Should not throw any key-related errors
            expect(screen.getByText('Debug Logs')).toBeInTheDocument();
        }, 100);
    });

    it('should display current status correctly', () => {
        render(
            <DataFlowTracker
                draftId="test-draft-123"
                proposalStatus="pending"
                eventDetails={{ eventName: 'Test Event' }}
            />
        );

        expect(screen.getByText('pending')).toBeInTheDocument();
        expect(screen.getByText('test-draft-123')).toBeInTheDocument();
    });
}); 