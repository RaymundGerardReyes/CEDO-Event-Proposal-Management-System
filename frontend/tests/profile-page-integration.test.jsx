import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/utils/api';
import ProfilePage from '@/app/student-dashboard/profile/page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/utils/api', () => ({
  apiRequest: vi.fn(),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }) => <div {...props}>{children}</div>,
  },
}));

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

describe('ProfilePage Integration Tests', () => {
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

  beforeEach(() => {
    vi.clearAllMocks();
    
    vi.mocked(useRouter).mockReturnValue({
      push: mockPush,
      back: mockBack,
      forward: vi.fn(),
      refresh: vi.fn(),
      replace: vi.fn(),
      prefetch: vi.fn(),
    });

    vi.mocked(useAuth).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isInitialized: true,
    });

    mockApiRequest.mockResolvedValue({
      success: true,
      user: mockUser,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Complete User Flow', () => {
    it('should complete full profile editing workflow', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Initial state
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getByDisplayValue('09123456789')).toBeInTheDocument();

      // Edit organization description
      const orgEditButton = screen.getByText('Edit');
      fireEvent.click(orgEditButton);

      const orgTextarea = screen.getByDisplayValue('Test Organization');
      fireEvent.change(orgTextarea, { target: { value: 'Updated Organization' } });

      const orgSaveButton = screen.getByText('Save Changes');
      fireEvent.click(orgSaveButton);

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/profile', {
          method: 'PUT',
          body: JSON.stringify({ organizationDescription: 'Updated Organization' }),
        });
      });

      // Edit phone number
      const phoneEditButton = screen.getAllByText('Edit')[1];
      fireEvent.click(phoneEditButton);

      const phoneInput = screen.getByDisplayValue('09123456789');
      fireEvent.change(phoneInput, { target: { value: '09987654321' } });

      const phoneSaveButton = screen.getByText('Save Changes');
      fireEvent.click(phoneSaveButton);

      await waitFor(() => {
        expect(mockApiRequest).toHaveBeenCalledWith('/profile/phone', {
          method: 'PUT',
          body: JSON.stringify({ phoneNumber: '09987654321' }),
        });
      });
    });

    it('should handle error recovery in editing workflow', async () => {
      mockApiRequest.mockRejectedValueOnce(new Error('Network error'));

      await act(async () => {
        render(<ProfilePage />);
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      const textarea = screen.getByDisplayValue('Test Organization');
      fireEvent.change(textarea, { target: { value: 'Updated Organization' } });

      const saveButton = screen.getByText('Save Changes');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });

      // Should still be in edit mode after error
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
    });
  });

  describe('State Persistence', () => {
    it('should maintain state during rapid interactions', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Rapid edit/cancel cycles
      const editButton = screen.getByText('Edit');
      
      fireEvent.click(editButton);
      fireEvent.click(screen.getByText('Cancel'));
      fireEvent.click(editButton);
      fireEvent.click(screen.getByText('Cancel'));

      // State should be consistent
      expect(screen.getByText('Test Organization')).toBeInTheDocument();
      expect(screen.getByText('Edit')).toBeInTheDocument();
    });

    it('should handle concurrent edits', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      // Start editing organization
      const orgEditButton = screen.getByText('Edit');
      fireEvent.click(orgEditButton);

      // Start editing phone
      const phoneEditButton = screen.getAllByText('Edit')[1];
      fireEvent.click(phoneEditButton);

      // Both should be in edit mode
      expect(screen.getAllByText('Save Changes')).toHaveLength(2);
      expect(screen.getAllByText('Cancel')).toHaveLength(2);
    });
  });

  describe('Data Synchronization', () => {
    it('should sync data after successful save', async () => {
      const updatedUser = {
        ...mockUser,
        organization_description: 'Updated Organization',
        phone_number: '09987654321',
      };

      mockApiRequest
        .mockResolvedValueOnce({ success: true, user: updatedUser })
        .mockResolvedValueOnce({ success: true, user: updatedUser });

      await act(async () => {
        render(<ProfilePage />);
      });

      // Edit and save organization
      const orgEditButton = screen.getByText('Edit');
      fireEvent.click(orgEditButton);

      const orgTextarea = screen.getByDisplayValue('Test Organization');
      fireEvent.change(orgTextarea, { target: { value: 'Updated Organization' } });

      const orgSaveButton = screen.getByText('Save Changes');
      fireEvent.click(orgSaveButton);

      await waitFor(() => {
        expect(screen.getByText('Updated Organization')).toBeInTheDocument();
      });
    });

    it('should handle data refresh', async () => {
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

  describe('Error Scenarios', () => {
    it('should handle network errors gracefully', async () => {
      mockApiRequest.mockRejectedValue(new Error('Network error'));

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument();
      });
    });

    it('should handle API errors with proper messaging', async () => {
      mockApiRequest.mockResolvedValue({
        success: false,
        error: 'Validation failed',
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Validation failed')).toBeInTheDocument();
      });
    });

    it('should handle timeout errors', async () => {
      mockApiRequest.mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 6000))
      );

      await act(async () => {
        render(<ProfilePage />);
      });

      await waitFor(() => {
        expect(screen.getByText('Request timeout')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Scenarios', () => {
    it('should handle rapid state changes without errors', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      const editButton = screen.getByText('Edit');
      
      // Rapid clicking
      for (let i = 0; i < 5; i++) {
        fireEvent.click(editButton);
        fireEvent.click(screen.getByText('Cancel'));
      }

      expect(screen.getByText('Test Organization')).toBeInTheDocument();
    });

    it('should handle large data updates', async () => {
      const largeDescription = 'A'.repeat(1000);
      
      await act(async () => {
        render(<ProfilePage />);
      });

      const editButton = screen.getByText('Edit');
      fireEvent.click(editButton);

      const textarea = screen.getByDisplayValue('Test Organization');
      fireEvent.change(textarea, { target: { value: largeDescription } });

      expect(textarea.value).toBe(largeDescription);
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByLabelText('Organization Description')).toBeInTheDocument();
      expect(screen.getByLabelText('Phone Number')).toBeInTheDocument();
    });

    it('should have proper button labels', async () => {
      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Edit')).toBeInTheDocument();
      expect(screen.getByText('Save Changes')).toBeInTheDocument();
      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty user data', async () => {
      vi.mocked(useAuth).mockReturnValue({
        user: null,
        isLoading: false,
        isInitialized: true,
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('should handle missing profile data', async () => {
      const userWithoutProfile = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
      };

      vi.mocked(useAuth).mockReturnValue({
        user: userWithoutProfile,
        isLoading: false,
        isInitialized: true,
      });

      await act(async () => {
        render(<ProfilePage />);
      });

      expect(screen.getByText('No organization description provided')).toBeInTheDocument();
      expect(screen.getByText('No phone number provided')).toBeInTheDocument();
    });
  });
});

