import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Database, Palette, Plus, RotateCcw, Table, Upload, Edit2, Save, X } from 'lucide-react'
import { useStore } from '../store'
import { generateRandomEmoji } from '../utils'

const Overview: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, charts, pivots, activeDataset, setActiveDataset, getDataset, updateDataset } = useStore()
  const [editingDataset, setEditingDataset] = useState(false)
  const [editName, setEditName] = useState('')
  const [editEmoji, setEditEmoji] = useState('')
  
  const selectedDataset = activeDataset ? getDataset(activeDataset) : null
  
  const handleEditStart = () => {
    if (selectedDataset) {
      setEditName(selectedDataset.name)
      setEditEmoji(selectedDataset.emoji)
      setEditingDataset(true)
    }
  }
  
  const handleEditSave = () => {
    if (selectedDataset && editName.trim()) {
      updateDataset(selectedDataset.id, {
        name: editName.trim(),
        emoji: editEmoji
      })
      setEditingDataset(false)
    }
  }
  
  const handleEditCancel = () => {
    setEditingDataset(false)
    setEditName('')
    setEditEmoji('')
  }
  
  const handleEmojiChange = () => {
    setEditEmoji(generateRandomEmoji())
  }
  
  // Filter data based on selected dataset
  const filteredCharts = selectedDataset 
    ? charts.filter(chart => chart.datasetId === selectedDataset.id)
    : []
  
  const filteredPivots = selectedDataset 
    ? pivots.filter(pivot => pivot.datasetId === selectedDataset.id)
    : []
  
  if (!selectedDataset) {
    return (
      <div className="h-full bg-clr-bg p-6 flex items-center justify-center">
        <div className="text-center">
          <Database className="h-16 w-16 text-clr-text-secondary mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Dataset Selected</h2>
          <p className="text-clr-text-secondary">Please select a dataset to view its overview</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="h-full bg-clr-bg p-6 overflow-auto">
      <div className="max-w-7xl mx-auto">
        {/* Dataset Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {editingDataset ? (
                <div className="flex items-center space-x-3">
                  <button
                    onClick={handleEmojiChange}
                    className="text-4xl hover:scale-110 transition-transform"
                  >
                    {editEmoji}
                  </button>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-3xl font-bold text-clr-text bg-clr-bg border border-clr-border rounded-apple px-3 py-1 focus:ring-2 focus:ring-clr-primary focus:border-clr-primary"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') handleEditSave()
                      if (e.key === 'Escape') handleEditCancel()
                    }}
                    autoFocus
                  />
                  <button
                    onClick={handleEditSave}
                    className="p-2 text-clr-success hover:bg-clr-success/10 rounded-apple transition-colors"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                  <button
                    onClick={handleEditCancel}
                    className="p-2 text-clr-text-secondary hover:bg-clr-hover rounded-apple transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3 min-w-0">
                  <span className="text-4xl flex-shrink-0">{selectedDataset.emoji}</span>
                  <h1 className="text-3xl font-bold text-clr-text truncate">{selectedDataset.name}</h1>
                  <button
                    onClick={handleEditStart}
                    className="p-2 text-clr-text-secondary hover:bg-clr-hover rounded-apple transition-colors flex-shrink-0"
                  >
                    <Edit2 className="h-5 w-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
          <p className="text-clr-text-secondary mt-2">
            {selectedDataset.rowCount.toLocaleString()} rows • {selectedDataset.source.toUpperCase()} • Last updated {new Date(selectedDataset.updatedAt).toLocaleDateString()}
          </p>
        </div>
        
        {/* Dataset Overview */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-clr-text mb-4">Dataset Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clr-text-secondary">Total Rows</p>
                  <p className="text-2xl font-bold text-clr-text">{selectedDataset.rowCount.toLocaleString()}</p>
                </div>
                <Database className="h-8 w-8 text-clr-primary" />
              </div>
            </div>
            
            <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clr-text-secondary">Columns</p>
                  <p className="text-2xl font-bold text-clr-text">{Object.keys(selectedDataset.schema).length}</p>
                </div>
                <Table className="h-8 w-8 text-clr-primary" />
              </div>
            </div>
            
            <div className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-clr-text-secondary">Charts</p>
                  <p className="text-2xl font-bold text-clr-text">{filteredCharts.length}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-clr-primary" />
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Charts */}
        {filteredCharts.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-clr-text">Recent Charts</h2>
              <button 
                onClick={() => navigate('/chart')}
                className="button-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chart
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCharts.slice(0, 6).map((chart) => (
                <div 
                  key={chart.id}
                  onClick={() => navigate(`/chart/${chart.id}`)}
                  className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border hover:bg-clr-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-clr-text truncate">{chart.title}</h3>
                    <BarChart3 className="h-5 w-5 text-clr-primary" />
                  </div>
                  <p className="text-sm text-clr-text-secondary mb-2 capitalize">{chart.type} chart</p>
                  <p className="text-xs text-clr-text-secondary">
                    Created {new Date(chart.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Pivots */}
        {filteredPivots.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-clr-text">Recent Pivots</h2>
              <button 
                onClick={() => navigate('/pivot')}
                className="button-primary"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Pivot
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPivots.slice(0, 6).map((pivot) => (
                <div 
                  key={pivot.id}
                  onClick={() => navigate(`/pivot/${pivot.id}`)}
                  className="bg-clr-bg-secondary rounded-apple p-4 border border-clr-border hover:bg-clr-hover transition-colors cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-clr-text">Pivot Table</h3>
                    <RotateCcw className="h-5 w-5 text-clr-primary" />
                  </div>
                  <p className="text-sm text-clr-text-secondary mb-2">
                    {pivot.rows.length} rows • {pivot.columns.length} columns • {pivot.values.length} values
                  </p>
                  <p className="text-xs text-clr-text-secondary">
                    Created {new Date(pivot.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-clr-text mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => navigate('/table')}
              className="p-4 bg-clr-bg-secondary rounded-apple border border-clr-border hover:bg-clr-hover transition-colors text-left"
            >
              <Table className="h-8 w-8 text-clr-primary mb-2" />
              <h3 className="font-medium text-clr-text">View Table</h3>
              <p className="text-sm text-clr-text-secondary">Explore your data</p>
            </button>
            
            <button 
              onClick={() => navigate('/pivot')}
              className="p-4 bg-clr-bg-secondary rounded-apple border border-clr-border hover:bg-clr-hover transition-colors text-left"
            >
              <RotateCcw className="h-8 w-8 text-clr-primary mb-2" />
              <h3 className="font-medium text-clr-text">Create Pivot</h3>
              <p className="text-sm text-clr-text-secondary">Summarize your data</p>
            </button>
            
            <button 
              onClick={() => navigate('/chart')}
              className="p-4 bg-clr-bg-secondary rounded-apple border border-clr-border hover:bg-clr-hover transition-colors text-left"
            >
              <BarChart3 className="h-8 w-8 text-clr-primary mb-2" />
              <h3 className="font-medium text-clr-text">Create Chart</h3>
              <p className="text-sm text-clr-text-secondary">Visualize your data</p>
            </button>
            
            {filteredCharts.length > 0 && (
              <button 
                onClick={() => navigate(`/design/${filteredCharts[0].id}`)}
                className="p-4 bg-clr-bg-secondary rounded-apple border border-clr-border hover:bg-clr-hover transition-colors text-left"
              >
                <Palette className="h-8 w-8 text-clr-primary mb-2" />
                <h3 className="font-medium text-clr-text">Design Chart</h3>
                <p className="text-sm text-clr-text-secondary">Customize appearance</p>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Overview 