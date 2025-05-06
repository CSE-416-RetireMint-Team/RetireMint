// Silence noisy logs during tests
beforeAll(() => {
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  // Set default environment variables (optional)
  process.env.NODE_ENV = 'test';
  process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/testdb';
  