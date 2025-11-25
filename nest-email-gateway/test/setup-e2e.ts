// Suppress BullMQ Redis version warnings in tests
const originalWarn = console.warn;
console.warn = (...args: any[]) => {
  if (args[0]?.toString().includes('Redis version')) return;
  originalWarn(...args);
};
