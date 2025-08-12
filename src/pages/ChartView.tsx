import React, { useState, useMemo, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
} from 'chart.js'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { Plus, Settings, Eye, Table, Edit3, Download, Trash2, Palette, BarChart3, TrendingUp, PieChart } from 'lucide-react'
import { useStore } from '../store'
import { generateId, aggregateData } from '../utils'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  LineElement,
  PointElement,
  ChartDataLabels
)

const ChartView: React.FC = () => {
  const navigate = useNavigate()
  const { chartId } = useParams<{ chartId?: string }>()
  const { datasets, charts, activeDataset, getDataset, addChart, updateChart, deleteChart, deleteChartWithDesignChoice, getChartDesigns } = useStore()
  const [selectedChartId, setSelectedChartId] = useState<string | null>(chartId || null)
  const [chartConfig, setChartConfig] = useState({
    type: 'bar' as 'bar' | 'horizontalBar' | 'line' | 'pie' | 'doughnut',
    title: 'New Chart',
    xField: '',
    yFields: [{ field: '', aggregation: 'count' as 'sum' | 'count' | 'avg' | 'min' | 'max' }],
    groupBy: '',
    stackedGrouping: true, // Default to stacked when grouping is enabled
    colors: ['#007AFF', '#34C759', '#FF9500', '#FF3B30', '#5856D6'],
    showLegend: true,
    showValues: true,
    showPercentages: false,
    showCategoryNames: true,
    sortBy: 'none' as 'none' | 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc',
    // Bar chart-specific options
    xAxisSortBy: 'none' as 'none' | 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc',
    yAxisSortBy: 'none' as 'none' | 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc',
    rangeMode: 'auto' as 'auto' | 'manual',
    rangeMin: 0,
    rangeMax: 100,
    omitZeroValues: false,
    // Pie/Doughnut-specific options
    showCenterTotal: false,
    doughnutSize: 50, // Inner radius percentage (0-80)
    labelsOutside: false, // Show labels outside pie elements
    pieSpacing: 0, // Gap between pie slices (0-10)
    // Font size options
    titleFontSize: 16,
    legendFontSize: 12,
    labelsFontSize: 12,
  })
  const [showTable, setShowTable] = useState(false)

  const dataset = activeDataset ? getDataset(activeDataset) : datasets[0]
  const selectedChart = selectedChartId ? charts.find(c => c.id === selectedChartId) : null

  // Load existing chart data when chartId is provided in URL
  useEffect(() => {
    if (chartId && charts.length > 0) {
      const chart = charts.find(c => c.id === chartId)
      if (chart) {
        setSelectedChartId(chartId)
        // Load the chart configuration
        setChartConfig({
          type: chart.type,
          title: chart.title,
          xField: chart.data.xField,
          yFields: chart.data.yFields,
          groupBy: chart.data.groupBy || '',
          stackedGrouping: chart.data.stackedGrouping ?? true,
          colors: chart.style.colors,
          showLegend: chart.style.showLegend,
          showValues: chart.style.showValues,
          showPercentages: chart.style.showPercentages || false,
          showCategoryNames: chart.style.showCategoryNames || true,
          sortBy: chart.data.sortBy || 'none',
          xAxisSortBy: chart.data.xAxisSortBy || 'none',
          yAxisSortBy: chart.data.yAxisSortBy || 'none',
          rangeMode: chart.style.rangeMode || 'auto',
          rangeMin: chart.style.rangeMin || 0,
          rangeMax: chart.style.rangeMax || 100,
          omitZeroValues: chart.style.omitZeroValues || false,
          showCenterTotal: chart.style.showCenterTotal || false,
          doughnutSize: chart.style.doughnutSize || 50,
          labelsOutside: chart.style.labelsOutside || false,
          pieSpacing: chart.style.pieSpacing || 0,
          titleFontSize: chart.style.titleFontSize || 16,
          legendFontSize: chart.style.legendFontSize || 12,
          labelsFontSize: chart.style.labelsFontSize || 12,
        })
      }
    }
  }, [chartId, charts])

  const availableFields = useMemo(() => {
    if (!dataset) return []
    return Object.keys(dataset.schema)
  }, [dataset])

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

  const chartData = useMemo(() => {
    if (!dataset) {
      return null
    }
    
    // For pie/doughnut charts, don't require xField
    const isPieChart = ['pie', 'doughnut'].includes(chartConfig.type)
    if (!isPieChart && !chartConfig.xField) {
      return null
    }
    if (!chartConfig.yFields[0]?.field) {
      return null
    }
    
    const isGrouped = chartConfig.groupBy && !isPieChart
    
    if (isGrouped) {
      // Handle grouped/stacked data
      const groupedData = aggregateGroupedData(
        dataset.data,
        chartConfig.xField,
        chartConfig.yFields[0].field,
        chartConfig.groupBy,
        chartConfig.yFields[0].aggregation
      )
      
      // Get all unique categories and groups
      const allCategories = Object.keys(groupedData)
      const allGroups = new Set<string>()
      Object.values(groupedData).forEach(categoryData => {
        Object.keys(categoryData).forEach(group => allGroups.add(group))
      })
      const groupArray = Array.from(allGroups)
      
      // Apply sorting to categories
      const sortBy = chartConfig.type === 'horizontalBar' ? chartConfig.yAxisSortBy : chartConfig.xAxisSortBy
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
      
      // Create datasets for each group
      const datasets = groupArray.map((group, index) => {
        const data = allCategories.map(category => {
          const value = groupedData[category][group] || 0
          return chartConfig.omitZeroValues && value === 0 ? null : value
        })
        
        return {
          label: group,
          data: data.filter(val => val !== null),
          backgroundColor: chartConfig.colors[index % chartConfig.colors.length],
          borderColor: chartConfig.colors[index % chartConfig.colors.length],
          borderWidth: 1,
        }
      })
      
      return {
        labels: allCategories.filter((_, index) => {
          return datasets.some(dataset => dataset.data[index] !== null)
        }),
        datasets
      }
    } else {
      // Handle non-grouped data
      const aggregated = aggregateData(
        dataset.data,
        isPieChart ? chartConfig.yFields[0].field : chartConfig.xField,
        isPieChart ? 'count' : chartConfig.yFields[0].field,
        isPieChart ? 'count' : chartConfig.yFields[0].aggregation
      )
      
      let dataEntries = Object.entries(aggregated)
      
      // Filter out zero values if enabled
      if (chartConfig.omitZeroValues) {
        dataEntries = dataEntries.filter(([, value]) => value !== 0)
      }
      
      // Apply sorting based on chart type
      const sortBy = ['bar', 'horizontalBar'].includes(chartConfig.type) 
        ? (chartConfig.type === 'horizontalBar' ? chartConfig.yAxisSortBy : chartConfig.xAxisSortBy)
        : chartConfig.sortBy
      
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
      
      return {
        labels,
        datasets: [
          {
            label: `${chartConfig.yFields[0].field} (${chartConfig.yFields[0].aggregation})`,
            data: values,
            backgroundColor: chartConfig.colors.slice(0, labels.length),
            borderColor: chartConfig.colors.slice(0, labels.length),
            borderWidth: 1,
            spacing: ['pie', 'doughnut'].includes(chartConfig.type) ? chartConfig.pieSpacing : 0,
          },
        ],
      }
    }
  }, [dataset, chartConfig])

  const centerTotalPlugin = {
    id: 'centerTotal',
    afterDraw: (chart: any) => {
      if (chartConfig.type === 'doughnut' && chartConfig.showCenterTotal) {
        const { ctx, width, height, data } = chart
        
        // Get the total from the chart data
        if (data && data.datasets && data.datasets[0] && data.datasets[0].data) {
          const total = data.datasets[0].data.reduce((sum: number, val: number) => sum + val, 0)
          
          ctx.save()
          ctx.font = 'bold 24px Arial'
          ctx.fillStyle = '#333333'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          
          const centerX = width / 2
          const centerY = height / 2
          
          ctx.fillText(total.toLocaleString(), centerX, centerY - 10)
          
          ctx.font = '14px Arial'
          ctx.fillStyle = '#666666'
          ctx.fillText('Total', centerX, centerY + 15)
          
          ctx.restore()
        }
      }
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: chartConfig.type === 'horizontalBar' ? 'y' as const : 'x' as const,
    plugins: {
      legend: {
        display: chartConfig.showLegend,
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: {
            size: chartConfig.legendFontSize,
          },
        },
      },
      title: {
        display: !!chartConfig.title,
        text: chartConfig.title,
        padding: {
          top: 10,
          bottom: 30,
        },
        font: {
          size: chartConfig.titleFontSize,
        },
      },
      datalabels: {
        display: chartConfig.showValues || chartConfig.showPercentages,
        formatter: (value: number, context: any) => {
          if (!chartConfig.showValues && !chartConfig.showPercentages) return ''
          
          let label = ''
          if (chartConfig.showValues) {
            label = value.toLocaleString()
          }
          if (chartConfig.showPercentages) {
            const total = context.dataset.data.reduce((sum: number, val: number) => sum + val, 0)
            const percentage = ((value / total) * 100).toFixed(1)
            label = chartConfig.showValues ? `${label} (${percentage}%)` : `${percentage}%`
          }
          return label
        },
        // Position labels outside for pie/doughnut charts when enabled
        anchor: ['pie', 'doughnut'].includes(chartConfig.type) && chartConfig.labelsOutside ? 'end' as const : 'center' as const,
        align: ['pie', 'doughnut'].includes(chartConfig.type) && chartConfig.labelsOutside ? 'end' as const : 'center' as const,
        offset: ['pie', 'doughnut'].includes(chartConfig.type) && chartConfig.labelsOutside ? 10 : 0,
        color: '#333333',
        font: {
          weight: 'bold' as const,
          size: chartConfig.labelsFontSize,
        }
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            let label = chartConfig.showCategoryNames ? context.dataset.label || '' : ''
            if (label) label += ': '
            label += context.parsed.y !== undefined ? context.parsed.y : context.parsed
            return label
          }
        }
      }
    },
    scales: ['bar', 'horizontalBar', 'line'].includes(chartConfig.type) ? {
      x: {
        stacked: Boolean(chartConfig.groupBy) && chartConfig.stackedGrouping && ['bar', 'horizontalBar'].includes(chartConfig.type),
      },
      y: {
        beginAtZero: true,
        stacked: Boolean(chartConfig.groupBy) && chartConfig.stackedGrouping && ['bar', 'horizontalBar'].includes(chartConfig.type),
        ...(chartConfig.rangeMode === 'manual' && ['bar', 'horizontalBar'].includes(chartConfig.type) ? {
          min: chartConfig.rangeMin,
          max: chartConfig.rangeMax,
        } : {}),
      },
    } : {},
    cutout: chartConfig.type === 'doughnut' ? `${chartConfig.doughnutSize}%` : undefined,
  }

  const renderChart = () => {
    if (!chartData) {
      return null
    }
    
    const plugins = chartConfig.type === 'doughnut' && chartConfig.showCenterTotal ? [centerTotalPlugin] : []
    
    switch (chartConfig.type) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />
      case 'horizontalBar':
        return <Bar data={chartData} options={chartOptions} />
      case 'line':
        return <Line data={chartData} options={chartOptions} />
      case 'pie':
        return <Pie data={chartData} options={chartOptions} plugins={plugins} />
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} plugins={plugins} />
      default:
        return null
    }
  }

  const getChartTypeIcon = (type: string) => {
    switch (type) {
      case 'bar':
        return <BarChart3 className="h-5 w-5" />
      case 'horizontalBar':
        return <BarChart3 className="h-5 w-5 rotate-90" />
      case 'line':
        return <TrendingUp className="h-5 w-5" />
      case 'pie':
        return <PieChart className="h-5 w-5" />
      case 'doughnut':
        return <PieChart className="h-5 w-5" />
      default:
        return <BarChart3 className="h-5 w-5" />
    }
  }

  const handleCreateChart = () => {
    const isPieChart = ['pie', 'doughnut'].includes(chartConfig.type)
    if (!dataset || (!isPieChart && !chartConfig.xField) || !chartConfig.yFields[0]?.field) return
    
    const chart = {
      id: generateId(),
      datasetId: dataset.id,
      type: chartConfig.type,
      title: chartConfig.title,
      data: {
        xField: chartConfig.xField,
        yFields: chartConfig.yFields,
        groupBy: chartConfig.groupBy,
        stackedGrouping: chartConfig.stackedGrouping,
        sortBy: chartConfig.sortBy,
        xAxisSortBy: chartConfig.xAxisSortBy,
        yAxisSortBy: chartConfig.yAxisSortBy
      },
      style: {
        colors: chartConfig.colors,
        showLegend: chartConfig.showLegend,
        showValues: chartConfig.showValues,
        showPercentages: chartConfig.showPercentages,
        showCategoryNames: chartConfig.showCategoryNames,
        rangeMode: chartConfig.rangeMode,
        rangeMin: chartConfig.rangeMin,
        rangeMax: chartConfig.rangeMax,
        omitZeroValues: chartConfig.omitZeroValues,
        showCenterTotal: chartConfig.showCenterTotal,
        doughnutSize: chartConfig.doughnutSize,
        labelsOutside: chartConfig.labelsOutside,
        pieSpacing: chartConfig.pieSpacing,
        titleFontSize: chartConfig.titleFontSize,
        legendFontSize: chartConfig.legendFontSize,
        labelsFontSize: chartConfig.labelsFontSize,
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    addChart(chart)
    setSelectedChartId(chart.id)
  }

  const handleUpdateChart = () => {
    if (!selectedChart) return
    
    updateChart(selectedChart.id, {
      type: chartConfig.type,
      title: chartConfig.title,
      data: {
        xField: chartConfig.xField,
        yFields: chartConfig.yFields,
        groupBy: chartConfig.groupBy,
        stackedGrouping: chartConfig.stackedGrouping,
        sortBy: chartConfig.sortBy,
        xAxisSortBy: chartConfig.xAxisSortBy,
        yAxisSortBy: chartConfig.yAxisSortBy
      },
      style: {
        colors: chartConfig.colors,
        showLegend: chartConfig.showLegend,
        showValues: chartConfig.showValues,
        showPercentages: chartConfig.showPercentages,
        showCategoryNames: chartConfig.showCategoryNames,
        rangeMode: chartConfig.rangeMode,
        rangeMin: chartConfig.rangeMin,
        rangeMax: chartConfig.rangeMax,
        omitZeroValues: chartConfig.omitZeroValues,
        showCenterTotal: chartConfig.showCenterTotal,
        doughnutSize: chartConfig.doughnutSize,
        labelsOutside: chartConfig.labelsOutside,
        pieSpacing: chartConfig.pieSpacing,
        titleFontSize: chartConfig.titleFontSize,
        legendFontSize: chartConfig.legendFontSize,
        labelsFontSize: chartConfig.labelsFontSize,
      }
    })
  }

  const handleDeleteChart = (chartId: string) => {
    const chartDesigns = getChartDesigns(chartId)
    
    if (chartDesigns.length > 0) {
      // Show confirmation dialog with design choice
      const confirmDelete = window.confirm(
        `This chart has ${chartDesigns.length} associated design(s). Do you want to delete the chart?`
      )
      
      if (confirmDelete) {
        const keepDesigns = window.confirm(
          'Do you want to keep the associated designs?\n\n' +
          '• Click "OK" to keep designs (they will remain linked to the dataset)\n' +
          '• Click "Cancel" to delete designs along with the chart'
        )
        
        deleteChartWithDesignChoice(chartId, keepDesigns)
        
        if (selectedChartId === chartId) {
          setSelectedChartId(null)
        }
      }
    } else {
      // No designs, simple deletion
      if (window.confirm('Are you sure you want to delete this chart?')) {
        deleteChart(chartId)
        
        if (selectedChartId === chartId) {
          setSelectedChartId(null)
        }
      }
    }
  }

  const loadChartConfig = (chart: any) => {
    setChartConfig({
      type: chart.type,
      title: chart.title,
      xField: chart.data.xField,
      yFields: chart.data.yFields,
      groupBy: chart.data.groupBy || '',
      stackedGrouping: chart.data.stackedGrouping ?? true,
      colors: chart.style.colors,
      showLegend: chart.style.showLegend,
      showValues: chart.style.showValues,
      showPercentages: chart.style.showPercentages || false,
      showCategoryNames: chart.style.showCategoryNames || true,
      sortBy: chart.data.sortBy || 'none',
      xAxisSortBy: chart.data.xAxisSortBy || 'none',
      yAxisSortBy: chart.data.yAxisSortBy || 'none',
      rangeMode: chart.style.rangeMode || 'auto',
      rangeMin: chart.style.rangeMin || 0,
      rangeMax: chart.style.rangeMax || 100,
      omitZeroValues: chart.style.omitZeroValues || false,
      showCenterTotal: chart.style.showCenterTotal || false,
      doughnutSize: chart.style.doughnutSize || 50,
      labelsOutside: chart.style.labelsOutside || false,
      pieSpacing: chart.style.pieSpacing || 0,
      titleFontSize: chart.style.titleFontSize || 16,
      legendFontSize: chart.style.legendFontSize || 12,
      labelsFontSize: chart.style.labelsFontSize || 12,
    })
  }

  const enterDesignMode = () => {
    if (selectedChartId) {
      navigate(`/design/${selectedChartId}`)
    }
  }

  const createNewDesign = () => {
    if (selectedChartId) {
      navigate(`/design/${selectedChartId}`)
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
    <div className="p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-clr-text">Chart Builder</h1>
          <p className="text-clr-text-secondary">
            Create and customize charts for {dataset.emoji} {dataset.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/chart')}
            className="button-secondary"
          >
            Cancel
          </button>
          
          {selectedChartId && (
            <button
              onClick={() => navigate(`/design/${selectedChartId}`)}
              className="button-primary"
            >
              <Palette className="h-4 w-4 mr-2" />
              Design Mode
            </button>
          )}
        </div>
      </div>
      
      <div className="flex gap-6 flex-1">
        {/* Configuration Panel */}
        <div className="w-96 flex-shrink-0 space-y-4">
          {/* Chart Type & Title */}
          <div className="card p-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">Chart Title</label>
                <input
                  type="text"
                  value={chartConfig.title}
                  onChange={(e) => setChartConfig(prev => ({ ...prev, title: e.target.value }))}
                  className="input-field w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clr-text mb-3">Chart Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { type: 'bar', label: 'Bar' },
                    { type: 'horizontalBar', label: 'Horizontal Bar' },
                    { type: 'line', label: 'Line' },
                    { type: 'pie', label: 'Pie' },
                    { type: 'doughnut', label: 'Donut' }
                  ].map(({ type, label }) => (
                    <button
                      key={type}
                      onClick={() => setChartConfig({...chartConfig, type: type as any})}
                      className={`p-3 rounded-apple text-xs transition-all duration-200 flex flex-col items-center space-y-1 ${
                        chartConfig.type === type 
                          ? 'bg-clr-primary text-white shadow-sm scale-105' 
                          : 'bg-clr-bg-secondary hover:bg-clr-hover text-clr-text hover:scale-102'
                      }`}
                    >
                      <div className="scale-75">
                        {getChartTypeIcon(type)}
                      </div>
                      <span className="font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          {/* Data Configuration */}
          <div className="card p-4">
            <h3 className="font-semibold text-clr-text mb-4">Data Fields</h3>
            <div className="space-y-4">
              {!['pie', 'doughnut'].includes(chartConfig.type) && (
                <div>
                  <label className="block text-sm font-medium text-clr-text mb-2">
                    {chartConfig.type === 'horizontalBar' ? 'Y-Axis (Categories)' : 'X-Axis (Categories)'}
                  </label>
                  <select
                    value={chartConfig.xField}
                    onChange={(e) => setChartConfig(prev => ({ ...prev, xField: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="">Select field...</option>
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                </div>
              )}
              
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">
                  {['pie', 'doughnut'].includes(chartConfig.type) 
                    ? 'Data Field' 
                    : chartConfig.type === 'horizontalBar' 
                      ? 'X-Axis (Values)' 
                      : 'Y-Axis (Values)'}
                </label>
                <div className="flex gap-2">
                  <select
                    value={chartConfig.yFields[0]?.field || ''}
                    onChange={(e) => setChartConfig(prev => ({
                      ...prev,
                      yFields: [{ ...prev.yFields[0], field: e.target.value }]
                    }))}
                    className="input-field flex-1"
                  >
                    <option value="">Select field...</option>
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  {!['pie', 'doughnut'].includes(chartConfig.type) && (
                    <select
                      value={chartConfig.yFields[0]?.aggregation || 'count'}
                      onChange={(e) => setChartConfig(prev => ({
                        ...prev,
                        yFields: [{ ...prev.yFields[0], aggregation: e.target.value as any }]
                      }))}
                      className="input-field w-24"
                    >
                      <option value="count">Count</option>
                      <option value="sum">Sum</option>
                      <option value="avg">Avg</option>
                      <option value="min">Min</option>
                      <option value="max">Max</option>
                    </select>
                  )}
                </div>
              </div>
              
              {['bar', 'horizontalBar'].includes(chartConfig.type) && (
                <div>
                  <label className="block text-sm font-medium text-clr-text mb-2">Group By</label>
                  <select
                    value={chartConfig.groupBy}
                    onChange={(e) => setChartConfig(prev => ({ ...prev, groupBy: e.target.value }))}
                    className="input-field w-full"
                  >
                    <option value="">None</option>
                    {availableFields.map(field => (
                      <option key={field} value={field}>{field}</option>
                    ))}
                  </select>
                  
                  {chartConfig.groupBy && (
                    <div className="mt-2">
                      <select
                        value={chartConfig.stackedGrouping ? 'stacked' : 'grouped'}
                        onChange={(e) => setChartConfig(prev => ({ ...prev, stackedGrouping: e.target.value === 'stacked' }))}
                        className="input-field w-full"
                      >
                        <option value="stacked">Stacked</option>
                        <option value="grouped">Side by Side</option>
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Sort & Range */}
          <div className="card p-4">
            <h3 className="font-semibold text-clr-text mb-4">Sort & Range</h3>
            <div className="space-y-4">
              {['bar', 'horizontalBar'].includes(chartConfig.type) ? (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-clr-text mb-1">
                      {chartConfig.type === 'horizontalBar' ? 'Y-Sort' : 'X-Sort'}
                    </label>
                    <select
                      value={chartConfig.type === 'horizontalBar' ? chartConfig.yAxisSortBy : chartConfig.xAxisSortBy}
                      onChange={(e) => setChartConfig(prev => ({
                        ...prev,
                        [chartConfig.type === 'horizontalBar' ? 'yAxisSortBy' : 'xAxisSortBy']: e.target.value as any
                      }))}
                      className="input-field w-full text-sm"
                    >
                      <option value="none">None</option>
                      <option value="value-desc">Value ↓</option>
                      <option value="value-asc">Value ↑</option>
                      <option value="label-asc">Label A-Z</option>
                      <option value="label-desc">Label Z-A</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-clr-text mb-1">
                      {chartConfig.type === 'horizontalBar' ? 'X-Sort' : 'Y-Sort'}
                    </label>
                    <select
                      value={chartConfig.type === 'horizontalBar' ? chartConfig.xAxisSortBy : chartConfig.yAxisSortBy}
                      onChange={(e) => setChartConfig(prev => ({
                        ...prev,
                        [chartConfig.type === 'horizontalBar' ? 'xAxisSortBy' : 'yAxisSortBy']: e.target.value as any
                      }))}
                      className="input-field w-full text-sm"
                    >
                      <option value="none">None</option>
                      <option value="value-desc">Value ↓</option>
                      <option value="value-asc">Value ↑</option>
                      <option value="label-asc">Label A-Z</option>
                      <option value="label-desc">Label Z-A</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-clr-text mb-2">Sort Data</label>
                  <select
                    value={chartConfig.sortBy}
                    onChange={(e) => setChartConfig(prev => ({ ...prev, sortBy: e.target.value as any }))}
                    className="input-field w-full"
                  >
                    <option value="none">No Sorting</option>
                    <option value="value-desc">Value (High to Low)</option>
                    <option value="value-asc">Value (Low to High)</option>
                    <option value="label-asc">Label (A to Z)</option>
                    <option value="label-desc">Label (Z to A)</option>
                  </select>
                </div>
              )}

              {['bar', 'horizontalBar'].includes(chartConfig.type) && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-clr-text">Range</label>
                    <label className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={chartConfig.omitZeroValues}
                        onChange={(e) => setChartConfig(prev => ({ ...prev, omitZeroValues: e.target.checked }))}
                        className="mr-2"
                      />
                      <span>Omit zeros</span>
                    </label>
                  </div>
                  <select
                    value={chartConfig.rangeMode}
                    onChange={(e) => setChartConfig(prev => ({ ...prev, rangeMode: e.target.value as any }))}
                    className="input-field w-full"
                  >
                    <option value="auto">Auto</option>
                    <option value="manual">Manual</option>
                  </select>
                  
                  {chartConfig.rangeMode === 'manual' && (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-clr-text-secondary mb-1">Min</label>
                        <input
                          type="number"
                          value={chartConfig.rangeMin}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, rangeMin: parseFloat(e.target.value) || 0 }))}
                          className="input-field w-full text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-clr-text-secondary mb-1">Max</label>
                        <input
                          type="number"
                          value={chartConfig.rangeMax}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, rangeMax: parseFloat(e.target.value) || 100 }))}
                          className="input-field w-full text-sm"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Style Options */}
          <div className="card p-4">
            <h3 className="font-semibold text-clr-text mb-4">Style Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">Labels</label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chartConfig.showLegend}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, showLegend: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Legend</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chartConfig.showValues}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, showValues: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Values</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chartConfig.showPercentages}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, showPercentages: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Percentages</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={chartConfig.showCategoryNames}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, showCategoryNames: e.target.checked }))}
                      className="mr-2"
                    />
                    <span className="text-sm">Show Category Names</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">Colors</label>
                <div className="flex gap-2">
                  {chartConfig.colors.slice(0, 5).map((color, index) => (
                    <input
                      key={index}
                      type="color"
                      value={color}
                      onChange={(e) => {
                        const newColors = [...chartConfig.colors]
                        newColors[index] = e.target.value
                        setChartConfig(prev => ({ ...prev, colors: newColors }))
                      }}
                      className="w-8 h-8 rounded border border-clr-border cursor-pointer"
                    />
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-clr-text mb-2">Font Sizes</label>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-clr-text-secondary mb-1">
                      Title Size: {chartConfig.titleFontSize}px
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="24"
                      value={chartConfig.titleFontSize}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, titleFontSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-clr-text-secondary mb-1">
                      Legend Size: {chartConfig.legendFontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="16"
                      value={chartConfig.legendFontSize}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, legendFontSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-clr-text-secondary mb-1">
                      Labels Size: {chartConfig.labelsFontSize}px
                    </label>
                    <input
                      type="range"
                      min="8"
                      max="16"
                      value={chartConfig.labelsFontSize}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, labelsFontSize: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
                
              {['pie', 'doughnut'].includes(chartConfig.type) && (
                <div className="space-y-3">
                  {chartConfig.type === 'doughnut' && (
                    <div>
                      <label className="block text-sm font-medium text-clr-text mb-2">
                        Inner Size: {chartConfig.doughnutSize}%
                      </label>
                      <input
                        type="range"
                        min="20"
                        max="80"
                        value={chartConfig.doughnutSize}
                        onChange={(e) => setChartConfig(prev => ({ ...prev, doughnutSize: parseInt(e.target.value) }))}
                        className="w-full"
                      />
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-clr-text mb-2">
                      Spacing: {chartConfig.pieSpacing}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={chartConfig.pieSpacing}
                      onChange={(e) => setChartConfig(prev => ({ ...prev, pieSpacing: parseInt(e.target.value) }))}
                      className="w-full"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={chartConfig.labelsOutside}
                        onChange={(e) => setChartConfig(prev => ({ ...prev, labelsOutside: e.target.checked }))}
                        className="mr-2"
                      />
                      <span className="text-sm">Labels Outside</span>
                    </label>
                    
                    {chartConfig.type === 'doughnut' && (
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={chartConfig.showCenterTotal}
                          onChange={(e) => setChartConfig(prev => ({ ...prev, showCenterTotal: e.target.checked }))}
                          className="mr-2"
                        />
                        <span className="text-sm">Show Center Total</span>
                      </label>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={selectedChart ? handleUpdateChart : handleCreateChart}
              disabled={
                !chartConfig.yFields[0]?.field ||
                (!['pie', 'doughnut'].includes(chartConfig.type) && !chartConfig.xField)
              }
              className="button-primary flex-1 disabled:opacity-50"
            >
              {selectedChart ? 'Update' : 'Create'}
            </button>
            <button
              onClick={() => setShowTable(!showTable)}
              className="button-icon-secondary"
            >
              <Table className="h-4 w-4" />
              <span className="text-sm">Toggle Table</span>
            </button>
          </div>
        </div>

        {/* Chart Preview */}
        <div className="flex-1 card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-clr-text">Preview</h3>
            <div className="flex items-center gap-2">
              <button className="text-clr-text-secondary hover:text-clr-primary">
                <Download className="h-4 w-4" />
              </button>
              <button 
                onClick={createNewDesign}
                disabled={!selectedChartId}
                className="text-clr-text-secondary hover:text-clr-primary disabled:opacity-50 disabled:cursor-not-allowed"
                title="Create New Design"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>
          </div>
        
          <div className="h-full flex items-center justify-center">
            {chartData ? (
              <div className="w-full max-w-4xl h-96 max-h-96 chart-container">
                {renderChart()}
              </div>
            ) : (
              <div className="text-center text-clr-text-secondary">
                <Settings className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="font-medium text-lg mb-2">Configure your chart</p>
                <div className="text-sm space-y-1 max-w-md">
                  {!dataset && (
                    <p className="text-clr-error">• No dataset available - please import data first</p>
                  )}
                  {dataset && !chartConfig.yFields[0]?.field && (
                    <p className="text-clr-warning">• Select a data field ({chartConfig.type === 'pie' || chartConfig.type === 'doughnut' ? 'categories' : 'values'})</p>
                  )}
                  {dataset && chartConfig.yFields[0]?.field && !['pie', 'doughnut'].includes(chartConfig.type) && !chartConfig.xField && (
                    <p className="text-clr-warning">• Select a category field (X-axis)</p>
                  )}
                  {dataset && chartConfig.yFields[0]?.field && (['pie', 'doughnut'].includes(chartConfig.type) || chartConfig.xField) && (
                    <p className="text-clr-info">• Chart will render once all fields are selected</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChartView 