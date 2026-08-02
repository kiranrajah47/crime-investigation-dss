/**
 * authService.js
 * --------------
 * Centralised API calls for all authentication-related endpoints.
 * Uses Flask session cookies (withCredentials) — no JWT token management required.
 */

import axios from 'axios';

// Ensure cookies are sent with every request (Flask-Login session support)
axios.defaults.withCredentials = true;

const BASE = '/api/auth';

/**
 * Login a user with username + password.
 * @param {string} username
 * @param {string} password
 * @param {boolean} remember - Whether to persist the session cookie
 * @returns {Promise<{success: boolean, user?: object, message?: string}>}
 */
export const loginUser = async (username, password, remember = false) => {
  const response = await axios.post(`${BASE}/login`, { username, password, remember });
  return response.data;
};

/**
 * Logout the currently authenticated user.
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const logoutUser = async () => {
  const response = await axios.post(`${BASE}/logout`);
  return response.data;
};

/**
 * Check current auth status — used on app initialisation.
 * @returns {Promise<{isAuthenticated: boolean, user?: object}>}
 */
export const getAuthStatus = async () => {
  const response = await axios.get(`${BASE}/status`);
  return response.data;
};

/**
 * Change the password for the currently logged-in user.
 * @param {string} current_password
 * @param {string} new_password
 * @param {string} confirm_password
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const changePassword = async (current_password, new_password, confirm_password) => {
  const response = await axios.post(`${BASE}/change-password`, {
    current_password,
    new_password,
    confirm_password,
  });
  return response.data;
};
