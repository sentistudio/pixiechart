import React, { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { fabric } from 'fabric'
import { 
  ArrowLeft, 
  Save, 
  RotateCcw, 
  Download, 
  Type, 
  Square, 
  Circle, 
  Minus,
  Move,
  Trash2,
  Copy
} from 'lucide-react'
import { useStore } from '../store'
import { generateId, aggregateData, generateDesignTitle } from '../utils'

const DesignMode: React.FC = () => {
  const { chartId } = useParams<{ chartId: string }>()
  const navigate = useNavigate()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<fabric.Canvas | null>(null)
  const [selectedTool, setSelectedTool] = useState<'select' | 'text' | 'rect' | 'circle' | 'line'>('select')
  const [hasChanges, setHasChanges] = useState(false)
  const [showDesignChoice, setShowDesignChoice] = useState(false)
  
  const { getChart, addDesign, updateDesign, getDesign, getDataset } = useStore()
  
  const chart = chartId ? getChart(chartId) : null
  const design = chartId ? getDesign(chartId) : null

  useEffect(() => {
    if (canvasRef.current) {
      const fabricCanvas = new fabric.Canvas(canvasRef.current, {
        width: 800,
        height: 600,
        backgroundColor: '#ffffff'
      })
      
      setCanvas(fabricCanvas)
      
      // Check if there's an existing design and show choice dialog
      if (design && chart) {
        setShowDesignChoice(true)
      } else if (chart) {
        // Create initial design from chart data
        initializeFromChart(fabricCanvas, chart)
      }
      
      // Track changes
      fabricCanvas.on('object:modified', () => setHasChanges(true))
      fabricCanvas.on('object:added', () => setHasChanges(true))
      fabricCanvas.on('object:removed', () => setHasChanges(true))
      
      // Add right-click context menu for group/ungroup
      fabricCanvas.on('mouse:down', (e) => {
        if (e.e.button === 2) { // Right click
          e.e.preventDefault()
          const activeObject = fabricCanvas.getActiveObject()
          if (activeObject) {
            showContextMenu(e.e, activeObject, fabricCanvas)
          }
        }
      })
      
      return () => {
        fabricCanvas.dispose()
      }
    }
  }, [chartId, design])

  const aggregateGroupedData = (data: any[], xField: string, yField: string, groupByField: string, aggregation: string) => {
    const grouped: Record<string, Record<string, number[]>> = {}
    
    data.forEach(row => {
      const xValue = row[xField]
      const yValue = row[yField]
      const groupValue = row[groupByField]
      
      if (!grouped[xValue]) grouped[xValue] = {}
      if (!grouped[xValue][groupValue]) grouped[xValue][groupValue] = []
      
      grouped[xValue][groupValue].push(yValue)
    })
    
    // Apply aggregation
    const result: Record<string, Record<string, number>> = {}
    for (const [xValue, groups] of Object.entries(grouped)) {
      result[xValue] = {}
      for (const [groupValue, values] of Object.entries(groups)) {
        switch (aggregation) {
          case 'sum':
            result[xValue][groupValue] = values.reduce((sum, val) => sum + val, 0)
            break
          case 'avg':
            result[xValue][groupValue] = values.reduce((sum, val) => sum + val, 0) / values.length
            break
          case 'count':
            result[xValue][groupValue] = values.length
            break
          case 'min':
            result[xValue][groupValue] = Math.min(...values)
            break
          case 'max':
            result[xValue][groupValue] = Math.max(...values)
            break
          default:
            result[xValue][groupValue] = values.reduce((sum, val) => sum + val, 0)
        }
      }
    }
    
    return result
  }

  const showContextMenu = (e: MouseEvent, activeObject: fabric.Object, fabricCanvas: fabric.Canvas) => {
    const contextMenu = document.createElement('div')
    contextMenu.style.position = 'absolute'
    contextMenu.style.left = `${e.clientX}px`
    contextMenu.style.top = `${e.clientY}px`
    contextMenu.style.backgroundColor = 'white'
    contextMenu.style.border = '1px solid #ccc'
    contextMenu.style.borderRadius = '4px'
    contextMenu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)'
    contextMenu.style.zIndex = '1000'
    contextMenu.style.minWidth = '120px'
    
    const createMenuItem = (text: string, onClick: () => void) => {
      const item = document.createElement('div')
      item.textContent = text
      item.style.padding = '8px 12px'
      item.style.cursor = 'pointer'
      item.style.fontSize = '14px'
      item.style.color = '#333'
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f5f5f5'
      })
      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'white'
      })
      item.addEventListener('click', () => {
        onClick()
        document.body.removeChild(contextMenu)
      })
      return item
    }
    
    if (activeObject.type === 'group') {
      // Show ungroup option
      const ungroupItem = createMenuItem('Ungroup', () => {
        const group = activeObject as fabric.Group
        group.destroy()
        fabricCanvas.remove(group)
        setHasChanges(true)
      })
      contextMenu.appendChild(ungroupItem)
    } else {
      // Show group option if multiple objects are selected
      const activeObjects = fabricCanvas.getActiveObjects()
      if (activeObjects.length > 1) {
        const groupItem = createMenuItem('Group', () => {
          const group = new fabric.Group(activeObjects, {
            selectable: true,
            hasControls: true,
            hasBorders: true,
            transparentCorners: false
          })
          fabricCanvas.remove(...activeObjects)
          fabricCanvas.add(group)
          fabricCanvas.setActiveObject(group)
          setHasChanges(true)
        })
        contextMenu.appendChild(groupItem)
      }
    }
    
    // Add delete option
    const deleteItem = createMenuItem('Delete', () => {
      fabricCanvas.remove(activeObject)
      setHasChanges(true)
    })
    contextMenu.appendChild(deleteItem)
    
    document.body.appendChild(contextMenu)
    
    // Remove context menu when clicking elsewhere
    const removeContextMenu = (event: MouseEvent) => {
      if (!contextMenu.contains(event.target as Node)) {
        document.body.removeChild(contextMenu)
        document.removeEventListener('click', removeContextMenu)
      }
    }
    
    setTimeout(() => {
      document.addEventListener('click', removeContextMenu)
    }, 0)
  }

  const initializeFromChart = (fabricCanvas: fabric.Canvas, chart: any) => {
    // Add chart title
    const title = new fabric.Text(chart.title, {
      left: 400,
      top: 50,
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#333333',
      textAlign: 'center',
      originX: 'center'
    })
    fabricCanvas.add(title)
    
    // Get chart data from store
    const dataset = getDataset(chart.datasetId)
    if (!dataset) return
    
    const isPieChart = ['pie', 'doughnut'].includes(chart.type)
    const isGrouped = chart.data.groupBy && !isPieChart
    
    if (isGrouped) {
      // Handle grouped data
      const groupedData = aggregateGroupedData(
        dataset.data,
        chart.data.xField,
        chart.data.yFields[0].field,
        chart.data.groupBy,
        chart.data.yFields[0].aggregation
      )
      
      let allCategories = Object.keys(groupedData)
      const allGroups = new Set<string>()
      Object.values(groupedData).forEach(categoryData => {
        Object.keys(categoryData).forEach(group => allGroups.add(group))
      })
      const groupArray = Array.from(allGroups)
      
      // Apply sorting to categories
      const sortBy = chart.type === 'horizontalBar' ? chart.data.yAxisSortBy : chart.data.xAxisSortBy
      if (sortBy !== 'none') {
        allCategories.sort((a, b) => {
          const aTotal = groupArray.reduce((sum, group) => sum + (groupedData[a][group] || 0), 0)
          const bTotal = groupArray.reduce((sum, group) => sum + (groupedData[b][group] || 0), 0)
          
          switch (sortBy) {
            case 'value-desc': return bTotal - aTotal
            case 'value-asc': return aTotal - bTotal
            case 'label-asc': return a.localeCompare(b)
            case 'label-desc': return b.localeCompare(a)
            default: return 0
          }
        })
      }
      
      // Create chart elements based on type
      switch (chart.type) {
        case 'bar':
          createGroupedBarChart(fabricCanvas, allCategories, groupedData, groupArray, chart.style.colors, false, chart.data.stackedGrouping, chart)
          break
        case 'horizontalBar':
          createGroupedBarChart(fabricCanvas, allCategories, groupedData, groupArray, chart.style.colors, true, chart.data.stackedGrouping, chart)
          break
      }
    } else {
      // Handle non-grouped data
      const aggregated = aggregateData(
        dataset.data,
        isPieChart ? chart.data.yFields[0].field : chart.data.xField,
        isPieChart ? 'count' : chart.data.yFields[0].field,
        isPieChart ? 'count' : chart.data.yFields[0].aggregation
      )
      
      let dataEntries = Object.entries(aggregated)
      
      // Filter out zero values if enabled
      if (chart.style.omitZeroValues) {
        dataEntries = dataEntries.filter(([, value]) => value !== 0)
      }
      
      // Apply sorting based on chart type
      const sortBy = ['bar', 'horizontalBar'].includes(chart.type) 
        ? (chart.type === 'horizontalBar' ? chart.data.yAxisSortBy : chart.data.xAxisSortBy)
        : chart.data.sortBy
      
      switch (sortBy) {
        case 'value-desc':
          dataEntries.sort((a, b) => b[1] - a[1])
          break
        case 'value-asc':
          dataEntries.sort((a, b) => a[1] - b[1])
          break
        case 'label-asc':
          dataEntries.sort((a, b) => a[0].localeCompare(b[0]))
          break
        case 'label-desc':
          dataEntries.sort((a, b) => b[0].localeCompare(a[0]))
          break
        default:
          // 'none' - keep original order
          break
      }
      
      const labels = dataEntries.map(([label]) => label)
      const values = dataEntries.map(([, value]) => value)
      const colors = chart.style.colors
      
      // Create chart elements based on type
      switch (chart.type) {
        case 'doughnut':
        case 'pie':
          createPieChart(fabricCanvas, labels, values, colors, chart.type === 'doughnut')
          break
        case 'bar':
          createBarChart(fabricCanvas, labels, values, colors, false, chart)
          break
        case 'horizontalBar':
          createBarChart(fabricCanvas, labels, values, colors, true, chart)
          break
        case 'line':
          createLineChart(fabricCanvas, labels, values, colors, chart)
          break
      }
    }
    
    fabricCanvas.renderAll()
  }

  const createBackgroundGrid = (canvas: fabric.Canvas, chartArea: { x: number, y: number, width: number, height: number }) => {
    const gridLines = []
    const gridSpacing = 50
    const gridColor = '#e0e0e0'
    
    // Vertical grid lines
    for (let x = chartArea.x; x <= chartArea.x + chartArea.width; x += gridSpacing) {
      const line = new fabric.Line([x, chartArea.y, x, chartArea.y + chartArea.height], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false
      })
      gridLines.push(line)
    }
    
    // Horizontal grid lines
    for (let y = chartArea.y; y <= chartArea.y + chartArea.height; y += gridSpacing) {
      const line = new fabric.Line([chartArea.x, y, chartArea.x + chartArea.width, y], {
        stroke: gridColor,
        strokeWidth: 1,
        selectable: false
      })
      gridLines.push(line)
    }
    
    // Create grid group
    const gridGroup = new fabric.Group(gridLines, {
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false
    })
    
    canvas.add(gridGroup)
    return gridGroup
  }

  const createLegend = (canvas: fabric.Canvas, labels: string[], colors: string[], position: { x: number, y: number }) => {
    const legendSpacing = 25
    const legendItemWidth = 150
    const legendItemHeight = 20
    const legendItems: fabric.Object[] = []
    
    labels.forEach((label, index) => {
      const color = colors[index % colors.length]
      const y = index * legendSpacing
      
      // Create legend color box
      const colorBox = new fabric.Rect({
        left: 0,
        top: y,
        width: legendItemHeight,
        height: legendItemHeight,
        fill: color,
        stroke: '#cccccc',
        strokeWidth: 1,
        selectable: false
      })
      
      legendItems.push(colorBox)
      
      // Create legend label
      const legendLabel = new fabric.Text(label, {
        left: legendItemHeight + 8,
        top: y + legendItemHeight / 2,
        fontSize: 12,
        fill: '#333333',
        originY: 'center',
        selectable: false
      })
      
      legendItems.push(legendLabel)
    })
    
    // Create legend group
    const legendGroup = new fabric.Group(legendItems, {
      left: position.x,
      top: position.y,
      selectable: true,
      hasControls: true,
      hasBorders: true,
      transparentCorners: false
    })
    
    canvas.add(legendGroup)
    return legendGroup
  }

  const createGroupedBarChart = (
    canvas: fabric.Canvas,
    categories: string[],
    groupedData: Record<string, Record<string, number>>,
    groups: string[],
    colors: string[],
    horizontal: boolean,
    stacked: boolean = true,
    chart?: any
  ) => {
    const chartArea = { x: 120, y: 120, width: 500, height: 300 }
    
    // Create background grid
    createBackgroundGrid(canvas, chartArea)
    
    // Calculate max value for scaling
    const maxValue = Math.max(...categories.map(category => {
      if (stacked) {
        return groups.reduce((sum, group) => sum + (groupedData[category][group] || 0), 0)
      } else {
        return Math.max(...groups.map(group => groupedData[category][group] || 0))
      }
    }))
    
    const categoryWidth = horizontal ? chartArea.height / categories.length : chartArea.width / categories.length
    const barThickness = stacked ? categoryWidth * 0.6 : (categoryWidth * 0.6) / groups.length
    
    categories.forEach((category, categoryIndex) => {
      let stackOffset = 0
      
      groups.forEach((group, groupIndex) => {
        const value = groupedData[category][group] || 0
        if (value === 0) return
        
        const color = colors[groupIndex % colors.length]
        
        if (horizontal) {
          const barLength = (value / maxValue) * chartArea.width
          const x = stacked ? chartArea.x + stackOffset : chartArea.x
          const y = chartArea.y + categoryIndex * categoryWidth + (categoryWidth - barThickness) / 2
          const barY = stacked ? y : y + groupIndex * (barThickness + 2)
          
          const bar = new fabric.Rect({
            left: x,
            top: barY,
            width: barLength,
            height: barThickness,
            fill: color,
            stroke: '#ffffff',
            strokeWidth: 1,
            selectable: true
          })
          
          canvas.add(bar)
          
          if (stacked) {
            stackOffset += barLength
          }
        } else {
          const barHeight = (value / maxValue) * chartArea.height
          const x = stacked ? chartArea.x + categoryIndex * categoryWidth + (categoryWidth - barThickness) / 2 : 
                             chartArea.x + categoryIndex * categoryWidth + groupIndex * (barThickness + 2) + (categoryWidth - groups.length * barThickness) / 2
          const y = stacked ? chartArea.y + chartArea.height - barHeight - stackOffset : chartArea.y + chartArea.height - barHeight
          
          const bar = new fabric.Rect({
            left: x,
            top: y,
            width: barThickness,
            height: barHeight,
            fill: color,
            stroke: '#ffffff',
            strokeWidth: 1,
            selectable: true
          })
          
          canvas.add(bar)
          
          if (stacked) {
            stackOffset += barHeight
          }
        }
      })
    })
    
    // Add category labels
    categories.forEach((category, index) => {
      if (horizontal) {
        const label = new fabric.Text(category, {
          left: chartArea.x - 10,
          top: chartArea.y + index * categoryWidth + categoryWidth / 2,
          fontSize: 12,
          fill: '#333333',
          textAlign: 'right',
          originX: 'right',
          originY: 'center'
        })
        canvas.add(label)
      } else {
        const label = new fabric.Text(category, {
          left: chartArea.x + index * categoryWidth + categoryWidth / 2,
          top: chartArea.y + chartArea.height + 15,
          fontSize: 12,
          fill: '#333333',
          textAlign: 'center',
          originX: 'center'
        })
        canvas.add(label)
      }
    })
    
    // Add axis lines
    const xAxis = new fabric.Line([chartArea.x, chartArea.y + chartArea.height, chartArea.x + chartArea.width, chartArea.y + chartArea.height], {
      stroke: '#333333',
      strokeWidth: 2,
      selectable: false
    })
    canvas.add(xAxis)
    
    const yAxis = new fabric.Line([chartArea.x, chartArea.y, chartArea.x, chartArea.y + chartArea.height], {
      stroke: '#333333',
      strokeWidth: 2,
      selectable: false
    })
    canvas.add(yAxis)
    
    // Add Y-axis scale labels
    const stepCount = 5
    const step = maxValue / stepCount
    
    for (let i = 0; i <= stepCount; i++) {
      const value = Math.round(step * i)
      const y = chartArea.y + chartArea.height - (value / maxValue) * chartArea.height
      
      // Add tick mark
      const tick = new fabric.Line([chartArea.x - 5, y, chartArea.x, y], {
        stroke: '#333333',
        strokeWidth: 1,
        selectable: false
      })
      canvas.add(tick)
      
      // Add label
      const label = new fabric.Text(value.toString(), {
        left: chartArea.x - 10,
        top: y,
        fontSize: 12,
        fill: '#333333',
        textAlign: 'right',
        originX: 'right',
        originY: 'center'
      })
      canvas.add(label)
    }
    
    // Add data values on bars if enabled
    if (chart && chart.style.showValues) {
      categories.forEach((category, categoryIndex) => {
        let stackOffset = 0
        
        groups.forEach((group, groupIndex) => {
          const value = groupedData[category][group] || 0
          if (value === 0) return
          
          if (horizontal) {
            const barLength = (value / maxValue) * chartArea.width
            const x = stacked ? chartArea.x + stackOffset + barLength / 2 : chartArea.x + barLength / 2
            const y = chartArea.y + categoryIndex * categoryWidth + categoryWidth / 2
            
            const valueLabel = new fabric.Text(value.toString(), {
              left: x,
              top: y,
              fontSize: 12,
              fill: '#333333',
              textAlign: 'center',
              originX: 'center',
              originY: 'center'
            })
            canvas.add(valueLabel)
            
            if (stacked) {
              stackOffset += barLength
            }
          } else {
            const barHeight = (value / maxValue) * chartArea.height
            const x = stacked ? chartArea.x + categoryIndex * categoryWidth + categoryWidth / 2 : 
                             chartArea.x + categoryIndex * categoryWidth + groupIndex * (barThickness + 2) + barThickness / 2 + (categoryWidth - groups.length * barThickness) / 2
            const y = stacked ? chartArea.y + chartArea.height - barHeight / 2 - stackOffset : chartArea.y + chartArea.height - barHeight / 2
            
            const valueLabel = new fabric.Text(value.toString(), {
              left: x,
              top: y,
              fontSize: 12,
              fill: '#333333',
              textAlign: 'center',
              originX: 'center',
              originY: 'center'
            })
            canvas.add(valueLabel)
            
            if (stacked) {
              stackOffset += barHeight
            }
          }
        })
      })
    }
    
    // Add legend
    createLegend(canvas, groups, colors, { x: chartArea.x + chartArea.width + 20, y: chartArea.y + 50 })
  }

  const createPieChart = (canvas: fabric.Canvas, labels: string[], values: number[], colors: string[], isDoughnut: boolean) => {
    const centerX = 400
    const centerY = 300
    const radius = 120
    const innerRadius = isDoughnut ? 60 : 0
    
    const total = values.reduce((sum, val) => sum + val, 0)
    let currentAngle = -90 // Start from top
    
    values.forEach((value, index) => {
      const angle = (value / total) * 360
      const color = colors[index % colors.length]
      
      // Create pie slice using Path
      const startAngle = currentAngle * Math.PI / 180
      const endAngle = (currentAngle + angle) * Math.PI / 180
      
      // Calculate outer arc points
      const x1 = centerX + radius * Math.cos(startAngle)
      const y1 = centerY + radius * Math.sin(startAngle)
      const x2 = centerX + radius * Math.cos(endAngle)
      const y2 = centerY + radius * Math.sin(endAngle)
      
      let pathString = ''
      
      if (!isDoughnut) {
        // Regular pie slice - start from center
        pathString = `M ${centerX} ${centerY} L ${x1} ${y1}`
      } else {
        // Doughnut slice - start from inner radius
        const ix1 = centerX + innerRadius * Math.cos(startAngle)
        const iy1 = centerY + innerRadius * Math.sin(startAngle)
        pathString = `M ${ix1} ${iy1} L ${x1} ${y1}`
      }
      
      // Outer arc
      const largeArcFlag = angle > 180 ? 1 : 0
      pathString += ` A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`
      
      if (isDoughnut) {
        // For doughnut, add inner arc
        const ix2 = centerX + innerRadius * Math.cos(endAngle)
        const iy2 = centerY + innerRadius * Math.sin(endAngle)
        pathString += ` L ${ix2} ${iy2}`
        // Inner arc (reverse direction)
        pathString += ` A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${centerX + innerRadius * Math.cos(startAngle)} ${centerY + innerRadius * Math.sin(startAngle)}`
      }
      
      pathString += ' Z'
      
      const slice = new fabric.Path(pathString, {
        fill: color,
        stroke: '#ffffff',
        strokeWidth: 2,
        selectable: true
      })
      
      canvas.add(slice)
      
      // Add label
      const labelAngle = currentAngle + angle / 2
      const labelRadius = isDoughnut ? (radius + innerRadius) / 2 : radius * 0.7
      const labelX = centerX + labelRadius * Math.cos(labelAngle * Math.PI / 180)
      const labelY = centerY + labelRadius * Math.sin(labelAngle * Math.PI / 180)
      
      const label = new fabric.Text(labels[index], {
        left: labelX,
        top: labelY,
        fontSize: 12,
        fill: '#333333',
        textAlign: 'center',
        originX: 'center',
        originY: 'center'
      })
      
      canvas.add(label)
      currentAngle += angle
    })
    
    // Add legend
    createLegend(canvas, labels, colors, { x: 550, y: 200 })
  }

  const createBarChart = (canvas: fabric.Canvas, labels: string[], values: number[], colors: string[], horizontal: boolean, chart?: any) => {
    const chartArea = { x: 120, y: 120, width: 500, height: 300 }
    
    // Create background grid
    createBackgroundGrid(canvas, chartArea)
    
    const barMaxValue = Math.max(...values)
    const barWidth = horizontal ? chartArea.height / labels.length - 10 : chartArea.width / labels.length - 10
    
    values.forEach((value, index) => {
      const color = colors[index % colors.length]
      
      if (horizontal) {
        const barHeight = 30
        const barLength = (value / barMaxValue) * chartArea.width
        const x = chartArea.x
        const y = chartArea.y + index * (barHeight + 10)
        
        const bar = new fabric.Rect({
          left: x,
          top: y,
          width: barLength,
          height: barHeight,
          fill: color,
          stroke: '#ffffff',
          strokeWidth: 1,
          selectable: true
        })
        canvas.add(bar)
        
        // Add label
        const label = new fabric.Text(labels[index], {
          left: x - 10,
          top: y + barHeight / 2,
          fontSize: 12,
          fill: '#333333',
          textAlign: 'right',
          originX: 'right',
          originY: 'center'
        })
        canvas.add(label)
      } else {
        const barHeight = (value / barMaxValue) * chartArea.height
        const x = chartArea.x + index * (barWidth + 10)
        const y = chartArea.y + chartArea.height - barHeight
        
        const bar = new fabric.Rect({
          left: x,
          top: y,
          width: barWidth,
          height: barHeight,
          fill: color,
          stroke: '#ffffff',
          strokeWidth: 1,
          selectable: true
        })
        canvas.add(bar)
        
        // Add label
        const label = new fabric.Text(labels[index], {
          left: x + barWidth / 2,
          top: chartArea.y + chartArea.height + 20,
          fontSize: 12,
          fill: '#333333',
          textAlign: 'center',
          originX: 'center'
        })
        canvas.add(label)
      }
    })
    
    // Add axis lines
    const xAxis = new fabric.Line([chartArea.x, chartArea.y + chartArea.height, chartArea.x + chartArea.width, chartArea.y + chartArea.height], {
      stroke: '#333333',
      strokeWidth: 2,
      selectable: false
    })
    canvas.add(xAxis)
    
    const yAxis = new fabric.Line([chartArea.x, chartArea.y, chartArea.x, chartArea.y + chartArea.height], {
      stroke: '#333333',
      strokeWidth: 2,
      selectable: false
    })
    canvas.add(yAxis)
    
    // Add Y-axis scale labels
    const chartMaxValue = Math.max(...values)
    const stepCount = 5
    const step = chartMaxValue / stepCount
    
    for (let i = 0; i <= stepCount; i++) {
      const value = Math.round(step * i)
      const y = chartArea.y + chartArea.height - (value / chartMaxValue) * chartArea.height
      
      // Add tick mark
      const tick = new fabric.Line([chartArea.x - 5, y, chartArea.x, y], {
        stroke: '#333333',
        strokeWidth: 1,
        selectable: false
      })
      canvas.add(tick)
      
      // Add label
      const label = new fabric.Text(value.toString(), {
        left: chartArea.x - 10,
        top: y,
        fontSize: 12,
        fill: '#333333',
        textAlign: 'right',
        originX: 'right',
        originY: 'center'
      })
      canvas.add(label)
    }
    
    // Add data values on bars if enabled
    if (chart && chart.style.showValues) {
      values.forEach((value, index) => {
        if (horizontal) {
          const barLength = (value / chartMaxValue) * chartArea.width
          const x = chartArea.x + barLength + 5
          const y = chartArea.y + index * (30 + 10) + 15
          
          const valueLabel = new fabric.Text(value.toString(), {
            left: x,
            top: y,
            fontSize: 12,
            fill: '#333333',
            originY: 'center'
          })
          canvas.add(valueLabel)
        } else {
          const barHeight = (value / chartMaxValue) * chartArea.height
          const x = chartArea.x + index * (barWidth + 10) + barWidth / 2
          const y = chartArea.y + chartArea.height - barHeight - 5
          
          const valueLabel = new fabric.Text(value.toString(), {
            left: x,
            top: y,
            fontSize: 12,
            fill: '#333333',
            textAlign: 'center',
            originX: 'center',
            originY: 'bottom'
          })
          canvas.add(valueLabel)
        }
      })
    }
    
    // Add legend
    createLegend(canvas, labels, colors, { x: chartArea.x + chartArea.width + 20, y: chartArea.y + 50 })
  }

  const createLineChart = (canvas: fabric.Canvas, labels: string[], values: number[], colors: string[], chart?: any) => {
    const chartArea = { x: 120, y: 120, width: 500, height: 300 }
    
    // Create background grid
    createBackgroundGrid(canvas, chartArea)
    
    const lineMaxValue = Math.max(...values)
    const stepX = chartArea.width / (labels.length - 1)
    
    const points = values.map((value, index) => ({
      x: chartArea.x + index * stepX,
      y: chartArea.y + chartArea.height - (value / lineMaxValue) * chartArea.height
    }))
    
    // Create line
    const pathString = points.reduce((path, point, index) => {
      return path + (index === 0 ? `M ${point.x} ${point.y}` : ` L ${point.x} ${point.y}`)
    }, '')
    
    const line = new fabric.Path(pathString, {
      fill: '',
      stroke: colors[0],
      strokeWidth: 3,
      selectable: true
    })
    canvas.add(line)
    
    // Add points
    points.forEach((point, index) => {
      const circle = new fabric.Circle({
        left: point.x,
        top: point.y,
        radius: 4,
        fill: colors[0],
        originX: 'center',
        originY: 'center',
        selectable: true
      })
      canvas.add(circle)
      
      // Add label
      const label = new fabric.Text(labels[index], {
        left: point.x,
        top: chartArea.y + chartArea.height + 20,
        fontSize: 12,
        fill: '#333333',
        textAlign: 'center',
        originX: 'center'
      })
      canvas.add(label)
    })
    
    // Add axis lines
    const xAxis = new fabric.Line([chartArea.x, chartArea.y + chartArea.height, chartArea.x + chartArea.width, chartArea.y + chartArea.height], {
      stroke: '#333333',
      strokeWidth: 2,
      selectable: false
    })
    canvas.add(xAxis)
    
    const yAxis = new fabric.Line([chartArea.x, chartArea.y, chartArea.x, chartArea.y + chartArea.height], {
      stroke: '#333333',
      strokeWidth: 2,
      selectable: false
    })
    canvas.add(yAxis)
    
    // Add legend - for line chart, show data series name
    createLegend(canvas, ['Data Series'], colors, { x: chartArea.x + chartArea.width + 20, y: chartArea.y + 50 })
  }

  const handleToolChange = (tool: 'select' | 'text' | 'rect' | 'circle' | 'line') => {
    setSelectedTool(tool)
    
    if (!canvas) return
    
    if (tool === 'select') {
      canvas.isDrawingMode = false
      canvas.selection = true
    } else {
      canvas.isDrawingMode = false
      canvas.selection = false
    }
  }

  const addText = () => {
    if (!canvas) return
    
    const text = new fabric.Text('New Text', {
      left: 100,
      top: 100,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#333333'
    })
    
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
    setHasChanges(true)
  }

  const addShape = (type: 'rect' | 'circle' | 'line') => {
    if (!canvas) return
    
    let shape: fabric.Object
    
    switch (type) {
      case 'rect':
        shape = new fabric.Rect({
          left: 100,
          top: 100,
          width: 100,
          height: 100,
          fill: '#007AFF',
          stroke: '#333333',
          strokeWidth: 2
        })
        break
      case 'circle':
        shape = new fabric.Circle({
          left: 100,
          top: 100,
          radius: 50,
          fill: '#34C759',
          stroke: '#333333',
          strokeWidth: 2
        })
        break
      case 'line':
        shape = new fabric.Line([50, 100, 200, 100], {
          left: 100,
          top: 100,
          stroke: '#333333',
          strokeWidth: 2
        })
        break
      default:
        return
    }
    
    canvas.add(shape)
    canvas.setActiveObject(shape)
    canvas.renderAll()
    setHasChanges(true)
  }

  const deleteSelected = () => {
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      canvas.remove(activeObject)
      canvas.renderAll()
      setHasChanges(true)
    }
  }

  const changeColor = (color: string) => {
    if (!canvas) return
    
    const activeObject = canvas.getActiveObject()
    if (activeObject) {
      if (activeObject.type === 'text') {
        activeObject.set('fill', color)
      } else {
        activeObject.set('fill', color)
      }
      canvas.renderAll()
      setHasChanges(true)
    }
  }

  const saveDesign = () => {
    if (!canvas || !chartId) return
    
    const { designs } = useStore.getState()
    const designData = canvas.toJSON()
    const existingDesigns = designs.filter(d => d.chartId === chartId).length
    
    const designConfig = {
      id: design?.id || generateId(),
      chartId,
      title: design?.title || generateDesignTitle(chart?.title || 'Chart', existingDesigns),
      fabricJSON: JSON.stringify(designData),
      createdAt: design?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    if (design) {
      updateDesign(design.id, designConfig)
    } else {
      addDesign(designConfig)
    }
    
    setHasChanges(false)
  }

  const resetDesign = () => {
    if (!canvas || !chart) return
    
    canvas.clear()
    initializeFromChart(canvas, chart)
    setHasChanges(false)
  }

  const exportImage = () => {
    if (!canvas) return
    
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1
    })
    
    const link = document.createElement('a')
    link.download = `${chart?.title || 'chart'}_design.png`
    link.href = dataURL
    link.click()
  }

  const copyAsSVG = async () => {
    if (!canvas) return
    
    try {
      // Get the SVG representation and copy as plain text (works best for Figma)
      const svgData = canvas.toSVG()
      await navigator.clipboard.writeText(svgData)
      
      showNotification('SVG copied to clipboard! Perfect for Figma! 🎨', 'success')
      console.log('✅ SVG copied to clipboard:', svgData.substring(0, 200) + '...')
    } catch (error) {
      console.error('❌ Failed to copy SVG:', error)
      showNotification('Failed to copy SVG. Please check clipboard permissions.', 'error')
    }
  }





  const showNotification = (message: string, type: 'success' | 'error') => {
    // Create notification element
    const notification = document.createElement('div')
    notification.className = `fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
      type === 'success' 
        ? 'bg-green-500 text-white' 
        : 'bg-red-500 text-white'
    }`
    notification.textContent = message
    notification.style.transform = 'translateX(100%)'
    
    document.body.appendChild(notification)
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)'
    }, 100)
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)'
      setTimeout(() => {
        document.body.removeChild(notification)
      }, 300)
    }, 3000)
  }

  const goBack = () => {
    if (hasChanges) {
      const confirmLeave = window.confirm('You have unsaved changes. Are you sure you want to leave?')
      if (!confirmLeave) return
    }
    navigate('/chart')
  }

  const handleUseSavedDesign = () => {
    if (canvas && design) {
      canvas.loadFromJSON(design.fabricJSON, () => {
        canvas.renderAll()
      })
    }
    setShowDesignChoice(false)
  }

  const handleUseCurrentPreview = () => {
    if (canvas && chart) {
      initializeFromChart(canvas, chart)
    }
    setShowDesignChoice(false)
  }

  if (!chart) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-clr-text mb-2">Chart Not Found</h2>
          <p className="text-clr-text-secondary">The chart you're trying to edit doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-clr-bg-secondary">
      {/* Header */}
      <div className="bg-clr-bg border-b border-clr-border px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={goBack}
              className="button-secondary"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Charts
            </button>
            <div>
              <h1 className="text-lg font-semibold text-clr-text">Design Mode</h1>
              <p className="text-sm text-clr-text-secondary">{chart.title}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <button
              onClick={resetDesign}
              className="button-secondary"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </button>
            <button
              onClick={exportImage}
              className="button-secondary"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={copyAsSVG}
              className="button-secondary"
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy SVG
            </button>

            <button
              onClick={saveDesign}
              disabled={!hasChanges}
              className="button-primary disabled:opacity-50"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 flex">
        {/* Toolbar */}
        <div className="w-16 bg-clr-bg border-r border-clr-border flex flex-col py-4">
          <div className="space-y-2">
            <button
              onClick={() => handleToolChange('select')}
              className={`w-12 h-12 rounded-apple mx-auto flex items-center justify-center transition-colors ${
                selectedTool === 'select' ? 'bg-clr-primary text-white' : 'text-clr-text-secondary hover:bg-clr-hover'
              }`}
            >
              <Move className="h-5 w-5" />
            </button>
            
            <button
              onClick={addText}
              className={`w-12 h-12 rounded-apple mx-auto flex items-center justify-center transition-colors ${
                selectedTool === 'text' ? 'bg-clr-primary text-white' : 'text-clr-text-secondary hover:bg-clr-hover'
              }`}
            >
              <Type className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => addShape('rect')}
              className={`w-12 h-12 rounded-apple mx-auto flex items-center justify-center transition-colors ${
                selectedTool === 'rect' ? 'bg-clr-primary text-white' : 'text-clr-text-secondary hover:bg-clr-hover'
              }`}
            >
              <Square className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => addShape('circle')}
              className={`w-12 h-12 rounded-apple mx-auto flex items-center justify-center transition-colors ${
                selectedTool === 'circle' ? 'bg-clr-primary text-white' : 'text-clr-text-secondary hover:bg-clr-hover'
              }`}
            >
              <Circle className="h-5 w-5" />
            </button>
            
            <button
              onClick={() => addShape('line')}
              className={`w-12 h-12 rounded-apple mx-auto flex items-center justify-center transition-colors ${
                selectedTool === 'line' ? 'bg-clr-primary text-white' : 'text-clr-text-secondary hover:bg-clr-hover'
              }`}
            >
              <Minus className="h-5 w-5" />
            </button>
            
            <div className="border-t border-clr-border my-2"></div>
            
            <button
              onClick={deleteSelected}
              className="w-12 h-12 rounded-apple mx-auto flex items-center justify-center text-clr-text-secondary hover:bg-clr-error hover:text-white transition-colors"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Canvas */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="bg-white rounded-apple shadow-lg">
            <canvas
              ref={canvasRef}
              className="rounded-apple"
              onContextMenu={(e) => e.preventDefault()}
            />
          </div>
        </div>
        
        {/* Properties Panel */}
        <div className="w-64 bg-clr-bg border-l border-clr-border p-4">
          <h3 className="font-semibold text-clr-text mb-4">Properties</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-clr-text mb-2">
                Colors
              </label>
              <div className="grid grid-cols-4 gap-2">
                {['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6', '#8E8E93', '#000000', '#FFFFFF'].map(color => (
                  <button
                    key={color}
                    onClick={() => changeColor(color)}
                    className="w-8 h-8 rounded border-2 border-clr-border hover:border-clr-primary transition-colors"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-clr-text mb-2">
                Custom Color
              </label>
              <input
                type="color"
                onChange={(e) => changeColor(e.target.value)}
                className="w-full h-8 rounded border border-clr-border"
              />
            </div>
            
            <div className="pt-4 border-t border-clr-border">
              <p className="text-sm text-clr-text-secondary">
                Select an object to modify its properties
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Status Bar */}
      <div className="bg-clr-bg border-t border-clr-border px-6 py-2">
        <div className="flex items-center justify-between">
          <div className="text-sm text-clr-text-secondary">
            {hasChanges ? 'Unsaved changes' : 'All changes saved'}
          </div>
          <div className="text-sm text-clr-text-secondary">
            Use the toolbar to add elements, select objects to modify them
          </div>
        </div>
      </div>
      
      {/* Design Choice Dialog */}
      {showDesignChoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-clr-bg rounded-apple-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-clr-text mb-4">Choose Design Source</h3>
            <p className="text-clr-text-secondary mb-6">
              You have a saved design for this chart. Would you like to continue with your saved design or start fresh with the current chart preview?
            </p>
            
            <div className="flex space-x-4">
              <button
                onClick={handleUseSavedDesign}
                className="button-secondary flex-1"
              >
                Use Saved Design
              </button>
              <button
                onClick={handleUseCurrentPreview}
                className="button-primary flex-1"
              >
                Use Current Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DesignMode 