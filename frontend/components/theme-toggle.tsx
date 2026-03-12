"use client"

import * as React from "react"
import { Moon, Sun, Monitor, Palette } from "lucide-react"
import { useTheme } from "./theme-provider"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  const getCurrentThemeIcon = () => {
    switch (theme) {
      case "light":
        return <Sun className="h-[1.2rem] w-[1.2rem]" />
      case "dark":
        return <Moon className="h-[1.2rem] w-[1.2rem]" />
      case "system":
        return <Monitor className="h-[1.2rem] w-[1.2rem]" />
      default:
        return <Palette className="h-[1.2rem] w-[1.2rem]" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="relative bg-background/60 backdrop-blur-sm border-border/40 hover:bg-muted/80 transition-all duration-200"
        >
          {getCurrentThemeIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 bg-background/95 backdrop-blur-sm border-border/40">
        <DropdownMenuLabel className="font-medium text-foreground">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Choose Theme
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setTheme("light")}
          className={`cursor-pointer transition-colors ${
            theme === "light" 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-muted/80"
          }`}
        >
          <div className="flex items-center gap-3 w-full">
            <Sun className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Light</div>
              <div className="text-xs text-muted-foreground">Bright and clean interface</div>
            </div>
            {theme === "light" && (
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            )}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("dark")}
          className={`cursor-pointer transition-colors ${
            theme === "dark" 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-muted/80"
          }`}
        >
          <div className="flex items-center gap-3 w-full">
            <Moon className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">Dark</div>
              <div className="text-xs text-muted-foreground">Easy on the eyes</div>
            </div>
            {theme === "dark" && (
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            )}
          </div>
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setTheme("system")}
          className={`cursor-pointer transition-colors ${
            theme === "system" 
              ? "bg-primary/10 text-primary" 
              : "hover:bg-muted/80"
          }`}
        >
          <div className="flex items-center gap-3 w-full">
            <Monitor className="h-4 w-4" />
            <div className="flex-1">
              <div className="font-medium">System</div>
              <div className="text-xs text-muted-foreground">Matches your device</div>
            </div>
            {theme === "system" && (
              <div className="h-2 w-2 rounded-full bg-primary"></div>
            )}
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
