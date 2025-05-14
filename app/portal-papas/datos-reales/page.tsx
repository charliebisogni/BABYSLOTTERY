"use client"

import type React from "react" // No es estrictamente necesario si no usas React.FC o similar
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
import { calcularPuntuacion, asignarPuntosPorCercania } from "@/lib/utils" // Asumimos que estas funciones existen y son correctas
import { sendEmail } from "@/components/notification-toast"

// Opciones para los selects (deberían ser las mismas que en otras partes)
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
  console.log("[Datos Reales Page] Renderizando página.");
  const router = useRouter()
  const { toast } = useToast()
  const { user, refreshAuthUser } = useAuth() // Asumo que podrías tener refreshAuthUser o similar si actualizas 'user'
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isCalculating, setIsCalculating] = useState(false)
  const [calculoRealizado, setCalculoRealizado] = useState(user?.calculo_realizado || false)

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

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    console.log("[Datos Reales Page] useEffect ejecutándose. User:", user);
    const fetchDatosActuales = async () => {
      if (!user) {
        console.log("[Datos Reales Page] No hay usuario, saliendo de fetchDatosActuales.");
        return;
      }
      console.log("[Datos Reales Page] Usuario existe, intentando cargar datos actuales. Calculo realizado:", user.calculo_realizado);

      try {
        // Si los datos ya están en el objeto user (del contexto), usarlos
        if (user.fecha_real) { // Usamos fecha_real como indicador de que los datos ya se cargaron/guardaron
          console.log("[Datos Reales Page] Cargando datos desde el objeto user del contexto.");
          setFormData({
            fecha: user.fecha_real || "",
            hora: user.hora_real || "",
            peso: user.peso_real_valor || undefined,
            pesoUnidad: user.peso_real_unidad || "g",
            longitud: user.longitud_real || undefined,
            colorOjos: user.color_ojos_real || "",
            sexo: user.sexo_real || "",
            colorPelo: user.color_pelo_real || "",
          })
          setCalculoRealizado(user.calculo_realizado || false)
        } else {
           // Opcionalmente, podrías cargar desde DB si el objeto user no está completo,
           // pero el refreshAuthUser debería manejar esto al actualizar el user.
           console.log("[Datos Reales Page] No hay datos reales en el objeto user, esperando entrada manual.");
        }
      } catch (error) {
        console.error("[Datos Reales Page] Error al cargar datos actuales:", error)
        toast({
          title: "Error ❌",
          description: "No se pudieron cargar los datos actuales.",
          variant: "destructive",
        })
      }
    }

    fetchDatosActuales()
  }, [user]) // Solo depende de user. 'toast' es estable.

  const handleChange = (field: string, value: string | number) => {
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
    if (!formData.fecha) newErrors.fecha = "La fecha es requerida"
    if (!formData.hora) newErrors.hora = "La hora es requerida"
    if (formData.peso === undefined) newErrors.peso = "El peso es requerido"
    else if (formData.peso <= 0) newErrors.peso = "El peso debe ser mayor a 0"
    if (formData.longitud === undefined) newErrors.longitud = "La longitud es requerida"
    else if (formData.longitud <= 0) newErrors.longitud = "La longitud debe ser mayor a 0"
    if (!formData.colorOjos) newErrors.colorOjos = "El color de ojos es requerido"
    if (!formData.sexo) newErrors.sexo = "El sexo es requerido"
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm() || !user) return
    setIsSubmitting(true)
    console.log("[Datos Reales Page] Guardando datos reales del bebé ID:", user.id);

    try {
      const supabase = createClientSupabaseClient()
      const updates = {
        fecha_real: formData.fecha,
        hora_real: formData.hora,
        peso_real_valor: formData.peso,
        peso_real_unidad: formData.pesoUnidad,
        longitud_real: formData.longitud,
        color_ojos_real: formData.colorOjos,
        sexo_real: formData.sexo,
        color_pelo_real: formData.colorPelo || null,
        // No actualizamos calculo_realizado aquí, se hace en calcularGanador
      }

      const { error } = await supabase
        .from("eventos_bebe")
        .update(updates)
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "Datos guardados ✅",
        description: "Los datos reales del bebé han sido guardados correctamente.",
      })

      // Actualizar datos del usuario en el contexto para reflejar los cambios
      if (refreshAuthUser) { // Suponiendo que tienes una función para refrescar el usuario del contexto
        await refreshAuthUser();
      } else if (user) { // Fallback si no hay refreshAuthUser
         Object.assign(user, updates); // No ideal, no causa re-render en otros componentes
      }


    } catch (error) {
      console.error("[Datos Reales Page] Error al guardar datos reales:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al guardar los datos. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const calcularGanador = async () => {
    if (!user || !user.id || !user.fecha_real) { // Asegurar que hay datos reales guardados
        toast({
            title: "Faltan datos ⚠️",
            description: "Primero debes guardar los datos reales del bebé.",
            variant: "destructive",
        });
        return;
    }

    setIsCalculating(true)
    console.log("[Datos Reales Page] Calculando ganador para el bebé ID:", user.id);

    try {
      const supabase = createClientSupabaseClient()

      const { data: predicciones, error: errorPredicciones } = await supabase
        .from("predicciones")
        .select("*")
        .eq("id_evento_bebe", user.id)

      if (errorPredicciones) throw errorPredicciones

      console.log(`[Datos Reales Page] Se encontraron ${predicciones?.length || 0} predicciones para este bebé`)

      if (!predicciones || predicciones.length === 0) {
        toast({
          title: "Sin predicciones ⚠️",
          description: "No hay predicciones para calcular el ganador.",
          variant: "destructive",
        })
        setIsCalculating(false)
        return
      }

      let prediccionesConPuntuacion = predicciones.map((prediccion) => ({
        ...prediccion,
        puntuacion: calcularPuntuacion(prediccion, user), // user aquí ya debería tener los datos reales
      }))

      console.log("[Datos Reales Page] Puntuaciones iniciales calculadas")
      prediccionesConPuntuacion = await asignarPuntosPorCercania(prediccionesConPuntuacion, user)
      console.log("[Datos Reales Page] Puntos adicionales asignados por cercanía")

      for (const prediccion of prediccionesConPuntuacion) {
        await supabase.from("predicciones").update({ puntuacion: prediccion.puntuacion }).eq("id", prediccion.id)
      }
      console.log("[Datos Reales Page] Puntuaciones actualizadas en la base de datos")

      await supabase.from("eventos_bebe").update({ calculo_realizado: true }).eq("id", user.id)
      setCalculoRealizado(true)
      if (user) user.calculo_realizado = true; // Actualizar el estado local del user también
      if (refreshAuthUser) await refreshAuthUser();


      toast({
        title: "Cálculo completado 🎉",
        description: "Se ha calculado el ganador correctamente.",
      })

      const ganador = prediccionesConPuntuacion.sort((a, b) => b.puntuacion - a.puntuacion)[0]

      if (ganador) {
        console.log("[Datos Reales Page] Ganador encontrado:", ganador.nombre_participante);
        console.log("[Datos Reales Page] A PUNTO DE LLAMAR a sendEmail para el GANADOR...");
        try {
            const emailWinnerSent = await sendEmail({
                endpoint: "/api/send-winner-email", // Endpoint para el correo del ganador
                data: {
                id_bebe: user.id,
                email_ganador: ganador.email_participante,
                nombre_ganador: ganador.nombre_participante,
                nombre_bebe_identificador: user.identificador_publico || user.nombre_evento || "tu Bebé",
                },
                successMessage: `Hemos notificado a ${ganador.nombre_participante} sobre su victoria 🏆`,
                errorMessage: "No pudimos enviar la notificación al ganador, pero los resultados están disponibles.",
            });
            console.log("[Datos Reales Page] Resultado de sendEmail (ganador):", emailWinnerSent);
        } catch (emailError) {
            console.error("[Datos Reales Page] Error capturado al llamar a sendEmail (ganador):", emailError);
        }
      } else {
        console.log("[Datos Reales Page] No se encontró un ganador claro (podría ser un empate no manejado o sin predicciones).");
      }

      // Enviar correos con resultados a todos los participantes (LO DEJAREMOS PENDIENTE POR AHORA)
      // console.log("[Datos Reales Page] A PUNTO DE LLAMAR a sendEmail para TODOS los participantes...");
      // try {
      //   const emailResultsSent = await sendEmail({
      //     endpoint: "/api/send-results-email", // Necesitaremos crear este endpoint y su función
      //     data: {
      //       id_bebe: user.id,
      //     },
      //     successMessage: "Hemos enviado los resultados a todos los participantes 👶",
      //     errorMessage: "No pudimos enviar los resultados a todos los participantes.",
      //   });
      //   console.log("[Datos Reales Page] Resultado de sendEmail (todos los resultados):", emailResultsSent);
      // } catch (emailError) {
      //    console.error("[Datos Reales Page] Error capturado al llamar a sendEmail (todos los resultados):", emailError);
      // }
      
      // Considera no redirigir automáticamente para que el admin vea los toasts
      // router.push(`/evento/${user.id}/resultados`) 

    } catch (error) {
      console.error("[Datos Reales Page] Error al calcular ganador:", error)
      toast({
        title: "Error ❌",
        description: "Hubo un problema al calcular el ganador. Por favor, intenta nuevamente.",
        variant: "destructive",
      })
    } finally {
      setIsCalculating(false)
    }
  }

  if (!user) {
    // Podrías mostrar un spinner aquí o un mensaje, o ProtectedRoute ya lo maneja
    console.log("[Datos Reales Page] Esperando al usuario del contexto...");
    return <div className="container mx-auto px-4 py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-pink-600" /></div>;
  }
  
  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Datos Reales del Bebé de {user.nombre_evento} 👶</CardTitle>
            <CardDescription className="text-center">
              Ingresa los datos reales del bebé y calcula el ganador 🏆
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* ... (resto de tus InputFields, DateField, TimeField, SelectField, NumberWithUnitField sin cambios) ... */}
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
                    step="0.1" // Permitir decimales
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
                    className="md:col-span-2" // Asumiendo que quieres que ocupe dos columnas si es el último
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={isSubmitting || calculoRealizado}>
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</>
                ) : calculoRealizado ? (
                  "Datos Reales ya Guardados ✅"
                ) : (
                  "Guardar Datos Reales 💾"
                )}
              </Button>

              <Button
                type="button"
                className="w-full"
                onClick={calcularGanador}
                disabled={isCalculating || calculoRealizado || !user.fecha_real /* Solo habilitar si hay datos reales guardados */}
              >
                {isCalculating ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando...</>
                ) : calculoRealizado ? (
                  "Ganador ya calculado ✅"
                ) : (
                  "Calcular Ganador y Notificar 🏆"
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