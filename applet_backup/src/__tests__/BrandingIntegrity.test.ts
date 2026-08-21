import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';

const PNG_HEADER = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
const EXPECTED_ICON_SHA256 = 'f128c30e4f09ff353f07a39f420349495be3b373906001a8c0b8151899cbfcbd';

function getSha256(buffer: Buffer): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

describe('Protección contra Regresiones de Branding AulaInfinity', () => {
  const files = [
    'public/brand/logo.png',
    'src/assets/images/brand/logo.png',
    'public/brand/icon.png',
    'public/favicon.png',
    'public/icon-192.png',
    'public/icon-512.png'
  ];

  it('Todos los archivos de branding existen físicamente', () => {
    files.forEach(file => {
      const fullPath = path.resolve(process.cwd(), file);
      expect(fs.existsSync(fullPath), `El archivo ${file} debe existir físicamente`).toBe(true);
    });
  });

  it('Todos los archivos de branding son archivos PNG binarios reales con firma 89 50 4E 47', () => {
    files.forEach(file => {
      const fullPath = path.resolve(process.cwd(), file);
      const buffer = fs.readFileSync(fullPath);
      expect(buffer.length).toBeGreaterThan(64);
      const header = buffer.subarray(0, 8);
      expect(header.equals(PNG_HEADER), `El archivo ${file} debe comenzar con la firma binaria PNG 89 50 4E 47 0D 0A 1A 0A`).toBe(true);
    });
  });

  it('public/brand/logo.png y src/assets/images/brand/logo.png son BYTE-A-BYTE idénticos', () => {
    const publicLogo = fs.readFileSync(path.resolve(process.cwd(), 'public/brand/logo.png'));
    const srcLogo = fs.readFileSync(path.resolve(process.cwd(), 'src/assets/images/brand/logo.png'));
    expect(publicLogo.equals(srcLogo)).toBe(true);
    expect(getSha256(publicLogo)).toBe(getSha256(srcLogo));
  });

  it('public/brand/icon.png conserva exactamente su SHA256 oficial inmutable', () => {
    const iconBuffer = fs.readFileSync(path.resolve(process.cwd(), 'public/brand/icon.png'));
    const iconSha = getSha256(iconBuffer);
    expect(iconSha).toBe(EXPECTED_ICON_SHA256);
  });
});
