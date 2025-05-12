"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClientSupabaseClient } from "@/lib/supabase"
import { formatearFecha, formatearHora } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Trophy, Medal, Award, Loader2 } from "lucide-react"

interface ResultadosPageProps {
  params: {
    id: string
  }
}

export default function ResultadosPage({ params }: ResultadosPageProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [evento, setEvento] = useState<any>(null)
  const [predicciones, setPredicciones] = useState<any[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Verificar si el usuario está autorizado para ver estos resultados
        const bebeAutorizado = sessionStorage.getItem("bebeResultadosAutorizado")

        if (!bebeAutorizado) {
          // Si no hay autorización, redirigir a la página de acceso
          router.push("/acceso-resultados")
          return
        }

        const { id } = JSON.parse(bebeAutorizado)

        // Verificar que el ID autorizado coincide con el ID de la URL
        if (id.toString() !== params.id) {
          // Si no coincide, redirigir a la página de acceso
          router.push("/acceso-resultados")
          return
        }

        // Si está autorizado, cargar los datos
        await loadData()
      } catch (error) {
        console.error("Error al verificar autorización:", error)
        router.push("/acceso-resultados")
      }
    }

    const loadData = async () => {
      try {
        setLoading(true)
        const supabase = createClientSupabaseClient()

        // Obtener el evento
        const { data: eventoData, error: eventoError } = await supabase
          .from("eventos_bebe")
          .select("*")
          .eq("id", params.id)
          .single()

        if (eventoError) {
          throw eventoError
        }

        if (!eventoData) {
          setError("No se encontró el evento")
          setLoading(false)
          return
        }

        setEvento(eventoData)

        // Obtener las predicciones
        const { data: prediccionesData, error: prediccionesError } = await supabase
          .from("predicciones")
          .select("*")
          .eq("id_evento_bebe", params.id)
          .order("puntuacion", { ascending: false })

        if (prediccionesError) {
          throw prediccionesError
        }

        setPredicciones(prediccionesData || [])
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar datos:", error)
        setError("Hubo un problema al cargar los datos")
        setLoading(false)
      }
    }

    checkAuthorization()
  }, [params.id, router])

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12 flex justify-center items-center">
        <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Error</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild>
              <Link href="/">Volver al inicio 🏠</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const hayResultados = evento?.calculo_realizado && evento?.fecha_real
  const top3 = predicciones.slice(0, 3)
  const ganador = top3.length > 0 ? top3[0] : null

  if (!hayResultados) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Resultados de {evento?.nombre_evento} 👶</CardTitle>
            <CardDescription className="text-center">Aún no hay resultados disponibles ⏳</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              Los resultados estarán disponibles una vez que nazca el bebé y se calculen los ganadores. 🏆
            </p>
            <Button asChild>
              <Link href="/">Volver al inicio 🏠</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto space-y-8">
        <Card className="bg-gradient-to-r from-pink-50 to-blue-50">
          <CardHeader>
            <CardTitle className="text-center text-3xl text-pink-600">¡{evento.nombre_evento} ya nació! 👶</CardTitle>
            <CardDescription className="text-center text-lg">
              Es un{evento.sexo_real === "Niño" ? "a" : ""} {evento.sexo_real}{" "}
              {evento.sexo_real === "Niño" ? "👦" : "👧"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="font-medium text-lg text-pink-600">Fecha y Hora 📅⏰</h3>
                <p>
                  <span className="font-medium">Fecha:</span> {formatearFecha(evento.fecha_real)}
                </p>
                <p>
                  <span className="font-medium">Hora:</span> {formatearHora(evento.hora_real)}
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-medium text-lg text-pink-600">Características 👶</h3>
                <p>
                  <span className="font-medium">Peso:</span> {evento.peso_real_valor} {evento.peso_real_unidad} ⚖️
                </p>
                <p>
                  <span className="font-medium">Longitud:</span> {evento.longitud_real} cm 📏
                </p>
                <p>
                  <span className="font-medium">Color de ojos:</span> {evento.color_ojos_real} 👁️
                </p>
                {evento.color_pelo_real && (
                  <p>
                    <span className="font-medium">Color de pelo:</span> {evento.color_pelo_real} 💇
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {ganador && (
          <Card className="bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200">
            <CardHeader>
              <div className="flex justify-center mb-2">
                <Trophy className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-center text-2xl text-yellow-700">¡Tenemos un ganador! 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-yellow-700">{ganador.nombre_participante} 🎉</h3>
                <p className="text-yellow-600">Puntuación: {ganador.puntuacion} puntos ✨</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-medium text-yellow-700">Sus predicciones 🔮</h3>
                  <p>
                    <span className="font-medium">Fecha:</span> {formatearFecha(ganador.fecha_predicha)}
                  </p>
                  <p>
                    <span className="font-medium">Hora:</span> {formatearHora(ganador.hora_predicha)}
                  </p>
                  <p>
                    <span className="font-medium">Peso:</span> {ganador.peso_predicho_valor}{" "}
                    {ganador.peso_predicho_unidad}
                  </p>
                  <p>
                    <span className="font-medium">Longitud:</span> {ganador.longitud_predicha} cm
                  </p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-yellow-700">Más predicciones 📊</h3>
                  <p>
                    <span className="font-medium">Color de ojos:</span> {ganador.color_ojos_predicho}
                  </p>
                  <p>
                    <span className="font-medium">Sexo:</span> {ganador.sexo_predicho}
                  </p>
                  {ganador.color_pelo_predicho && (
                    <p>
                      <span className="font-medium">Color de pelo:</span> {ganador.color_pelo_predicho}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {top3.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-center text-xl">Top 3 Participantes 🏆</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {top3.map((prediccion, index) => (
                  <div key={prediccion.id} className="flex items-center space-x-4 p-4 rounded-lg bg-gray-50">
                    <div className="flex-shrink-0">
                      {index === 0 ? (
                        <Trophy className="h-8 w-8 text-yellow-500" />
                      ) : index === 1 ? (
                        <Medal className="h-8 w-8 text-gray-400" />
                      ) : (
                        <Award className="h-8 w-8 text-amber-700" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{prediccion.nombre_participante}</p>
                      <p className="text-sm text-gray-500 truncate">{prediccion.email_participante}</p>
                    </div>
                    <div className="inline-flex items-center text-base font-semibold text-gray-900">
                      {prediccion.puntuacion} puntos ✨
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <Button asChild>
            <Link href="/">Volver al inicio 🏠</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
