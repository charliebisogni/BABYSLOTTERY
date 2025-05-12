"use client"

import { useState, useEffect } from "react"

interface ImageVerifierProps {
  src: string
  label: string
}

export function ImageVerifier({ src, label }: ImageVerifierProps) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")

  useEffect(() => {
    const img = new Image()
    img.src = src
    img.onload = () => setStatus("success")
    img.onerror = () => setStatus("error")
  }, [src])

  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-0 right-0 m-2 p-2 bg-black bg-opacity-70 text-white text-xs rounded z-50">
      {label}: {status === "loading" ? "⏳" : status === "success" ? "✅" : "❌"}
    </div>
  )
}
