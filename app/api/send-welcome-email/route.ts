// app/api/send-welcome-email/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    // 1. Obtener los datos que envió el frontend
    const body = await request.json();
    const { email_padres, nombre_bebe_identificador } = body;

    if (!email_padres || !nombre_bebe_identificador) {
      return NextResponse.json({ error: 'Faltan datos requeridos (email_padres, nombre_bebe_identificador)' }, { status: 400 });
    }

    // 2. Obtener la URL de la Edge Function y la Anon Key de las variables de entorno
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_WELCOME_EMAIL_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; // Usamos la misma que podría usar el cliente

    if (!edgeFunctionUrl || !supabaseAnonKey) {
      console.error('Error: Variables de entorno para Supabase Edge Function no configuradas en Vercel.');
      return NextResponse.json({ error: 'Error de configuración del servidor.' }, { status: 500 });
    }

    // 3. Preparar y realizar la llamada a la Supabase Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey, // Header requerido por el gateway de Supabase
        'Authorization': `Bearer ${supabaseAnonKey}` // Header requerido por el gateway de Supabase
      },
      body: JSON.stringify({
        email_padres,
        nombre_bebe_identificador,
        // contrasena_participantes: body.contrasena_participantes, // Si también la envías
      }),
    });

    // 4. Manejar la respuesta de la Edge Function
    const responseData = await response.json();

    if (!response.ok) {
      // Si la Edge Function devolvió un error (ej. 4xx o 5xx)
      console.error('Error desde Supabase Edge Function:', responseData);
      return NextResponse.json({ error: responseData.error || 'Error al invocar la función de envío de correo.', details: responseData.details }, { status: response.status });
    }

    // Si la Edge Function respondió con éxito (ej. 200)
    console.log('Respuesta exitosa de Supabase Edge Function:', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error) {
    console.error('Error en la API Route /api/send-welcome-email:', error);
    return NextResponse.json({ error: 'Error interno del servidor en la API Route.', details: error.message }, { status: 500 });
  }
}