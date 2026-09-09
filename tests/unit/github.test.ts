import { describe, it, expect } from 'vitest';
import { isAllowedPath, safeUploadName, describeGitHubStatus } from '../../functions/lib/github';

describe('isAllowedPath', () => {
  it('allows content and upload paths', () => {
    expect(isAllowedPath('content/posts/a.json')).toBe(true);
    expect(isAllowedPath('content/books.json')).toBe(true);
    expect(isAllowedPath('public/uploads/a.jpg')).toBe(true);
  });

  it('refuses traversal and absolute paths', () => {
    for (const p of [
      '../secrets',
      'content/../../etc/passwd',
      '/etc/passwd',
      'content/posts/../../../x',
      'content\\..\\x',
    ]) {
      expect(isAllowedPath(p)).toBe(false);
    }
  });

  it('refuses paths outside the two writable roots', () => {
    for (const p of [
      'functions/api/login.ts',
      '.github/workflows/deploy.yml',
      'package.json',
      'src/lib/books.ts',
      'contentx/evil.json',
    ]) {
      expect(isAllowedPath(p)).toBe(false);
    }
  });

  it('refuses a bare prefix with nothing after it', () => {
    expect(isAllowedPath('content/')).toBe(false);
    expect(isAllowedPath('public/uploads/')).toBe(false);
  });
});

describe('safeUploadName', () => {
  it('strips directories from a client-supplied filename', () => {
    expect(safeUploadName('../../etc/passwd.jpg', 1)).not.toContain('..');
    expect(safeUploadName('a/b/c.png', 1)).toBe('1-c.png');
  });

  it('lowercases and slugifies', () => {
    expect(safeUploadName('My Photo (1).JPG', 7)).toBe('7-my-photo-1.jpg');
  });

  it('rejects a disallowed extension by returning null', () => {
    expect(safeUploadName('evil.svg', 1)).toBeNull();
    expect(safeUploadName('evil.html', 1)).toBeNull();
    expect(safeUploadName('noextension', 1)).toBeNull();
  });
});

describe('describeGitHubStatus', () => {
  it('names an expired token, the most likely failure a year out', () => {
    expect(describeGitHubStatus(401)).toMatch(/expired/i);
  });

  it('distinguishes permission from expiry', () => {
    expect(describeGitHubStatus(403)).toMatch(/permission/i);
    expect(describeGitHubStatus(403)).not.toMatch(/expired/i);
  });

  it('points at the config variables when the repo is not found', () => {
    expect(describeGitHubStatus(404)).toMatch(/GITHUB_REPO/);
  });

  it('falls back to the raw status for anything unrecognised', () => {
    expect(describeGitHubStatus(500)).toBe('github returned 500');
  });
});
