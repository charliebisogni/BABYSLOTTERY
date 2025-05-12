"use client"

import { useToast } from "@/hooks/use-toast"

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
  const { toast } = useToast()

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
      throw new Error(errorData.error || "Error en la solicitud")
    }

    toast({
      title: "¡Notificación enviada! ✉️",
      description: successMessage,
    })

    if (onSuccess) {
      onSuccess()
    }

    return true
  } catch (error) {
    console.error("Error al enviar notificación:", error)
    toast({
      title: "Error al enviar notificación ❌",
      description: errorMessage,
      variant: "destructive",
    })
    return false
  }
}
