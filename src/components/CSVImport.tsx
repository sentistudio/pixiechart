import React, { useState } from 'react'
import { useDropzone } from 'react-dropzone'
import Papa from 'papaparse'
import { X, Upload, FileText, AlertCircle, Check, Globe, FileSpreadsheet } from 'lucide-react'
import { Dataset } from '../store'
import { generateId, detectColumnType, generateRandomEmoji } from '../utils'

interface CSVImportProps {
  onClose: () => void
  onImport: (dataset: Dataset) => void
}

const CSVImport: React.FC<CSVImportProps> = ({ onClose, onImport }) => {
  const [importType, setImportType] = useState<'csv' | 'gsheet'>('csv')
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[] | null>(null)
  const [schema, setSchema] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [gsheetUrl, setGsheetUrl] = useState('')
  const [gsheetName, setGsheetName] = useState('')

  const onDrop = (acceptedFiles: File[]) => {
    const csvFile = acceptedFiles[0]
    if (csvFile) {
      setFile(csvFile)
      setError(null)
      parseCSV(csvFile)
    }
  }

  const parseCSV = (file: File) => {
    setIsLoading(true)
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        setIsLoading(false)
        
        if (results.errors.length > 0) {
          setError('Error parsing CSV: ' + results.errors[0].message)
          return
        }
        
        const data = results.data as any[]
        if (data.length === 0) {
          setError('CSV file is empty')
          return
        }
        
        // Generate schema
        const headers = Object.keys(data[0])
        const detectedSchema: Record<string, string> = {}
        
        headers.forEach(header => {
          const columnValues = data.map(row => row[header])
          detectedSchema[header] = detectColumnType(columnValues)
        })
        
        setSchema(detectedSchema)
        setPreview(data.slice(0, 10)) // Show first 10 rows as preview
      },
      error: (error) => {
        setIsLoading(false)
        setError('Error reading file: ' + error.message)
      }
    })
  }

  const parseGoogleSheet = async (url: string) => {
    setIsLoading(true)
    setError(null)
    
    try {
      // Convert Google Sheets URL to CSV export URL
      let csvUrl = url
      
      // Handle different Google Sheets URL formats
      if (url.includes('docs.google.com/spreadsheets')) {
        // Extract sheet ID from URL
        const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/)
        if (match) {
          const sheetId = match[1]
          csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`
        } else {
          setError('Invalid Google Sheets URL format')
          setIsLoading(false)
          return
        }
      }
      
      // Use Papa Parse to fetch and parse the CSV data
      Papa.parse(csvUrl, {
        header: true,
        skipEmptyLines: true,
        download: true,
        complete: (results) => {
          setIsLoading(false)
          
          if (results.errors.length > 0) {
            setError('Error parsing Google Sheet: ' + results.errors[0].message)
            return
          }
          
          const data = results.data as any[]
          if (data.length === 0) {
            setError('Google Sheet is empty')
            return
          }
          
          // Generate schema
          const headers = Object.keys(data[0])
          const detectedSchema: Record<string, string> = {}
          
          headers.forEach(header => {
            const columnValues = data.map(row => row[header])
            detectedSchema[header] = detectColumnType(columnValues)
          })
          
          setSchema(detectedSchema)
          setPreview(data.slice(0, 10)) // Show first 10 rows as preview
        },
        error: (error) => {
          setIsLoading(false)
          setError('Error fetching Google Sheet: ' + error.message)
        }
      })
    } catch (error) {
      setIsLoading(false)
      setError('Error connecting to Google Sheets: ' + (error as Error).message)
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.csv']
    },
    maxFiles: 1
  })

  const handleImport = () => {
    if (!preview) return
    
    setIsLoading(true)
    
    if (importType === 'csv' && file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const data = results.data as any[]
          const dataset: Dataset = {
            id: generateId(),
            name: file.name.replace('.csv', ''),
            emoji: generateRandomEmoji(),
            source: 'csv',
            schema,
            data,
            rowCount: data.length,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
          
          onImport(dataset)
          setIsLoading(false)
        },
        error: (error) => {
          setError('Error importing file: ' + error.message)
          setIsLoading(false)
        }
      })
    } else if (importType === 'gsheet' && gsheetUrl) {
      // For Google Sheets, we already have the data in preview
      const dataset: Dataset = {
        id: generateId(),
        name: gsheetName || 'Google Sheet',
        emoji: generateRandomEmoji(),
        source: 'gsheet',
        schema,
        data: preview,
        rowCount: preview.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
      
      onImport(dataset)
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-clr-bg rounded-apple-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-clr-border flex-shrink-0">
          <h2 className="text-xl font-semibold text-clr-text">Import Dataset</h2>
          <button
            onClick={onClose}
            className="text-clr-text-secondary hover:text-clr-text"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          {/* Import Type Selector */}
          <div className="mb-6">
            <div className="flex space-x-2 p-1 bg-clr-bg-secondary rounded-apple">
              <button
                onClick={() => {
                  setImportType('csv')
                  setFile(null)
                  setPreview(null)
                  setSchema({})
                  setError(null)
                  setGsheetUrl('')
                  setGsheetName('')
                }}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-apple transition-colors ${
                  importType === 'csv' 
                    ? 'bg-clr-primary text-white' 
                    : 'text-clr-text hover:bg-clr-hover'
                }`}
              >
                <FileText className="h-4 w-4" />
                <span>CSV File</span>
              </button>
              <button
                onClick={() => {
                  setImportType('gsheet')
                  setFile(null)
                  setPreview(null)
                  setSchema({})
                  setError(null)
                }}
                className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-apple transition-colors ${
                  importType === 'gsheet' 
                    ? 'bg-clr-primary text-white' 
                    : 'text-clr-text hover:bg-clr-hover'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Google Sheets</span>
              </button>
            </div>
          </div>

          {importType === 'csv' && !file ? (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-apple-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-clr-primary bg-clr-primary bg-opacity-10'
                  : 'border-clr-border hover:border-clr-primary'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="h-12 w-12 text-clr-text-secondary mx-auto mb-4" />
              <p className="text-lg font-medium text-clr-text mb-2">
                {isDragActive ? 'Drop the CSV file here' : 'Drag & drop a CSV file'}
              </p>
              <p className="text-clr-text-secondary">
                or click to select a file from your computer
              </p>
            </div>
          ) : importType === 'gsheet' && !preview ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">
                  Google Sheets URL
                </label>
                <input
                  type="text"
                  value={gsheetUrl}
                  onChange={(e) => setGsheetUrl(e.target.value)}
                  placeholder="https://docs.google.com/spreadsheets/d/..."
                  className="input-field w-full"
                />
                <p className="text-xs text-clr-text-secondary mt-1">
                  Make sure your Google Sheet is publicly accessible or shared with "Anyone with the link can view"
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">
                  Dataset Name (optional)
                </label>
                <input
                  type="text"
                  value={gsheetName}
                  onChange={(e) => setGsheetName(e.target.value)}
                  placeholder="My Dataset"
                  className="input-field w-full"
                />
              </div>
              
              <button
                onClick={() => parseGoogleSheet(gsheetUrl)}
                disabled={!gsheetUrl || isLoading}
                className="button-primary disabled:opacity-50 w-full"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading Sheet...
                  </>
                ) : (
                  <>
                    <Globe className="h-4 w-4 mr-2" />
                    Load Google Sheet
                  </>
                )}
              </button>
            </div>
          ) : preview ? (
            <div className="space-y-6">
              {/* File/Sheet Info */}
              <div className="flex items-center space-x-4 p-4 bg-clr-bg-secondary rounded-apple">
                {importType === 'csv' ? (
                  <FileText className="h-8 w-8 text-clr-primary" />
                ) : (
                  <FileSpreadsheet className="h-8 w-8 text-clr-primary" />
                )}
                <div>
                  <p className="font-medium text-clr-text">
                    {importType === 'csv' ? file?.name : gsheetName || 'Google Sheet'}
                  </p>
                  <p className="text-sm text-clr-text-secondary">
                    {importType === 'csv' && file ? `${(file.size / 1024).toFixed(1)} KB` : 'Google Sheets'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setFile(null)
                    setPreview(null)
                    setSchema({})
                    setError(null)
                    setGsheetUrl('')
                    setGsheetName('')
                  }}
                  className="ml-auto text-clr-text-secondary hover:text-clr-error"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              
              {/* Error */}
              {error && (
                <div className="flex items-center space-x-2 p-4 bg-clr-error bg-opacity-10 border border-clr-error rounded-apple">
                  <AlertCircle className="h-5 w-5 text-clr-error" />
                  <span className="text-clr-error">{error}</span>
                </div>
              )}
              
              {/* Schema */}
              {Object.keys(schema).length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-clr-text mb-4">Column Schema</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(schema).map(([column, type]) => (
                      <div key={column} className="flex items-center justify-between p-3 bg-clr-bg-secondary rounded-apple">
                        <span className="font-medium text-clr-text">{column}</span>
                        <span className="text-sm text-clr-text-secondary capitalize">
                          {type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Preview */}
              {preview && (
                <div>
                  <h3 className="text-lg font-medium text-clr-text mb-4">Data Preview</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full border border-clr-border rounded-apple">
                      <thead className="bg-clr-bg-secondary">
                        <tr>
                          {Object.keys(preview[0]).map((header) => (
                            <th key={header} className="px-4 py-2 text-left text-sm font-medium text-clr-text border-b border-clr-border">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, index) => (
                          <tr key={index} className="hover:bg-clr-bg-secondary">
                            {Object.keys(row).map((key) => (
                              <td key={key} className="px-4 py-2 text-sm text-clr-text border-b border-clr-border">
                                {row[key]}
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
          ) : null}
        </div>
        
        <div className="flex items-center justify-between p-6 border-t border-clr-border flex-shrink-0">
          <button
            onClick={onClose}
            className="button-secondary"
          >
            Cancel
          </button>
          
          <button
            onClick={handleImport}
            disabled={!preview || isLoading || (importType === 'csv' && !file) || (importType === 'gsheet' && !gsheetUrl)}
            className="button-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Import Dataset
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default CSVImport 