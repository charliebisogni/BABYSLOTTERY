// app/api/send-welcome-email/route.ts
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  console.log("[API Route] /api/send-welcome-email INVOCADA"); 
  try {
    // 1. Obtener los datos que envió el frontend
    const body = await request.json();
    const { email_padres, nombre_bebe_identificador } = body; // La contraseña de participantes no se usa aquí
    console.log("[API Route] Body recibido:", { email_padres, nombre_bebe_identificador });

    if (!email_padres || !nombre_bebe_identificador) {
      console.error("[API Route] Faltan datos: email_padres o nombre_bebe_identificador");
      return NextResponse.json({ error: 'Faltan datos requeridos (email_padres, nombre_bebe_identificador)' }, { status: 400 });
    }

    // 2. Obtener la URL de la Edge Function y la Anon Key de las variables de entorno
    const edgeFunctionUrl = process.env.SUPABASE_EDGE_FUNCTION_WELCOME_EMAIL_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 
    
    console.log("[API Route] URL Edge Function recuperada:", edgeFunctionUrl);
    console.log("[API Route] Supabase Anon Key disponible:", !!supabaseAnonKey); // Loguea true si la clave existe

    if (!edgeFunctionUrl) {
      console.error('[API Route] Error: Variable de entorno SUPABASE_EDGE_FUNCTION_WELCOME_EMAIL_URL no configurada en Vercel.');
      return NextResponse.json({ error: 'Error de configuración del servidor (URL de función no encontrada).' }, { status: 500 });
    }
    if (!supabaseAnonKey) {
      console.error('[API Route] Error: Variable de entorno NEXT_PUBLIC_SUPABASE_ANON_KEY no configurada en Vercel.');
      return NextResponse.json({ error: 'Error de configuración del servidor (Clave API no encontrada).' }, { status: 500 });
    }

    console.log(`[API Route] A punto de hacer fetch a Supabase Edge Function: ${edgeFunctionUrl}`);
    
    // 3. Preparar y realizar la llamada a la Supabase Edge Function
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey, // Header requerido por el gateway de Supabase
        'Authorization': `Bearer ${supabaseAnonKey}` // Header requerido por el gateway de Supabase
      },
      body: JSON.stringify({ // Asegúrate de enviar solo los campos que la Edge Function espera
        email_padres: email_padres, // Corregido aquí
        nombre_bebe_identificador: nombre_bebe_identificador, // Corregido aquí
      }),
    }).catch(fetchError => {
      console.error("[API Route] Error en el FETCH MISMO a Supabase Edge Function:", fetchError);
      // Devuelve un objeto que simula una respuesta de error para que el flujo continúe
      return { 
        ok: false, 
        status: 503, // Service Unavailable o un código de error apropiado
        json: async () => ({ error: 'Error al conectar con el servicio de funciones.', details: fetchError.message }) 
      } as unknown as Response; // Type assertion para satisfacer a TypeScript
    });

    if (!response) { // Por si el .catch devolvió algo inesperado (no debería con el 'as unknown as Response')
         console.error("[API Route] Fetch no devolvió un objeto Response válido después del catch.");
         return NextResponse.json({ error: 'Respuesta inválida del fetch interno.' }, { status: 500 });
    }
    
    console.log("[API Route] Respuesta de fetch a Supabase Edge Function. Status:", response.status);

    // 4. Manejar la respuesta de la Edge Function
    const responseData = await response.json();
    console.log("[API Route] Datos de respuesta de Supabase Edge Function:", responseData);

    if (!response.ok) {
      // Si la Edge Function devolvió un error (ej. 4xx o 5xx)
      console.error('[API Route] Error desde Supabase Edge Function:', responseData);
      return NextResponse.json({ error: responseData.error || 'Error al invocar la función de envío de correo.', details: responseData.details }, { status: response.status });
    }

    // Si la Edge Function respondió con éxito (ej. 200)
    console.log('[API Route] Respuesta exitosa de Supabase Edge Function:', responseData);
    return NextResponse.json(responseData, { status: 200 });

  } catch (error: any) {
    console.error('[API Route] Error general en /api/send-welcome-email:', error);
    return NextResponse.json({ error: 'Error interno del servidor en la API Route.', details: error.message }, { status: 500 });
  }
}