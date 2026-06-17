// Global test setup
global.console = {
  ...console,
  // uncomment to ignore a specific log level
  // log: jest.fn(),
  // debug: jest.fn(),
  // info: jest.fn(),
  // warn: jest.fn(),
  // error: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.USE_MOCK_TTS = 'true';