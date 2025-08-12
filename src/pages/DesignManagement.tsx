import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Palette, Plus, Edit3, Trash2, Eye, Calendar, BarChart3, Database, Check } from 'lucide-react'
import { useStore } from '../store'

const DesignManagement: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, charts, designs, activeDataset, getDataset, getChart, deleteDesign, updateDesign } = useStore()
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  const selectedDataset = activeDataset ? getDataset(activeDataset) : null
  
  // Filter designs based on selected dataset
  const filteredDesigns = selectedDataset 
    ? designs.filter(design => {
        const chart = getChart(design.chartId)
        return chart?.datasetId === selectedDataset.id
      })
    : designs
  
  const handleEditDesign = (designId: string) => {
    const design = designs.find(d => d.id === designId)
    if (design) {
      navigate(`/design/${design.chartId}`)
    }
  }
  
  const handleDeleteDesign = (designId: string) => {
    if (confirm('Are you sure you want to delete this design? This action cannot be undone.')) {
      deleteDesign(designId)
    }
  }
  
  const handleCreateNewDesign = () => {
    navigate('/chart')
  }
  
  const handleStartTitleEdit = (designId: string, currentTitle: string) => {
    setEditingTitle(designId)
    setEditTitle(currentTitle)
  }
  
  const handleSaveTitleEdit = (designId: string) => {
    if (editTitle.trim()) {
      updateDesign(designId, { title: editTitle.trim() })
    }
    setEditingTitle(null)
    setEditTitle('')
  }
  
  const handleCancelTitleEdit = () => {
    setEditingTitle(null)
    setEditTitle('')
  }
  
  const getDesignSourceInfo = (design: any) => {
    const chart = getChart(design.chartId)
    if (!chart) return { chartTitle: 'Unknown Chart', datasetName: 'Unknown Dataset', emoji: '❓' }
    
    const dataset = getDataset(chart.datasetId || '')
    return {
      chartTitle: chart.title,
      datasetName: dataset?.name || 'Unknown Dataset',
      emoji: dataset?.emoji || '❓'
    }
  }
  
  if (!selectedDataset) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Dataset Selected</h2>
          <p className="text-clr-text-secondary">Please select a dataset from the dashboard to view its designs</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-clr-text">Design Management</h1>
          <p className="text-clr-text-secondary">
            Manage all design files for {selectedDataset.emoji} {selectedDataset.name}
          </p>
        </div>
        <button
          onClick={handleCreateNewDesign}
          className="button-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Design
        </button>
      </div>
      
      {filteredDesigns.length === 0 ? (
        <div className="text-center py-12">
          <Palette className="h-16 w-16 text-clr-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Designs Yet</h2>
          <p className="text-clr-text-secondary mb-6">
            Create your first design by building a chart and entering Design Mode
          </p>
          <button
            onClick={handleCreateNewDesign}
            className="button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Chart & Design
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDesigns.map((design) => {
            const { chartTitle, datasetName, emoji } = getDesignSourceInfo(design)
            
            return (
              <div
                key={design.id}
                className="card p-6 cursor-pointer transition-all group hover:bg-clr-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <Palette className="h-5 w-5 text-clr-primary" />
                    {editingTitle === design.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitleEdit(design.id)
                            } else if (e.key === 'Escape') {
                              handleCancelTitleEdit()
                            }
                          }}
                          className="input-field text-sm flex-1 min-w-0"
                          autoFocus
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleSaveTitleEdit(design.id)
                          }}
                          className="p-1 hover:bg-clr-success hover:text-white rounded"
                          title="Save"
                        >
                          <Check className="h-3 w-3" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelTitleEdit()
                          }}
                          className="p-1 hover:bg-clr-text-secondary hover:text-white rounded"
                          title="Cancel"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-clr-text truncate flex-1">{design.title || chartTitle}</h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingTitle !== design.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartTitleEdit(design.id, design.title || chartTitle)
                        }}
                        className="p-1 hover:bg-clr-warning hover:text-white rounded"
                        title="Edit Title"
                      >
                        <Edit3 className="h-3 w-3" />
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditDesign(design.id)
                      }}
                      className="p-1 hover:bg-clr-primary hover:text-white rounded"
                      title="View Design"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteDesign(design.id)
                      }}
                      className="p-1 hover:bg-clr-danger hover:text-white rounded"
                      title="Delete Design"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-clr-text-secondary">
                    <Database className="h-4 w-4" />
                    <span>{emoji} {datasetName}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-clr-text-secondary">
                    <BarChart3 className="h-4 w-4" />
                    <span>From chart: {chartTitle}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-clr-text-secondary">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(design.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-clr-success rounded-full"></div>
                    <span className="text-xs text-clr-text-secondary">Design saved</span>
                  </div>
                  <span className="text-xs text-clr-text-secondary">
                    Updated {new Date(design.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
      

    </div>
  )
}

export default DesignManagement 