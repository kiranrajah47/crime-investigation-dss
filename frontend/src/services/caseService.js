/**
 * caseService.js
 * --------------
 * Centralised API calls for all case-related endpoints:
 *  - Submitting a new case for analysis
 *  - Fetching case history
 *  - Fetching a single case's full results
 *  - Dashboard statistics
 */

import axios from 'axios';

axios.defaults.withCredentials = true;

const BASE = '/api';

/**
 * Submit a new case for analysis.
 * @param {FormData} formData - Must include victim_file, evidence_file, suspects_file, weights, and optional case_title
 * @param {function} [onUploadProgress] - Optional progress callback: (progressEvent) => void
 * @returns {Promise<{success: boolean, case_db_id: number, case_id: string}>}
 */
export const analyzeCase = async (formData, onUploadProgress) => {
  const config = {
    headers: { 'Content-Type': 'multipart/form-data' },
  };
  if (onUploadProgress) {
    config.onUploadProgress = onUploadProgress;
  }
  const response = await axios.post(`${BASE}/cases/analyze`, formData, config);
  return response.data;
};

/**
 * Fetch case history for the current user.
 * Admins receive all cases; investigators receive only their own.
 * @param {number} [page=1]
 * @param {number} [perPage=10]
 * @returns {Promise<{cases: Array, total: number, page: number, total_pages: number}>}
 */
export const getCaseHistory = async (page = 1, perPage = 10) => {
  const response = await axios.get(`${BASE}/cases/history`, { params: { page, per_page: perPage } });
  return response.data;
};

/**
 * Fetch full details and ranked report for a single case.
 * @param {number|string} caseDbId - The database integer ID of the case
 * @returns {Promise<{case: object, report: Array}>}
 */
export const getCaseDetails = async (caseDbId) => {
  const response = await axios.get(`${BASE}/cases/${caseDbId}`);
  return response.data;
};

/**
 * Fetch statistics for the current user's dashboard.
 * @returns {Promise<{total_cases: number, total_suspects: number, this_month: number}>}
 */
export const getDashboardStats = async () => {
  const response = await axios.get(`${BASE}/dashboard/stats`);
  return response.data;
};

/**
 * Build a PDF export URL for a case (handled directly by Flask — not an API call).
 * The link can be used as an <a href> to trigger a browser download.
 * @param {number|string} caseDbId
 * @returns {string} URL string
 */
export const getPdfExportUrl = (caseDbId) => `/export/${caseDbId}`;

/**
 * Fetch optional Sentence-BERT similarity comparison for a case.
 * @param {number|string} caseDbId
 * @returns {Promise<Array<{name: string, tfidf_score: number, sbert_score: number}>>}
 */
export const getSbertComparison = async (caseDbId) => {
  const response = await axios.get(`${BASE}/cases/${caseDbId}/sbert-comparison`);
  return response.data;
};
