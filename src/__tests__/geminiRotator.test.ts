import { describe, it, expect } from 'vitest';
import { generateGroundedNewsSummary } from '@/services/ai/geminiClient';

describe('geminiClient and Rotator', () => {
  it('returns null gracefully when no API key is set in environment', async () => {
    const originalGeminiKey = process.env.GEMINI_API_KEY;
    const originalGoogleKey = process.env.GOOGLE_API_KEY;

    delete process.env.GEMINI_API_KEY;
    delete process.env.GOOGLE_API_KEY;

    const result = await generateGroundedNewsSummary(
      'CW8.PA',
      'Amundi MSCI World',
      50000,
      50.0,
      2500,
      5.0,
      [],
      'Trimestre'
    );

    expect(result).toBeNull();

    if (originalGeminiKey) process.env.GEMINI_API_KEY = originalGeminiKey;
    if (originalGoogleKey) process.env.GOOGLE_API_KEY = originalGoogleKey;
  });
});
