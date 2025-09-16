import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Backend API prefix
export const API_BASE_URL = 'https://unibackend.iuptit.com/api/v1/'

// Helper to build full API URLs
export function apiUrl(path: string) {
  const clean = path.startsWith('/') ? path.slice(1) : path
  return `${API_BASE_URL}${clean}`
}
