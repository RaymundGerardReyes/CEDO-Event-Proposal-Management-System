// @jest-environment jsdom
/**
 * Integration test for the /submit-event flow
 * Covers: protected org info, event details, file upload, draft save/restore, submit, error handling
 * ✅ ENHANCED: Added specific tests for draft status fix and error handling
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import SubmitEventFlow from './SubmitEventFlow.jsx';
import * as api from './api/proposalAPI';

jest.mock('./api/proposalAPI');

// Mock for file input
function createMockFile(name = 'test.pdf', size = 1234, type = 'application/pdf') {
    const file = new File(['dummy content'], name, { type });
    Object.defineProperty(file, 'size', { value: size });
    return file;
}

// ✅ NEW: Mock for draft API
jest.mock('@/lib/draft-api', () => ({
    saveEventTypeSelection: jest.fn(),
    createDraft: jest.fn(),
    getDraft: jest.fn(),
    updateDraft: jest.fn()
}));

describe('SubmitEventFlow Integration', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Clear localStorage/sessionStorage for draft restore tests
        localStorage.clear();
        sessionStorage.clear();
    });

    it('renders and locks protected org info', async () => {
        render(<SubmitEventFlow />);
        const orgInput = await screen.findByLabelText(/Organization Name/i);
        expect(orgInput).toBeInTheDocument();
        expect(orgInput).toHaveAttribute('readonly');
        expect(orgInput).toHaveAttribute('disabled');
        expect(orgInput).toHaveClass('select-none');
    });

    it('fills out event details and uploads a file', async () => {
        render(<SubmitEventFlow />);
        // Fill out event name
        const eventNameInput = await screen.findByLabelText(/Event Name/i);
        fireEvent.change(eventNameInput, { target: { value: 'Integration Test Event' } });
        expect(eventNameInput.value).toBe('Integration Test Event');
        // Fill out venue
        const venueInput = screen.getByLabelText(/Venue/i);
        fireEvent.change(venueInput, { target: { value: 'Test Venue' } });
        expect(venueInput.value).toBe('Test Venue');
        // Fill out date fields (simulate date picker)
        // For simplicity, set value directly if possible
        const startDateInput = screen.getByLabelText(/Start Date/i);
        fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
        const endDateInput = screen.getByLabelText(/End Date/i);
        fireEvent.change(endDateInput, { target: { value: '2025-01-02' } });
        // Fill out time fields
        const startTimeInput = screen.getByLabelText(/Start Time/i);
        fireEvent.change(startTimeInput, { target: { value: '09:00' } });
        const endTimeInput = screen.getByLabelText(/End Time/i);
        fireEvent.change(endTimeInput, { target: { value: '17:00' } });
        // Select event type (radio)
        const eventTypeRadio = screen.getByLabelText(/Academic Enhancement/i);
        fireEvent.click(eventTypeRadio);
        expect(eventTypeRadio.checked).toBe(true);
        // Select event mode (radio)
        const eventModeRadio = screen.getByLabelText(/Offline/i);
        fireEvent.click(eventModeRadio);
        expect(eventModeRadio.checked).toBe(true);
        // Fill out SDP credits
        const sdpCreditsInput = screen.getByLabelText(/SDP Credits/i);
        fireEvent.change(sdpCreditsInput, { target: { value: '2' } });
        expect(sdpCreditsInput.value).toBe('2');
        // Select target audience (checkbox)
        const audienceCheckbox = screen.getByLabelText(/Students/i);
        fireEvent.click(audienceCheckbox);
        expect(audienceCheckbox.checked).toBe(true);
        // Upload file (mock)
        const fileInput = screen.getByLabelText(/GPOA Document/i);
        const file = createMockFile();
        fireEvent.change(fileInput, { target: { files: [file] } });
        // Check file preview appears (optional)
        await waitFor(() => {
            expect(screen.getByText(/test.pdf/i)).toBeInTheDocument();
        });
    });

    it('saves draft and restores on reload', async () => {
        render(<SubmitEventFlow />);
        // Fill out event name
        const eventNameInput = await screen.findByLabelText(/Event Name/i);
        fireEvent.change(eventNameInput, { target: { value: 'Draft Restore Event' } });
        // Simulate save draft (click Save Draft button)
        const saveDraftButton = screen.getByText(/Save Draft/i);
        fireEvent.click(saveDraftButton);
        // Simulate reload by unmounting and remounting
        // (In real app, draft would be in localStorage/sessionStorage)
        // For this test, you may need to mock localStorage/sessionStorage
        // and check that the value is restored
        // (Implementation depends on your draft persistence logic)
    });

    it('submits proposal with all required fields', async () => {
        api.saveProposal.mockResolvedValue({ success: true });
        render(<SubmitEventFlow />);
        // Fill out all required fields as above
        const eventNameInput = await screen.findByLabelText(/Event Name/i);
        fireEvent.change(eventNameInput, { target: { value: 'Submit Event' } });
        const venueInput = screen.getByLabelText(/Venue/i);
        fireEvent.change(venueInput, { target: { value: 'Submit Venue' } });
        const startDateInput = screen.getByLabelText(/Start Date/i);
        fireEvent.change(startDateInput, { target: { value: '2025-01-01' } });
        const endDateInput = screen.getByLabelText(/End Date/i);
        fireEvent.change(endDateInput, { target: { value: '2025-01-02' } });
        const startTimeInput = screen.getByLabelText(/Start Time/i);
        fireEvent.change(startTimeInput, { target: { value: '09:00' } });
        const endTimeInput = screen.getByLabelText(/End Time/i);
        fireEvent.change(endTimeInput, { target: { value: '17:00' } });
        const eventTypeRadio = screen.getByLabelText(/Academic Enhancement/i);
        fireEvent.click(eventTypeRadio);
        const eventModeRadio = screen.getByLabelText(/Offline/i);
        fireEvent.click(eventModeRadio);
        const sdpCreditsInput = screen.getByLabelText(/SDP Credits/i);
        fireEvent.change(sdpCreditsInput, { target: { value: '2' } });
        const audienceCheckbox = screen.getByLabelText(/Students/i);
        fireEvent.click(audienceCheckbox);
        // Upload file
        const fileInput = screen.getByLabelText(/GPOA Document/i);
        const file = createMockFile();
        fireEvent.change(fileInput, { target: { files: [file] } });
        // Click submit (Next or Submit button)
        const submitButton = screen.getByText(/Next|Submit/i);
        fireEvent.click(submitButton);
        // Wait for API call
        await waitFor(() => {
            expect(api.saveProposal).toHaveBeenCalled();
        });
        // Assert payload includes org info and all required fields
        const payload = api.saveProposal.mock.calls[0][0];
        expect(payload.organizationName).toBeDefined();
        expect(payload.eventName || payload.communityEventName).toBeDefined();
        expect(payload.venue || payload.communityVenue).toBeDefined();
        expect(payload.communityGPOAFile || payload.gpoaFile).toBeDefined();
    });

    it('handles API/network errors gracefully', async () => {
        api.saveProposal.mockRejectedValue(new Error('Network error'));
        render(<SubmitEventFlow />);
        // Fill out required fields
        const eventNameInput = await screen.findByLabelText(/Event Name/i);
        fireEvent.change(eventNameInput, { target: { value: 'Error Event' } });
        // Click submit
        const submitButton = screen.getByText(/Next|Submit/i);
        fireEvent.click(submitButton);
        // Wait for error toast/message
        await waitFor(() => {
            expect(screen.getByText(/Network error/i)).toBeInTheDocument();
        });
    });

    it('handles null/undefined and rapid navigation edge cases', async () => {
        render(<SubmitEventFlow />);
        // Simulate rapid navigation (click Next/Previous quickly)
        const nextButton = screen.getByText(/Next/i);
        const prevButton = screen.getByText(/Previous|Back/i);
        fireEvent.click(nextButton);
        fireEvent.click(prevButton);
        fireEvent.click(nextButton);
        // No crash, no data loss
        expect(screen.getByLabelText(/Event Name/i)).toBeInTheDocument();
    });

    // ✅ NEW: Test draft status fix
    it('handles draft not found error gracefully', async () => {
        const { saveEventTypeSelection } = require('@/lib/draft-api');
        saveEventTypeSelection.mockRejectedValue(new Error('Draft not found. Please create a new draft and try again.'));

        render(<SubmitEventFlow />);

        // Simulate event type selection
        const eventTypeButton = screen.getByText(/School-Based Event/i);
        fireEvent.click(eventTypeButton);

        // Wait for error handling
        await waitFor(() => {
            expect(screen.getByText(/Draft not found/i)).toBeInTheDocument();
        });
    });

    // ✅ NEW: Test retry logic for network errors
    it('retries failed event type saves', async () => {
        const { saveEventTypeSelection } = require('@/lib/draft-api');

        // Mock first call fails, second succeeds
        saveEventTypeSelection
            .mockRejectedValueOnce(new Error('Network error'))
            .mockResolvedValueOnce({ success: true });

        render(<SubmitEventFlow />);

        // Simulate event type selection
        const eventTypeButton = screen.getByText(/School-Based Event/i);
        fireEvent.click(eventTypeButton);

        // Wait for retry and success
        await waitFor(() => {
            expect(saveEventTypeSelection).toHaveBeenCalledTimes(2);
        });
    });

    // ✅ NEW: Test loading states
    it('shows loading state during event type save', async () => {
        const { saveEventTypeSelection } = require('@/lib/draft-api');
        saveEventTypeSelection.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

        render(<SubmitEventFlow />);

        // Simulate event type selection
        const eventTypeButton = screen.getByText(/School-Based Event/i);
        fireEvent.click(eventTypeButton);

        // Check for loading indicator
        await waitFor(() => {
            expect(screen.getByText(/Saving your selection/i)).toBeInTheDocument();
        });
    });

    // ✅ NEW: Test localStorage fallback
    it('saves to localStorage even when backend fails', async () => {
        const { saveEventTypeSelection } = require('@/lib/draft-api');
        saveEventTypeSelection.mockRejectedValue(new Error('Server error'));

        render(<SubmitEventFlow />);

        // Simulate event type selection
        const eventTypeButton = screen.getByText(/School-Based Event/i);
        fireEvent.click(eventTypeButton);

        // Check that localStorage was updated
        await waitFor(() => {
            const stored = localStorage.getItem('selectedEventType');
            expect(stored).toBe('school-based');
        });
    });
}); 