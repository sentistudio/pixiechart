import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export function generateRandomEmoji(): string {
  const datasetEmojis = [
    '📊', '📈', '📉', '📋', '📑', '📄', '📝', '📁', '📂', '🗂️',
    '🔢', '💹', '📊', '🎯', '🎲', '🎨', '🎭', '🎪', '🎸', '🎹',
    '🌟', '⭐', '✨', '💫', '🔮', '🎪', '🎯', '🎲', '🎨', '🎭',
    '🚀', '🛸', '🌍', '🌎', '🌏', '🗺️', '🧭', '📍', '📌', '🔍',
    '💡', '🔬', '🧪', '⚗️', '🔭', '🧬', '⚡', '💥', '🔥', '💎',
    '🏆', '🥇', '🎖️', '🏅', '🎁', '🎊', '🎉', '🎈', '🎂', '🍰',
    '🌈', '🌸', '🌺', '🌻', '🌷', '🌹', '🌿', '🍀', '🌱', '🌳'
  ]
  
  return datasetEmojis[Math.floor(Math.random() * datasetEmojis.length)]
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function generateDesignTitle(chartTitle: string, designCount: number = 0): string {
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  })
  
  if (designCount === 0) {
    return `${chartTitle} Design`
  }
  
  return `${chartTitle} Design ${designCount + 1}`
}

export function detectColumnType(values: any[]): 'text' | 'number' | 'date' | 'boolean' {
  const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '')
  
  if (nonNullValues.length === 0) return 'text'
  
  // Check if all values are booleans
  if (nonNullValues.every(v => typeof v === 'boolean' || v === 'true' || v === 'false')) {
    return 'boolean'
  }
  
  // Check if all values are numbers
  if (nonNullValues.every(v => !isNaN(Number(v)))) {
    return 'number'
  }
  
  // Check if all values are dates
  if (nonNullValues.every(v => !isNaN(Date.parse(String(v))))) {
    return 'date'
  }
  
  return 'text'
}

export function aggregateData(
  data: any[],
  groupBy: string,
  valueField: string,
  aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max'
): Record<string, number> {
  const groups = data.reduce((acc, row) => {
    const key = row[groupBy]
    if (!acc[key]) acc[key] = []
    acc[key].push(row[valueField])
    return acc
  }, {} as Record<string, any[]>)
  
  const result: Record<string, number> = {}
  
  Object.entries(groups).forEach(([key, values]) => {
    const valuesArray = values as any[]
    const numValues = valuesArray.filter((v: any) => !isNaN(Number(v))).map(Number)
    
    switch (aggregation) {
      case 'sum':
        result[key] = numValues.reduce((sum: number, val: number) => sum + val, 0)
        break
      case 'count':
        result[key] = valuesArray.length
        break
      case 'avg':
        result[key] = numValues.length > 0 ? numValues.reduce((sum: number, val: number) => sum + val, 0) / numValues.length : 0
        break
      case 'min':
        result[key] = numValues.length > 0 ? Math.min(...numValues) : 0
        break
      case 'max':
        result[key] = numValues.length > 0 ? Math.max(...numValues) : 0
        break
    }
  })
  
  return result
}

export function exportToCSV(data: any[], filename: string): void {
  if (data.length === 0) return
  
  const headers = Object.keys(data[0])
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export function downloadCanvas(canvas: HTMLCanvasElement, filename: string, format: 'png' | 'jpeg' = 'png'): void {
  const link = document.createElement('a')
  link.download = filename
  link.href = canvas.toDataURL(`image/${format}`)
  link.click()
} 