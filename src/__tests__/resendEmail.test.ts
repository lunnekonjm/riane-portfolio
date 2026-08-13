import { describe, it, expect } from 'vitest';
import { sendPeriodicReportEmail } from '@/services/email/resend';

describe('resendEmail Service', () => {
  it('gracefully fails when API key or from email is missing without crashing', async () => {
    // Ensure test environment has empty keys
    const originalApiKey = process.env.RESEND_API_KEY;
    const originalFrom = process.env.RESEND_FROM_EMAIL;

    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM_EMAIL;

    const result = await sendPeriodicReportEmail({
      toEmail: 'test@example.com',
      subject: 'Test Report',
      reportMarkdown: '# Test Report\n\n- 🟢 Test item',
      dashboardUrl: 'http://localhost:3000',
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('manquant côté serveur');

    // Restore env
    if (originalApiKey) process.env.RESEND_API_KEY = originalApiKey;
    if (originalFrom) process.env.RESEND_FROM_EMAIL = originalFrom;
  });
});
