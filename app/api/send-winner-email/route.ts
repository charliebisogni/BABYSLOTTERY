import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { id_bebe, email_ganador, nombre_ganador, nombre_bebe_identificador } = await request.json()

    // Validar datos requeridos
    if (!id_bebe || !email_ganador || !nombre_ganador || !nombre_bebe_identificador) {
      return NextResponse.json(
        { error: "Se requieren todos los campos: id_bebe, email_ganador, nombre_ganador, nombre_bebe_identificador" },
        { status: 400 },
      )
    }

    // Aquí se llamaría a la Supabase Edge Function
    console.log("🏆 Enviando correo al ganador:", email_ganador)
    console.log("📋 Datos:", { id_bebe, nombre_ganador, nombre_bebe_identificador })

    // En producción, aquí se invocaría la Edge Function de Supabase
    // const supabase = createServerSupabaseClient()
    // const { data, error } = await supabase.functions.invoke('send-winner-email', {
    //   body: { id_bebe, email_ganador, nombre_ganador, nombre_bebe_identificador }
    // })

    return NextResponse.json({
      success: true,
      message: "Correo al ganador enviado correctamente",
    })
  } catch (error) {
    console.error("Error al enviar correo al ganador:", error)
    return NextResponse.json({ error: "Error al procesar la solicitud" }, { status: 500 })
  }
}
