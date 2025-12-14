/**
 * Next.js Instrumentation Hook
 * This file runs once when the server starts
 * Use this to initialize event handlers and other server-side setup
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize event handlers when server starts
    const { initializeEventHandlers } = await import('./events/EventHandlers');
    
    try {
      initializeEventHandlers();
      console.log('✅ Event handlers initialized');
    } catch (error) {
      console.error('❌ Failed to initialize event handlers:', error);
    }
  }
}

