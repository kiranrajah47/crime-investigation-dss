/**
 * adminService.js
 * ---------------
 * Centralised API calls for all admin-only endpoints:
 *  - User management (list, register, toggle active status, delete)
 *  - Case management (delete)
 *
 * All endpoints are guarded by `api_admin_required` on the Flask side.
 * Calling these as a non-admin user will result in a 403 response.
 */

import axios from 'axios';

axios.defaults.withCredentials = true;

const BASE = '/api/admin';

// ── User management ──────────────────────────────────────────────────────────

/**
 * Fetch all users in the system (admin only).
 * @returns {Promise<Array>} Array of user objects
 */
export const getAllUsers = async () => {
  const response = await axios.get(`${BASE}/users`);
  return response.data;
};

/**
 * Register a new user account (admin only).
 * @param {object} userData - { username, full_name, email, password, role }
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const registerUser = async (userData) => {
  const response = await axios.post(`${BASE}/users/register`, userData);
  return response.data;
};

/**
 * Toggle the active/inactive status of a user account.
 * @param {number} userId - The database ID of the user
 * @returns {Promise<{success: boolean, isActive: boolean, message: string}>}
 */
export const toggleUserStatus = async (userId) => {
  const response = await axios.post(`${BASE}/users/${userId}/toggle`);
  return response.data;
};

/**
 * Permanently delete a user account and all their cases.
 * @param {number} userId - The database ID of the user
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteUser = async (userId) => {
  const response = await axios.post(`${BASE}/users/${userId}/delete`);
  return response.data;
};

// ── Case management ──────────────────────────────────────────────────────────

/**
 * Fetch all cases in the system (admin only) with pagination.
 * @param {number} [page=1]
 * @param {number} [perPage=10]
 * @returns {Promise<{cases: Array, total: number, page: number, total_pages: number}>}
 */
export const getAllCases = async (page = 1, perPage = 10) => {
  const response = await axios.get(`${BASE}/cases`, { params: { page, per_page: perPage } });
  return response.data;
};

/**
 * Permanently delete a case record (admin only).
 * @param {number} caseId - The database ID of the case
 * @returns {Promise<{success: boolean, message: string}>}
 */
export const deleteCase = async (caseId) => {
  const response = await axios.post(`${BASE}/cases/${caseId}/delete`);
  return response.data;
};
