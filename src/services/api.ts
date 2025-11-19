import { apiFactory } from '../shared/services';

// Base API URL
const API_URL = process.env.REACT_APP_API_URL || 'https://api.autoelite.io';

// Helper function to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Create API instances using the shared factory
export const authApi = apiFactory.createAuthApi(API_URL, getToken);
export const usersApi = apiFactory.createUsersApi(API_URL, getToken);
export const dealersApi = apiFactory.createDealersApi(API_URL, getToken);
export const vehiclesApi = apiFactory.createVehiclesApi(API_URL, getToken);
export const imagesApi = apiFactory.createImagesApi(API_URL, getToken);
