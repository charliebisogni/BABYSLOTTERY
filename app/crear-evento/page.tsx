"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField } from "@/components/ui/form-components"
import { createClientSupabaseClient, hashPassword } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SqlInstructions } from "@/components/sql-instructions"

export default function CrearEventoPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombreEvento: "",
    identificadorPublico: "",
    contrasenaParticipantes: "",
    email: "",
    password: "",
    confirmPassword: "",
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

    if (!formData.nombreEvento.trim()) newErrors.nombreEvento = "El nombre del bebé es requerido"
    if (!formData.identificadorPublico.trim()) newErrors.identificadorPublico = "El identificador público es requerido"
    if (!formData.contrasenaParticipantes.trim())
      newErrors.contrasenaParticipantes = "La contraseña para participantes es requerida"

    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

    if (!formData.password) {
      newErrors.password = "La contraseña es requerida"
    } else if (formData.password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)
    setDebugInfo(null)

    try {
      const supabase = createClientSupabaseClient()

      // Verificar si ya existe un evento con ese email
      const { data: existingEvent, error: checkError } = await supabase
        .from("eventos_bebe")
        .select("id")
        .eq("email_admin", formData.email)
        .maybeSingle()

      if (checkError) {
        setDebugInfo(`Error al verificar email existente: ${JSON.stringify(checkError)}`)
        throw checkError
      }

      if (existingEvent) {
        setErrors({ email: "Ya existe un bebé registrado con este email" })
        setIsSubmitting(false)
        return
      }

      // Crear el nuevo evento
      const hashedPassword = hashPassword(formData.password)
      const hashedParticipantPassword = hashPassword(formData.contrasenaParticipantes)

      // Preparar los datos para insertar
      const eventData = {
        nombre_evento: formData.nombreEvento,
        identificador_publico: formData.identificadorPublico,
        contrasena_participantes_hash: hashedParticipantPassword,
        email_admin: formData.email,
        password_hash: hashedPassword,
        fecha_creacion: new Date().toISOString(),
      }

      // Insertar el nuevo evento
      const { data: newEvent, error: insertError } = await supabase.from("eventos_bebe").insert([eventData]).select()

      if (insertError) {
        setDebugInfo(`Error al insertar evento: ${JSON.stringify(insertError)}`)
        throw insertError
      }

      toast({
        title: "¡Bebé registrado! 🎉",
        description: "Tu bebé ha sido registrado correctamente. Ahora puedes iniciar sesión.",
      })

      // Redirigir a la página de login
      router.push("/login-papas")
    } catch (error: any) {
      console.error("Error al registrar bebé:", error)

      // Mostrar información de depuración más detallada
      if (!debugInfo) {
        setDebugInfo(`Error: ${error.message || JSON.stringify(error)}`)
      }

      toast({
        title: "Error al registrar ❌",
        description: "Hubo un problema al registrar el bebé. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <SqlInstructions />

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Registrar un Nuevo Bebé por Nacer ✨</CardTitle>
          <CardDescription className="text-center">
            Registra tu bebé para comenzar a recibir predicciones 👶
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-3">Información del Bebé</h3>
              <div className="space-y-4">
                <InputField
                  id="nombreEvento"
                  label="Nombre del Bebé 👶"
                  placeholder="Ej: Bebé Pérez 2025"
                  required
                  value={formData.nombreEvento}
                  onChange={(value) => handleChange("nombreEvento", value)}
                  error={errors.nombreEvento}
                />
                <InputField
                  id="identificadorPublico"
                  label="Identificador Público (Nombre y Apellido)"
                  placeholder="Ej: Bebé Juan Pérez"
                  required
                  value={formData.identificadorPublico}
                  onChange={(value) => handleChange("identificadorPublico", value)}
                  error={errors.identificadorPublico}
                />
                <InputField
                  id="contrasenaParticipantes"
                  label="Contraseña para Participantes 🔑"
                  type="password"
                  placeholder="Para compartir con amigos y familiares"
                  required
                  value={formData.contrasenaParticipantes}
                  onChange={(value) => handleChange("contrasenaParticipantes", value)}
                  error={errors.contrasenaParticipantes}
                />
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-3">Cuenta de Administrador</h3>
              <div className="space-y-4">
                <InputField
                  id="email"
                  label="Email del Administrador 📧"
                  type="email"
                  placeholder="tu@email.com"
                  required
                  value={formData.email}
                  onChange={(value) => handleChange("email", value)}
                  error={errors.email}
                />
                <InputField
                  id="password"
                  label="Contraseña de Administrador 🔒"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(value) => handleChange("password", value)}
                  error={errors.password}
                />
                <InputField
                  id="confirmPassword"
                  label="Confirmar Contraseña 🔒"
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(value) => handleChange("confirmPassword", value)}
                  error={errors.confirmPassword}
                />
              </div>
            </div>

            {debugInfo && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-xs overflow-auto max-h-32">
                <p className="font-semibold">Información de depuración:</p>
                <pre>{debugInfo}</pre>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Registrando...
                </>
              ) : (
                "Registrar Bebé ✨"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
