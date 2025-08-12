import React, { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Plus, 
  X, 
  BarChart3, 
  Download, 
  Settings, 
  ChevronDown, 
  ChevronRight, 
  Filter,
  ArrowUp,
  ArrowDown,
  MoreHorizontal,
  Search,
  Check
} from 'lucide-react'
import { useStore } from '../store'
import { generateId, aggregateData } from '../utils'

interface PivotField {
  field: string
  type: 'text' | 'number' | 'date' | 'boolean'
  order: 'asc' | 'desc'
  sortBy: 'field' | string // field name or value field
  showTotals: boolean
  repeatLabels?: boolean // only for rows
}

interface PivotValueField {
  field: string
  aggregation: 'sum' | 'avg' | 'count' | 'count_unique' | 'min' | 'max'
  showAs: 'default' | 'percent_row' | 'percent_column' | 'percent_grand' | 'difference' | 'running_total'
}

interface PivotFilter {
  field: string
  type: 'text' | 'number' | 'date' | 'boolean'
  values: string[]
  dateRange?: { start: string; end: string }
}

interface PivotConfig {
  rows: PivotField[]
  columns: PivotField[]
  values: PivotValueField[]
  filters: PivotFilter[]
}

interface GroupedData {
  [key: string]: any[]
}

interface PivotRow {
  id: string
  level: number
  isExpanded: boolean
  isTotal: boolean
  label: string
  values: { [key: string]: any }
  children?: PivotRow[]
  parentId?: string
}

const PivotView: React.FC = () => {
  const navigate = useNavigate()
  const { datasets, activeDataset, getDataset, addPivot, charts, addChart } = useStore()
  const dataset = getDataset(activeDataset || '')
  
  const [pivotTitle, setPivotTitle] = useState('')
  const [pivotConfig, setPivotConfig] = useState<PivotConfig>({
    rows: [],
    columns: [],
    values: [],
    filters: []
  })
  
  const [draggedField, setDraggedField] = useState<string | null>(null)
  const [draggedFrom, setDraggedFrom] = useState<string | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [selectedFilters, setSelectedFilters] = useState<{ [key: string]: string[] }>({})
  const [showFieldSettings, setShowFieldSettings] = useState<{ field: string; type: 'row' | 'column' | 'value' } | null>(null)
  const [showFilterDialog, setShowFilterDialog] = useState<string | null>(null)
  
  // Detect field types from data
  const fieldTypes = useMemo(() => {
    if (!dataset) return {}
    
    const types: { [key: string]: 'text' | 'number' | 'date' | 'boolean' } = {}
    const sampleSize = Math.min(100, dataset.data.length)
    
    Object.keys(dataset.data[0] || {}).forEach(field => {
      const samples = dataset.data.slice(0, sampleSize).map(row => row[field])
      
      // Check if mostly numbers
      const numericCount = samples.filter(val => !isNaN(Number(val)) && val !== '' && val !== null).length
      if (numericCount > sampleSize * 0.8) {
        types[field] = 'number'
        return
      }
      
      // Check if dates
      const dateCount = samples.filter(val => {
        const date = new Date(val)
        return !isNaN(date.getTime()) && val.toString().match(/\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}/)
      }).length
      if (dateCount > sampleSize * 0.8) {
        types[field] = 'date'
        return
      }
      
      // Check if boolean
      const booleanCount = samples.filter(val => 
        val === true || val === false || val === 'true' || val === 'false'
      ).length
      if (booleanCount > sampleSize * 0.8) {
        types[field] = 'boolean'
        return
      }
      
      types[field] = 'text'
    })
    
    return types
  }, [dataset])
  
  // Available fields for dragging
  const availableFields = useMemo(() => {
    if (!dataset) return []
    return Object.keys(dataset.data[0] || {}).filter(field => {
      const usedInRows = pivotConfig.rows.some(r => r.field === field)
      const usedInColumns = pivotConfig.columns.some(c => c.field === field)
      const usedInValues = pivotConfig.values.some(v => v.field === field)
      return !usedInRows && !usedInColumns && !usedInValues
    })
  }, [dataset, pivotConfig])
  
  // Generate column groups for pivot table
  const generateColumnGroups = useCallback((data: any[], columns: PivotField[]): string[] => {
    if (columns.length === 0) return ['Grand Total']
    
    const groups = new Set<string>()
    
    data.forEach(row => {
      const path = columns.map(col => String(row[col.field] || 'Other')).join(' › ')
      groups.add(path)
    })
    
    const sortedGroups = Array.from(groups).sort()
    
    // Add totals if needed
    if (columns.some(c => c.showTotals)) {
      const withTotals: string[] = []
      sortedGroups.forEach(group => {
        withTotals.push(group)
        // Add subtotals for each level
        const parts = group.split(' › ')
        for (let i = 0; i < parts.length - 1; i++) {
          const subtotal = parts.slice(0, i + 1).join(' › ') + ' Total'
          if (!withTotals.includes(subtotal)) {
            withTotals.push(subtotal)
          }
        }
      })
      withTotals.push('Grand Total')
      return withTotals
    }
    
    sortedGroups.push('Grand Total')
    return sortedGroups
  }, [])
  
  // Aggregate values based on function
  const aggregateValue = useCallback((data: any[], valueField: PivotValueField): number => {
    if (data.length === 0) return 0
    
    const values = data.map(row => row[valueField.field]).filter(val => val !== null && val !== undefined && val !== '')
    
    switch (valueField.aggregation) {
      case 'sum':
        return values.reduce((sum, val) => sum + (Number(val) || 0), 0)
      case 'avg':
        const numericValues = values.filter(val => !isNaN(Number(val))).map(Number)
        return numericValues.length > 0 ? numericValues.reduce((sum, val) => sum + val, 0) / numericValues.length : 0
      case 'count':
        return values.length
      case 'count_unique':
        return new Set(values).size
      case 'min':
        const minValues = values.filter(val => !isNaN(Number(val))).map(Number)
        return minValues.length > 0 ? Math.min(...minValues) : 0
      case 'max':
        const maxValues = values.filter(val => !isNaN(Number(val))).map(Number)
        return maxValues.length > 0 ? Math.max(...maxValues) : 0
      default:
        return 0
    }
  }, [])
  
  // Build hierarchical row structure
  const buildRowHierarchy = useCallback((data: any[], rows: PivotField[], values: PivotValueField[], columns: string[], level: number, parentId: string): PivotRow[] => {
    if (level >= rows.length) return []
    
    const currentField = rows[level]
    const groups = new Map<string, any[]>()
    
    // Group data by current field
    data.forEach(row => {
      const key = String(row[currentField.field] || 'Other')
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key)!.push(row)
    })
    
    const result: PivotRow[] = []
    
    // Sort groups
    const sortedKeys = Array.from(groups.keys()).sort((a, b) => {
      if (currentField.order === 'desc') return b.localeCompare(a)
      return a.localeCompare(b)
    })
    
    sortedKeys.forEach(key => {
      const groupData = groups.get(key)!
      const rowId = `${parentId}:${key}:${level}`
      
      // Calculate values for this group
      const rowValues: { [key: string]: any } = {}
      columns.forEach(col => {
        const colData = col === 'Grand Total' ? groupData : groupData.filter(row => {
          const path = pivotConfig.columns.map(c => String(row[c.field] || 'Other')).join(' › ')
          return path === col
        })
        
        values.forEach(valueField => {
          const valueKey = `${col}:${valueField.field}`
          rowValues[valueKey] = aggregateValue(colData, valueField)
        })
      })
      
      const pivotRow: PivotRow = {
        id: rowId,
        level,
        isExpanded: expandedRows.has(rowId),
        isTotal: false,
        label: key,
        values: rowValues,
        parentId
      }
      
      // Add children if there are more levels
      if (level < rows.length - 1) {
        pivotRow.children = buildRowHierarchy(groupData, rows, values, columns, level + 1, rowId)
      }
      
      result.push(pivotRow)
      
      // Add subtotal if needed
      if (currentField.showTotals && level < rows.length - 1) {
        const subtotalRow: PivotRow = {
          id: `${rowId}:total`,
          level: level + 1,
          isExpanded: false,
          isTotal: true,
          label: `${key} Total`,
          values: { ...rowValues }, // Same values as parent
          parentId: rowId
        }
        result.push(subtotalRow)
      }
    })
    
    return result
  }, [pivotConfig.columns, aggregateValue, expandedRows])
  
  // Generate row groups for pivot table
  const generateRowGroups = useCallback((data: any[], rows: PivotField[], values: PivotValueField[], columns: string[]): PivotRow[] => {
    if (rows.length === 0) {
      // No row grouping, just aggregate all data
      const aggregated: { [key: string]: any } = {}
      
      columns.forEach(col => {
        const colData = col === 'Grand Total' ? data : data.filter(row => {
          const path = pivotConfig.columns.map(c => String(row[c.field] || 'Other')).join(' › ')
          return path === col
        })
        
        values.forEach(valueField => {
          const key = `${col}:${valueField.field}`
          aggregated[key] = aggregateValue(colData, valueField)
        })
      })
      
      return [{
        id: 'root',
        level: 0,
        isExpanded: true,
        isTotal: false,
        label: 'Grand Total',
        values: aggregated
      }]
    }
    
    return buildRowHierarchy(data, rows, values, columns, 0, 'root')
  }, [pivotConfig.columns, aggregateValue, buildRowHierarchy])
  
  // Generate pivot data
  const pivotData = useMemo(() => {
    if (!dataset || pivotConfig.values.length === 0) return { rows: [], columns: [] }
    
    try {
      let data = [...dataset.data]
      
      // Apply filters
      pivotConfig.filters.forEach(filter => {
        if (filter.values.length === 0) return
        data = data.filter(row => filter.values.includes(String(row[filter.field])))
      })
      
      // Generate column structure
      const columnGroups = generateColumnGroups(data, pivotConfig.columns)
      
      // Generate row structure  
      const rowGroups = generateRowGroups(data, pivotConfig.rows, pivotConfig.values, columnGroups)
      
      return { rows: rowGroups, columns: columnGroups }
    } catch (error) {
      console.error('Error generating pivot data:', error)
      return { rows: [], columns: [] }
    }
  }, [dataset, pivotConfig, generateColumnGroups, generateRowGroups])
  
  // Flatten rows for display
  const flattenedRows = useMemo(() => {
    try {
      const flatten = (rows: PivotRow[]): PivotRow[] => {
        const result: PivotRow[] = []
        
        rows.forEach(row => {
          result.push(row)
          if (row.children && row.isExpanded) {
            result.push(...flatten(row.children))
          }
        })
        
        return result
      }
      
      return flatten(pivotData.rows || [])
    } catch (error) {
      console.error('Error flattening rows:', error)
      return []
    }
  }, [pivotData.rows, expandedRows])
  
  // Handle drag and drop
  const handleDragStart = (field: string, from: string) => {
    setDraggedField(field)
    setDraggedFrom(from)
  }
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }
  
  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault()
    
    if (!draggedField || !draggedFrom) return
    
    try {
      const newConfig = { ...pivotConfig }
      
      // Remove from source
      if (draggedFrom === 'available') {
        // Already handled by availableFields filter
      } else if (draggedFrom === 'rows') {
        newConfig.rows = newConfig.rows.filter(r => r.field !== draggedField)
      } else if (draggedFrom === 'columns') {
        newConfig.columns = newConfig.columns.filter(c => c.field !== draggedField)
      } else if (draggedFrom === 'values') {
        newConfig.values = newConfig.values.filter(v => v.field !== draggedField)
      } else if (draggedFrom === 'filters') {
        newConfig.filters = newConfig.filters.filter(f => f.field !== draggedField)
      }
      
      // Add to destination
      if (zone === 'rows') {
        newConfig.rows.push({
          field: draggedField,
          type: fieldTypes[draggedField] || 'text',
          order: 'asc',
          sortBy: 'field',
          showTotals: false,
          repeatLabels: false
        })
      } else if (zone === 'columns') {
        newConfig.columns.push({
          field: draggedField,
          type: fieldTypes[draggedField] || 'text',
          order: 'asc',
          sortBy: 'field',
          showTotals: false
        })
      } else if (zone === 'values') {
        const fieldType = fieldTypes[draggedField] || 'text'
        newConfig.values.push({
          field: draggedField,
          aggregation: fieldType === 'number' ? 'sum' : 'count',
          showAs: 'default'
        })
      } else if (zone === 'filters') {
        if (dataset?.data) {
          const uniqueValues = Array.from(new Set(dataset.data.map(row => String(row[draggedField]))))
          newConfig.filters.push({
            field: draggedField,
            type: fieldTypes[draggedField] || 'text',
            values: uniqueValues
          })
        }
      }
      
      setPivotConfig(newConfig)
      setDraggedField(null)
      setDraggedFrom(null)
    } catch (error) {
      console.error('Error handling drop:', error)
      setDraggedField(null)
      setDraggedFrom(null)
    }
  }
  
  // Toggle row expansion
  const toggleRowExpansion = (rowId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(rowId)) {
      newExpanded.delete(rowId)
    } else {
      newExpanded.add(rowId)
    }
    setExpandedRows(newExpanded)
  }
  
  // Save pivot
  const savePivot = () => {
    if (!dataset) return
    
    const title = pivotTitle.trim() || generatePivotTitle()
    
    const pivot = {
      id: generateId(),
      datasetId: dataset.id,
      title,
      rows: pivotConfig.rows.map(r => r.field),
      columns: pivotConfig.columns.map(c => c.field),
      values: pivotConfig.values.map(v => ({ field: v.field, aggregation: v.aggregation })),
      filters: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    addPivot(pivot)
    navigate('/pivot-management')
  }
  
  // Generate pivot title
  const generatePivotTitle = () => {
    const rowsText = pivotConfig.rows.length > 0 ? pivotConfig.rows.map(r => r.field).join(', ') : 'All Data'
    const valuesText = pivotConfig.values.length > 0 ? pivotConfig.values.map(v => `${v.field} (${v.aggregation})`).join(', ') : 'Count'
    return `${rowsText} by ${valuesText}`
  }
  
  // Clear all configuration
  const clearAll = () => {
    setPivotConfig({
      rows: [],
      columns: [],
      values: [],
      filters: []
    })
    setExpandedRows(new Set())
    setSelectedFilters({})
  }
  
  if (!dataset) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-clr-text-secondary mb-4">No dataset selected</p>
          <button
            onClick={() => navigate('/')}
            className="button-primary"
          >
            Select Dataset
          </button>
        </div>
      </div>
    )
  }
  
  return (
    <div className="p-6 h-full">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-clr-text">Pivot Table Builder</h1>
            <p className="text-clr-text-secondary">
              Build interactive pivot tables with grouping, aggregation, and filtering
            </p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/pivot-management')}
              className="button-secondary"
            >
              Cancel
            </button>
            
            <button
              onClick={savePivot}
              disabled={pivotConfig.values.length === 0}
              className="button-primary disabled:opacity-50"
            >
              Save Pivot
            </button>
          </div>
        </div>
        
        {/* Title Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-clr-text mb-2">
            Pivot Title (optional)
          </label>
          <input
            type="text"
            value={pivotTitle}
            onChange={(e) => setPivotTitle(e.target.value)}
            placeholder={generatePivotTitle()}
            className="input-field"
          />
        </div>
        
        <div className="flex flex-1 gap-6">
        {/* Configuration Panel */}
        <div className="w-80 bg-clr-bg-secondary rounded-apple border border-clr-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-clr-text">Pivot Configuration</h3>
            <button
              onClick={clearAll}
              className="text-sm text-clr-text-secondary hover:text-clr-text"
            >
              Clear all
            </button>
          </div>
          
          {/* Available Fields */}
          <div>
            <h4 className="text-sm font-medium text-clr-text mb-2">Available Fields</h4>
            <div className="grid grid-cols-2 gap-2">
              {availableFields.map(field => (
                <div
                  key={field}
                  draggable
                  onDragStart={() => handleDragStart(field, 'available')}
                  className="px-3 py-2 bg-clr-bg rounded-apple border border-clr-border cursor-move hover:bg-clr-hover text-sm"
                >
                  {field}
                </div>
              ))}
            </div>
          </div>
          
          {/* Rows */}
          <div>
            <h4 className="text-sm font-medium text-clr-text mb-2">Rows</h4>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'rows')}
              className="min-h-[80px] p-3 border-2 border-dashed border-clr-border rounded-apple space-y-2"
            >
              {pivotConfig.rows.map((row, index) => (
                <div key={`${row.field}-${index}`} className="flex items-center justify-between px-3 py-2 bg-blue-50 rounded-apple">
                  <span className="text-sm">{row.field}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowFieldSettings({ field: row.field, type: 'row' })}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const newConfig = { ...pivotConfig }
                        newConfig.rows = newConfig.rows.filter(r => r.field !== row.field)
                        setPivotConfig(newConfig)
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {pivotConfig.rows.length === 0 && (
                <div className="text-center text-clr-text-secondary text-sm py-4">
                  Drop fields here to create row groups
                </div>
              )}
            </div>
          </div>
          
          {/* Columns */}
          <div>
            <h4 className="text-sm font-medium text-clr-text mb-2">Columns</h4>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'columns')}
              className="min-h-[80px] p-3 border-2 border-dashed border-clr-border rounded-apple space-y-2"
            >
              {pivotConfig.columns.map((col, index) => (
                <div key={`${col.field}-${index}`} className="flex items-center justify-between px-3 py-2 bg-green-50 rounded-apple">
                  <span className="text-sm">{col.field}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowFieldSettings({ field: col.field, type: 'column' })}
                      className="p-1 hover:bg-green-100 rounded"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const newConfig = { ...pivotConfig }
                        newConfig.columns = newConfig.columns.filter(c => c.field !== col.field)
                        setPivotConfig(newConfig)
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {pivotConfig.columns.length === 0 && (
                <div className="text-center text-clr-text-secondary text-sm py-4">
                  Drop fields here to create column groups
                </div>
              )}
            </div>
          </div>
          
          {/* Values */}
          <div>
            <h4 className="text-sm font-medium text-clr-text mb-2">Values</h4>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'values')}
              className="min-h-[80px] p-3 border-2 border-dashed border-clr-border rounded-apple space-y-2"
            >
              {pivotConfig.values.map((val, index) => (
                <div key={`${val.field}-${index}`} className="flex items-center justify-between px-3 py-2 bg-purple-50 rounded-apple">
                  <span className="text-sm">{val.field} ({val.aggregation})</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowFieldSettings({ field: val.field, type: 'value' })}
                      className="p-1 hover:bg-purple-100 rounded"
                    >
                      <Settings className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const newConfig = { ...pivotConfig }
                        newConfig.values = newConfig.values.filter(v => v.field !== val.field)
                        setPivotConfig(newConfig)
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {pivotConfig.values.length === 0 && (
                <div className="text-center text-clr-text-secondary text-sm py-4">
                  Drop fields here to aggregate values
                </div>
              )}
            </div>
          </div>
          
          {/* Filters */}
          <div>
            <h4 className="text-sm font-medium text-clr-text mb-2">Filters</h4>
            <div
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, 'filters')}
              className="min-h-[80px] p-3 border-2 border-dashed border-clr-border rounded-apple space-y-2"
            >
              {pivotConfig.filters.map((filter, index) => (
                <div key={`${filter.field}-${index}`} className="flex items-center justify-between px-3 py-2 bg-orange-50 rounded-apple">
                  <span className="text-sm">{filter.field}</span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setShowFilterDialog(filter.field)}
                      className="p-1 hover:bg-orange-100 rounded"
                    >
                      <Filter className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => {
                        const newConfig = { ...pivotConfig }
                        newConfig.filters = newConfig.filters.filter(f => f.field !== filter.field)
                        setPivotConfig(newConfig)
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              ))}
              {pivotConfig.filters.length === 0 && (
                <div className="text-center text-clr-text-secondary text-sm py-4">
                  Drop fields here to filter data
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Pivot Table */}
        <div className="flex-1 bg-white rounded-apple border border-clr-border overflow-hidden">
          {pivotConfig.values.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-clr-text-secondary mb-4">Add at least one value field to see the pivot table</p>
              </div>
            </div>
          ) : !pivotData.rows || pivotData.rows.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <p className="text-clr-text-secondary mb-4">No data to display</p>
              </div>
            </div>
          ) : (
            <div className="overflow-auto h-full">
              <div className="inline-block min-w-full">
                <table className="table-auto border-collapse">
                  <thead className="bg-clr-bg-secondary sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-clr-text border-r border-clr-border bg-clr-bg-secondary sticky left-0 min-w-0 max-w-xs resize-horizontal overflow-hidden whitespace-nowrap">
                        <div className="truncate">
                          {pivotConfig.rows.map(r => r.field).join(' / ') || 'Rows'}
                        </div>
                      </th>
                      {(pivotData.columns || []).map(col => (
                        <th key={col} className="px-4 py-2 text-center text-sm font-medium text-clr-text border-r border-clr-border min-w-0 max-w-xs resize-horizontal overflow-hidden whitespace-nowrap">
                          <div className="truncate">
                            {col}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {flattenedRows.map(row => (
                      <tr key={row.id} className="border-b border-clr-border hover:bg-clr-bg-secondary">
                        <td className="px-4 py-2 text-sm text-clr-text border-r border-clr-border bg-white sticky left-0 min-w-0 max-w-xs resize-horizontal overflow-hidden">
                          <div className="flex items-center" style={{ paddingLeft: `${row.level * 20}px` }}>
                            {row.children && row.children.length > 0 && (
                              <button
                                onClick={() => toggleRowExpansion(row.id)}
                                className="mr-2 p-1 hover:bg-clr-hover rounded flex-shrink-0"
                              >
                                {row.isExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                              </button>
                            )}
                            <span className={`truncate ${row.isTotal ? 'font-semibold' : ''}`}>{row.label}</span>
                          </div>
                        </td>
                        {(pivotData.columns || []).map(col => (
                          <td key={col} className="px-4 py-2 text-sm text-clr-text text-center border-r border-clr-border min-w-0 max-w-xs resize-horizontal overflow-hidden whitespace-nowrap">
                            <div className="truncate">
                              {pivotConfig.values.map(valueField => {
                                const key = `${col}:${valueField.field}`
                                const value = row.values?.[key]
                                if (value === undefined || value === null || isNaN(value)) return '0'
                                
                                // Format based on field type
                                if (valueField.aggregation === 'count' || valueField.aggregation === 'count_unique') {
                                  return value.toLocaleString()
                                } else if (fieldTypes[valueField.field] === 'number') {
                                  return value.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })
                                } else {
                                  return value.toString()
                                }
                              }).join(' / ')}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}

export default PivotView 