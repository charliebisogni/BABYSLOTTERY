"use client"

import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"

// Script SQL actualizado y simplificado
const SQL_SCRIPT = `
-- Añadir columnas para el sistema de privacidad si no existen
ALTER TABLE eventos_bebe
ADD COLUMN IF NOT EXISTS identificador_publico VARCHAR(255),
ADD COLUMN IF NOT EXISTS contrasena_participantes_hash VARCHAR(255);

-- Asegurar que identificador_publico sea único
ALTER TABLE eventos_bebe
DROP CONSTRAINT IF EXISTS eventos_bebe_identificador_publico_key;

ALTER TABLE eventos_bebe
ADD CONSTRAINT eventos_bebe_identificador_publico_key UNIQUE (identificador_publico);

-- Actualizar eventos existentes con valores por defecto
UPDATE eventos_bebe 
SET 
  identificador_publico = COALESCE(identificador_publico, CONCAT('Bebé ID ', id)),
  contrasena_participantes_hash = COALESCE(contrasena_participantes_hash, password_hash)
WHERE 
  identificador_publico IS NULL OR contrasena_participantes_hash IS NULL;
`

export function SqlInstructions() {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(SQL_SCRIPT.trim())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Alert className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Información para administradores</AlertTitle>
      <AlertDescription>
        <p className="mb-2">
          Para habilitar todas las funciones de privacidad, es necesario ejecutar un script SQL en la base de datos.
        </p>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              Ver instrucciones SQL
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Script SQL para actualizar la base de datos</DialogTitle>
              <DialogDescription>
                Ejecuta este script en tu base de datos Supabase para habilitar todas las funciones de privacidad. Este
                script es seguro de ejecutar múltiples veces.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px]">
              <pre className="text-sm">{SQL_SCRIPT}</pre>
            </div>
            <DialogFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleCopy} className="w-full sm:w-auto">
                {copied ? "¡Copiado!" : "Copiar SQL"}
              </Button>
              <DialogClose asChild>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cerrar
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  )
}
