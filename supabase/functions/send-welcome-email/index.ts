// supabase/functions/send-welcome-email/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { Resend } from 'npm:resend'

// Plantilla del correo de bienvenida con más emojis
function getWelcomeEmailHtml(nombreBebeIdentificador: string, emailPadres: string) {
  const nombreAmigablePadres = emailPadres.split('@')[0]; 

  return `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 20px auto; padding: 30px; border: 1px solid #ddd; border-radius: 12px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://i.postimg.cc/LhQzqL3d/LOGOPRINCIPAL.png" alt="Baby's Lottery Logo" style="max-width: 120px; margin-bottom:10px;"> 
          </div>
          <h1 style="color: #FF69B4; text-align: center; font-size: 26px;">¡Felicidades y Bienvenido/a a Baby's Lottery! 🍼🎉</h1>
          <p style="font-size: 16px; text-align: center;">¡Hola <span class="math-inline">\{nombreAmigablePadres\}\! 👋</p\>
<p style\="font\-size\: 16px; text\-align\: center; margin\-top\: 20px;"\>¡Qué emoción\! Tu 'Bebé por nacer' \(<strong\></span>{nombreBebeIdentificador}</strong>) ha sido registrado exitosamente en <strong>Baby's Lottery</strong>! 🧸</p>
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
