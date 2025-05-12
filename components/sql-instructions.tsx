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

const SQL_SCRIPT = `
-- Añadir columnas para el sistema de privacidad
ALTER TABLE IF EXISTS eventos_bebe
ADD COLUMN IF NOT EXISTS identificador_publico VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS contrasena_participantes_hash VARCHAR(255);

-- Actualizar eventos existentes con valores por defecto
UPDATE eventos_bebe 
SET 
  identificador_publico = CONCAT('Bebé ID ', id),
  contrasena_participantes_hash = password_hash
WHERE 
  identificador_publico IS NULL;
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
                Ejecuta este script en tu base de datos Supabase para habilitar todas las funciones de privacidad.
              </DialogDescription>
            </DialogHeader>
            <div className="bg-gray-100 p-4 rounded-md overflow-auto max-h-[300px]">
              <pre className="text-sm">{SQL_SCRIPT}</pre>
            </div>
            <DialogFooter>
              <Button onClick={handleCopy}>{copied ? "¡Copiado!" : "Copiar SQL"}</Button>
              <DialogClose asChild>
                <Button variant="outline">Cerrar</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </AlertDescription>
    </Alert>
  )
}
