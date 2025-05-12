"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField } from "@/components/ui/form-components"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

export default function LoginPapasPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { login } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  })

  // Estado de errores
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Manejar cambios en los campos
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    // Limpiar error cuando el usuario modifica el campo
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  // Validar formulario
  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const result = await login(formData.email, formData.password)

      if (result.success) {
        toast({
          title: "¡Bienvenido! 👋",
          description: "Has iniciado sesión correctamente.",
        })
        router.push("/portal-papas/dashboard")
      } else {
        setErrors({
          general: result.message,
        })
      }
    } catch (error) {
      console.error("Error al iniciar sesión:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al iniciar sesión. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Portal Mamá y Papá 👨‍👩‍👦</CardTitle>
          <CardDescription className="text-center">
            Inicia sesión para acceder a tu evento de baby shower 🎉
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {errors.general && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
                {errors.general} ❌
              </div>
            )}
            <InputField
              id="email"
              label="Email 📧"
              type="email"
              placeholder="tu@email.com"
              required
              value={formData.email}
              onChange={(value) => handleChange("email", value)}
              error={errors.email}
            />
            <InputField
              id="password"
              label="Contraseña 🔒"
              type="password"
              required
              value={formData.password}
              onChange={(value) => handleChange("password", value)}
              error={errors.password}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando sesión...
                </>
              ) : (
                "Iniciar Sesión 🚪"
              )}
            </Button>
            <div className="text-center text-sm">
              ¿No tienes un evento?{" "}
              <Link href="/crear-evento" className="text-pink-600 hover:underline">
                Crear evento ✨
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
