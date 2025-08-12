import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Plus, Edit3, Trash2, Eye, Calendar, Database, X } from 'lucide-react'
import { useStore } from '../store'

const ChartManagement: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, charts, activeDataset, getDataset, deleteChart, updateChart } = useStore()
  const [selectedChart, setSelectedChart] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  const selectedDataset = activeDataset ? getDataset(activeDataset) : null
  
  // Filter charts based on selected dataset
  const filteredCharts = selectedDataset 
    ? charts.filter(chart => chart.datasetId === selectedDataset.id)
    : charts
  
  const handleEditChart = (chartId: string) => {
    const chart = charts.find(c => c.id === chartId)
    if (chart) {
      // Navigate to the chart view/edit page
      navigate(`/chart/${chartId}`)
    }
  }
  
  const handleDeleteChart = (chartId: string) => {
    const chart = charts.find(c => c.id === chartId)
    
    let confirmMessage = 'Are you sure you want to delete this chart?'
    confirmMessage += ' This action cannot be undone.'
    
    if (confirm(confirmMessage)) {
      deleteChart(chartId)
    }
  }
  
  const handleCreateNewChart = () => {
    navigate('/chart/builder')
  }
  
  const handleViewChart = (chartId: string) => {
    navigate(`/chart/${chartId}`)
  }
  
  const handleStartTitleEdit = (chartId: string, currentTitle: string) => {
    setEditingTitle(chartId)
    setEditTitle(currentTitle)
  }
  
  const handleSaveTitleEdit = (chartId: string) => {
    if (editTitle.trim()) {
      updateChart(chartId, { title: editTitle.trim() })
    }
    setEditingTitle(null)
    setEditTitle('')
  }
  
  const handleCancelTitleEdit = () => {
    setEditingTitle(null)
    setEditTitle('')
  }
  
  const getChartSummary = (chart: any) => {
    const config = chart.config || {}
    const chartType = config.chartType || 'bar'
    const xField = config.xField || ''
    const yField = config.yField || ''
    
    return {
      chartType,
      xField,
      yField,
      fieldsText: `${xField} vs ${yField}`.slice(0, 30) + ((`${xField} vs ${yField}`).length > 30 ? '...' : '')
    }
  }
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }
  
  if (!selectedDataset) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Dataset Selected</h2>
          <p className="text-clr-text-secondary">Please select a dataset from the dashboard to view its charts</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-clr-text">Chart Management</h1>
          <p className="text-clr-text-secondary">
            Manage all charts for {selectedDataset.emoji} {selectedDataset.name}
          </p>
        </div>
        <button
          onClick={handleCreateNewChart}
          className="button-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Chart
        </button>
      </div>
      
      {filteredCharts.length === 0 ? (
        <div className="text-center py-12">
          <BarChart3 className="h-16 w-16 text-clr-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Charts Yet</h2>
          <p className="text-clr-text-secondary mb-6">
            Create your first chart to visualize your data
          </p>
          <button
            onClick={handleCreateNewChart}
            className="button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Chart
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCharts.map((chart) => {
            const summary = getChartSummary(chart)
            
            return (
              <div
                key={chart.id}
                className={`card p-6 cursor-pointer transition-all group ${
                  selectedChart === chart.id ? 'ring-2 ring-clr-primary' : 'hover:bg-clr-hover'
                }`}
                onClick={() => setSelectedChart(chart.id)}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <BarChart3 className="h-5 w-5 text-clr-success" />
                    {editingTitle === chart.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="input-field text-sm py-1 px-2 flex-1"
                          onBlur={() => handleSaveTitleEdit(chart.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitleEdit(chart.id)
                            } else if (e.key === 'Escape') {
                              handleCancelTitleEdit()
                            }
                          }}
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveTitleEdit(chart.id)
                          }}
                          className="p-1 hover:bg-clr-success hover:text-white rounded"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-clr-text truncate flex-1">
                        {chart.title}
                      </h3>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleStartTitleEdit(chart.id, chart.title)
                      }}
                      className="p-1 hover:bg-clr-warning hover:text-white rounded"
                      title="Edit title"
                    >
                      <Edit3 className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditChart(chart.id)
                      }}
                      className="p-1 hover:bg-clr-primary hover:text-white rounded"
                      title="Edit chart"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteChart(chart.id)
                      }}
                      className="p-1 hover:bg-clr-danger hover:text-white rounded"
                      title="Delete chart"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-clr-text-secondary">Type:</span>
                    <span className="text-clr-text capitalize">{summary.chartType}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-clr-text-secondary">Fields:</span>
                    <span className="text-clr-text truncate ml-2">{summary.fieldsText}</span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-clr-text-secondary">Created:</span>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3 text-clr-text-secondary" />
                      <span className="text-clr-text-secondary">{formatDate(chart.createdAt)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-clr-border">
                  <div className="flex items-center space-x-1">
                    <Database className="h-4 w-4 text-clr-text-secondary" />
                    <span className="text-sm text-clr-text-secondary">
                      {selectedDataset.emoji} {selectedDataset.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditChart(chart.id)
                      }}
                      className="text-sm text-clr-primary hover:text-clr-primary-dark"
                    >
                      Open
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default ChartManagement 