"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"
interface ThemeCtx { theme: Theme; toggle: () => void }

const Ctx = createContext<ThemeCtx>({ theme: "light", toggle: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light")

  // Applique la classe dark sur <html>
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [theme])

  // Initialisation depuis localStorage ou préférence système
  useEffect(() => {
    const stored = localStorage.getItem("admin-theme") as Theme | null
    const pref = stored ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    setTheme(pref)
  }, [])

  function toggle() {
    setTheme(prev => {
      const next: Theme = prev === "light" ? "dark" : "light"
      localStorage.setItem("admin-theme", next)
      return next
    })
  }

  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>
}

export function useTheme() { return useContext(Ctx) }
