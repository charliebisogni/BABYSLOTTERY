// supabase/functions/send-winner-email/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'npm:resend'

// Plantilla del correo para el ganador
function getWinnerEmailHtml(nombreGanador: string, nombreBebeIdentificador: string) {
  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #ddd; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://i.postimg.cc/LhQzqL3d/LOGOPRINCIPAL.png" alt="Baby's Lottery Logo" style="max-width: 120px; margin-bottom:10px;">
          </div>
          <h1 style="color: #FFD700; text-align: center; font-size: 28px;">¡Súper Felicidades, ${nombreGanador}! 🏆🥳</h1>
          <p style="font-size: 16px; text-align: center; margin-top: 20px;">¡Enhorabuena, <strong>${nombreGanador}</strong>! 🎉</p>
          <p style="font-size: 16px; text-align: center;">¡Eres el/la gran ganador/a de <strong>Baby's Lottery</strong> para <strong>${nombreBebeIdentificador}</strong>! 🌟</p>
          <p style="font-size: 16px; text-align: center;">Tus predicciones fueron las más acertadas y tu intuición es increíble. 🔮</p>
          <p style="font-size: 16px; text-align: center; margin-top: 25px;">¡Gracias por participar y celebrar con nosotros! 🎁</p>
          <br>
          <p style="font-size: 16px; text-align: center;">Con alegría, ✨</p>
          <p style="font-size: 16px; text-align: center; font-weight: bold;">El equipo de Baby's Lottery</p>
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
            <p>Recibiste este correo como notificación de Baby's Lottery.</p>
            <p>&copy; ${new Date().getFullYear()} Baby's Lottery. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

console.log("Función 'send-winner-email' inicializada y lista para recibir solicitudes.");

Deno.serve(async (req: Request) => {
  // 1. Manejar la solicitud OPTIONS para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*', // En producción: 'https://www.babyslottery.lat' (o tu dominio)
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  // 2. Asegurarse de que la solicitud es POST y tiene el header correcto
  if (req.method !== 'POST') {
    console.log(`[send-winner-email] Método no permitido: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  if (!req.headers.get('content-type')?.includes('application/json')) {
    console.log(`[send-winner-email] Content-Type inválido: ${req.headers.get('content-type')}`);
    return new Response(JSON.stringify({ error: 'Invalid Content-Type, expected application/json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let idBebe = ''
  let emailGanador = ''
  let nombreGanador = ''
  let nombreBebeIdentificador = ''

  try {
    const body = await req.json()
    console.log('[send-winner-email] Cuerpo de la solicitud recibido:', body);
    idBebe = body.id_bebe
    emailGanador = body.email_ganador
    nombreGanador = body.nombre_ganador
    nombreBebeIdentificador = body.nombre_bebe_identificador

    if (!idBebe || !emailGanador || !nombreGanador || !nombreBebeIdentificador) {
      throw new Error('Faltan datos requeridos (id_bebe, email_ganador, nombre_ganador, nombre_bebe_identificador) en el cuerpo de la solicitud.')
    }
  } catch (error) {
    console.error('[send-winner-email] Error al parsear el cuerpo de la solicitud:', error)
    return new Response(JSON.stringify({ error: error.message || 'Cuerpo de solicitud inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // 3. Obtener la API Key de Resend desde los Secrets de Supabase
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('[send-winner-email] Error: RESEND_API_KEY no está configurada en los secrets del proyecto.')
    return new Response(
      JSON.stringify({ error: 'Error de configuración del servidor: Falta la API key de Resend.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }

  const resend = new Resend(RESEND_API_KEY)

  try {
    // 4. Preparar y enviar el correo
    const emailHtml = getWinnerEmailHtml(nombreGanador, nombreBebeIdentificador)

    console.log(`[send-winner-email] Intentando enviar correo de ganador a: ${emailGanador} para el bebé: ${nombreBebeIdentificador}`);
    const { data, error } = await resend.emails.send({
      from: 'Baby\'s Lottery <felicidades@babyslottery.lat>', // CAMBIA babyslottery.lat POR TU DOMINIO VERIFICADO
      to: [emailGanador],
      subject: `¡Súper Felicidades, ${nombreGanador}! 🏆 Has ganado en Baby's Lottery para ${nombreBebeIdentificador} 🥳`,
      html: emailHtml,
    })

    if (error) {
      console.error('[send-winner-email] Error al enviar el correo de ganador desde Resend:', error)
      return new Response(JSON.stringify({ error: 'Error al enviar el correo de ganador.', details: error.message || JSON.stringify(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log('[send-winner-email] Correo de ganador enviado exitosamente:', data)
    return new Response(JSON.stringify({ message: 'Correo de ganador enviado exitosamente!', emailId: data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    console.error('[send-winner-email] Error inesperado al intentar enviar el correo de ganador:', e)
    return new Response(JSON.stringify({ error: 'Error inesperado del servidor.', details: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})