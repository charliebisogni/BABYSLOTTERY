export interface WelcomeEmailProps {
  nombrePadres: string
  nombreBebe: string
  contrasenaParticipantes?: string
}

export interface WinnerEmailProps {
  nombreGanador: string
  nombreBebe: string
}

export interface ResultsEmailProps {
  nombreParticipante: string
  nombreBebe: string
  fechaReal: string
  horaReal: string
  pesoReal: string
  tallaReal: string
  colorOjosReal: string
  colorPeloReal: string
  nombreGanador: string
}

export function generateWelcomeEmailHtml(props: WelcomeEmailProps): string {
  const { nombrePadres, nombreBebe, contrasenaParticipantes } = props

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>¡Bienvenido a Baby's Lottery!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background-color: #f9f0f2; border-radius: 10px; padding: 20px; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Felicidades y Bienvenido/a a Baby's Lottery, ${nombrePadres}! 🍼🎉</h1>
      </div>
      <div class="content">
        <p>¡Hola ${nombrePadres}! 👋</p>
        <p>¡Qué emoción! Tu 'Bebé por nacer' (${nombreBebe}) ha sido registrado exitosamente en Baby's Lottery! 🧸</p>
        <p>Ya puedes compartir el identificador '${nombreBebe}' ${contrasenaParticipantes ? `y la contraseña de participante '${contrasenaParticipantes}' 🤫` : ""} con tus amigos y familiares para que se unan a la diversión.</p>
        <p>¡Mucha suerte y a disfrutar de esta dulce espera! 💖</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático de Baby's Lottery. Por favor, no respondas a este mensaje.</p>
      </div>
    </body>
    </html>
  `
}

export function generateWinnerEmailHtml(props: WinnerEmailProps): string {
  const { nombreGanador, nombreBebe } = props

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>¡Has ganado en Baby's Lottery!</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background-color: #fff9e0; border-radius: 10px; padding: 20px; }
        .trophy { font-size: 48px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Súper Felicidades, ${nombreGanador}! 🏆</h1>
        <h2>Has ganado en Baby's Lottery para ${nombreBebe} 🥳</h2>
      </div>
      <div class="content">
        <div class="trophy">🏆✨</div>
        <p>¡Enhorabuena, ${nombreGanador}! 🎉</p>
        <p>¡Eres el/la gran ganador/a de Baby's Lottery para ${nombreBebe}! 🌟</p>
        <p>Tus predicciones fueron las más acertadas y tu intuición es increíble. 🔮</p>
        <p>¡Gracias por participar y celebrar con nosotros! 🎁</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático de Baby's Lottery. Por favor, no respondas a este mensaje.</p>
      </div>
    </body>
    </html>
  `
}

export function generateResultsEmailHtml(props: ResultsEmailProps): string {
  const {
    nombreParticipante,
    nombreBebe,
    fechaReal,
    horaReal,
    pesoReal,
    tallaReal,
    colorOjosReal,
    colorPeloReal,
    nombreGanador,
  } = props

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Resultados de Baby's Lottery</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; margin-bottom: 30px; }
        .content { background-color: #f0f9ff; border-radius: 10px; padding: 20px; }
        .baby-data { background-color: #ffffff; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .baby-data h3 { margin-top: 0; color: #0369a1; }
        .winner { background-color: #fff9e0; border-radius: 8px; padding: 15px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #888; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>¡Noticias emocionantes de ${nombreBebe} y resultados de Baby's Lottery! 🍼✨</h1>
      </div>
      <div class="content">
        <p>¡Hola ${nombreParticipante}! 👋</p>
        <p>Nos alegra un montón contarte que ¡${nombreBebe} ya está aquí! 👶👣</p>
        
        <div class="baby-data">
          <h3>Aquí están los datos reales de esta preciosura:</h3>
          <ul>
            <li><strong>Fecha de Nacimiento:</strong> ${fechaReal} 🗓️</li>
            <li><strong>Hora:</strong> ${horaReal} ⏰</li>
            <li><strong>Peso:</strong> ${pesoReal} ⚖️</li>
            <li><strong>Longitud/Talla:</strong> ${tallaReal} 📏</li>
            <li><strong>Color de Ojos:</strong> ${colorOjosReal} 👀</li>
            <li><strong>Color de Pelo:</strong> ${colorPeloReal} 💇</li>
          </ul>
        </div>
        
        <div class="winner">
          <p>Y ahora... redoble de tambores... 🥁</p>
          <p>El/La ganador/a de Baby's Lottery, con la predicción más cercana, ha sido: <strong>${nombreGanador}</strong>! 🏆 ¡Felicidades!</p>
        </div>
        
        <p>¡Muchísimas gracias a todos por participar, por sus buenos deseos y por compartir esta dulce emoción! 🥰💖</p>
      </div>
      <div class="footer">
        <p>Este es un correo automático de Baby's Lottery. Por favor, no respondas a este mensaje.</p>
      </div>
    </body>
    </html>
  `
}
