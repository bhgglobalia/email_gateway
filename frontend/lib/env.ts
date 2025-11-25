const requiredEnvVars = ['NEXT_PUBLIC_API_URL'] as const;

export const env = {
  API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  WS_URL: process.env.NEXT_PUBLIC_WS_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
} as const;

if (typeof window === "undefined" && process.env.NODE_ENV !== 'test') {
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      console.warn(`Missing environment variable: ${varName}`);
    }
  });
}