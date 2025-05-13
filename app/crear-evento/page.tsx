"use client"

import type React from "react"
import { useState, useEffect } from "react" // useEffect no se usa actualmente, se puede quitar si no hay otra lógica de carga
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField } from "@/components/ui/form-components"
import { createClientSupabaseClient, hashPassword } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
// import { SqlInstructions } from "@/components/sql-instructions" // MANTENEMOS ESTO COMENTADO/ELIMINADO
import { sendEmail } from "@/components/notification-toast"

export default function CrearEventoPage() {
  console.log("[Crear Evento Page] Renderizando página (versión post-conflicto, con SqlInstructions desactivado)."); 

  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  // const [debugInfo, setDebugInfo] = useState<string | null>(null); // Descomentar para depuración avanzada del submit

  const [formData, setFormData] = useState({
    nombreEvento: "",
    identificadorPublico: "",
    contrasenaParticipantes: "",
    email: "",
    password: "",
    confirmPassword: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsSubmitting(true)
    // setDebugInfo(null); // Si usas debugInfo

    try {
      const supabase = createClientSupabaseClient()

      const { data: existingEvent, error: checkError } = await supabase
        .from("eventos_bebe")
        .select("id")
        .eq("email_admin", formData.email)
        .maybeSingle()

      if (checkError && checkError.code !== "PGRST116") {
        console.error("[Crear Evento] Error verificando email existente:", checkError);
        throw checkError
      }

      if (existingEvent) {
        console.log("[Crear Evento] Email ya registrado:", formData.email);
        setErrors({ email: "Ya existe un bebé registrado con este email" })
        setIsSubmitting(false)
        return
      }

      const hashedPasswordAdmin = await hashPassword(formData.password);
      const hashedPasswordParticipant = await hashPassword(formData.contrasenaParticipantes);

      const eventDataToInsert = {
        nombre_evento: formData.nombreEvento,
        identificador_publico: formData.identificadorPublico,
        contrasena_participantes_hash: hashedPasswordParticipant,
        email_admin: formData.email,
        password_hash: hashedPasswordAdmin,
        // fecha_creacion: new Date().toISOString(), // Supabase puede manejar esto automáticamente con un DEFAULT now() en la DB
      }
      
      console.log("[Crear Evento] Registrando bebé con datos (sin hashes):", {
        nombre_evento: eventDataToInsert.nombre_evento,
        identificador_publico: eventDataToInsert.identificador_publico,
        email_admin: eventDataToInsert.email_admin,
      });

      const { data: newEventData, error: insertError } = await supabase
        .from("eventos_bebe")
        .insert([eventDataToInsert])
        .select()
        .single(); 

      if (insertError) {
        console.error("[Crear Evento] Error al insertar nuevo bebé:", insertError);
        throw insertError
      }

      if (!newEventData) {
        console.error("[Crear Evento] No se recibieron datos después de registrar el bebé.");
        throw new Error("No se recibieron datos después de registrar el bebé")
      }
      
      console.log("[Crear Evento] Bebé registrado con éxito:", newEventData);

      toast({
        title: "¡Bebé registrado! 🎉",
        description: `El bebé "${formData.nombreEvento}" ha sido registrado correctamente.`,
      })

      // Enviar correo de bienvenida
      console.log("[Crear Evento] A punto de llamar a sendEmail...");
      try {
        const emailSent = await sendEmail({
          endpoint: "/api/send-welcome-email",
          data: {
            email_padres: formData.email,
            nombre_bebe_identificador: formData.identificadorPublico,
          },
          successMessage: "Te hemos enviado un correo de bienvenida con los detalles 📧",
          errorMessage: "No pudimos enviar el correo de bienvenida, pero tu bebé ha sido registrado.",
        })
        console.log("[Crear Evento] Resultado de sendEmail:", emailSent);
      } catch (emailError) {
        console.error("[Crear Evento] Error capturado al llamar a sendEmail:", emailError);
      }
      
      console.log("[Crear Evento] A punto de redirigir a /login-papas");
      router.push("/login-papas")

    } catch (error: any) {
      console.error("[Crear Evento] Error principal en handleSubmit:", error)
      toast({
        title: "Error al Registrar ❌",
        description: error.message || "Hubo un problema al registrar el bebé. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      // Pequeña verificación para evitar actualizar estado en componente desmontado si la redirección es muy rápida
      // aunque el error #321 original no debería ser por esto si sendEmail ya no usa useToast()
      if (typeof setIsSubmitting === 'function') { 
          setIsSubmitting(false)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {/* <SqlInstructions /> */} {/* La línea del componente de instrucciones SQL está comentada/eliminada */}
      
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

            {/* {debugInfo && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-xs overflow-auto max-h-32">
                <p className="font-semibold">Información de depuración:</p>
                <pre>{debugInfo}</pre>
              </div>
            )}
            */}
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