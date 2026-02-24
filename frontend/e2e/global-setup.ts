import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup runs once before all tests
 * Use this to:
 * - Verify test environment is ready
 * - Seed initial data if needed
 * - Login and save authentication state (if applicable)
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting E2E test setup...');

  // Get base URL from config
  const baseURL = config.projects[0].use.baseURL || 'http://localhost:3000';
  const apiURL = process.env.TEST_API_URL || 'http://localhost:8000';

  console.log(`📍 Frontend URL: ${baseURL}`);
  console.log(`📍 Backend API URL: ${apiURL}`);

  // Verify that frontend is accessible
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('🔍 Verifying frontend is accessible...');
    await page.goto(baseURL, { timeout: 10000 });
    console.log('✅ Frontend is ready');
  } catch (error) {
    console.error('❌ Frontend is not accessible!');
    console.error('Make sure to start the frontend server: npm run dev');
    throw error;
  }

  // Verify that backend is accessible
  try {
    console.log('🔍 Verifying backend API is accessible...');
    const response = await page.request.get(`${apiURL}/health`, { timeout: 5000 });

    if (response.ok()) {
      console.log('✅ Backend API is ready');
    } else {
      // Backend might not have /health endpoint, try root
      const rootResponse = await page.request.get(`${apiURL}/`, { timeout: 5000 });
      if (rootResponse.ok() || rootResponse.status() === 404) {
        console.log('✅ Backend API is ready (verified via root endpoint)');
      } else {
        throw new Error(`Backend returned status ${rootResponse.status()}`);
      }
    }
  } catch (error) {
    console.warn('⚠️  Backend API verification failed (this is OK if backend has no health endpoint)');
    console.warn('Make sure to start the backend server: uvicorn app.main:app --reload');
  }

  await browser.close();

  console.log('✅ Global setup complete\n');
}

export default globalSetup;
