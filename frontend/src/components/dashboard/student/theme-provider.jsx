// frontend/src/components/dashboard/student/theme-provider.jsx
import { ThemeProvider as NextThemesProvider } from "next-themes";
// Removed: type annotation for ThemeProviderProps was here

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}