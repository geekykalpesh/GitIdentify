import { describe, it, expect } from 'vitest';
import { logger } from '../src/main/services/loggerService';

describe('LoggerService - Security Redactor', () => {
  it('should redact GitHub Personal Access Tokens (ghp_*)', () => {
    const raw = 'Connecting with token ghp_1234567890abcdef1234567890abcdef to api.github.com';
    const sanitized = logger.sanitize(raw);
    expect(sanitized).not.toContain('ghp_1234567890abcdef1234567890abcdef');
    expect(sanitized).toContain('[REDACTED_TOKEN]');
  });

  it('should redact SSH Private Keys', () => {
    const raw = `SSH Key Loaded:
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
QyNTUxOQAAACBA1234567890abcdef
-----END OPENSSH PRIVATE KEY-----
Connection established.`;

    const sanitized = logger.sanitize(raw);
    expect(sanitized).not.toContain('b3BlbnNzaC1rZXktdjE');
    expect(sanitized).toContain('[REDACTED_PRIVATE_KEY]');
  });

  it('should sanitize Bearer tokens in headers', () => {
    const raw = 'Header: Bearer gho_abcdef1234567890abcdef1234567890';
    const sanitized = logger.sanitize(raw);
    expect(sanitized).toContain('Bearer [REDACTED_TOKEN]');
  });
});
