import axios from "axios"
import type { UserProfile } from "@/types/profile"

const TOKEN_KEY = "weathernow_token"

export interface AuthUser {
  id: string
  email: string
  name: string
  avatar?: string
  profile: UserProfile
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

// Attach token to every axios request if present
axios.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

export async function fetchCurrentUser(apiUrl: string): Promise<AuthUser | null> {
  const token = getToken()
  if (!token) return null
  try {
    const res = await axios.get(`${apiUrl}/auth/me`)
    return res.data.user
  } catch {
    clearToken()
    return null
  }
}

export async function googleSignIn(apiUrl: string, credential: string): Promise<AuthUser> {
  const res = await axios.post(`${apiUrl}/auth/google`, { credential })
  setToken(res.data.token)
  return res.data.user
}

export async function login(apiUrl: string, email: string, password: string): Promise<AuthUser> {
  const res = await axios.post(`${apiUrl}/auth/login`, { email, password })
  setToken(res.data.token)
  return res.data.user
}

export async function register(apiUrl: string, email: string, password: string, name: string): Promise<AuthUser> {
  const res = await axios.post(`${apiUrl}/auth/register`, { email, password, name })
  setToken(res.data.token)
  return res.data.user
}

export async function updateProfile(apiUrl: string, data: Partial<UserProfile> & { name?: string }): Promise<AuthUser["profile"]> {
  const res = await axios.put(`${apiUrl}/profile`, data)
  return res.data.profile
}

export function logout(): void {
  clearToken()
}
