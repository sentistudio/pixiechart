import React, { useState, useMemo } from 'react'
import { Search, Filter, SortAsc, SortDesc, Download, Edit } from 'lucide-react'
import { useStore } from '../store'
import { exportToCSV } from '../utils'

const TableView: React.FC = () => {
  const { datasets, activeDataset, getDataset } = useStore()
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [filterText, setFilterText] = useState('')
  const [editingCell, setEditingCell] = useState<{ row: number; column: string } | null>(null)
  const [editValue, setEditValue] = useState('')

  const dataset = activeDataset ? getDataset(activeDataset) : datasets[0]

  const sortedData = useMemo(() => {
    if (!dataset) return []
    
    let data = [...dataset.data]
    
    // Apply filter
    if (filterText) {
      data = data.filter(row =>
        Object.values(row).some(value =>
          String(value).toLowerCase().includes(filterText.toLowerCase())
        )
      )
    }
    
    // Apply sort
    if (sortConfig) {
      data.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
        return 0
      })
    }
    
    return data
  }, [dataset, sortConfig, filterText])

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current?.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleCellEdit = (row: number, column: string, value: string) => {
    setEditingCell({ row, column })
    setEditValue(value)
  }

  const handleCellSave = () => {
    if (editingCell && dataset) {
      // In a real app, this would update the dataset
      console.log('Saving cell:', editingCell, editValue)
      setEditingCell(null)
      setEditValue('')
    }
  }

  const handleExport = () => {
    if (dataset) {
      exportToCSV(sortedData, `${dataset.name}_filtered.csv`)
    }
  }

  if (!dataset) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-clr-text mb-2">No Dataset Selected</h2>
          <p className="text-clr-text-secondary">Please select a dataset from the dashboard</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-clr-text truncate">{dataset.name}</h1>
          <p className="text-clr-text-secondary">
            {sortedData.length} of {dataset.rowCount} rows
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-clr-text-secondary h-4 w-4" />
            <input
              type="text"
              placeholder="Filter data..."
              value={filterText}
              onChange={(e) => setFilterText(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>
          
          <button
            onClick={handleExport}
            className="button-secondary"
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="card">
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead className="bg-clr-bg-secondary">
                <tr>
                  {Object.keys(dataset.schema).map((column) => (
                    <th
                      key={column}
                      className="px-4 py-3 text-left text-sm font-medium text-clr-text border-b border-clr-border cursor-pointer hover:bg-clr-hover"
                      onClick={() => handleSort(column)}
                    >
                      <div className="flex items-center space-x-2">
                        <span>{column}</span>
                        {sortConfig?.key === column && (
                          sortConfig.direction === 'asc' ? 
                            <SortAsc className="h-4 w-4" /> : 
                            <SortDesc className="h-4 w-4" />
                        )}
                      </div>
                    </th>
                  ))}
                  <th className="px-4 py-3 text-right text-sm font-medium text-clr-text border-b border-clr-border">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((row, rowIndex) => (
                  <tr
                    key={rowIndex}
                    className="hover:bg-clr-bg-secondary border-b border-clr-border"
                  >
                    {Object.keys(dataset.schema).map((column) => (
                      <td
                        key={column}
                        className="px-4 py-3 text-sm text-clr-text relative"
                      >
                        {editingCell?.row === rowIndex && editingCell?.column === column ? (
                          <input
                            type="text"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            onBlur={handleCellSave}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCellSave()
                              if (e.key === 'Escape') setEditingCell(null)
                            }}
                            className="input-field py-1 px-2 text-sm"
                            autoFocus
                          />
                        ) : (
                          <div
                            className="cursor-pointer hover:bg-clr-hover px-2 py-1 rounded"
                            onClick={() => handleCellEdit(rowIndex, column, row[column])}
                          >
                            {row[column]}
                          </div>
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleCellEdit(rowIndex, Object.keys(dataset.schema)[0], row[Object.keys(dataset.schema)[0]])}
                        className="text-clr-text-secondary hover:text-clr-primary"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TableView 