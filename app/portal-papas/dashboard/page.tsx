"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ProtectedRoute } from "@/components/protected-route"
import { useAuth } from "@/contexts/auth-context"
import { createClientSupabaseClient, type Prediccion } from "@/lib/supabase"
import { calcularEstadisticas, formatearFecha } from "@/lib/utils"
import { Loader2, Users, Calendar, Clock, Weight, Ruler, Baby } from "lucide-react"
import { AdminAlert } from "@/components/admin-alert"

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [predicciones, setPredicciones] = useState<Prediccion[]>([])
  const [loading, setLoading] = useState(true)
  const [estadisticas, setEstadisticas] = useState<ReturnType<typeof calcularEstadisticas> | null>(null)

  useEffect(() => {
    const fetchPredicciones = async () => {
      if (!user) return

      try {
        setLoading(true)
        const supabase = createClientSupabaseClient()
        const { data, error } = await supabase
          .from("predicciones")
          .select("*")
          .eq("id_evento_bebe", user.id)
          .order("fecha_registro", { ascending: false })

        if (error) throw error

        setPredicciones(data || [])
        setEstadisticas(calcularEstadisticas(data || []))
      } catch (error) {
        console.error("Error al cargar predicciones:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchPredicciones()
  }, [user])

  const handleYaNacio = () => {
    router.push("/portal-papas/datos-reales")
  }

  if (!user) return null

  return (
    <ProtectedRoute>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-5xl mx-auto">
          <AdminAlert />
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold text-pink-600 mb-2">Portal de tu Bebé 👨‍👩‍👦</h1>
            <p className="text-gray-600">Bienvenido al portal de administración de tu bebé por nacer 🎉</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-pink-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-pink-500" />
                    Participación 👥
                  </CardTitle>
                  <CardDescription>Estadísticas de participación para tu bebé</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-medium text-lg">Total de Participantes</h3>
                      <p className="text-3xl font-bold text-pink-600">{predicciones.length}</p>
                    </div>

                    {predicciones.length > 0 && (
                      <div>
                        <h3 className="font-medium text-lg mb-2">Lista de Participantes 📋</h3>
                        <div className="max-h-60 overflow-y-auto border rounded-md">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 sticky top-0">
                              <tr>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Nombre
                                </th>
                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Fecha
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {predicciones.map((prediccion) => (
                                <tr key={prediccion.id}>
                                  <td className="px-4 py-2 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {prediccion.nombre_participante}
                                    </div>
                                    <div className="text-xs text-gray-500">{prediccion.email_participante}</div>
                                  </td>
                                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">
                                    {formatearFecha(prediccion.fecha_registro)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Baby className="h-5 w-5 text-pink-500" />
                    Predicciones Promedio 📊
                  </CardTitle>
                  <CardDescription>Estadísticas calculadas a partir de todas las predicciones</CardDescription>
                </CardHeader>
                <CardContent>
                  {predicciones.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Aún no hay predicciones para mostrar estadísticas 📊
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-5 w-5 text-pink-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Fecha promedio</p>
                            <p className="font-medium">
                              {estadisticas?.fechaPromedio ? formatearFecha(estadisticas.fechaPromedio) : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-pink-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Hora promedio</p>
                            <p className="font-medium">{estadisticas?.horaPromedio || "N/A"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Weight className="h-5 w-5 text-pink-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Peso promedio</p>
                            <p className="font-medium">
                              {estadisticas?.pesoPromedio
                                ? `${estadisticas.pesoPromedio.valor.toFixed(2)} ${estadisticas.pesoPromedio.unidad}`
                                : "N/A"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Ruler className="h-5 w-5 text-pink-500 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-500">Longitud promedio</p>
                            <p className="font-medium">
                              {estadisticas?.longitudPromedio ? `${estadisticas.longitudPromedio} cm` : "N/A"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 pt-2">
                        <div className="text-center p-3 bg-pink-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Color de ojos 👁️</p>
                          <p className="font-medium">{estadisticas?.colorOjosMasVotado || "N/A"}</p>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Sexo 👶</p>
                          <p className="font-medium">{estadisticas?.sexoMasVotado || "N/A"}</p>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded-lg">
                          <p className="text-xs text-gray-500 mb-1">Color de pelo 💇</p>
                          <p className="font-medium">{estadisticas?.colorPeloMasVotado || "N/A"}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          <div className="mt-8 text-center">
            <Button
              size="lg"
              className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white px-8 py-6 text-lg rounded-full shadow-lg hover:shadow-xl transition-all"
              onClick={handleYaNacio}
            >
              👶 ¡YA NACIÓ! 👣
            </Button>
            <p className="mt-2 text-gray-500 text-sm">Haz clic cuando nazca el bebé para ingresar los datos reales</p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
