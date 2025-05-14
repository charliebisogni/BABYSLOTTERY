// app/api/send-winner-email/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log("[API Route] /api/send-winner-email INVOCADA"); 
  try {
    // 1. Obtener los datos que envió el frontend
    const body = await request.json();
    const { id_bebe, email_ganador, nombre_ganador, nombre_bebe_identificador } = body;
    console.log("[API Route] Body recibido para send-winner-email:", body);

    if (!id_bebe || !email_ganador || !nombre_ganador || !nombre_bebe_identificador) {
      console.error("[API Route] Faltan datos para send-winner-email:", body);
      return NextResponse.json({ error: 'Faltan datos requeridos (id_bebe, email_ganador, nombre_ganador, nombre_bebe_identificador)' }, { status: 400 });
    }

    // 2. Obtener la URL de la Edge Function y la Anon Key de las variables de entorno
    // ¡NECESITAREMOS UNA NUEVA VARIABLE DE ENTORNO PARA ESTA URL!
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_WINNER_EMAIL_URL; // <--- NUEVA VARIABLE
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

    console.log("[API Route] URL Edge Function (winner) recuperada:", edgeFunctionUrl);
    console.log("[API Route] Supabase Anon Key disponible:", !!supabaseAnonKey);

    if (!edgeFunctionUrl) {
      console.error('[API Route] Error: Variable de entorno SUPABASE_EDGE_FUNCTION_WINNER_EMAIL_URL no configurada en Vercel.');
      return NextResponse.json({ error: 'Error de configuración del servidor (URL de función winner no encontrada).' }, { status: 500 });
    }
    if (!supabaseAnonKey) {
      console.error('[API Route] Error: Variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada en Vercel.');
      return NextResponse.json({ error: 'Error de configuración del servidor (Clave API no encontrada).' }, { status: 500 });
    }

    console.log(`[API Route] A punto de hacer fetch a Supabase Edge Function (winner): ${edgeFunctionUrl}`);

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`
      },
      body: JSON.stringify({
        id_bebe,
        email_ganador,
        nombre_ganador,
        nombre_bebe_identificador,
      }),
    }).catch(fetchError => {
      console.error("[API Route] Error en el FETCH MISMO a Supabase Edge Function (winner):", fetchError);
      return { 
        ok: false, 
        status: 503, 
        json: async () => ({ error: 'Error al conectar con el servicio de funciones (winner).', details: fetchError.message }) 
      } as unknown as Response;
    });

    if (!response) {
         console.error("[API Route] Fetch (winner) no devolvió un objeto Response válido después del catch.");
         return NextResponse.json({ error: 'Respuesta inválida del fetch interno (winner).' }, { status: 500 });
    }

    console.log("[API Route] Respuesta de fetch a Supabase Edge Function (winner). Status:", response.status);

    const responseData = await response.json();
    console.log("[API Route] Datos de respuesta de Supabase Edge Function (winner):", responseData);

    if (!response.ok) {
      console.error('[API Route] Error desde Supabase Edge Function (winner):', responseData);
      return NextResponse.json({ error: responseData.error || 'Error al invocar la función de envío de correo al ganador.', details: responseData.details }, { status: response.status });
    }

    console.log('[API Route] Respuesta exitosa de Supabase Edge Function (winner):', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('[API Route] Error general en /api/send-winner-email:', error);
    return NextResponse.json({ error: 'Error interno del servidor en la API Route (winner).', details: error.message }, { status: 500 });
  }
}