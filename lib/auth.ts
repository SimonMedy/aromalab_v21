// Authentication utilities using localStorage
export interface User {
  id: string
  email: string
  name: string
  role: "admin" | "user"
  createdAt: string
}

export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

const AUTH_KEY = "aromalab_auth"
const USERS_KEY = "aromalab_users"

// Initialize with default admin user
const initializeUsers = () => {
  const users = localStorage.getItem(USERS_KEY)
  if (!users) {
    const defaultUsers: User[] = [
      {
        id: "1",
        email: "admin@aromalab.com",
        name: "Administrateur",
        role: "admin",
        createdAt: new Date().toISOString(),
      },
    ]
    localStorage.setItem(USERS_KEY, JSON.stringify(defaultUsers))
    // Store password separately (in real app, this would be hashed)
    localStorage.setItem("aromalab_passwords", JSON.stringify({ "admin@aromalab.com": "admin123" }))
  }
}

export const login = (email: string, password: string): User | null => {
  initializeUsers()
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
  const passwords = JSON.parse(localStorage.getItem("aromalab_passwords") || "{}")

  if (passwords[email] === password) {
    const user = users.find((u) => u.email === email)
    if (user) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(user))
      return user
    }
  }
  return null
}

export const register = (email: string, password: string, name: string): User | null => {
  initializeUsers()
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
  const passwords = JSON.parse(localStorage.getItem("aromalab_passwords") || "{}")

  if (users.find((u) => u.email === email)) {
    return null // User already exists
  }

  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
    role: "user",
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  passwords[email] = password

  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.setItem("aromalab_passwords", JSON.stringify(passwords))
  localStorage.setItem(AUTH_KEY, JSON.stringify(newUser))

  return newUser
}

export const createUser = (
  email: string,
  password: string,
  name: string,
  role: "admin" | "user" = "user",
): { success: boolean; user?: User; error?: string } => {
  initializeUsers()
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
  const passwords = JSON.parse(localStorage.getItem("aromalab_passwords") || "{}")

  if (users.find((u) => u.email === email)) {
    return { success: false, error: "Un utilisateur avec cet email existe déjà" }
  }

  const newUser: User = {
    id: Date.now().toString(),
    email,
    name,
    role,
    createdAt: new Date().toISOString(),
  }

  users.push(newUser)
  passwords[email] = password

  localStorage.setItem(USERS_KEY, JSON.stringify(users))
  localStorage.setItem("aromalab_passwords", JSON.stringify(passwords))

  return { success: true, user: newUser }
}

export const logout = () => {
  localStorage.removeItem(AUTH_KEY)
}

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem(AUTH_KEY)
  return user ? JSON.parse(user) : null
}

export const getAllUsers = (): User[] => {
  initializeUsers()
  return JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
}

export const updateUser = (userId: string, updates: Partial<User>): boolean => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
  const index = users.findIndex((u) => u.id === userId)

  if (index !== -1) {
    users[index] = { ...users[index], ...updates }
    localStorage.setItem(USERS_KEY, JSON.stringify(users))

    // Update current user if it's the same
    const currentUser = getCurrentUser()
    if (currentUser?.id === userId) {
      localStorage.setItem(AUTH_KEY, JSON.stringify(users[index]))
    }
    return true
  }
  return false
}

export const deleteUser = (userId: string): boolean => {
  const users: User[] = JSON.parse(localStorage.getItem(USERS_KEY) || "[]")
  const filtered = users.filter((u) => u.id !== userId)

  if (filtered.length < users.length) {
    localStorage.setItem(USERS_KEY, JSON.stringify(filtered))
    return true
  }
  return false
}
