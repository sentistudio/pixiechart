import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LayoutDashboard, BarChart3, RotateCcw, Table, Settings, Upload, ChevronDown, Eye, Palette } from 'lucide-react'
import { cn } from '../utils'
import { useStore } from '../store'
import { useTheme } from '../store/theme'
import CSVImport from './CSVImport'
import SettingsModal from './SettingsModal'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const { datasets, activeDataset, setActiveDataset, addDataset } = useStore()
  const { theme } = useTheme()
  const [showImport, setShowImport] = React.useState(false)
  const [showSettings, setShowSettings] = React.useState(false)
  
  // Initialize theme on mount
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  
  // Auto-select first dataset if none selected but datasets exist
  React.useEffect(() => {
    if (!activeDataset && datasets.length > 0) {
      setActiveDataset(datasets[0].id)
    }
  }, [activeDataset, datasets, setActiveDataset])
  
  const selectedDataset = datasets.find(d => d.id === activeDataset)
  
  const handleImport = (dataset: any) => {
    addDataset(dataset)
    setActiveDataset(dataset.id)
    setShowImport(false)
  }
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, requiresDataset: false },
    { path: '/overview', label: 'Overview', icon: Eye, requiresDataset: true },
    { path: '/table', label: 'Table', icon: Table, requiresDataset: true },
    { path: '/pivot-management', label: 'Pivot', icon: RotateCcw, requiresDataset: true },
    { path: '/chart', label: 'Charts', icon: BarChart3, requiresDataset: true },
    { path: '/design', label: 'Designs', icon: Palette, requiresDataset: true },
  ]
  
  return (
    <div className="min-h-screen bg-clr-bg flex">
      {/* Sidebar */}
      <div className="w-64 bg-clr-bg-secondary border-r border-clr-border flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-clr-text">PixieChart</h1>
          <p className="text-sm text-clr-text-secondary mt-1">Data visualization made simple</p>
        </div>
        
        <nav className="px-4 space-y-2">
          {/* Dashboard - always visible */}
          <Link
            to="/"
            className={cn(
              "flex items-center px-4 py-3 text-sm font-medium rounded-apple transition-colors",
              location.pathname === '/'
                ? "bg-clr-primary text-white"
                : "text-clr-text hover:bg-clr-hover"
            )}
          >
            <LayoutDashboard className="h-5 w-5 mr-3" />
            Dashboard
          </Link>
          
          {/* Dataset Selector */}
          {datasets.length > 0 && (
            <div className="pt-4 pb-4">
              <label className="block text-xs font-medium text-clr-text-secondary mb-2 px-4">
                ACTIVE DATASET
              </label>
              <div className="relative">
                <select 
                  value={activeDataset || ''}
                  onChange={(e) => setActiveDataset(e.target.value || null)}
                  className="w-full bg-clr-bg border border-clr-border rounded-apple px-3 py-2 text-sm text-clr-text appearance-none pr-8 focus:ring-2 focus:ring-clr-primary focus:border-clr-primary truncate"
                >
                  {datasets.map(dataset => (
                    <option key={dataset.id} value={dataset.id}>
                      {dataset.emoji} {dataset.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-clr-text-secondary pointer-events-none" />
              </div>
              {selectedDataset && (
                <p className="text-xs text-clr-text-secondary mt-1 px-4">
                  {selectedDataset.rowCount.toLocaleString()} rows • {selectedDataset.source.toUpperCase()}
                </p>
              )}
            </div>
          )}
          
          {/* Dataset-specific navigation */}
          {navItems.slice(1).map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            const isDisabled = item.requiresDataset && !activeDataset
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center px-4 py-3 text-sm font-medium rounded-apple transition-colors",
                  isActive && !isDisabled
                    ? "bg-clr-primary text-white"
                    : isDisabled
                    ? "text-clr-text-secondary cursor-not-allowed opacity-50"
                    : "text-clr-text hover:bg-clr-hover"
                )}
                onClick={isDisabled ? (e) => e.preventDefault() : undefined}
              >
                <Icon className="h-5 w-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>
        
        <div className="flex-1"></div>
        
        <div className="p-4 border-t border-clr-border">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center w-full px-4 py-3 text-sm font-medium text-clr-text hover:bg-clr-hover rounded-apple transition-colors"
          >
            <Settings className="h-5 w-5 mr-3" />
            Settings
          </button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-clr-bg border-b border-clr-border px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h2 className="text-lg font-semibold text-clr-text">
                {navItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
              {selectedDataset && location.pathname !== '/' && (
                <span className="text-sm text-clr-text-secondary truncate">
                  • {selectedDataset.emoji} {selectedDataset.name}
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowImport(true)}
                className="button-secondary"
              >
                <Upload className="h-4 w-4 mr-2" />
                Import Dataset
              </button>
              <button className="button-primary">
                Export
              </button>
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
      
      {/* Dataset Import Modal */}
      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
      
      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  )
}

export default Layout 