import ProfilePage from '@/app/student-dashboard/profile/page';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/utils/api';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock auth context
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

// Mock API utility
vi.mock('@/utils/api', () => ({
  apiRequest: vi.fn(),
}));

// Mock Framer Motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

// Mock Lucide React icons
vi.mock('lucide-react', () => ({
  AlertCircle: () => <div data-testid="alert-circle" />,
  ArrowLeft: () => <div data-testid="arrow-left" />,
  Building: () => <div data-testid="building" />,
  CheckCircle: () => <div data-testid="check-circle" />,
  Edit3: () => <div data-testid="edit-3" />,
  Lock: () => <div data-testid="lock" />,
  Mail: () => <div data-testid="mail" />,
  Phone: () => <div data-testid="phone" />,
  RefreshCw: () => <div data-testid="refresh-cw" />,
  Save: () => <div data-testid="save" />,
  Shield: () => <div data-testid="shield" />,
  UserCircle: () => <div data-testid="user-circle" />,
}));

describe('ProfilePage', () => {
  const mockPush = vi.fn();
  const mockBack = vi.fn();
  const mockApiRequest = vi.mocked(apiRequest);

  const mockUser = {
    id: 'user-123',
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    avatar_url: 'https://example.com/avatar.jpg',
    organization_description: 'Test Organization',
    phone_number: '09123456789',
    user_metadata: {
      full_name: 'Test User',
      avatar_url: 'https://example.com/avatar.jpg',
    },
    raw_user_meta_data: {
      full_name: 'Test User',
    },
    app_metadata: {
      provider: 'google',
    },
    identities: [
      { provider: 'google' }
    ],
  };

  const mockAuthContext = {
    user: mockUser,
    isLoading: false,
    isInitialized: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup router mock
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: mockBack,
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    // Setup auth context mock
    vi.mocked(useAuth).mockReturnValue(mockAuthContext);

    // Setup API mock
    mockApiRequest.mockResolvedValue({
      success: true,
      user: mockUser,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Component Rendering', () => {
    it('should render profile page with user data', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
      expect(screen.getByText('Manage your account information and preferences')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
      // Check for email input field instead of text
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    it('should show loading state when auth is not initialized', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: true,
        isInitialized: false,
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Initializing profile...')).toBeInTheDocument();
    });

    it('should show authentication required when no user', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isInitialized: true,
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
      expect(screen.getByText('Please sign in to view your profile.')).toBeInTheDocument();
    });
  });

  describe('Profile Overview', () => {
    it('should display user avatar and name', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Student')).toBeInTheDocument();
      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should show Google account badge for Google users', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Google Account')).toBeInTheDocument();
    });
  });

  describe('Personal Information', () => {
    it('should display email address as read-only', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const emailInput = screen.getByDisplayValue('test@example.com');
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('readonly');
    });

    it('should show Google auth indicator for Google users', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Google')).toBeInTheDocument();
      expect(screen.getByText('Authentication is handled through Google OAuth. No password needed.')).toBeInTheDocument();
    });
  });

  describe('Contact Information', () => {
    it('should display organization description', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    it('should display phone number', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByDisplayValue('09123456789')).toBeInTheDocument();
    });

    it('should show edit button for organization description', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(2); // Organization and phone edit buttons
    });
  });

  describe('Organization Description Editing', () => {
    it('should enter edit mode when edit button is clicked', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Get the first Edit button (organization description)
      const editButtons = screen.getAllByText('Edit');
      const orgEditButton = editButtons[0];
      fireEvent.click(orgEditButton);

      expect(screen.getByDisplayValue('Test Organization')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
    });

    it('should save organization description', async () => {
      mockApiRequest.mockResolvedValueOnce({
        success: true,
        user: { ...mockUser, organization_description: 'Updated Organization' },
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      // Get the first Edit button (organization description)
      const editButtons = screen.getAllByText('Edit');
      const orgEditButton = editButtons[0];
      fireEvent.click(orgEditButton);

      const textarea = screen.getByDisplayValue('Test Organization');
      fireEvent.change(textarea, { target: { value: 'Updated Organization' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/profile', {
          method: 'PUT',
          body: JSON.stringify({ organizationDescription: 'Updated Organization' }),
        });
      });
    });

    it('should cancel editing when cancel button is clicked', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Get the first Edit button (organization description)
      const editButtons = screen.getAllByText('Edit');
      const orgEditButton = editButtons[0];
      fireEvent.click(orgEditButton);

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getAllByText('Edit')).toHaveLength(2); // Both edit buttons should be visible
    });
  });

  describe('Phone Number Editing', () => {
    it('should enter edit mode for phone number', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const phoneEditButton = screen.getAllByText('Edit')[1]; // Second edit button for phone
      fireEvent.click(phoneEditButton);

      expect(screen.getByDisplayValue('09123456789')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });

    it('should validate phone number format', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const phoneEditButton = screen.getAllByText('Edit')[1];
      fireEvent.click(phoneEditButton);

      const phoneInput = screen.getByDisplayValue('09123456789');
      fireEvent.change(phoneInput, { target: { value: '123' } });

      expect(screen.getByText('Phone number must be exactly 11 digits and start with 09.')).toBeInTheDocument();
    });

    it('should save valid phone number', async () => {
      mockApiRequest.mockResolvedValueOnce({
        success: true,
        user: { ...mockUser, phone_number: '09987654321' },
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      const phoneEditButton = screen.getAllByText('Edit')[1];
      fireEvent.click(phoneEditButton);

      const phoneInput = screen.getByDisplayValue('09123456789');
      fireEvent.change(phoneInput, { target: { value: '09987654321' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/profile/phone', {
          method: 'PUT',
          body: JSON.stringify({ phoneNumber: '09987654321' }),
        });
      });
    });
  });

  describe('Navigation', () => {
    it('should navigate back when back button is clicked', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const backButton = screen.getByTestId('arrow-left');
      fireEvent.click(backButton);

      expect(mockBack).toHaveBeenCalled();
    });

    it('should refresh profile data when refresh button is clicked', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/profile');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('API Error'));

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('API Error')).toBeInTheDocument();
      });
    });

    it('should handle organization save error', async () => {
      mockApiRequest.mockResolvedValueOnce({
        success: false,
        error: 'Save failed',
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      // Get the first Edit button (organization description)
      const editButtons = screen.getAllByText('Edit');
      const orgEditButton = editButtons[0];
      fireEvent.click(orgEditButton);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Save failed')).toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading spinner when refreshing', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const refreshButton = screen.getByText('Refresh');
      fireEvent.click(refreshButton);

      expect(screen.getByText('Refreshing profile data...')).toBeInTheDocument();
    });

    it('should disable save button when saving', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Get the first Edit button (organization description)
      const editButtons = screen.getAllByText('Edit');
      const orgEditButton = editButtons[0];
      fireEvent.click(orgEditButton);

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      expect(saveButton).toBeDisabled();
    });
  });

  describe('Performance', () => {
    it('should render without errors', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    });

    it('should handle component state transitions', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Test basic state transitions work correctly
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons).toHaveLength(2); // Organization and phone edit buttons

      // Test that edit mode can be entered and exited
      const orgEditButton = editButtons[0];
      fireEvent.click(orgEditButton);
      expect(screen.getByText('Save Changes')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Cancel'));
      expect(screen.getAllByText('Edit')).toHaveLength(2); // Back to normal state
    });
  });
});

