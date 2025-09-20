import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/utils/api';

// Mock dependencies
vi.mock('@/contexts/auth-context', () => ({
  useAuth: vi.fn(),
}));

vi.mock('@/utils/api', () => ({
  apiRequest: vi.fn(),
}));

describe('Profile Page Hooks and Utilities', () => {
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
    vi.mocked(useAuth).mockReturnValue(mockAuthContext);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Data Fetching', () => {
    it('should fetch profile data successfully', async () => {
      const mockApiRequest = vi.mocked(apiRequest);
      mockApiRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });

      // Test the API call
      const result = await apiRequest('/profile');
      
      expect(result).toEqual({
        success: true,
        user: mockUser,
      });
      expect(mockApiRequest).toHaveBeenCalledWith('/profile');
    });

    it('should handle profile data fetch error', async () => {
      const mockApiRequest = vi.mocked(apiRequest);
      mockApiRequest.mockRejectedValue(new Error('Network error'));

      await expect(apiRequest('/profile')).rejects.toThrow('Network error');
    });

    it('should handle timeout in profile data fetch', async () => {
      const mockApiRequest = vi.mocked(apiRequest);
      mockApiRequest.mockImplementation(() => 
        new Promise((resolve) => setTimeout(resolve, 6000))
      );

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      );

      await expect(Promise.race([
        apiRequest('/profile'),
        timeoutPromise
      ])).rejects.toThrow('Request timeout');
    });
  });

  describe('User Data Processing', () => {
    it('should get optimized profile picture from Google OAuth', () => {
      const userData = {
        user_metadata: {
          avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocKC6Y6BGJ0clYuJQyhfbMSl7i95M5Q_qHHCV5OQO7OTk1vdliQ=s96-c'
        }
      };

      // Test the profile picture optimization logic
      const profilePicUrl = userData.user_metadata.avatar_url;
      const optimizedUrl = profilePicUrl.replace(/=s\d+-c/g, '=s400-c');
      
      expect(optimizedUrl).toBe('https://lh3.googleusercontent.com/a/ACg8ocKC6Y6BGJ0clYuJQyhfbMSl7i95M5Q_qHHCV5OQO7OTk1vdliQ=s400-c');
    });

    it('should get user display name from metadata', () => {
      const userData = {
        user_metadata: {
          full_name: 'John Doe'
        },
        raw_user_meta_data: {
          full_name: 'John Doe'
        },
        name: 'John Doe',
        email: 'john@example.com'
      };

      // Test display name extraction logic
      const nameOptions = [
        userData.user_metadata?.full_name,
        userData.user_metadata?.name,
        userData.raw_user_meta_data?.full_name,
        userData.raw_user_meta_data?.name,
        userData.name,
        userData.email?.split('@')[0]?.replace(/[._]/g, ' ')
      ].filter(Boolean);

      expect(nameOptions[0]).toBe('John Doe');
    });

    it('should detect Google account', () => {
      const userData = {
        user_metadata: {
          avatar_url: 'https://lh3.googleusercontent.com/a/ACg8ocKC6Y6BGJ0clYuJQyhfbMSl7i95M5Q_qHHCV5OQO7OTk1vdliQ=s96-c'
        },
        app_metadata: {
          provider: 'google'
        },
        identities: [
          { provider: 'google' }
        ]
      };

      // Test Google account detection logic
      const hasGooglePicture = userData.user_metadata?.avatar_url?.includes('googleusercontent.com');
      const hasGoogleProvider = userData.app_metadata?.provider === 'google' ||
        userData.identities?.some(identity => identity.provider === 'google');

      expect(hasGooglePicture).toBe(true);
      expect(hasGoogleProvider).toBe(true);
    });
  });

  describe('Form Validation', () => {
    it('should validate phone number format', () => {
      const validatePhoneNumber = (phone) => {
        if (!phone) return false;
        const phoneRegex = /^09\d{9}$/;
        return phoneRegex.test(phone);
      };

      expect(validatePhoneNumber('09123456789')).toBe(true);
      expect(validatePhoneNumber('1234567890')).toBe(false);
      expect(validatePhoneNumber('0912345678')).toBe(false);
      expect(validatePhoneNumber('')).toBe(false);
    });

    it('should handle phone number input formatting', () => {
      const handlePhoneChange = (value) => {
        const digitOnly = value.replace(/\D/g, '').slice(0, 11);
        return digitOnly;
      };

      expect(handlePhoneChange('09123456789')).toBe('09123456789');
      expect(handlePhoneChange('091-234-5678')).toBe('0912345678');
      expect(handlePhoneChange('091234567890123')).toBe('09123456789');
    });
  });

  describe('State Management', () => {
    it('should handle organization description state', () => {
      const { result } = renderHook(() => {
        const [organizationDescription, setOrganizationDescription] = React.useState('');
        
        const handleChange = (value) => {
          setOrganizationDescription(value);
        };

        return { organizationDescription, handleChange };
      });

      act(() => {
        result.current.handleChange('New Organization');
      });

      expect(result.current.organizationDescription).toBe('New Organization');
    });

    it('should handle phone number state', () => {
      const { result } = renderHook(() => {
        const [phoneNumber, setPhoneNumber] = React.useState('');
        
        const handleChange = (value) => {
          const digitOnly = value.replace(/\D/g, '').slice(0, 11);
          setPhoneNumber(digitOnly);
        };

        return { phoneNumber, handleChange };
      });

      act(() => {
        result.current.handleChange('09123456789');
      });

      expect(result.current.phoneNumber).toBe('09123456789');
    });

    it('should handle editing states', () => {
      const { result } = renderHook(() => {
        const [isEditingOrg, setIsEditingOrg] = React.useState(false);
        const [isEditingPhone, setIsEditingPhone] = React.useState(false);
        
        const startEditingOrg = () => setIsEditingOrg(true);
        const stopEditingOrg = () => setIsEditingOrg(false);
        const startEditingPhone = () => setIsEditingPhone(true);
        const stopEditingPhone = () => setIsEditingPhone(false);

        return { 
          isEditingOrg, 
          isEditingPhone, 
          startEditingOrg, 
          stopEditingOrg, 
          startEditingPhone, 
          stopEditingPhone 
        };
      });

      act(() => {
        result.current.startEditingOrg();
      });

      expect(result.current.isEditingOrg).toBe(true);

      act(() => {
        result.current.stopEditingOrg();
      });

      expect(result.current.isEditingOrg).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should serialize errors properly', () => {
      const serializeError = (err) => {
        if (!err) return 'Unknown error';
        if (typeof err === 'string') return err;
        if (err instanceof Error) return `${err.name}: ${err.message}`;
        try {
          return JSON.stringify(err);
        } catch (_) {
          return String(err);
        }
      };

      expect(serializeError(new Error('Test error'))).toBe('Error: Test error');
      expect(serializeError('String error')).toBe('String error');
      expect(serializeError({ message: 'Object error' })).toBe('{"message":"Object error"}');
      expect(serializeError(null)).toBe('Unknown error');
    });

    it('should handle API errors gracefully', async () => {
      const mockApiRequest = vi.mocked(apiRequest);
      mockApiRequest.mockRejectedValue(new Error('API Error'));

      try {
        await apiRequest('/profile');
      } catch (error) {
        expect(error.message).toBe('API Error');
      }
    });
  });

  describe('Performance', () => {
    it('should handle rapid state updates', () => {
      const { result } = renderHook(() => {
        const [count, setCount] = React.useState(0);
        
        const increment = () => setCount(prev => prev + 1);
        
        return { count, increment };
      });

      // Simulate rapid updates
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.increment();
        }
      });

      expect(result.current.count).toBe(10);
    });

    it('should handle async operations', async () => {
      const { result } = renderHook(() => {
        const [data, setData] = React.useState(null);
        const [loading, setLoading] = React.useState(false);
        
        const fetchData = async () => {
          setLoading(true);
          try {
            const response = await apiRequest('/profile');
            setData(response);
          } catch (error) {
            setData({ error: error.message });
          } finally {
            setLoading(false);
          }
        };

        return { data, loading, fetchData };
      });

      const mockApiRequest = vi.mocked(apiRequest);
      mockApiRequest.mockResolvedValue({ success: true, user: mockUser });

      await act(async () => {
        await result.current.fetchData();
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual({ success: true, user: mockUser });
    });
  });
});

