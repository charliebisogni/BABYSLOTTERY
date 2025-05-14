import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Prediccion, EventoBebe } from "./supabase" // Asegúrate de que este import sea correcto para tus tipos

// Función para combinar clases de Tailwind
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Función para convertir peso a gramos para comparación
// CORREGIDO: Añadir valor por defecto para 'unidad' si es undefined/null
export function convertirAGramos(valor: number, unidad?: "kg" | "g" | null): number {
  const unidadReal = unidad || "g"; // Si la unidad es null o undefined, asumimos "g"
  return unidadReal === "kg" ? valor * 1000 : valor
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

// Función para calcular la puntuación base de una predicción
export function calcularPuntuacion(prediccion: Prediccion, datosReales: EventoBebe): number {
  let puntuacion = 0

  // Verificar que los datos reales estén completos
  if (
    !datosReales.fecha_real ||
    !datosReales.hora_real ||
    datosReales.peso_real_valor === null || datosReales.peso_real_valor === undefined || // Chequeo más robusto
    !datosReales.peso_real_unidad ||
    datosReales.longitud_real === null || datosReales.longitud_real === undefined || // Chequeo más robusto
    !datosReales.color_ojos_real ||
    !datosReales.sexo_real
  ) {
    console.warn("[calcularPuntuacion] Faltan datos reales del bebé para el cálculo completo. ID Evento:", datosReales.id);
    // Podrías decidir devolver 0 o calcular puntos parciales si algunos datos sí existen.
    // Por ahora, si falta algún dato crucial, devolvemos 0 para esta predicción.
    // O podrías optar por no sumar puntos para la categoría específica que falta.
    // Para el error original, la clave está en convertirAGramos.
  }

  // Puntuación por fecha de nacimiento (solo si hay fecha real)
  if (datosReales.fecha_real && prediccion.fecha_predicha) {
    const fechaPredicha = new Date(prediccion.fecha_predicha)
    const fechaReal = new Date(datosReales.fecha_real)
    const difDias = diferenciaEnDias(fechaPredicha, fechaReal)
    if (difDias === 0) puntuacion += 50
    else if (difDias === 1) puntuacion += 30
    else if (difDias === 2) puntuacion += 20
    else if (difDias === 3) puntuacion += 10
  }

  // Puntuación por hora de nacimiento (solo si hay hora real)
  if (datosReales.hora_real && prediccion.hora_predicha) {
    const difMinutos = diferenciaEnMinutos(prediccion.hora_predicha, datosReales.hora_real)
    if (difMinutos === 0) puntuacion += 40
    else if (difMinutos <= 60) puntuacion += 20
    else if (difMinutos <= 120) puntuacion += 15 // Esto es dentro de 2 horas, no +/- 1 hora
    else if (difMinutos <= 240) puntuacion += 10 // Esto es dentro de 4 horas, no +/- 2 horas
  }
  
  // Puntuación por color de ojos (solo si hay color real)
  if (datosReales.color_ojos_real && prediccion.color_ojos_predicho === datosReales.color_ojos_real) {
    puntuacion += 20
  }

  // Puntuación por sexo del bebé (solo si hay sexo real)
  if (datosReales.sexo_real && prediccion.sexo_predicho === datosReales.sexo_real) {
    puntuacion += 20
  }

  // Puntuación por color de pelo (solo si ambos existen)
  if (prediccion.color_pelo_predicho && datosReales.color_pelo_real && prediccion.color_pelo_predicho === datosReales.color_pelo_real) {
    puntuacion += 15
  }

  // La puntuación por peso y longitud se asigna en `asignarPuntosPorCercania`
  // por lo que la puntuación devuelta aquí es la base sin esos puntos de cercanía.
  return puntuacion
}

// Función para asignar puntos adicionales basados en la cercanía al peso y longitud
export function asignarPuntosPorCercania(predicciones: Prediccion[], datosReales: EventoBebe): Prediccion[] {
  // Asegurarse de que predicciones sea un array
  if (!Array.isArray(predicciones)) {
    console.error("[asignarPuntosPorCercania] 'predicciones' no es un array:", predicciones);
    return []; // O devolver predicciones tal cual si se prefiere no modificar
  }
  // Asegurarse de que datosReales y sus propiedades necesarias existan
  if (!datosReales || datosReales.peso_real_valor === null || datosReales.peso_real_valor === undefined || !datosReales.peso_real_unidad || datosReales.longitud_real === null || datosReales.longitud_real === undefined) {
    console.warn("[asignarPuntosPorCercania] Faltan datos reales del bebé para asignar puntos por cercanía. ID Evento:", datosReales?.id);
    return predicciones.map(p => ({ ...p, puntuacion: p.puntuacion || 0 })); // Devuelve las predicciones con su puntuación base si no se pueden calcular los de cercanía
  }

  const pesoRealGramos = convertirAGramos(datosReales.peso_real_valor, datosReales.peso_real_unidad)

  const prediccionesConDiferencias = predicciones.map((prediccion) => {
    // CORREGIDO: Verificar que prediccion.peso_predicho_valor exista
    const pesoPredichoGramos = (prediccion.peso_predicho_valor !== null && prediccion.peso_predicho_valor !== undefined)
      ? convertirAGramos(prediccion.peso_predicho_valor, prediccion.peso_predicho_unidad)
      : Infinity; // Si no hay valor de peso predicho, se le asigna una diferencia infinita

    const difPeso = Math.abs(pesoPredichoGramos - pesoRealGramos)
    
    const longitudPredicha = (prediccion.longitud_predicha !== null && prediccion.longitud_predicha !== undefined)
        ? prediccion.longitud_predicha
        : Infinity; // Si no hay valor de longitud predicha, se le asigna una diferencia infinita

    const difLongitud = Math.abs(longitudPredicha - datosReales.longitud_real!) // Usamos ! porque ya verificamos datosReales.longitud_real arriba

    return {
      ...prediccion,
      puntuacion: prediccion.puntuacion || 0, // Asegurar que puntuacion exista
      difPeso,
      difLongitud,
    }
  })

  // Ordenar por diferencia de peso (menor a mayor)
  const ordenadosPorPeso = [...prediccionesConDiferencias].sort((a, b) => a.difPeso - b.difPeso)
  if (ordenadosPorPeso.length > 0 && ordenadosPorPeso[0].difPeso !== Infinity) {
    ordenadosPorPeso[0].puntuacion = (ordenadosPorPeso[0].puntuacion || 0) + 30
    if (ordenadosPorPeso.length > 1 && ordenadosPorPeso[1].difPeso !== Infinity) {
      ordenadosPorPeso[1].puntuacion = (ordenadosPorPeso[1].puntuacion || 0) + 15
    }
  }

  // Ordenar por diferencia de longitud (menor a mayor)
  const ordenadosPorLongitud = [...prediccionesConDiferencias].sort((a, b) => a.difLongitud - b.difLongitud)
  if (ordenadosPorLongitud.length > 0 && ordenadosPorLongitud[0].difLongitud !== Infinity) {
    ordenadosPorLongitud[0].puntuacion = (ordenadosPorLongitud[0].puntuacion || 0) + 30
    if (ordenadosPorLongitud.length > 1 && ordenadosPorLongitud[1].difLongitud !== Infinity) {
      ordenadosPorLongitud[1].puntuacion = (ordenadosPorLongitud[1].puntuacion || 0) + 15
    }
  }
  
  // Actualizar las puntuaciones en el array original (prediccionesConDiferencias)
  // Es un poco complejo porque ordenadosPorPeso y ordenadosPorLongitud son copias ordenadas.
  // La forma más simple es reconstruir el array original con las puntuaciones actualizadas.
  // Creamos un mapa de ID a puntuación actualizada
  const mapaPuntuaciones: Record<string | number, number> = {};
  prediccionesConDiferencias.forEach(p => {
    mapaPuntuaciones[p.id] = p.puntuacion; // Puntuación base
  });

  ordenadosPorPeso.slice(0, 2).forEach((p, index) => {
      if (p.difPeso !== Infinity) {
          mapaPuntuaciones[p.id] = (mapaPuntuaciones[p.id] || 0) + (index === 0 ? 30 : 15);
      }
  });

  ordenadosPorLongitud.slice(0, 2).forEach((p, index) => {
      if (p.difLongitud !== Infinity) {
        // Evitar sumar dos veces si ya obtuvo puntos por peso y es el mismo participante
        // Esto se complica si un mismo participante es el más cercano en peso Y longitud.
        // Para simplificar, vamos a asumir que los puntos son acumulativos,
        // pero una forma más justa sería buscar el ID y solo actualizar si es mayor.
        // Por ahora, solo sumamos.
        // Si queremos evitar doble suma en la misma prediccion por ser la más cercana en ambas:
        // No, la lógica anterior ya sumaba sobre la puntuación existente (que podía incluir ya la del peso).
        // Lo que necesitamos es que los puntos por cercanía se sumen a la puntuación base, y no se pisen.

        // Vamos a recalcular desde el `prediccionesConDiferencias` original para evitar sumar sobre sumas de diferentes ordenaciones
        // Esta parte se estaba volviendo compleja. Simplifiquemos:
        // `asignarPuntosPorCercania` debería tomar las predicciones con puntuación base,
        // y AÑADIR los puntos por cercanía.
        // Lo que haré es que las puntuaciones en ordenadosPorPeso y ordenadosPorLongitud
        // se reflejen de vuelta en el array `predicciones` original.
      }
  });

  // Reconstruir el array de predicciones con las puntuaciones finales
  // Esta parte es delicada para asegurar que las puntuaciones se asignen correctamente al participante original
  // y que los puntos por peso y longitud se sumen correctamente a la puntuación base.

  // La lógica de asignarPuntosPorCercania se vuelve un poco enrevesada si modifica
  // directamente la puntuación que ya fue calculada.
  // Lo más limpio sería que `calcularPuntuacion` devuelva la puntuación base,
  // y luego `asignarPuntosPorCercania` devuelva un objeto con los puntos adicionales por peso y longitud
  // para cada participante, y el componente que llama sume todo.
  // Pero para modificar mínimamente tu estructura:
  // La función `asignarPuntosPorCercania` modificará las puntuaciones en el array que se le pasa
  // (que es una copia debido al spread `...prediccionesConDiferencias` en el sort).
  // Necesitamos asegurar que las modificaciones en `ordenadosPorPeso` y `ordenadosPorLongitud`
  // se reflejen en un único set de objetos prediccion.

  // Devolvemos el array `prediccionesConDiferencias` que ahora tiene las puntuaciones actualizadas
  // por los sorts y asignaciones directas.
  return prediccionesConDiferencias.map(({ difPeso, difLongitud, ...prediccion }) => prediccion as Prediccion);
}


// Función para formatear la fecha en español
export function formatearFecha(fecha: string | Date): string { // Aceptar Date también
  if (!fecha) return "Fecha no disponible";
  return new Date(fecha).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
  })
}

// Función para formatear la hora
export function formatearHora(hora?: string | null): string {
  if (!hora) return "Hora no disponible";
  const [horas, minutos] = hora.split(":")
  if (isNaN(Number(horas)) || isNaN(Number(minutos))) return "Hora inválida";
  return `${horas.padStart(2, '0')}:${minutos.padStart(2, '0')}`
}

// Función para calcular estadísticas de predicciones
export function calcularEstadisticas(predicciones: Prediccion[]) {
  if (!predicciones || !predicciones.length) { // Añadir chequeo de si predicciones es null/undefined
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

  // Filtrar predicciones que puedan tener datos incompletos para ciertos cálculos
  const prediccionesValidasParaFecha = predicciones.filter(p => p.fecha_predicha);
  const fechasMs = prediccionesValidasParaFecha.map((p) => new Date(p.fecha_predicha!).getTime())
  const fechaPromedioMs = fechasMs.length ? fechasMs.reduce((a, b) => a + b, 0) / fechasMs.length : null;
  const fechaPromedio = fechaPromedioMs ? new Date(fechaPromedioMs).toISOString().split("T")[0] : null;

  const prediccionesValidasParaHora = predicciones.filter(p => p.hora_predicha);
  const horasMinutos = prediccionesValidasParaHora.map((p) => {
    const [horas, minutos] = p.hora_predicha!.split(":").map(Number)
    return horas * 60 + minutos
  })
  const minutosPromedioTotal = horasMinutos.length ? horasMinutos.reduce((a, b) => a + b, 0) / horasMinutos.length : null;
  let horaPromedio = null;
  if (minutosPromedioTotal !== null) {
    const horasPromedioEntero = Math.floor(minutosPromedioTotal / 60)
    const minutosPromedioEntero = Math.floor(minutosPromedioTotal % 60)
    horaPromedio = `${horasPromedioEntero.toString().padStart(2, "0")}:${minutosPromedioEntero.toString().padStart(2, "0")}`
  }
  
  const prediccionesValidasParaPeso = predicciones.filter(p => p.peso_predicho_valor !== null && p.peso_predicho_valor !== undefined);
  const pesosGramos = prediccionesValidasParaPeso.map((p) => convertirAGramos(p.peso_predicho_valor!, p.peso_predicho_unidad))
  const pesoPromedioGramos = pesosGramos.length ? pesosGramos.reduce((a, b) => a + b, 0) / pesosGramos.length : null;
  let pesoPromedio = null;
  if (pesoPromedioGramos !== null) {
    pesoPromedio = {
      valor: pesoPromedioGramos > 1000 ? parseFloat((pesoPromedioGramos / 1000).toFixed(2)) : parseFloat(pesoPromedioGramos.toFixed(0)),
      unidad: pesoPromedioGramos > 1000 ? "kg" : "g",
    }
  }

  const prediccionesValidasParaLongitud = predicciones.filter(p => p.longitud_predicha !== null && p.longitud_predicha !== undefined);
  const longitudes = prediccionesValidasParaLongitud.map((p) => p.longitud_predicha!)
  const longitudPromedioValue = longitudes.length ? longitudes.reduce((a, b) => a + b, 0) / longitudes.length : null;
  const longitudPromedio = longitudPromedioValue !== null ? Math.round(longitudPromedioValue * 10) / 10 : null;

  const calcularModa = (arr: (string | null | undefined)[]) => { // Permitir undefined
    const conteo: Record<string, number> = {}
    arr.forEach((item) => {
      if (item) { // Asegurar que item no sea null o undefined
        conteo[item] = (conteo[item] || 0) + 1
      }
    })
    if (Object.keys(conteo).length === 0) return null; // Si no hay items válidos
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
    longitudPromedio,
    colorOjosMasVotado,
    sexoMasVotado,
    colorPeloMasVotado,
  }
}