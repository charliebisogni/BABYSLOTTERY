import { createClient } from "@supabase/supabase-js"
import { createHash } from "crypto"

// Tipos para nuestras tablas
export type Prediccion = {
  id: number
  nombre_participante: string
  email_participante: string
  fecha_predicha: string
  hora_predicha: string
  peso_predicho_valor: number
  peso_predicho_unidad: "kg" | "g"
  longitud_predicha: number
  color_ojos_predicho: string
  sexo_predicho: string
  color_pelo_predicho: string | null
  fecha_registro: string
  puntuacion: number
  id_evento_bebe: number
}

export type EventoBebe = {
  id: number
  nombre_evento: string
  identificador_publico: string
  contrasena_participantes_hash: string
  email_admin: string
  password_hash: string
  fecha_creacion: string
  fecha_real: string | null
  hora_real: string | null
  peso_real_valor: number | null
  peso_real_unidad: "kg" | "g" | null
  longitud_real: number | null
  color_ojos_real: string | null
  sexo_real: string | null
  color_pelo_real: string | null
  calculo_realizado: boolean
}

// Nuevo tipo para los datos reales del bebé
export type DatosRealesBebe = {
  id: number
  fecha_real: string
  hora_real: string
  peso_real_valor: number
  peso_real_unidad: "kg" | "g"
  longitud_real: number
  color_ojos_real: string
  sexo_real: string
  color_pelo_real: string | null
  calculo_realizado: boolean
}

// Cliente de Supabase para el servidor
export const createServerSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  return createClient(supabaseUrl, supabaseKey)
}

// Cliente de Supabase para el cliente (navegador)
let clientSupabaseClient: ReturnType<typeof createClient> | null = null

export const createClientSupabaseClient = () => {
  if (clientSupabaseClient) return clientSupabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error("Variables de entorno de Supabase no disponibles:", {
      url: !!supabaseUrl,
      key: !!supabaseKey,
    })
    throw new Error("Faltan las variables de entorno de Supabase")
  }

  clientSupabaseClient = createClient(supabaseUrl, supabaseKey)
  return clientSupabaseClient
}

// Función para hashear contraseñas
export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex")
}

// Función para verificar contraseñas
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const hashedInput = hashPassword(password)
  return hashedInput === hashedPassword
}
