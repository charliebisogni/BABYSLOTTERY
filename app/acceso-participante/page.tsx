"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField } from "@/components/ui/form-components"
import { createClientSupabaseClient, verifyPassword } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { SqlInstructions } from "@/components/sql-instructions"

export default function AccesoParticipantePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSqlInstructions, setShowSqlInstructions] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    identificadorPublico: "",
    contrasenaParticipantes: "",
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

    if (!formData.identificadorPublico.trim()) newErrors.identificadorPublico = "El identificador del bebé es requerido"
    if (!formData.contrasenaParticipantes.trim()) newErrors.contrasenaParticipantes = "La contraseña es requerida"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const supabase = createClientSupabaseClient()
      let bebe = null
      let error = null
      let columnaContrasenaNueva = false

      // Primero intentamos buscar por identificador_publico (nueva columna)
      try {
        const result = await supabase
          .from("eventos_bebe")
          .select("id, nombre_evento, contrasena_participantes_hash, calculo_realizado")
          .eq("identificador_publico", formData.identificadorPublico)
          .single()

        if (result.data) {
          bebe = result.data
          error = null
          columnaContrasenaNueva = true
        } else {
          error = result.error
        }
      } catch (e) {
        console.error("Error al buscar por identificador_publico:", e)
        // Si hay un error aquí, probablemente es porque la columna no existe
        setShowSqlInstructions(true)
      }

      // Si no encontramos por identificador_publico, intentamos buscar por nombre_evento
      if (!bebe) {
        try {
          const result = await supabase
            .from("eventos_bebe")
            .select("id, nombre_evento, password_hash, contrasena_participantes_hash, calculo_realizado")
            .eq("nombre_evento", formData.identificadorPublico)
            .single()

          if (result.data) {
            bebe = result.data
            error = null
            // Verificamos si existe la columna contrasena_participantes_hash
            columnaContrasenaNueva = !!result.data.contrasena_participantes_hash
          } else {
            error = result.error
          }
        } catch (e) {
          console.error("Error al buscar por nombre_evento:", e)
          error = e
        }
      }

      if (error && error.code !== "PGRST116") {
        console.error("Error al buscar bebé:", error)
        throw error
      }

      if (!bebe) {
        setErrors({ general: "Identificador del bebé o contraseña incorrectos" })
        setIsSubmitting(false)
        return
      }

      // Verificar si el bebé ya tiene resultados calculados
      if (bebe.calculo_realizado) {
        setErrors({ general: "Este bebé ya nació y no acepta más predicciones" })
        setIsSubmitting(false)
        return
      }

      // Verificar la contraseña
      let passwordValid = false

      // Si tenemos la nueva columna, verificamos con contrasena_participantes_hash
      if (columnaContrasenaNueva && bebe.contrasena_participantes_hash) {
        passwordValid = verifyPassword(formData.contrasenaParticipantes, bebe.contrasena_participantes_hash)
      }
      // Si no tenemos la nueva columna o está vacía, usamos password_hash como fallback
      else if (bebe.password_hash) {
        passwordValid = verifyPassword(formData.contrasenaParticipantes, bebe.password_hash)
      }

      if (!passwordValid) {
        setErrors({ general: "Identificador del bebé o contraseña incorrectos" })
        setIsSubmitting(false)
        return
      }

      // Guardar el ID del bebé en sessionStorage para usarlo en la página de participación
      sessionStorage.setItem(
        "bebeSeleccionado",
        JSON.stringify({
          id: bebe.id,
          nombre: bebe.nombre_evento,
        }),
      )

      // Redirigir a la página de participación
      router.push("/participar")
    } catch (error) {
      console.error("Error al verificar acceso:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al verificar tus datos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      {showSqlInstructions && <SqlInstructions />}

      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Acceso para Participantes 🎮</CardTitle>
          <CardDescription className="text-center">
            Ingresa el identificador del bebé y la contraseña proporcionada por los padres
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
              id="identificadorPublico"
              label="Nombre y Apellido del Bebé"
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
              placeholder="Proporcionada por los padres"
              required
              value={formData.contrasenaParticipantes}
              onChange={(value) => handleChange("contrasenaParticipantes", value)}
              error={errors.contrasenaParticipantes}
            />
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                "Participar 🎯"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
