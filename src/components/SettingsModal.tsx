import React from 'react'
import { X, User, Palette, Bell, Shield, HelpCircle } from 'lucide-react'
import ThemeSwitch from './ThemeSwitch'
import { useStore } from '../store'
import { useTheme } from '../store/theme'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const [activeSection, setActiveSection] = React.useState('personalization')
  const { clearAllData } = useStore()
  const { setTheme } = useTheme()
  
  if (!isOpen) return null
  
  const handleClearAllData = () => {
    const confirmed = window.confirm(
      'Are you sure you want to clear all data? This will remove all datasets, charts, pivots, and designs. This action cannot be undone.'
    )
    
    if (confirmed) {
      // Clear the main store
      clearAllData()
      
      // Clear localStorage completely to remove any persisted data
      localStorage.removeItem('pixiechart-storage')
      localStorage.removeItem('pixiechart-theme')
      
      // Reset theme to default
      setTheme('light')
      
      // Close the modal
      onClose()
      
      // Show success message
      alert('All data has been cleared successfully. PixieChart has been reset to its initial state.')
    }
  }

  const sections = [
    {
      id: 'personalization',
      name: 'Personalization',
      icon: Palette,
      description: 'Themes and appearance'
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: Bell,
      description: 'Alerts and updates'
    },
    {
      id: 'privacy',
      name: 'Privacy & Security',
      icon: Shield,
      description: 'Data and privacy settings'
    },
    {
      id: 'help',
      name: 'Help & Support',
      icon: HelpCircle,
      description: 'Documentation and support'
    }
  ]

  const renderPersonalizationSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-clr-text mb-2">Appearance</h3>
        <p className="text-sm text-clr-text-secondary mb-4">
          Customize how PixieChart looks and feels
        </p>
        
        <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-clr-text">Theme</h4>
              <p className="text-sm text-clr-text-secondary">Choose your preferred color scheme</p>
            </div>
            <ThemeSwitch />
          </div>
        </div>
      </div>
    </div>
  )

  const renderNotificationsSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-clr-text mb-2">Notifications</h3>
        <p className="text-sm text-clr-text-secondary mb-4">
          Manage how you receive updates and alerts
        </p>
        
        <div className="space-y-4">
          <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-clr-text">Email Notifications</h4>
                <p className="text-sm text-clr-text-secondary">Receive updates via email</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-clr-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-clr-primary"></div>
              </label>
            </div>
          </div>
          
          <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-clr-text">Data Processing Updates</h4>
                <p className="text-sm text-clr-text-secondary">Get notified when data imports complete</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-clr-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-clr-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPrivacySection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-clr-text mb-2">Privacy & Security</h3>
        <p className="text-sm text-clr-text-secondary mb-4">
          Control your data and privacy settings
        </p>
        
        <div className="space-y-4">
          <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
            <h4 className="font-medium text-clr-text mb-2">Data Storage</h4>
            <p className="text-sm text-clr-text-secondary mb-3">
              Your data is stored locally in your browser's storage and never sent to external servers.
            </p>
            <button 
              onClick={handleClearAllData}
              className="button-secondary text-sm hover:bg-red-100 hover:text-red-700 hover:border-red-300"
            >
              Clear All Data
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderHelpSection = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-clr-text mb-2">Help & Support</h3>
        <p className="text-sm text-clr-text-secondary mb-4">
          Get help and learn more about PixieChart
        </p>
        
        <div className="space-y-4">
          <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
            <h4 className="font-medium text-clr-text mb-2">Documentation</h4>
            <p className="text-sm text-clr-text-secondary mb-3">
              Learn how to use PixieChart with our comprehensive guides
            </p>
            <button className="button-primary text-sm">
              View Documentation
            </button>
          </div>
          
          <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
            <h4 className="font-medium text-clr-text mb-2">Version</h4>
            <p className="text-sm text-clr-text-secondary">
              PixieChart v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  )

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'personalization':
        return renderPersonalizationSection()
      case 'notifications':
        return renderNotificationsSection()
      case 'privacy':
        return renderPrivacySection()
      case 'help':
        return renderHelpSection()
      default:
        return renderPersonalizationSection()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-clr-bg rounded-apple-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex relative">
        {/* Close button - Top right corner */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-clr-text-secondary hover:text-clr-text hover:bg-clr-hover rounded-apple transition-colors z-10"
        >
          <X className="h-4 w-4" />
        </button>
        
        {/* Sidebar */}
        <div className="w-64 bg-clr-bg-secondary border-r border-clr-border p-4">
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-clr-text">Settings</h2>
          </div>
          
          <nav className="space-y-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-2 text-sm rounded-apple transition-colors text-left ${
                    activeSection === section.id
                      ? 'bg-clr-primary text-white'
                      : 'text-clr-text hover:bg-clr-hover'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{section.name}</div>
                    <div className="text-xs opacity-75">{section.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  )
}

export default SettingsModal 