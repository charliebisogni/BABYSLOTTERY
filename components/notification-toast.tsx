"use client"

// Importa la FUNCIÓN `toast` directamente, NO el hook `useToast`
import { toast } from "@/hooks/use-toast" 

interface SendEmailProps {
  endpoint: string
  data: any
  successMessage: string
  errorMessage: string
  onSuccess?: () => void
}

export async function sendEmail({
  endpoint,
  data,
  successMessage,
  errorMessage,
  onSuccess,
}: SendEmailProps): Promise<boolean> {
  // YA NO SE LLAMA A useToast() AQUÍ

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const errorData = await response.json()
      // Intenta obtener un mensaje más específico si es posible
      const message = errorData.message || errorData.error || "Error en la respuesta del servidor";
      console.error("Error en respuesta del servidor:", errorData);
      throw new Error(message)
    }

    // La función toast se puede llamar directamente porque fue exportada
    // y maneja su propio estado globalmente.
    toast({
      title: "¡Notificación enviada! ✉️",
      description: successMessage,
    })

    if (onSuccess) {
      onSuccess()
    }

    return true
  } catch (error: any) { // Especificar 'any' o un tipo más específico para error
    console.error("Error al enviar notificación:", error)
    toast({
      title: "Error al enviar notificación ❌",
      // Usar error.message si está disponible, sino el errorMessage por defecto
      description: error.message || errorMessage, 
      variant: "destructive",
    })
    return false
  }
}