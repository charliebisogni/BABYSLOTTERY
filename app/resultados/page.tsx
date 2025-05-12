import { createServerSupabaseClient } from "@/lib/supabase"
import { formatearFecha } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Baby } from "lucide-react"

async function getEventosConResultados() {
  const supabase = createServerSupabaseClient()
  const { data, error } = await supabase
    .from("eventos_bebe")
    .select("*")
    .eq("calculo_realizado", true)
    .order("fecha_real", { ascending: false })

  if (error) {
    console.error("Error al obtener eventos:", error)
    return []
  }

  return data
}

export default async function ResultadosPage() {
  const eventos = await getEventosConResultados()

  if (eventos.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center text-2xl">Resultados 🏆</CardTitle>
            <CardDescription className="text-center">Aún no hay resultados disponibles ⏳</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-6">
              Los resultados estarán disponibles una vez que nazcan los bebés y se calculen los ganadores. 👶
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
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center text-pink-600 mb-8">Resultados de Baby Showers 🏆👶</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {eventos.map((evento) => (
            <Card key={evento.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Baby className="h-5 w-5 text-pink-500" />
                  {evento.nombre_evento} 👶
                </CardTitle>
                <CardDescription>Nació el {formatearFecha(evento.fecha_real!)} 🎂</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-500">Sexo</p>
                      <p className="font-medium">
                        {evento.sexo_real} {evento.sexo_real === "Niño" ? "👦" : "👧"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Peso ⚖️</p>
                      <p className="font-medium">
                        {evento.peso_real_valor} {evento.peso_real_unidad}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Longitud 📏</p>
                      <p className="font-medium">{evento.longitud_real} cm</p>
                    </div>
                  </div>

                  <Button asChild className="w-full">
                    <Link href="/acceso-resultados">Ver Resultados 🔍</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
