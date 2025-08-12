import React, { useState } from 'react'
import { Sun, Moon, Zap, ChevronDown } from 'lucide-react'
import { useTheme, ThemeMode } from '../store/theme'

const ThemeSwitch: React.FC = () => {
  const { theme, setTheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  const themes = [
    { 
      id: 'light' as ThemeMode, 
      name: 'Light', 
      icon: Sun, 
      description: 'Light mode'
    },
    { 
      id: 'dark' as ThemeMode, 
      name: 'Dark', 
      icon: Moon, 
      description: 'Dark mode'
    },
    { 
      id: 'blue' as ThemeMode, 
      name: 'Blue', 
      icon: Zap, 
      description: 'Blue light mode'
    }
  ]

  const currentTheme = themes.find(t => t.id === theme) || themes[0]

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 text-sm text-clr-text-secondary hover:text-clr-text hover:bg-clr-hover rounded-apple transition-colors"
      >
        <currentTheme.icon className="h-4 w-4" />
        <span className="hidden sm:inline">{currentTheme.name}</span>
        <ChevronDown className="h-3 w-3" />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 top-full mt-2 w-48 bg-clr-bg-secondary border border-clr-border rounded-apple shadow-lg z-20">
            <div className="p-1">
              {themes.map((themeOption) => {
                const Icon = themeOption.icon
                return (
                  <button
                    key={themeOption.id}
                    onClick={() => {
                      setTheme(themeOption.id)
                      setIsOpen(false)
                    }}
                    className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-apple transition-colors ${
                      theme === themeOption.id
                        ? 'bg-clr-primary text-white'
                        : 'text-clr-text hover:bg-clr-hover'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <div className="flex-1 text-left">
                      <div className="font-medium">{themeOption.name}</div>
                      <div className="text-xs opacity-75">{themeOption.description}</div>
                    </div>
                    {theme === themeOption.id && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default ThemeSwitch 