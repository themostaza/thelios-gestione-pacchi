import { z } from 'zod'

import { registerSchema } from '@/lib/validations/user'

export type ProfileUser = {
  id: string
  email: string
  created_at: string
  user_id: string | null
  is_admin: boolean
}

export type CreateUserData = {
  email: string
  isAdmin: boolean
}

export type UserContextType = {
  users: ProfileUser[]
  loading: boolean
  error: string | null
  refreshUsers: () => Promise<void>
  addUser: (userData: CreateUserData) => Promise<{ success: boolean; message: string }>
  deleteUser: (id: string, userId: string | null) => Promise<void>
}

export type GetProfilesResult = {
  users: ProfileUser[] | null
  success: boolean
  message?: string
}

export type User = {
  id: string
  email: string
  isAdmin: boolean
}

export type AuthContextType = {
  user: User | null
  isLoading: boolean
  isAdmin: boolean
  login: (email: string, password: string) => Promise<boolean>
  register: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
}

export type LoginData = {
  email: string
  password: string
}

export type LoginFormData = {
  email: string
  password: string
}

export type RegisterFormData = z.infer<typeof registerSchema>

export type LoginResult = {
  success: boolean
  error?: string
  user?: {
    id: string
    email: string
  }
}

export type RegisterResult = {
  success: boolean
  message: string
}

export type LogoutResult = {
  success: boolean
  message: string
}

export type UserSessionResult = {
  user: User | null
  isAdmin: boolean
  error?: string
}

export type CreateUserResult = {
  success: boolean
  message: string
  email?: string
  isAdmin?: boolean
}

export type CreateUserFormData = CreateUserData
