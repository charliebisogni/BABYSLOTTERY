// supabase/functions/send-welcome-email/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'npm:resend'

// Plantilla del correo de bienvenida con URL de logo actualizada y charset UTF-8
function getWelcomeEmailHtml(nombreBebeIdentificador: string, emailPadres: string) {
  const nombreAmigablePadres = emailPadres.split('@')[0]; 

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>¡Bienvenido a Baby's Lottery!</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #ddd; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://i.postimg.cc/qM4jVGt7/LOGOPRINCIPAL.png" alt="Baby's Lottery Logo" style="max-width: 120px; margin-bottom:10px;"> 
          </div>
          <h1 style="color: #FF69B4; text-align: center; font-size: 26px;">¡Felicidades y Bienvenido/a a Baby's Lottery! 🍼🎉</h1>
          <p style="font-size: 16px; text-align: center;">¡Hola ${nombreAmigablePadres}! 👋</p>
          <p style="font-size: 16px; text-align: center; margin-top: 20px;">¡Qué emoción! Tu 'Bebé por nacer' (<strong>${nombreBebeIdentificador}</strong>) ha sido registrado exitosamente en <strong>Baby's Lottery</strong>! 🧸</p>
          <p style="font-size: 16px; text-align: center;">Ya puedes compartir el identificador '<strong>${nombreBebeIdentificador}</strong>' y la contraseña de participante 🤫 con tus amigos y familiares para que se unan a la diversión.</p>
          <p style="font-size: 16px; text-align: center; margin-top: 25px;">¡Mucha suerte y a disfrutar de esta dulce espera! 💖</p>
          <br>
          <p style="font-size: 16px; text-align: center;">Con cariño, 💕</p>
          <p style="font-size: 16px; text-align: center; font-weight: bold;">El equipo de Baby's Lottery</p>
          <div style="text-align: center; margin-top: 30px; font-size: 12px; color: #777;">
            <p>Recibiste este correo porque te registraste en Baby's Lottery.</p>
            <p>&copy; ${new Date().getFullYear()} Baby's Lottery. Todos los derechos reservados.</p>
          </div>
        </div>
      </body>
    </html>
  `
}

console.log("Función 'send-welcome-email' inicializada y lista para recibir solicitudes.");

Deno.serve(async (req: Request) => {
  // 1. Manejar la solicitud OPTIONS para CORS (importante para invocar desde el navegador)
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
    console.log(`[send-welcome-email] Método no permitido: ${req.method}`);
    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  if (!req.headers.get('content-type')?.includes('application/json')) {
    console.log(`[send-welcome-email] Content-Type inválido: ${req.headers.get('content-type')}`);
    return new Response(JSON.stringify({ error: 'Invalid Content-Type, expected application/json' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  let emailPadres = ''
  let nombreBebeIdentificador = ''

  try {
    const body = await req.json()
    console.log('[send-welcome-email] Cuerpo de la solicitud recibido:', body);
    emailPadres = body.email_padres
    nombreBebeIdentificador = body.nombre_bebe_identificador

    if (!emailPadres || !nombreBebeIdentificador) {
      throw new Error('Faltan email_padres o nombre_bebe_identificador en el cuerpo de la solicitud.')
    }
  } catch (error) {
    console.error('[send-welcome-email] Error al parsear el cuerpo de la solicitud:', error)
    return new Response(JSON.stringify({ error: error.message || 'Cuerpo de solicitud inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  // 3. Obtener la API Key de Resend desde los Secrets de Supabase
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  if (!RESEND_API_KEY) {
    console.error('[send-welcome-email] Error: RESEND_API_KEY no está configurada en los secrets del proyecto.')
    return new Response(
      JSON.stringify({ error: 'Error de configuración del servidor: Falta la API key de Resend.' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
    )
  }

  const resend = new Resend(RESEND_API_KEY)

  try {
    // 4. Preparar y enviar el correo
    const emailHtml = getWelcomeEmailHtml(nombreBebeIdentificador, emailPadres)

    console.log(`[send-welcome-email] Intentando enviar correo de bienvenida a: ${emailPadres}`);
    const { data, error } = await resend.emails.send({
      from: 'Baby\'s Lottery <bienvenida@babyslottery.lat>', // CAMBIA babyslottery.lat POR TU DOMINIO VERIFICADO
      to: [emailPadres],
      subject: `¡Felicidades y Bienvenido/a a Baby's Lottery, ${nombreBebeIdentificador}! 🍼🎉`,
      html: emailHtml,
    })

    if (error) {
      console.error('[send-welcome-email] Error al enviar el correo desde Resend:', error)
      return new Response(JSON.stringify({ error: 'Error al enviar el correo.', details: error.message || JSON.stringify(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    console.log('[send-welcome-email] Correo de bienvenida enviado exitosamente:', data)
    return new Response(JSON.stringify({ message: 'Correo de bienvenida enviado exitosamente!', emailId: data?.id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (e) {
    console.error('[send-welcome-email] Error inesperado al intentar enviar el correo:', e)
    return new Response(JSON.stringify({ error: 'Error inesperado del servidor.', details: e.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})