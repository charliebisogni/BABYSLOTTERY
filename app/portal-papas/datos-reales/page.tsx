"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { InputField, SelectField, DateField, TimeField, NumberWithUnitField } from "@/components/ui/form-components"
import { createClientSupabaseClient } from "@/lib/supabase"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { ProtectedRoute } from "@/components/protected-route"
import { calcularPuntuacion, asignarPuntosPorCercania } from "@/lib/utils"
// Importar la función sendEmail
import { sendEmail } from "@/components/notification-toast"

// Opciones para los selects (igual que en la página de participación)
const opcionesColorOjos = [
  { value: "Azul", label: "Azul" },
  { value: "Verde", label: "Verde" },
  { value: "Marrón", label: "Marrón" },
  { value: "Gris", label: "Gris" },
  { value: "Avellana", label: "Avellana" },
  { value: "Indefinido", label: "Indefinido" },
]

const opcionesSexo = [
  { value: "Niño", label: "Niño 👦" },
  { value: "Niña", label: "Niña 👧" },
]

const opcionesColorPelo = [
  { value: "Rubio", label: "Rubio 👱" },
  { value: "Castaño", label: "Castaño 👩‍🦱" },
  { value: "Moreno", label: "Moreno 🧑‍🦱" },
  { value: "Pelirrojo", label: "Pelirrojo 👨‍🦰" },
  { value: "Calvito", label: "Calvito 👨‍🦲" },
  { value: "Indefinido", label: "Indefinido 🤷" },
]

const opcionesPesoUnidad = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
]

export default function DatosRealesPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculoRealizado, setCalculoRealizado] = useState(false)

  // Estado del formulario
  const [formData, setFormData] = useState({
    fecha: "",
    hora: "",
    peso: undefined as number | undefined,
    pesoUnidad: "g",
    longitud: undefined as number | undefined,
    colorOjos: "",
    sexo: "",
    colorPelo: "",
  })

  // Estado de errores
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Cargar datos actuales si existen
  useEffect(() => {
    const fetchDatosActuales = async () => {
      if (!user) return

      try {
        // Verificar si ya hay datos reales
        if (
          user.fecha_real &&
          user.hora_real &&
          user.peso_real_valor &&
          user.longitud_real &&
          user.color_ojos_real &&
          user.sexo_real
        ) {
          setFormData({
            fecha: user.fecha_real,
            hora: user.hora_real,
            peso: user.peso_real_valor,
            pesoUnidad: user.peso_real_unidad || "g",
            longitud: user.longitud_real,
            colorOjos: user.color_ojos_real,
            sexo: user.sexo_real,
            colorPelo: user.color_pelo_real || "",
          })
          setCalculoRealizado(user.calculo_realizado || false)
        }
      } catch (error) {
        console.error("Error al cargar datos actuales:", error)
        toast({
          title: "Error ❌",
          description: "No se pudieron cargar los datos actuales.",
          variant: "destructive",
        })
      }
    }

    fetchDatosActuales()
  }, [user, toast])

  // Manejar cambios en los campos
  const handleChange = (field: string, value: string | number) => {
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

    if (!formData.fecha) newErrors.fecha = "La fecha es requerida"
    if (!formData.hora) newErrors.hora = "La hora es requerida"

    if (formData.peso === undefined) {
      newErrors.peso = "El peso es requerido"
    } else if (formData.peso <= 0) {
      newErrors.peso = "El peso debe ser mayor a 0"
    }

    if (formData.longitud === undefined) {
      newErrors.longitud = "La longitud es requerida"
    } else if (formData.longitud <= 0) {
      newErrors.longitud = "La longitud debe ser mayor a 0"
    }

    if (!formData.colorOjos) newErrors.colorOjos = "El color de ojos es requerido"
    if (!formData.sexo) newErrors.sexo = "El sexo es requerido"

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Guardar datos reales
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !user) return

    setIsSubmitting(true)

    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase
        .from("eventos_bebe")
        .update({
          fecha_real: formData.fecha,
          hora_real: formData.hora,
          peso_real_valor: formData.peso,
          peso_real_unidad: formData.pesoUnidad,
          longitud_real: formData.longitud,
          color_ojos_real: formData.colorOjos,
          sexo_real: formData.sexo,
          color_pelo_real: formData.colorPelo || null,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Datos guardados ✅",
        description: "Los datos reales del bebé han sido guardados correctamente.",
      })

      // Actualizar datos del usuario en el contexto
      if (user) {
        user.fecha_real = formData.fecha
        user.hora_real = formData.hora
        user.peso_real_valor = formData.peso
        user.peso_real_unidad = formData.pesoUnidad as "kg" | "g"
        user.longitud_real = formData.longitud
        user.color_ojos_real = formData.colorOjos
        user.sexo_real = formData.sexo
        user.color_pelo_real = formData.colorPelo || null
      }
    } catch (error) {
      console.error("Error al guardar datos reales:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al guardar los datos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular ganador
  const calcularGanador = async () => {
    if (!user) return

    setIsCalculating(true)

    try {
      const supabase = createClientSupabaseClient()

      console.log("Calculando ganador para el bebé ID:", user.id)

      // Obtener todas las predicciones para este evento
      const { data: predicciones, error: errorPredicciones } = await supabase
        .from("predicciones")
        .select("*")
        .eq("id_evento_bebe", user.id)

      if (errorPredicciones) throw errorPredicciones

      console.log(`Se encontraron ${predicciones?.length || 0} predicciones para este bebé`)

      if (!predicciones || predicciones.length === 0) {
        toast({
          title: "Sin predicciones ⚠️",
          description: "No hay predicciones para calcular el ganador.",
          variant: "destructive",
        })
        setIsCalculating(false)
        return
      }

      // Calcular puntuación para cada predicción
      let prediccionesConPuntuacion = predicciones.map((prediccion) => ({
        ...prediccion,
        puntuacion: calcularPuntuacion(prediccion, user),
      }))

      console.log("Puntuaciones iniciales calculadas")

      // Asignar puntos adicionales por cercanía en peso y longitud
      prediccionesConPuntuacion = await asignarPuntosPorCercania(prediccionesConPuntuacion, user)

      console.log("Puntos adicionales asignados por cercanía")

      // Actualizar puntuaciones en la base de datos
      for (const prediccion of prediccionesConPuntuacion) {
        await supabase.from("predicciones").update({ puntuacion: prediccion.puntuacion }).eq("id", prediccion.id)
      }

      console.log("Puntuaciones actualizadas en la base de datos")

      // Marcar cálculo como realizado
      await supabase.from("eventos_bebe").update({ calculo_realizado: true }).eq("id", user.id)

      setCalculoRealizado(true)
      user.calculo_realizado = true

      toast({
        title: "Cálculo completado 🎉",
        description: "Se ha calculado el ganador correctamente.",
      })

      // Obtener el ganador (la primera predicción ordenada por puntuación)
      const ganador = prediccionesConPuntuacion.sort((a, b) => b.puntuacion - a.puntuacion)[0]

      if (ganador) {
        // Enviar correo al ganador
        await sendEmail({
          endpoint: "/api/send-winner-email",
          data: {
            id_bebe: user.id,
            email_ganador: ganador.email_participante,
            nombre_ganador: ganador.nombre_participante,
            nombre_bebe_identificador: user.identificador_publico || user.nombre_evento,
          },
          successMessage: "Hemos notificado al ganador sobre su victoria 🏆",
          errorMessage: "No pudimos enviar la notificación al ganador, pero los resultados están disponibles",
        })
      }

      // Enviar correos con resultados a todos los participantes
      await sendEmail({
        endpoint: "/api/send-results-email",
        data: {
          id_bebe: user.id,
        },
        successMessage: "Hemos enviado los resultados a todos los participantes 👶",
        errorMessage:
          "No pudimos enviar los resultados a todos los participantes, pero están disponibles en la plataforma",
      })

      // Redirigir a la página de resultados
      router.push(`/evento/${user.id}/resultados`)
    } catch (error) {
      console.error("Error al calcular ganador:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al calcular el ganador. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Datos Reales del Bebé 👶</CardTitle>
            <CardDescription className="text-center">
              Ingresa los datos reales del bebé y calcula el ganador 🏆
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Fecha y hora de nacimiento 📅⏰</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <DateField
                    id="fecha"
                    label="Fecha Real de Nacimiento"
                    required
                    value={formData.fecha}
                    onChange={(value) => handleChange("fecha", value)}
                    error={errors.fecha}
                  />
                  <TimeField
                    id="hora"
                    label="Hora Real de Nacimiento"
                    required
                    value={formData.hora}
                    onChange={(value) => handleChange("hora", value)}
                    error={errors.hora}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium">Características físicas 👶</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <NumberWithUnitField
                    id="peso"
                    label="Peso Real al Nacer ⚖️"
                    units={opcionesPesoUnidad}
                    required
                    value={formData.peso}
                    unitValue={formData.pesoUnidad}
                    onValueChange={(value) => handleChange("peso", value)}
                    onUnitChange={(value) => handleChange("pesoUnidad", value)}
                    error={errors.peso}
                  />
                  <InputField
                    id="longitud"
                    label="Longitud/Talla Real al Nacer (cm) 📏"
                    type="number"
                    required
                    value={formData.longitud === undefined ? "" : formData.longitud}
                    onChange={(value) => handleChange("longitud", Number.parseFloat(value))}
                    error={errors.longitud}
                  />
                  <SelectField
                    id="colorOjos"
                    label="Color de Ojos Real"
                    options={opcionesColorOjos}
                    required
                    value={formData.colorOjos}
                    onChange={(value) => handleChange("colorOjos", value)}
                    error={errors.colorOjos}
                  />
                  <SelectField
                    id="sexo"
                    label="Sexo Real del Bebé 👶"
                    options={opcionesSexo}
                    required
                    value={formData.sexo}
                    onChange={(value) => handleChange("sexo", value)}
                    error={errors.sexo}
                  />
                  <SelectField
                    id="colorPelo"
                    label="Color de Pelo Real 💇"
                    options={opcionesColorPelo}
                    value={formData.colorPelo}
                    onChange={(value) => handleChange("colorPelo", value)}
                    className="md:col-span-2"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar Datos Reales 💾"
                )}
              </Button>

              <Button
                type="button"
                className="w-full"
                onClick={calcularGanador}
                disabled={isCalculating || calculoRealizado || !user.fecha_real}
              >
                {isCalculating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Calculando...
                  </>
                ) : calculoRealizado ? (
                  "Ganador ya calculado ✅"
                ) : (
                  "Guardar Datos y Calcular Ganador 🏆"
                )}
              </Button>

              {calculoRealizado && (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push(`/evento/${user.id}/resultados`)}
                >
                  Ver Resultados 🔍
                </Button>
              )}
            </CardFooter>
          </form>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
