import api from './api';

const adminApi = {
  // Wrapper for making admin API requests with API key auth
  request: async (method, url, data = null) => {
    const config = {
      method,
      url,
      headers: {
        'x-api-key': process.env.NEXT_PUBLIC_ADMIN_API_KEY
      }
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await api(config);
      return response.data;
    } catch (error) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized access to admin API');
      }
      throw error;
    }
  },

  // Admin API endpoints
  getDashboardData: () => adminApi.request('GET', '/admin'),
  
  // Add more admin endpoints as needed
  updateSettings: (settings) => adminApi.request('POST', '/admin/settings', settings),
};

export default adminApi;
