import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-6 md:mb-8 flex justify-center">
          <Image
            src="/images/babyslotterylogo-circular.png"
            alt="Baby's Lottery"
            width={240}
            height={240}
            className="object-contain"
            priority
          />
        </div>

        <h1 className="text-3xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-pink-500 to-blue-500 bg-clip-text text-transparent px-2">
          ¡Adivina cómo será nuestro bebé!
        </h1>

        <div className="bg-white rounded-lg shadow-lg p-4 md:p-8 mb-8">
          <p className="text-base md:text-lg mb-6">
            Bienvenido/a a nuestro juego de adivinanzas para baby shower. Registra tus predicciones sobre cómo será el
            bebé y el participante que más se acerque a la realidad ganará un premio especial. 🎁
          </p>

          <h2 className="text-xl md:text-2xl font-semibold mb-4 text-pink-600">¿Cómo funciona? 🤔</h2>

          <ol className="text-left space-y-4 mb-6">
            <li className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                1
              </span>
              <span className="text-sm md:text-base">
                Completa el formulario con tus predicciones sobre la fecha de nacimiento, peso, talla, color de ojos y
                más. ✍️
              </span>
            </li>
            <li className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                2
              </span>
              <span className="text-sm md:text-base">
                Cuando nazca el bebé, compararemos todas las predicciones con los datos reales. 📊
              </span>
            </li>
            <li className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center mr-2 mt-0.5 flex-shrink-0">
                3
              </span>
              <span className="text-sm md:text-base">
                El participante con más puntos (el que más se acerque a la realidad) será el ganador. 🏆
              </span>
            </li>
          </ol>

          <Button asChild size="lg" className="w-full md:w-auto mt-4">
            <Link href="/acceso-participante">¡Hacer mi predicción! ✍️🎁</Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
          <div className="bg-blue-50 rounded-lg p-4 md:p-6 shadow-sm">
            <h3 className="font-semibold text-base md:text-lg mb-2 text-blue-600">Fecha y Hora 📅</h3>
            <p className="text-sm md:text-base">Adivina cuándo llegará el bebé al mundo.</p>
          </div>

          <div className="bg-pink-50 rounded-lg p-4 md:p-6 shadow-sm">
            <h3 className="font-semibold text-base md:text-lg mb-2 text-pink-600">Características 👶</h3>
            <p className="text-sm md:text-base">Predice cómo será físicamente: peso, talla, color de ojos y pelo.</p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 md:p-6 shadow-sm">
            <h3 className="font-semibold text-base md:text-lg mb-2 text-purple-600">Premio 🎁</h3>
            <p className="text-sm md:text-base">El ganador recibirá un premio especial por sus dotes de adivinación.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
