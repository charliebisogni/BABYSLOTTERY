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
import type { DatosRealesBebe } from "@/lib/supabase"
import { calcularPuntuacion, asignarPuntosPorCercania } from "@/lib/utils"

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
  { value: "Niño", label: "Niño" },
  { value: "Niña", label: "Niña" },
]

const opcionesColorPelo = [
  { value: "Rubio", label: "Rubio" },
  { value: "Castaño", label: "Castaño" },
  { value: "Moreno", label: "Moreno" },
  { value: "Pelirrojo", label: "Pelirrojo" },
  { value: "Calvito", label: "Calvito" },
  { value: "Indefinido", label: "Indefinido" },
]

const opcionesPesoUnidad = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
]

export default function AdminPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [datosActuales, setDatosActuales] = useState<DatosRealesBebe | null>(null)
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
      try {
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase.from("datos_reales_bebe").select("*").limit(1).single()

        if (error) throw error

        if (data) {
          setDatosActuales(data)
          setCalculoRealizado(data.calculo_realizado || false)

          // Si hay datos, llenar el formulario
          if (data.fecha_real) {
            setFormData({
              fecha: data.fecha_real,
              hora: data.hora_real || "",
              peso: data.peso_real_valor || undefined,
              pesoUnidad: data.peso_real_unidad || "g",
              longitud: data.longitud_real || undefined,
              colorOjos: data.color_ojos_real || "",
              sexo: data.sexo_real || "",
              colorPelo: data.color_pelo_real || "",
            })
          }
        }
      } catch (error) {
        console.error("Error al cargar datos actuales:", error)
        toast({
          title: "Error",
          description: "No se pudieron cargar los datos actuales.",
          variant: "destructive",
        })
      }
    }

    fetchDatosActuales()
  }, [toast])

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

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      const supabase = createClientSupabaseClient()

      const { error } = await supabase
        .from("datos_reales_bebe")
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
        .eq("id", datosActuales?.id || 1)

      if (error) throw error

      toast({
        title: "Datos guardados",
        description: "Los datos reales del bebé han sido guardados correctamente.",
      })

      // Actualizar datos actuales
      setDatosActuales((prev) => {
        if (!prev) return null
        return {
          ...prev,
          fecha_real: formData.fecha,
          hora_real: formData.hora,
          peso_real_valor: formData.peso,
          peso_real_unidad: formData.pesoUnidad,
          longitud_real: formData.longitud,
          color_ojos_real: formData.colorOjos,
          sexo_real: formData.sexo,
          color_pelo_real: formData.colorPelo || null,
        }
      })
    } catch (error) {
      console.error("Error al guardar datos reales:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al guardar los datos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calcular ganador
  const calcularGanador = async () => {
    if (!datosActuales) return

    setIsCalculating(true)

    try {
      const supabase = createClientSupabaseClient()

      // Obtener todas las predicciones
      const { data: predicciones, error: errorPredicciones } = await supabase.from("predicciones").select("*")

      if (errorPredicciones) throw errorPredicciones

      if (!predicciones || predicciones.length === 0) {
        toast({
          title: "Sin predicciones",
          description: "No hay predicciones para calcular el ganador.",
          variant: "destructive",
        })
        return
      }

      // Calcular puntuación para cada predicción
      let prediccionesConPuntuacion = predicciones.map((prediccion) => ({
        ...prediccion,
        puntuacion: calcularPuntuacion(prediccion, datosActuales),
      }))

      // Asignar puntos adicionales por cercanía en peso y longitud
      prediccionesConPuntuacion = await asignarPuntosPorCercania(prediccionesConPuntuacion, datosActuales)

      // Actualizar puntuaciones en la base de datos
      for (const prediccion of prediccionesConPuntuacion) {
        await supabase.from("predicciones").update({ puntuacion: prediccion.puntuacion }).eq("id", prediccion.id)
      }

      // Marcar cálculo como realizado
      await supabase.from("datos_reales_bebe").update({ calculo_realizado: true }).eq("id", datosActuales.id)

      setCalculoRealizado(true)

      toast({
        title: "Cálculo completado",
        description: "Se ha calculado el ganador correctamente.",
      })

      // Redirigir a la página de resultados
      router.push("/resultados")
    } catch (error) {
      console.error("Error al calcular ganador:", error)
      toast({
        title: "Error",
        description: "Hubo un problema al calcular el ganador. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Panel de Administración</CardTitle>
          <CardDescription className="text-center">
            Ingresa los datos reales del bebé y calcula el ganador
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fecha y hora de nacimiento</h3>
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
              <h3 className="text-lg font-medium">Características físicas</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <NumberWithUnitField
                  id="peso"
                  label="Peso Real al Nacer"
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
                  label="Longitud/Talla Real al Nacer (cm)"
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
                  label="Sexo Real del Bebé"
                  options={opcionesSexo}
                  required
                  value={formData.sexo}
                  onChange={(value) => handleChange("sexo", value)}
                  error={errors.sexo}
                />
                <SelectField
                  id="colorPelo"
                  label="Color de Pelo Real"
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
                "Guardar Datos Reales"
              )}
            </Button>

            <Button
              type="button"
              className="w-full"
              onClick={calcularGanador}
              disabled={isCalculating || calculoRealizado || !datosActuales?.fecha_real}
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculando...
                </>
              ) : calculoRealizado ? (
                "Ganador ya calculado"
              ) : (
                "Guardar Datos y Calcular Ganador"
              )}
            </Button>

            {calculoRealizado && (
              <Button type="button" variant="outline" className="w-full" onClick={() => router.push("/resultados")}>
                Ver Resultados
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
