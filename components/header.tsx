"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { User, LogOut, Menu } from "lucide-react"

export function Header() {
  const { isAuthenticated, user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const closeSheet = () => setIsOpen(false)

  const NavLinks = () => (
    <>
      <Button asChild variant="ghost" onClick={closeSheet}>
        <Link href="/">Inicio 🏠</Link>
      </Button>

      {isAuthenticated ? (
        <>
          <Button asChild variant="ghost" onClick={closeSheet}>
            <Link href="/portal-papas/dashboard">Mi Dashboard 📊</Link>
          </Button>
        </>
      ) : (
        <>
          <Button asChild variant="ghost" onClick={closeSheet}>
            <Link href="/acceso-participante">Participar 🎮</Link>
          </Button>
          <Button asChild variant="ghost" onClick={closeSheet}>
            <Link href="/acceso-resultados">Resultados 🏆</Link>
          </Button>
          <Button asChild variant="outline" onClick={closeSheet}>
            <Link href="/crear-evento">Registrar Bebé ✨</Link>
          </Button>
          <Button asChild variant="default" onClick={closeSheet}>
            <Link href="/login-papas">Iniciar Sesión 👨‍👩‍👦</Link>
          </Button>
        </>
      )}
    </>
  )

  return (
    <header className="bg-gradient-to-r from-pink-100 to-blue-100 py-4 px-6 shadow-sm">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 z-10">
          <div className="w-10 h-10 relative flex-shrink-0">
            <Image
              src="/images/babyslotterylogo-circular.png"
              alt="Logo de Baby's Lottery"
              fill
              sizes="(max-width: 768px) 40px, 40px"
              className="object-contain"
              priority
            />
          </div>
          <span className="text-xl sm:text-2xl font-bold text-pink-600 hidden sm:inline">BABY&apos;S LOTTERY</span>
        </Link>

        {/* Navegación para pantallas medianas y grandes */}
        <nav className="hidden md:flex space-x-4 items-center">
          <NavLinks />

          {isAuthenticated && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline max-w-[120px] truncate">{user?.nombre_evento}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Mi Bebé 👨‍👩‍👦</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/portal-papas/dashboard">Dashboard 📊</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={logout} className="text-red-500">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>

        {/* Menú hamburguesa para móviles */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Abrir menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 relative">
                <Image
                  src="/images/babyslotterylogo-circular.png"
                  alt="Logo de Baby's Lottery"
                  fill
                  sizes="32px"
                  className="object-contain"
                />
              </div>
              <span className="font-bold text-pink-600">BABY&apos;S LOTTERY</span>
            </div>
            <nav className="flex flex-col space-y-4">
              <NavLinks />

              {isAuthenticated && (
                <>
                  <div className="py-2 px-4 bg-pink-50 rounded-md">
                    <p className="font-medium text-sm truncate">👨‍👩‍👦 {user?.nombre_evento}</p>
                    <p className="text-xs text-gray-500 truncate">{user?.email_admin}</p>
                  </div>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      logout()
                      closeSheet()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Cerrar Sesión
                  </Button>
                </>
              )}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  )
}
