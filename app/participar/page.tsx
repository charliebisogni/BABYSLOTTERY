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

// Opciones para los selects
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
  { value: "Sorpresa", label: "Sorpresa 🎁" },
]

const opcionesColorPelo = [
  { value: "Rubio", label: "Rubio 👱" },
  { value: "Castaño", label: "Castaño 👩‍🦰" },
  { value: "Moreno", label: "Moreno 🧑‍🦱" },
  { value: "Pelirrojo", label: "Pelirrojo 👨‍🦰" },
  { value: "Calvito", label: "Calvito 👨‍🦲" },
  { value: "Indefinido", label: "Indefinido 🤷" },
]

const opcionesPesoUnidad = [
  { value: "kg", label: "kg" },
  { value: "g", label: "g" },
]

export default function ParticiparPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [bebeSeleccionado, setBebeSeleccionado] = useState<{ id: number; nombre: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
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

  // Verificar si hay un bebé seleccionado en sessionStorage
  useEffect(() => {
    const storedBebe = sessionStorage.getItem("bebeSeleccionado")

    if (storedBebe) {
      try {
        const bebe = JSON.parse(storedBebe)
        setBebeSeleccionado(bebe)
        setLoading(false)
      } catch (error) {
        console.error("Error al parsear el bebé seleccionado:", error)
        router.push("/acceso-participante")
      }
    } else {
      // Si no hay bebé seleccionado, redirigir a la página de acceso
      router.push("/acceso-participante")
    }
  }, [router])

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

    if (!formData.nombre.trim()) newErrors.nombre = "El nombre es requerido"
    if (!formData.email.trim()) {
      newErrors.email = "El email es requerido"
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }

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

  // Enviar formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm() || !bebeSeleccionado) return

    setIsSubmitting(true)

    try {
      const supabase = createClientSupabaseClient()

      console.log("Enviando predicción para el bebé ID:", bebeSeleccionado.id)

      const { error } = await supabase.from("predicciones").insert([
        {
          nombre_participante: formData.nombre,
          email_participante: formData.email,
          fecha_predicha: formData.fecha,
          hora_predicha: formData.hora,
          peso_predicho_valor: formData.peso,
          peso_predicho_unidad: formData.pesoUnidad,
          longitud_predicha: formData.longitud,
          color_ojos_predicho: formData.colorOjos,
          sexo_predicho: formData.sexo,
          color_pelo_predicho: formData.colorPelo || null,
          id_evento_bebe: bebeSeleccionado.id,
        },
      ])

      if (error) throw error

      setSubmitted(true)
      toast({
        title: "¡Predicción enviada! 🎉",
        description: "Tu predicción ha sido registrada correctamente para el bebé " + bebeSeleccionado.nombre,
      })

      // Limpiar el bebé seleccionado de sessionStorage
      sessionStorage.removeItem("bebeSeleccionado")

      // Opcional: redirigir después de un tiempo
      setTimeout(() => {
        router.push("/")
      }, 5000)
    } catch (error) {
      console.error("Error al enviar la predicción:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al enviar tu predicción. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl text-green-600">¡Gracias por participar! 🎉</CardTitle>
            <CardDescription className="text-center">Tu predicción ha sido registrada correctamente.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">Te notificaremos cuando nazca el bebé y tengamos un ganador. 👶📱</p>
            <Button asChild>
              <a href="/">Volver al inicio 🏠</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    )
  }

  if (!bebeSeleccionado) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Acceso no autorizado 🔒</CardTitle>
            <CardDescription className="text-center">
              Debes ingresar el identificador del bebé y la contraseña para participar.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">Por favor, accede con las credenciales proporcionadas por los padres. 🔑</p>
            <Button asChild>
              <a href="/acceso-participante">Ir a la página de acceso 🚪</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="text-center text-2xl">Haz tu predicción ✍️</CardTitle>
          <CardDescription className="text-center">
            Completa el formulario con tus predicciones para {bebeSeleccionado.nombre} 👶
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Tus datos 📝</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InputField
                  id="nombre"
                  label="Nombre"
                  required
                  value={formData.nombre}
                  onChange={(value) => handleChange("nombre", value)}
                  error={errors.nombre}
                />
                <InputField
                  id="email"
                  label="Email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(value) => handleChange("email", value)}
                  error={errors.email}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium">Fecha y hora de nacimiento 📅⏰</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DateField
                  id="fecha"
                  label="Fecha de Nacimiento"
                  required
                  value={formData.fecha}
                  onChange={(value) => handleChange("fecha", value)}
                  error={errors.fecha}
                />
                <TimeField
                  id="hora"
                  label="Hora de Nacimiento"
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
                  label="Peso al Nacer ⚖️"
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
                  label="Longitud/Talla al Nacer (cm) 📏"
                  type="number"
                  required
                  value={formData.longitud === undefined ? "" : formData.longitud}
                  onChange={(value) => handleChange("longitud", Number.parseFloat(value))}
                  error={errors.longitud}
                />
                <SelectField
                  id="colorOjos"
                  label="Color de Ojos"
                  options={opcionesColorOjos}
                  required
                  value={formData.colorOjos}
                  onChange={(value) => handleChange("colorOjos", value)}
                  error={errors.colorOjos}
                />
                <SelectField
                  id="sexo"
                  label="Sexo del Bebé 👶"
                  options={opcionesSexo}
                  required
                  value={formData.sexo}
                  onChange={(value) => handleChange("sexo", value)}
                  error={errors.sexo}
                />
                <SelectField
                  id="colorPelo"
                  label="Color de Pelo 💇"
                  options={opcionesColorPelo}
                  value={formData.colorPelo}
                  onChange={(value) => handleChange("colorPelo", value)}
                  className="md:col-span-2"
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar mi Predicción 🎯"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
