import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Prediccion, EventoBebe } from "./supabase"

// Función para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para convertir peso a gramos para comparación
export function convertirAGramos(valor: number, unidad: "kg" | "g"): number {
  return unidad === "kg" ? valor * 1000 : valor
}

// Función para calcular la diferencia en días entre dos fechas
export function diferenciaEnDias(fecha1: Date, fecha2: Date): number {
  const diffTime = Math.abs(fecha2.getTime() - fecha1.getTime())
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

// Función para calcular la diferencia en minutos entre dos horas
export function diferenciaEnMinutos(hora1: string, hora2: string): number {
  const [hora1Horas, hora1Minutos] = hora1.split(":").map(Number)
  const [hora2Horas, hora2Minutos] = hora2.split(":").map(Number)

  const minutos1 = hora1Horas * 60 + hora1Minutos
  const minutos2 = hora2Horas * 60 + hora2Minutos

  return Math.abs(minutos2 - minutos1)
}

// Función para calcular la puntuación de una predicción
export function calcularPuntuacion(prediccion: Prediccion, datosReales: EventoBebe): number {
  let puntuacion = 0

  // Verificar que los datos reales estén completos
  if (
    !datosReales.fecha_real ||
    !datosReales.hora_real ||
    !datosReales.peso_real_valor ||
    !datosReales.peso_real_unidad ||
    !datosReales.longitud_real ||
    !datosReales.color_ojos_real ||
    !datosReales.sexo_real
  ) {
    return 0
  }

  // Puntuación por fecha de nacimiento
  const fechaPredicha = new Date(prediccion.fecha_predicha)
  const fechaReal = new Date(datosReales.fecha_real)
  const difDias = diferenciaEnDias(fechaPredicha, fechaReal)

  if (difDias === 0) {
    puntuacion += 50 // Fecha exacta
  } else if (difDias === 1) {
    puntuacion += 30 // +/- 1 día
  } else if (difDias === 2) {
    puntuacion += 20 // +/- 2 días
  } else if (difDias === 3) {
    puntuacion += 10 // +/- 3 días
  }

  // Puntuación por hora de nacimiento
  const difMinutos = diferenciaEnMinutos(prediccion.hora_predicha, datosReales.hora_real)

  if (difMinutos === 0) {
    puntuacion += 40 // Hora exacta
  } else if (difMinutos <= 60) {
    puntuacion += 20 // Dentro de la misma hora
  } else if (difMinutos <= 120) {
    puntuacion += 15 // +/- 1 hora
  } else if (difMinutos <= 240) {
    puntuacion += 10 // +/- 2 horas
  }

  // Puntuación por peso al nacer
  const pesoPredichoGramos = convertirAGramos(prediccion.peso_predicho_valor, prediccion.peso_predicho_unidad)
  const pesoRealGramos = convertirAGramos(datosReales.peso_real_valor, datosReales.peso_real_unidad)

  // La puntuación por peso se asignará después de comparar todas las predicciones

  // Puntuación por longitud al nacer
  // La puntuación por longitud se asignará después de comparar todas las predicciones

  // Puntuación por color de ojos
  if (prediccion.color_ojos_predicho === datosReales.color_ojos_real) {
    puntuacion += 20
  }

  // Puntuación por sexo del bebé
  if (prediccion.sexo_predicho === datosReales.sexo_real) {
    puntuacion += 20
  }

  // Puntuación por color de pelo
  if (
    prediccion.color_pelo_predicho &&
    datosReales.color_pelo_real &&
    prediccion.color_pelo_predicho === datosReales.color_pelo_real
  ) {
    puntuacion += 15
  }

  return puntuacion
}

// Función para asignar puntos adicionales basados en la cercanía al peso y longitud
export async function asignarPuntosPorCercania(predicciones: Prediccion[], datosReales: EventoBebe) {
  if (!datosReales.peso_real_valor || !datosReales.peso_real_unidad || !datosReales.longitud_real) {
    return predicciones
  }

  // Convertir todos los pesos a gramos para comparación
  const pesoRealGramos = convertirAGramos(datosReales.peso_real_valor, datosReales.peso_real_unidad)

  // Calcular diferencias de peso y longitud
  const prediccionesConDiferencias = predicciones.map((prediccion) => {
    const pesoPredichoGramos = convertirAGramos(prediccion.peso_predicho_valor, prediccion.peso_predicho_unidad)
    const difPeso = Math.abs(pesoPredichoGramos - pesoRealGramos)
    const difLongitud = Math.abs(prediccion.longitud_predicha - datosReales.longitud_real)

    return {
      ...prediccion,
      difPeso,
      difLongitud,
    }
  })

  // Ordenar por diferencia de peso (menor a mayor)
  const ordenadosPorPeso = [...prediccionesConDiferencias].sort((a, b) => a.difPeso - b.difPeso)

  // Asignar puntos por peso
  if (ordenadosPorPeso.length > 0) {
    ordenadosPorPeso[0].puntuacion += 30 // Más cercano
    if (ordenadosPorPeso.length > 1) {
      ordenadosPorPeso[1].puntuacion += 15 // Segundo más cercano
    }
  }

  // Ordenar por diferencia de longitud (menor a mayor)
  const ordenadosPorLongitud = [...prediccionesConDiferencias].sort((a, b) => a.difLongitud - b.difLongitud)

  // Asignar puntos por longitud
  if (ordenadosPorLongitud.length > 0) {
    ordenadosPorLongitud[0].puntuacion += 30 // Más cercano
    if (ordenadosPorLongitud.length > 1) {
      ordenadosPorLongitud[1].puntuacion += 15 // Segundo más cercano
    }
  }

  // Devolver las predicciones con puntuaciones actualizadas
  return prediccionesConDiferencias.map(({ difPeso, difLongitud, ...prediccion }) => prediccion)
}

// Función para formatear la fecha en español
export function formatearFecha(fecha: string): string {
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Función para formatear la hora
export function formatearHora(hora: string): string {
  const [horas, minutos] = hora.split(":")
  return `${horas}:${minutos}`
}

// Función para calcular estadísticas de predicciones
export function calcularEstadisticas(predicciones: Prediccion[]) {
  if (!predicciones.length) {
    return {
      fechaPromedio: null,
      horaPromedio: null,
      pesoPromedio: null,
      longitudPromedio: null,
      colorOjosMasVotado: null,
      sexoMasVotado: null,
      colorPeloMasVotado: null,
    }
  }

  // Calcular fecha promedio
  const fechasMs = predicciones.map((p) => new Date(p.fecha_predicha).getTime())
  const fechaPromedioMs = fechasMs.reduce((a, b) => a + b, 0) / fechasMs.length
  const fechaPromedio = new Date(fechaPromedioMs).toISOString().split("T")[0]

  // Calcular hora promedio
  const horasMinutos = predicciones.map((p) => {
    const [horas, minutos] = p.hora_predicha.split(":").map(Number)
    return horas * 60 + minutos
  })
  const minutosPromedio = horasMinutos.reduce((a, b) => a + b, 0) / horasMinutos.length
  const horasPromedioEntero = Math.floor(minutosPromedio / 60)
  const minutosPromedioEntero = Math.floor(minutosPromedio % 60)
  const horaPromedio = `${horasPromedioEntero.toString().padStart(2, "0")}:${minutosPromedioEntero.toString().padStart(2, "0")}`

  // Calcular peso promedio (todo en gramos)
  const pesosGramos = predicciones.map((p) => convertirAGramos(p.peso_predicho_valor, p.peso_predicho_unidad))
  const pesoPromedioGramos = pesosGramos.reduce((a, b) => a + b, 0) / pesosGramos.length
  const pesoPromedio = {
    valor: pesoPromedioGramos > 1000 ? pesoPromedioGramos / 1000 : pesoPromedioGramos,
    unidad: pesoPromedioGramos > 1000 ? "kg" : "g",
  }

  // Calcular longitud promedio
  const longitudes = predicciones.map((p) => p.longitud_predicha)
  const longitudPromedio = longitudes.reduce((a, b) => a + b, 0) / longitudes.length

  // Calcular moda para valores categóricos
  const calcularModa = (arr: (string | null)[]) => {
    const conteo: Record<string, number> = {}
    arr.forEach((item) => {
      if (item) {
        conteo[item] = (conteo[item] || 0) + 1
      }
    })

    let maxConteo = 0
    let moda: string | null = null

    for (const [valor, cantidad] of Object.entries(conteo)) {
      if (cantidad > maxConteo) {
        maxConteo = cantidad
        moda = valor
      }
    }

    return moda
  }

  const colorOjosMasVotado = calcularModa(predicciones.map((p) => p.color_ojos_predicho))
  const sexoMasVotado = calcularModa(predicciones.map((p) => p.sexo_predicho))
  const colorPeloMasVotado = calcularModa(predicciones.map((p) => p.color_pelo_predicho))

  return {
    fechaPromedio,
    horaPromedio,
    pesoPromedio,
    longitudPromedio: Math.round(longitudPromedio * 10) / 10, // Redondear a 1 decimal
    colorOjosMasVotado,
    sexoMasVotado,
    colorPeloMasVotado,
  }
}
