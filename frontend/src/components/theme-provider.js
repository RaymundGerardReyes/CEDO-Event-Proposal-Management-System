"use client"
import { createContext, useContext, useEffect, useState } from "react"

const ThemeContext = createContext({ theme: "light", setTheme: () => {} })

export function ThemeProvider({ children, defaultTheme = "light", ...props }) {
  const [theme, setTheme] = useState(defaultTheme)

  useEffect(() => {
    // Apply theme to document element
    const root = window.document.documentElement
    root.classList.remove("light", "dark")
    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (newTheme) => {
      setTheme(newTheme)
      // Save theme preference to localStorage
      if (typeof window !== "undefined") {
        window.localStorage.setItem("theme", newTheme)
      }
    },
  }

  return (
    <ThemeContext.Provider value={value} {...props}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
