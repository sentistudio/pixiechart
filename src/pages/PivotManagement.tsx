import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { RotateCcw, Plus, Edit3, Trash2, Eye, Calendar, Database, Table, Check } from 'lucide-react'
import { useStore } from '../store'

const PivotManagement: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, pivots, charts, activeDataset, getDataset, deletePivot, updatePivot } = useStore()
  const [editingTitle, setEditingTitle] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  
  const selectedDataset = activeDataset ? getDataset(activeDataset) : null
  
  // Filter pivots based on selected dataset
  const filteredPivots = selectedDataset 
    ? pivots.filter(pivot => pivot.datasetId === selectedDataset.id)
    : pivots
  
  const handleEditPivot = (pivotId: string) => {
    const pivot = pivots.find(p => p.id === pivotId)
    if (pivot) {
      // Set the pivot as active and navigate to pivot view
      const { setActivePivot } = useStore.getState()
      setActivePivot(pivotId)
      navigate('/pivot')
    }
  }
  
  const handleDeletePivot = (pivotId: string) => {
    const pivot = pivots.find(p => p.id === pivotId)
    const relatedCharts = charts.filter(c => c.pivotId === pivotId)
    
    let confirmMessage = 'Are you sure you want to delete this pivot table?'
    if (relatedCharts.length > 0) {
      confirmMessage += ` This will also delete ${relatedCharts.length} chart(s) that depend on this pivot.`
    }
    confirmMessage += ' This action cannot be undone.'
    
    if (confirm(confirmMessage)) {
      deletePivot(pivotId)
    }
  }
  
  const handleCreateNewPivot = () => {
    navigate('/pivot')
  }
  
  const handleStartTitleEdit = (pivotId: string, currentTitle: string) => {
    setEditingTitle(pivotId)
    setEditTitle(currentTitle)
  }
  
  const handleSaveTitleEdit = (pivotId: string) => {
    if (editTitle.trim()) {
      updatePivot(pivotId, { title: editTitle.trim() })
    }
    setEditingTitle(null)
    setEditTitle('')
  }
  
  const handleCancelTitleEdit = () => {
    setEditingTitle(null)
    setEditTitle('')
  }
  
  const getPivotSummary = (pivot: any) => {
    const config = pivot.config || {}
    const rowFields = config.rows || []
    const columnFields = config.columns || []
    const valueFields = config.values || []
    
    return {
      rows: rowFields.length,
      columns: columnFields.length,
      values: valueFields.length,
      rowFieldsText: rowFields.slice(0, 2).join(', ') + (rowFields.length > 2 ? '...' : ''),
      valueFieldsText: valueFields.slice(0, 2).map((v: any) => `${v.field} (${v.aggregation})`).join(', ') + (valueFields.length > 2 ? '...' : '')
    }
  }
  
  const getRelatedChartsCount = (pivotId: string) => {
    return charts.filter(c => c.pivotId === pivotId).length
  }
  
  if (!selectedDataset) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Dataset Selected</h2>
          <p className="text-clr-text-secondary">Please select a dataset from the dashboard to view its pivot tables</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-clr-text">Pivot Management</h1>
          <p className="text-clr-text-secondary">
            Manage all pivot tables for {selectedDataset.emoji} {selectedDataset.name}
          </p>
        </div>
        <button
          onClick={handleCreateNewPivot}
          className="button-primary"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create New Pivot
        </button>
      </div>
      
      {filteredPivots.length === 0 ? (
        <div className="text-center py-12">
          <RotateCcw className="h-16 w-16 text-clr-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Pivot Tables Yet</h2>
          <p className="text-clr-text-secondary mb-6">
            Create your first pivot table to summarize and analyze your data
          </p>
          <button
            onClick={handleCreateNewPivot}
            className="button-primary"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Pivot Table
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPivots.map((pivot) => {
            const summary = getPivotSummary(pivot)
            const relatedChartsCount = getRelatedChartsCount(pivot.id)
            
            return (
              <div
                key={pivot.id}
                className="card p-6 cursor-pointer transition-all group hover:bg-clr-hover"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2 flex-1">
                    <RotateCcw className="h-5 w-5 text-clr-info" />
                    {editingTitle === pivot.id ? (
                      <div className="flex items-center space-x-2 flex-1">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveTitleEdit(pivot.id)
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
                            handleSaveTitleEdit(pivot.id)
                          }}
                          className="p-1 rounded text-clr-primary hover:bg-clr-hover"
                          title="Save"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleCancelTitleEdit()
                          }}
                          className="p-1 rounded text-clr-text-secondary hover:bg-clr-hover"
                          title="Cancel"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <h3 className="font-semibold text-clr-text truncate">{pivot.title || 'Untitled Pivot'}</h3>
                    )}
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {editingTitle !== pivot.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStartTitleEdit(pivot.id, pivot.title || '')
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
                        handleEditPivot(pivot.id)
                      }}
                      className="p-1 hover:bg-clr-primary hover:text-white rounded"
                      title="Edit Pivot"
                    >
                      <Eye className="h-3 w-3" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeletePivot(pivot.id)
                      }}
                      className="p-1 hover:bg-clr-danger hover:text-white rounded"
                      title="Delete Pivot"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center space-x-2 text-clr-text-secondary">
                    <Database className="h-4 w-4" />
                    <span>{selectedDataset.emoji} {selectedDataset.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-clr-text-secondary">
                    <Table className="h-4 w-4" />
                    <span>{summary.rows} rows, {summary.columns} columns, {summary.values} values</span>
                  </div>
                  {summary.rowFieldsText && (
                    <div className="text-xs text-clr-text-secondary">
                      <span className="font-medium">Rows:</span> {summary.rowFieldsText}
                    </div>
                  )}
                  {summary.valueFieldsText && (
                    <div className="text-xs text-clr-text-secondary">
                      <span className="font-medium">Values:</span> {summary.valueFieldsText}
                    </div>
                  )}
                  <div className="flex items-center space-x-2 text-clr-text-secondary">
                    <Calendar className="h-4 w-4" />
                    <span>Updated {new Date(pivot.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-clr-info rounded-full"></div>
                    <span className="text-xs text-clr-text-secondary">
                      {relatedChartsCount} chart{relatedChartsCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <span className="text-xs text-clr-text-secondary">
                    Updated {new Date(pivot.updatedAt).toLocaleDateString()}
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

export default PivotManagement 