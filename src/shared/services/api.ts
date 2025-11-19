// Generic fetch wrapper with authentication
export async function fetchWithAuth<T>(
  baseUrl: string,
  endpoint: string, 
  options: RequestInit = {},
  getToken: () => string | null = () => null
): Promise<T> {
  const url = `${baseUrl}${endpoint}`;
  
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers
  };
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    // Handle 401 Unauthorized by redirecting to login
    if (response.status === 401) {
      throw new Error('Session expired. Please log in again.');
    }
    
    // Handle other errors
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `API error: ${response.status}`);
  }
  
  return await response.json() as T;
}

// Create API factory functions
export function createAuthApi(baseUrl: string, getToken: () => string | null) {
  return {
    login: async (username: string, password: string) => {
      return await fetchWithAuth<{ token: string, user: any }>(baseUrl, '/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      }, getToken);
    },
    
    getCurrentUser: async () => {
      return await fetchWithAuth<any>(baseUrl, '/api/auth/me', {}, getToken);
    },
    
    verifyToken: async () => {
      return await fetchWithAuth<{ valid: boolean, user?: any }>(baseUrl, '/api/auth/verify', {
        method: 'POST'
      }, getToken);
    }
  };
}

export function createUsersApi(baseUrl: string, getToken: () => string | null) {
  return {
    getAll: async () => {
      return await fetchWithAuth<any[]>(baseUrl, '/api/users', {}, getToken);
    },
    
    getById: async (id: number) => {
      return await fetchWithAuth<any>(baseUrl, `/api/users/${id}`, {}, getToken);
    },
    
    create: async (userData: any) => {
      return await fetchWithAuth<any>(baseUrl, '/api/users', {
        method: 'POST',
        body: JSON.stringify(userData)
      }, getToken);
    },
    
    update: async (id: number, userData: any) => {
      return await fetchWithAuth<any>(baseUrl, `/api/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify(userData)
      }, getToken);
    },
    
    changePassword: async (id: number, newPassword: string, currentPassword?: string) => {
      return await fetchWithAuth<{ success: boolean, message: string }>(baseUrl, `/api/users/${id}/change-password`, {
        method: 'POST',
        body: JSON.stringify({ 
          newPassword,
          currentPassword
        })
      }, getToken);
    },
    
    delete: async (id: number) => {
      return await fetchWithAuth<{ success: boolean }>(baseUrl, `/api/users/${id}`, {
        method: 'DELETE'
      }, getToken);
    }
  };
}

export function createDealersApi(baseUrl: string, getToken: () => string | null) {
  return {
    getAll: async () => {
      return await fetchWithAuth<any[]>(baseUrl, '/api/dealers', {}, getToken);
    },
    
    getById: async (id: number) => {
      return await fetchWithAuth<any>(baseUrl, `/api/dealers/${id}`, {}, getToken);
    },
    
    create: async (dealerData: any) => {
      return await fetchWithAuth<any>(baseUrl, '/api/dealers', {
        method: 'POST',
        body: JSON.stringify(dealerData)
      }, getToken);
    },
    
    update: async (id: number, dealerData: any) => {
      return await fetchWithAuth<any>(baseUrl, `/api/dealers/${id}`, {
        method: 'PUT',
        body: JSON.stringify(dealerData)
      }, getToken);
    },
    
    delete: async (id: number) => {
      return await fetchWithAuth<{ success: boolean }>(baseUrl, `/api/dealers/${id}`, {
        method: 'DELETE'
      }, getToken);
    }
  };
}

export function createVehiclesApi(baseUrl: string, getToken: () => string | null) {
  return {
    getAll: async (dealerId?: number) => {
      const queryParams = dealerId ? `?dealer_id=${dealerId}` : '';
      return await fetchWithAuth<any[]>(baseUrl, `/api/vehicles${queryParams}`, {}, getToken);
    },
    
    getById: async (id: number) => {
      return await fetchWithAuth<any>(baseUrl, `/api/vehicles/${id}`, {}, getToken);
    },
    
    create: async (vehicleData: any) => {
      return await fetchWithAuth<any>(baseUrl, '/api/vehicles', {
        method: 'POST',
        body: JSON.stringify(vehicleData)
      }, getToken);
    },
    
    update: async (id: number, vehicleData: any) => {
      return await fetchWithAuth<any>(baseUrl, `/api/vehicles/${id}`, {
        method: 'PUT',
        body: JSON.stringify(vehicleData)
      }, getToken);
    },
    
    delete: async (id: number) => {
      return await fetchWithAuth<{ success: boolean }>(baseUrl, `/api/vehicles/${id}`, {
        method: 'DELETE'
      }, getToken);
    }
  };
}

export function createImagesApi(baseUrl: string, getToken: () => string | null) {
  return {
    // Upload an image to Cloudflare Images
    upload: async (imageFile: File, metadata?: any) => {
      const formData = new FormData();
      formData.append('image', imageFile);
      
      if (metadata) {
        formData.append('metadata', JSON.stringify(metadata));
      }
      
      const token = getToken();
      const url = `${baseUrl}/api/images/upload`;
      
      // Important: Do NOT set Content-Type header when sending FormData
      // The browser will automatically set the correct Content-Type with boundary
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Session expired. Please log in again.');
        }
        
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `API error: ${response.status}`);
      }
      
      return await response.json();
    },
    
    // Get all images
    getAll: async (page: number = 1, perPage: number = 100) => {
      return await fetchWithAuth<{success: boolean, images: any[], total: number}>(
        baseUrl,
        `/api/images?page=${page}&per_page=${perPage}`,
        {},
        getToken
      );
    },
    
    // Delete an image
    delete: async (imageId: string) => {
      return await fetchWithAuth<{success: boolean, message: string}>(
        baseUrl,
        `/api/images/${imageId}`,
        { method: 'DELETE' },
        getToken
      );
    }
  };
}

// Export factory functions
export const apiFactory = {
  createAuthApi,
  createUsersApi,
  createDealersApi,
  createVehiclesApi,
  createImagesApi
};
