import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id_bebe } = await request.json()

    // Validar datos requeridos
    if (!id_bebe) {
      return NextResponse.json({ error: "Se requiere id_bebe" }, { status: 400 })
    }

    // Aquí se llamaría a la Supabase Edge Function
    console.log("📨 Enviando correos con resultados para el bebé ID:", id_bebe)

    // En producción, aquí se invocaría la Edge Function de Supabase
    // const supabase = createServerSupabaseClient()
    // const { data, error } = await supabase.functions.invoke('send-results-email', {
    //   body: { id_bebe }
    // })

    return NextResponse.json({
      success: true,
      message: "Correos con resultados enviados correctamente",
    })
  } catch (error) {
    console.error("Error al enviar correos con resultados:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
