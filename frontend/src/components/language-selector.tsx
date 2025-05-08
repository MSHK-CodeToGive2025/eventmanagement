import { useState, useEffect } from "react"
import { Check, Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Language = {
  code: string
  name: string
  flag: string
}

const languages: Language[] = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "zh", name: "中文", flag: "🇨🇳" },
]

export function LanguageSelector({ className }: { className?: string }) {
  const [currentLanguage, setCurrentLanguage] = useState<Language>(languages[0])
  const [mounted, setMounted] = useState(false)

  // Ensure component is mounted to avoid hydration issues
  useEffect(() => {
    setMounted(true)

    // Check for stored language preference
    const storedLang = localStorage.getItem("preferredLanguage")
    if (storedLang) {
      const foundLang = languages.find((lang) => lang.code === storedLang)
      if (foundLang) setCurrentLanguage(foundLang)
    }
  }, [])

  const selectLanguage = (language: Language) => {
    setCurrentLanguage(language)
    localStorage.setItem("preferredLanguage", language.code)
    // In a real app, you would also change the app's locale/translations here
  }

  if (!mounted) return null

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("flex items-center gap-1 px-2 hover:bg-gray-100 rounded-full", className)}
        >
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline text-sm font-medium">{currentLanguage.flag}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            className={cn(
              "flex items-center gap-2 cursor-pointer",
              currentLanguage.code === language.code && "font-medium",
            )}
            onClick={() => selectLanguage(language)}
          >
            <span className="text-base">{language.flag}</span>
            <span>{language.name}</span>
            {currentLanguage.code === language.code && <Check className="h-4 w-4 ml-auto" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
