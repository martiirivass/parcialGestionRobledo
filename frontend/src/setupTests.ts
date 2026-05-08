/**
 * Jest setup file for testing environment
 */
import '@testing-library/jest-dom';

// Mock environment variables
process.env.VITE_API_BASE_URL = 'http://localhost:8000/api/v1';
