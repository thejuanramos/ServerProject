export default async () => {
  process.env.JWT_SECRET = 'test-secret';
  process.env.NODE_ENV = 'test';
  
  // You can also set a dummy port or other test-specific vars here
  console.log('\n🔧 Jest Global Setup: Test environment variables initialized.');
};