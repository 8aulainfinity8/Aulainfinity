import type { ApiKeysConfig } from '../types';

// This is not exported to simulate secure, server-side storage.
// In a real app, this would be a database table or a secret manager.
export let apiKeysData: ApiKeysConfig = {
  geminiApiKey: 'YOUR_GEMINI_API_KEY_HERE', // Start with a placeholder key
};
