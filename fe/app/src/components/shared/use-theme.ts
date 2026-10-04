import { createContext, useContext } from "react"

export type Theme = string

export interface ThemeOption {
    value: string
    label?: string
    endpoint?: string
    client?: string
}

export type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme, clientOverride?: string) => void
    themes: ThemeOption[]
    isFetchingStyleConfig: boolean
}

const initialState: ThemeProviderState = {
    theme: "default",
    setTheme: () => null,
    themes: [],
    isFetchingStyleConfig: false,
}

export const ThemeProviderContext =
    createContext<ThemeProviderState>(initialState)

export const useTheme = () => {
    const context = useContext(ThemeProviderContext)
    return context || initialState
}
