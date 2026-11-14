// Unit tests only (tests/*.test.ts). Browser tests live in tests/e2e and run with Playwright.
import { defineConfig } from 'vitest/config';

export default defineConfig({ test: { include: ['tests/**/*.test.ts'] } });
