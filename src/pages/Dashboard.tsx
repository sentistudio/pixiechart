import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Database, Palette, Plus, RotateCcw, Table, Upload, Edit2, Save, X, Trash2, Eye, Layers, TrendingUp, Activity, Calendar, FileText, Lightbulb, ChevronRight } from 'lucide-react'
import { useStore } from '../store'
import { generateRandomEmoji } from '../utils'
import CSVImport from '../components/CSVImport'

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, charts, pivots, designs, addDataset, updateDataset, deleteDataset, setActiveDataset, setActivePivot, getDesignsByDataset } = useStore()
  const [showImport, setShowImport] = useState(false)
  const [editingDataset, setEditingDataset] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  const [showGetStarted, setShowGetStarted] = useState(() => {
    // Check localStorage to see if user has dismissed the intro
    const dismissed = localStorage.getItem('pixiechart-intro-dismissed')
    return dismissed !== 'true'
  })

  const handleDismissIntro = () => {
    setShowGetStarted(false)
    localStorage.setItem('pixiechart-intro-dismissed', 'true')
  }

  const handleShowIntro = () => {
    setShowGetStarted(true)
    localStorage.setItem('pixiechart-intro-dismissed', 'false')
  }

  const handleImportSampleData = (type: 'sales' | 'survey' | 'analytics') => {
    const sampleData = {
      sales: {
        id: 'sample-sales-2024',
        name: 'Sales Performance 2024',
        emoji: '📊',
        source: 'csv' as const,
        rowCount: 156,
        schema: {
          'Month': 'string',
          'Region': 'string', 
          'Product': 'string',
          'Sales': 'string',
          'Profit': 'string',
          'Units_Sold': 'string'
        },
        data: Array.from({ length: 156 }, (_, i) => ({
          Month: `2024-${String((i % 12) + 1).padStart(2, '0')}`,
          Region: ['North America', 'Europe', 'Asia Pacific', 'Latin America'][i % 4],
          Product: ['Laptop Pro', 'Desktop Elite', 'Tablet Max', 'Monitor Ultra'][i % 4],
          Sales: String(Math.floor(Math.random() * 100000) + 10000),
          Profit: String(Math.floor(Math.random() * 20000) + 2000),
          Units_Sold: String(Math.floor(Math.random() * 500) + 50)
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      survey: {
        id: 'sample-survey-2024',
        name: 'Customer Satisfaction Survey',
        emoji: '📝',
        source: 'csv' as const,
        rowCount: 240,
        schema: {
          'Date': 'string',
          'Customer_Type': 'string',
          'Department': 'string',
          'Rating': 'string',
          'Satisfaction': 'string'
        },
        data: Array.from({ length: 240 }, (_, i) => ({
          Date: `2024-10-${String((i % 30) + 1).padStart(2, '0')}`,
          Customer_Type: ['Premium', 'Standard', 'Basic'][i % 3],
          Department: ['Sales', 'Support', 'Technical'][i % 3],
          Rating: String(Math.floor(Math.random() * 5) + 1),
          Satisfaction: ['Very Satisfied', 'Satisfied', 'Neutral', 'Dissatisfied'][Math.floor(Math.random() * 4)]
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      analytics: {
        id: 'sample-analytics-2024',
        name: 'Website Analytics',
        emoji: '🌐',
        source: 'csv' as const,
        rowCount: 90,
        schema: {
          'Date': 'string',
          'Page_Views': 'string',
          'Unique_Visitors': 'string',
          'Bounce_Rate': 'string',
          'Traffic_Source': 'string'
        },
        data: Array.from({ length: 90 }, (_, i) => ({
          Date: `2024-${String(Math.floor(i/30) + 8).padStart(2, '0')}-${String((i % 30) + 1).padStart(2, '0')}`,
          Page_Views: String(Math.floor(Math.random() * 5000) + 1000),
          Unique_Visitors: String(Math.floor(Math.random() * 3000) + 500),
          Bounce_Rate: String((Math.random() * 50 + 20).toFixed(1)),
          Traffic_Source: ['Organic Search', 'Direct', 'Social Media', 'Paid Ads'][i % 4]
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
    
    addDataset(sampleData[type])
    setActiveDataset(sampleData[type].id)
  }
  
  const handleImport = (dataset: any) => {
    addDataset(dataset)
    setActiveDataset(dataset.id)
    setShowImport(false)
  }
  
  const handleEditStart = (dataset: any) => {
    setEditName(dataset.name)
    setEditEmoji(dataset.emoji)
    setEditingDataset(dataset.id)
  }
  
  const handleEditSave = (datasetId: string) => {
    if (editName.trim()) {
      updateDataset(datasetId, {
        name: editName.trim(),
        emoji: editEmoji
      })
      setEditingDataset(null)
    }
  }
  
  const handleEditCancel = () => {
    setEditingDataset(null)
    setEditName('')
    setEditEmoji('')
  }
  
  const handleEmojiChange = () => {
    setEditEmoji(generateRandomEmoji())
  }
  
  const handleDeleteDataset = (datasetId: string) => {
    const datasetCharts = getDatasetCharts(datasetId)
    const datasetPivots = getDatasetPivots(datasetId)
    const datasetDesigns = getDatasetDesigns(datasetId)
    
    const totalItems = datasetCharts.length + datasetPivots.length + datasetDesigns.length
    
    if (totalItems > 0) {
      const message = `This dataset contains ${totalItems} items (${datasetCharts.length} charts, ${datasetPivots.length} pivots, ${datasetDesigns.length} designs).\n\nDeleting this dataset will permanently remove all associated content. Are you sure you want to continue?`
      if (confirm(message)) {
        deleteDataset(datasetId)
      }
    } else {
      if (confirm('Are you sure you want to delete this dataset?')) {
        deleteDataset(datasetId)
      }
    }
  }
  
  const handleDatasetClick = (datasetId: string) => {
    setActiveDataset(datasetId)
    navigate('/overview')
  }
  
  const getDatasetCharts = (datasetId: string) => {
    return charts.filter(chart => chart.datasetId === datasetId)
  }
  
  const getDatasetPivots = (datasetId: string) => {
    return pivots.filter(pivot => pivot.datasetId === datasetId)
  }
  
  const getDatasetDesigns = (datasetId: string) => {
    return getDesignsByDataset(datasetId)
  }
  
  const getActivityLevel = (datasetId: string) => {
    const datasetCharts = getDatasetCharts(datasetId)
    const datasetPivots = getDatasetPivots(datasetId)
    const datasetDesigns = getDatasetDesigns(datasetId)
    
    const totalItems = datasetCharts.length + datasetPivots.length + datasetDesigns.length
    
    if (totalItems === 0) return { level: 'none', color: 'text-clr-text-secondary', bgColor: 'bg-clr-bg', label: 'No activity' }
    if (totalItems <= 3) return { level: 'low', color: 'text-yellow-600', bgColor: 'bg-yellow-50', label: 'Low activity' }
    if (totalItems <= 8) return { level: 'medium', color: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Medium activity' }
    return { level: 'high', color: 'text-green-600', bgColor: 'bg-green-50', label: 'High activity' }
  }
  
  const workflowSteps = [
    {
      id: 'import',
      title: 'Import Data',
      description: 'Start by uploading CSV files, connecting to Google Sheets, or linking your Notion databases',
      icon: Upload,
      completed: datasets.length > 0
    },
    {
      id: 'explore',
      title: 'Explore Data',
      description: 'View, filter, and edit your data in interactive table views with sorting and search',
      icon: Table,
      completed: datasets.length > 0
    },
    {
      id: 'pivot',
      title: 'Create Pivots',
      description: 'Summarize and aggregate your data with drag-and-drop pivot tables',
      icon: RotateCcw,
      completed: pivots.length > 0
    },
    {
      id: 'chart',
      title: 'Create Charts',
      description: 'Build beautiful visualizations with bar, line, pie charts and more',
      icon: BarChart3,
      completed: charts.length > 0
    },
    {
      id: 'design',
      title: 'Design Charts',
      description: 'Customize colors, fonts, and layouts with the visual design editor',
      icon: Palette,
      completed: designs.length > 0
    }
  ]

  // Get contextual tip based on user's current state
  const getContextualTip = () => {
    if (datasets.length === 0) {
      return {
        icon: Upload,
        title: "Ready to get started?",
        description: "Import your first dataset to begin exploring your data and creating visualizations, or try sample data to explore the features.",
        action: "Import Dataset",
        onClick: () => setShowImport(true),
        showSampleData: true
      }
    }
    
    if (datasets.length > 0 && pivots.length === 0 && charts.length === 0) {
      return {
        icon: BarChart3,
        title: "Great! Now let's visualize your data",
        description: "You have datasets ready. Create your first chart or pivot table to start analyzing your data.",
        action: "Create Chart",
        onClick: () => navigate('/chart')
      }
    }
    
    if (charts.length > 0 && designs.length === 0) {
      return {
        icon: Palette,
        title: "Make your charts beautiful",
        description: "Customize your charts with the design editor to match your brand and style preferences.",
        action: "Design Charts",
        onClick: () => navigate(`/design/${charts[0].id}`)
      }
    }
    
    if (datasets.length > 0 && pivots.length === 0) {
      return {
        icon: RotateCcw,
        title: "Try pivot tables",
        description: "Create pivot tables to summarize and analyze your data from different angles.",
        action: "Create Pivot",
        onClick: () => navigate('/pivot-management')
      }
    }
    
    return {
      icon: Lightbulb,
      title: "You're all set!",
      description: "You've explored most of PixieChart's features. Keep creating and refining your data visualizations.",
      action: "Explore More",
      onClick: () => navigate('/overview')
    }
  }

  const contextualTip = getContextualTip()

  return (
    <div className="p-6 h-full overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-clr-text mb-2">Dashboard</h1>
            <p className="text-clr-text-secondary">Manage your data and visualizations</p>
          </div>
          {!showGetStarted && (
            <button
              onClick={handleShowIntro}
              className="inline-flex items-center space-x-2 px-3 py-2 text-sm font-medium text-clr-primary hover:text-clr-primary/80 hover:bg-clr-primary/5 rounded-apple transition-colors"
            >
              <Lightbulb className="h-4 w-4" />
              <span>Show Guide</span>
            </button>
          )}
        </div>
      </div>
      
      {/* Get Started Introduction */}
      {showGetStarted && (
        <div className="mb-8 bg-gradient-to-r from-clr-primary/5 to-clr-primary/10 rounded-apple-lg border border-clr-primary/20 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-clr-primary/10 rounded-apple">
                <Lightbulb className="h-6 w-6 text-clr-primary" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-clr-text">Welcome to PixieChart</h2>
                <p className="text-clr-text-secondary">Your complete data visualization platform</p>
              </div>
            </div>
            <button
              onClick={handleDismissIntro}
              className="p-2 text-clr-text-secondary hover:text-clr-text hover:bg-clr-hover rounded-apple transition-colors"
              title="Dismiss introduction"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="mb-6">
            <p className="text-clr-text mb-4">
              PixieChart helps you transform raw data into beautiful, interactive visualizations. Here's what you can do:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
              {workflowSteps.map((step, index) => {
                const Icon = step.icon
                const isCompleted = step.completed
                
                return (
                  <div
                    key={step.id}
                    className={`p-4 rounded-apple border transition-all ${
                      isCompleted 
                        ? 'bg-clr-primary/5 border-clr-primary/30 shadow-sm' 
                        : 'bg-clr-bg border-clr-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Icon className={`h-6 w-6 ${isCompleted ? 'text-clr-primary' : 'text-clr-text-secondary'}`} />
                      <div className="flex items-center space-x-1">
                        <span className="text-xs text-clr-text-secondary">{index + 1}</span>
                        {isCompleted && (
                          <div className="w-2 h-2 bg-clr-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                    <h3 className="font-medium text-clr-text mb-1">{step.title}</h3>
                    <p className="text-sm text-clr-text-secondary leading-relaxed">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Contextual Tip */}
          <div className="bg-clr-bg rounded-apple border border-clr-border p-4">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-clr-primary/10 rounded-apple flex-shrink-0">
                <contextualTip.icon className="h-5 w-5 text-clr-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-clr-text mb-1">{contextualTip.title}</h3>
                <p className="text-sm text-clr-text-secondary mb-3">{contextualTip.description}</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={contextualTip.onClick}
                    className="inline-flex items-center space-x-2 text-sm font-medium text-clr-primary hover:text-clr-primary/80 transition-colors"
                  >
                    <span>{contextualTip.action}</span>
                    <ChevronRight className="h-4 w-4" />
                  </button>
                  {contextualTip.showSampleData && (
                    <>
                      <span className="text-sm text-clr-text-secondary">or try:</span>
                      <button
                        onClick={() => handleImportSampleData('sales')}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-clr-text bg-clr-bg-secondary hover:bg-clr-hover rounded-apple transition-colors"
                      >
                        <span>📊</span>
                        <span>Sales Data</span>
                      </button>
                      <button
                        onClick={() => handleImportSampleData('survey')}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-clr-text bg-clr-bg-secondary hover:bg-clr-hover rounded-apple transition-colors"
                      >
                        <span>📝</span>
                        <span>Survey Data</span>
                      </button>
                      <button
                        onClick={() => handleImportSampleData('analytics')}
                        className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-medium text-clr-text bg-clr-bg-secondary hover:bg-clr-hover rounded-apple transition-colors"
                      >
                        <span>🌐</span>
                        <span>Analytics Data</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      

      
      {/* Datasets */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-clr-text">Datasets</h2>
          <button 
            onClick={() => setShowImport(true)}
            className="button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Import Dataset
          </button>
        </div>
        
        {datasets.length === 0 ? (
          <div className="text-center py-16 bg-clr-bg-secondary rounded-apple-lg border border-clr-border">
            <Database className="h-20 w-20 text-clr-text-secondary mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold text-clr-text mb-2">No datasets yet</h3>
            <p className="text-clr-text-secondary mb-8 max-w-md mx-auto">
              Import your first dataset from CSV, Google Sheets, or Notion to start creating charts, pivots, and designs
            </p>
            <button 
              onClick={() => setShowImport(true)}
              className="button-primary"
            >
              <Upload className="h-4 w-4 mr-2" />
              Import Dataset
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {datasets.map((dataset) => {
              const datasetCharts = getDatasetCharts(dataset.id)
              const datasetPivots = getDatasetPivots(dataset.id)
              const datasetDesigns = getDatasetDesigns(dataset.id)
              const activityLevel = getActivityLevel(dataset.id)
              
              return (
                <div
                  key={dataset.id}
                  className="group relative bg-clr-bg border border-clr-border rounded-apple-lg p-6 hover:shadow-lg hover:border-clr-primary/20 transition-all duration-300 cursor-pointer overflow-hidden"
                  onClick={() => handleDatasetClick(dataset.id)}
                >
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-clr-primary to-transparent rounded-full transform translate-x-8 -translate-y-8"></div>
                  </div>
                  
                  {/* Header */}
                  <div className="relative flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      {editingDataset === dataset.id ? (
                        <div className="flex items-center space-x-2 flex-1 min-w-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEmojiChange()
                            }}
                            className="text-3xl hover:bg-clr-hover rounded-apple p-1 transition-colors"
                          >
                            {editEmoji}
                          </button>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 min-w-0 text-xl font-bold bg-transparent border-b-2 border-clr-primary focus:outline-none"
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          <span className="text-3xl">{dataset.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-xl font-bold text-clr-text truncate group-hover:text-clr-primary transition-colors">
                              {dataset.name}
                            </h3>
                            <div className="flex items-center space-x-2 mt-1">
                              <span className="px-2 py-1 text-xs rounded-full bg-clr-bg-secondary text-clr-text-secondary font-medium">
                                {dataset.source.toUpperCase()}
                              </span>
                              <span className={`px-2 py-1 text-xs rounded-full ${activityLevel.bgColor} ${activityLevel.color} font-medium`}>
                                {activityLevel.label}
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {editingDataset === dataset.id ? (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditSave(dataset.id)
                            }}
                            className="p-2 rounded-apple text-white bg-clr-primary hover:bg-clr-primary/90 transition-colors"
                          >
                            <Save className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditCancel()
                            }}
                            className="p-2 rounded-apple text-clr-text-secondary hover:bg-clr-hover transition-colors"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditStart(dataset)
                            }}
                            className="p-2 rounded-apple text-clr-text-secondary hover:text-clr-primary hover:bg-clr-hover transition-colors"
                            title="Edit dataset"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteDataset(dataset.id)
                            }}
                            className="p-2 rounded-apple text-clr-text-secondary hover:text-clr-error hover:bg-clr-error/10 transition-colors"
                            title="Delete dataset"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Dataset Info */}
                  <div className="relative grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center space-x-2 text-clr-text-secondary">
                      <Layers className="h-4 w-4" />
                      <span className="text-sm">
                        <span className="font-semibold text-clr-text">{dataset.rowCount.toLocaleString()}</span> rows
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-clr-text-secondary">
                      <FileText className="h-4 w-4" />
                      <span className="text-sm">
                        <span className="font-semibold text-clr-text">{Object.keys(dataset.schema).length}</span> columns
                      </span>
                    </div>
                  </div>
                  
                  {/* Statistics */}
                  <div className="relative grid grid-cols-3 gap-3 mb-6">
                    <div className="bg-clr-bg-secondary rounded-apple p-3 text-center group/stat hover:bg-clr-hover transition-colors">
                      <div className="flex items-center justify-center mb-1">
                        <BarChart3 className="h-4 w-4 text-clr-primary mr-1" />
                        <span className="text-lg font-bold text-clr-text">{datasetCharts.length}</span>
                      </div>
                      <div className="text-xs text-clr-text-secondary font-medium">Charts</div>
                    </div>
                    <div className="bg-clr-bg-secondary rounded-apple p-3 text-center group/stat hover:bg-clr-hover transition-colors">
                      <div className="flex items-center justify-center mb-1">
                        <RotateCcw className="h-4 w-4 text-clr-primary mr-1" />
                        <span className="text-lg font-bold text-clr-text">{datasetPivots.length}</span>
                      </div>
                      <div className="text-xs text-clr-text-secondary font-medium">Pivots</div>
                    </div>
                    <div className="bg-clr-bg-secondary rounded-apple p-3 text-center group/stat hover:bg-clr-hover transition-colors">
                      <div className="flex items-center justify-center mb-1">
                        <Palette className="h-4 w-4 text-clr-primary mr-1" />
                        <span className="text-lg font-bold text-clr-text">{datasetDesigns.length}</span>
                      </div>
                      <div className="text-xs text-clr-text-secondary font-medium">Designs</div>
                    </div>
                  </div>
                  
                  {/* Footer */}
                  <div className="relative flex items-center justify-between">
                    <div className="flex items-center space-x-2 text-clr-text-secondary">
                      <Calendar className="h-4 w-4" />
                      <span className="text-sm">
                        Updated {new Date(dataset.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveDataset(dataset.id)
                          navigate('/overview')
                        }}
                        className="flex items-center space-x-1 text-clr-primary hover:text-clr-primary/80 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="text-sm font-medium">View</span>
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      {/* Recent Activity */}
      {(charts.length > 0 || pivots.length > 0 || designs.length > 0) && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-clr-text mb-4">Recent Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Recent Pivots */}
            {pivots.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-clr-text mb-3">Recent Pivots</h3>
                <div className="space-y-2">
                  {pivots.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map((pivot) => {
                    const dataset = datasets.find(d => d.id === pivot.datasetId)
                    return (
                                             <div 
                         key={pivot.id}
                         onClick={() => {
                           setActivePivot(pivot.id)
                           navigate('/pivot')
                         }}
                         className="flex items-center space-x-3 p-3 bg-clr-bg-secondary rounded-apple hover:bg-clr-hover transition-colors cursor-pointer"
                       >
                        <RotateCcw className="h-5 w-5 text-clr-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-clr-text">{pivot.title || 'Pivot Table'}</p>
                          <p className="text-xs text-clr-text-secondary">
                            {dataset?.emoji} {dataset?.name} • {new Date(pivot.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Recent Charts */}
            {charts.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-clr-text mb-3">Recent Charts</h3>
                <div className="space-y-2">
                  {charts.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map((chart) => {
                    const dataset = datasets.find(d => d.id === chart.datasetId)
                    return (
                      <div 
                        key={chart.id}
                        onClick={() => navigate(`/chart/${chart.id}`)}
                        className="flex items-center space-x-3 p-3 bg-clr-bg-secondary rounded-apple hover:bg-clr-hover transition-colors cursor-pointer"
                      >
                        <BarChart3 className="h-5 w-5 text-clr-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-clr-text">{chart.title}</p>
                          <p className="text-xs text-clr-text-secondary">
                            {dataset?.emoji} {dataset?.name} • {new Date(chart.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
            
            {/* Recent Designs */}
            {designs.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-clr-text mb-3">Recent Designs</h3>
                <div className="space-y-2">
                  {designs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3).map((design) => {
                    const chart = charts.find(c => c.id === design.chartId)
                    const dataset = datasets.find(d => d.id === chart?.datasetId)
                    return (
                      <div 
                        key={design.id}
                        onClick={() => navigate(`/design/${design.chartId}`)}
                        className="flex items-center space-x-3 p-3 bg-clr-bg-secondary rounded-apple hover:bg-clr-hover transition-colors cursor-pointer"
                      >
                        <Palette className="h-5 w-5 text-clr-primary" />
                        <div className="flex-1">
                          <p className="font-medium text-clr-text">{design.title}</p>
                          <p className="text-xs text-clr-text-secondary">
                            {dataset?.emoji} {dataset?.name} • {new Date(design.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Dataset Import Modal */}
      {showImport && (
        <CSVImport
          onClose={() => setShowImport(false)}
          onImport={handleImport}
        />
      )}
    </div>
  )
}

export default Dashboard 