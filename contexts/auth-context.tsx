"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient, verifyPassword, type EventoBebe } from "@/lib/supabase"

type AuthContextType = {
  user: EventoBebe | null
  loading: boolean
  login: (email: string, password: string) => Promise<{ success: boolean; message: string }>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<EventoBebe | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Verificar si hay una sesión activa al cargar
  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedUser = localStorage.getItem("babyLotteryUser")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Error al verificar sesión:", error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setLoading(true)
      const supabase = createClientSupabaseClient()

      // Buscar el usuario por email
      const { data, error } = await supabase.from("eventos_bebe").select("*").eq("email_admin", email).single()

      if (error || !data) {
        return { success: false, message: "Usuario no encontrado" }
      }

      // Verificar la contraseña
      if (!verifyPassword(password, data.password_hash)) {
        return { success: false, message: "Contraseña incorrecta" }
      }

      // Guardar el usuario en el estado y localStorage
      setUser(data)
      localStorage.setItem("babyLotteryUser", JSON.stringify(data))

      return { success: true, message: "Inicio de sesión exitoso" }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      return { success: false, message: "Error al iniciar sesión" }
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("babyLotteryUser")
    router.push("/")
  }

  const value = {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider")
  }
  return context
}
