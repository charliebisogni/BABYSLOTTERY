"use client"

import { useState, useEffect } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createClientSupabaseClient } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"

export function AdminAlert() {
  const [showAlert, setShowAlert] = useState(false)
  const { isAuthenticated, user } = useAuth()

  useEffect(() => {
    const checkColumns = async () => {
      if (!isAuthenticated || !user) return

      try {
        const supabase = createClientSupabaseClient()

        // Intentar acceder a la columna identificador_publico
        const { data, error } = await supabase
          .from("eventos_bebe")
          .select("identificador_publico")
          .eq("id", user.id)
          .single()

        // Si hay un error, probablemente la columna no existe
        if (error && error.code === "PGRST116") {
          setShowAlert(true)
        }
      } catch (error) {
        console.error("Error al verificar columnas:", error)
        setShowAlert(true)
      }
    }

    checkColumns()
  }, [isAuthenticated, user])

  if (!showAlert || !isAuthenticated) return null

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Actualización de base de datos requerida</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Se requiere ejecutar un script SQL para habilitar las nuevas funciones de privacidad. Por favor, contacta al
          administrador del sistema.
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(`
ALTER TABLE IF EXISTS eventos_bebe
ADD COLUMN IF NOT EXISTS identificador_publico VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS contrasena_participantes_hash VARCHAR(255);

UPDATE eventos_bebe 
SET 
  identificador_publico = CONCAT('Bebé ID ', id),
  contrasena_participantes_hash = password_hash
WHERE 
  identificador_publico IS NULL;
            `)
            alert("SQL copiado al portapapeles")
          }}
        >
          Copiar SQL
        </Button>
      </AlertDescription>
    </Alert>
  )
}
