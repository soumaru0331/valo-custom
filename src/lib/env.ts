// src/lib/env.ts
if (!process.env.RIOT_API_KEY) {
  throw new Error('RIOT_API_KEY is not set in .env.local')
}

export const RIOT_API_KEY = process.env.RIOT_API_KEY
