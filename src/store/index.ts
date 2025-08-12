import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Dataset {
  id: string
  name: string
  emoji: string
  source: 'csv' | 'notion' | 'gsheet'
  schema: Record<string, string>
  data: any[]
  rowCount: number
  createdAt: string
  updatedAt: string
}

export interface PivotConfig {
  id: string
  datasetId: string
  title: string
  rows: string[]
  columns: string[]
  values: Array<{
    field: string
    aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'count_unique'
  }>
  filters: Array<{
    field: string
    operator: 'equals' | 'contains' | 'greater' | 'less'
    value: any
  }>
  createdAt: string
  updatedAt: string
}

export interface ChartConfig {
  id: string
  datasetId?: string
  pivotId?: string
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'horizontalBar'
  title: string
  data: {
    xField: string
    yFields: Array<{
      field: string
      aggregation: 'sum' | 'count' | 'avg' | 'min' | 'max'
    }>
    groupBy?: string
    stackedGrouping?: boolean
    sortBy?: 'none' | 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc'
    xAxisSortBy?: 'none' | 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc'
    yAxisSortBy?: 'none' | 'value-desc' | 'value-asc' | 'label-asc' | 'label-desc'
  }
  style: {
    colors: string[]
    showLegend: boolean
    showValues: boolean
    showPercentages: boolean
    showCategoryNames: boolean
    yAxisMin?: number
    yAxisMax?: number
    rangeMode?: 'auto' | 'manual'
    rangeMin?: number
    rangeMax?: number
    omitZeroValues?: boolean
    showCenterTotal?: boolean
    doughnutSize?: number
    labelsOutside?: boolean
    pieSpacing?: number
    titleFontSize?: number
    legendFontSize?: number
    labelsFontSize?: number
  }
  designId?: string
  createdAt: string
  updatedAt: string
}

export interface DesignConfig {
  id: string
  chartId: string
  title: string
  fabricJSON: string
  createdAt: string
  updatedAt: string
}

interface AppState {
  datasets: Dataset[]
  pivots: PivotConfig[]
  charts: ChartConfig[]
  designs: DesignConfig[]
  activeDataset: string | null
  activePivot: string | null
  activeChart: string | null
  
  // Actions
  addDataset: (dataset: Dataset) => void
  updateDataset: (id: string, updates: Partial<Dataset>) => void
  deleteDataset: (id: string) => void
  setActiveDataset: (id: string | null) => void
  
  addPivot: (pivot: PivotConfig) => void
  updatePivot: (id: string, updates: Partial<PivotConfig>) => void
  deletePivot: (id: string) => void
  setActivePivot: (id: string | null) => void
  
  addChart: (chart: ChartConfig) => void
  updateChart: (id: string, updates: Partial<ChartConfig>) => void
  deleteChart: (id: string) => void
  deleteChartWithDesignChoice: (id: string, keepDesigns: boolean) => void
  setActiveChart: (id: string | null) => void
  
  addDesign: (design: DesignConfig) => void
  updateDesign: (id: string, updates: Partial<DesignConfig>) => void
  deleteDesign: (id: string) => void
  
  // Getters
  getDataset: (id: string) => Dataset | undefined
  getPivot: (id: string) => PivotConfig | undefined
  getChart: (id: string) => ChartConfig | undefined
  getDesign: (chartId: string) => DesignConfig | undefined
  getDesignsByDataset: (datasetId: string) => DesignConfig[]
  getChartDesigns: (chartId: string) => DesignConfig[]
  
  // Clear all data
  clearAllData: () => void
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      datasets: [],
      pivots: [],
      charts: [],
      designs: [],
      activeDataset: null,
      activePivot: null,
      activeChart: null,
      
      addDataset: (dataset) => set((state) => ({ 
        datasets: [...state.datasets, dataset] 
      })),
      
      updateDataset: (id, updates) => set((state) => ({
        datasets: state.datasets.map(d => 
          d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
        )
      })),
      
      deleteDataset: (id) => set((state) => ({
        datasets: state.datasets.filter(d => d.id !== id),
        pivots: state.pivots.filter(p => p.datasetId !== id),
        charts: state.charts.filter(c => c.datasetId !== id),
        designs: state.designs.filter(d => {
          const chart = state.charts.find(c => c.id === d.chartId)
          return chart ? chart.datasetId !== id : false
        }),
        activeDataset: state.activeDataset === id ? null : state.activeDataset
      })),
      
      setActiveDataset: (id) => set({ activeDataset: id }),
      
      addPivot: (pivot) => set((state) => ({ 
        pivots: [...state.pivots, pivot] 
      })),
      
      updatePivot: (id, updates) => set((state) => ({
        pivots: state.pivots.map(p => 
          p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
        )
      })),
      
      deletePivot: (id) => set((state) => ({
        pivots: state.pivots.filter(p => p.id !== id),
        charts: state.charts.filter(c => c.pivotId !== id),
        activePivot: state.activePivot === id ? null : state.activePivot
      })),
      
      setActivePivot: (id) => set({ activePivot: id }),
      
      addChart: (chart) => set((state) => ({ 
        charts: [...state.charts, chart] 
      })),
      
      updateChart: (id, updates) => set((state) => ({
        charts: state.charts.map(c => 
          c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
        )
      })),
      
      deleteChart: (id) => set((state) => ({
        charts: state.charts.filter(c => c.id !== id),
        designs: state.designs.filter(d => d.chartId !== id),
        activeChart: state.activeChart === id ? null : state.activeChart
      })),
      
      deleteChartWithDesignChoice: (id, keepDesigns) => set((state) => ({
        charts: state.charts.filter(c => c.id !== id),
        designs: keepDesigns ? state.designs : state.designs.filter(d => d.chartId !== id),
        activeChart: state.activeChart === id ? null : state.activeChart
      })),
      
      setActiveChart: (id) => set({ activeChart: id }),
      
      addDesign: (design) => set((state) => ({ 
        designs: [...state.designs, {
          ...design,
          createdAt: design.createdAt || new Date().toISOString()
        }] 
      })),
      
      updateDesign: (id, updates) => set((state) => ({
        designs: state.designs.map(d => 
          d.id === id ? { ...d, ...updates, updatedAt: new Date().toISOString() } : d
        )
      })),
      
      deleteDesign: (id) => set((state) => ({
        designs: state.designs.filter(d => d.id !== id)
      })),
      
      getDataset: (id) => get().datasets.find(d => d.id === id),
      getPivot: (id) => get().pivots.find(p => p.id === id),
      getChart: (id) => get().charts.find(c => c.id === id),
      getDesign: (chartId) => get().designs.find(d => d.chartId === chartId),
      getDesignsByDataset: (datasetId) => {
        const state = get()
        return state.designs.filter(design => {
          const chart = state.charts.find(c => c.id === design.chartId)
          return chart?.datasetId === datasetId
        })
      },
      getChartDesigns: (chartId) => get().designs.filter(d => d.chartId === chartId),
      
      clearAllData: () => set({
        datasets: [],
        pivots: [],
        charts: [],
        designs: [],
        activeDataset: null,
        activePivot: null,
        activeChart: null
      })
    }),
    {
      name: 'pixiechart-storage',
      partialize: (state) => ({
        datasets: state.datasets,
        pivots: state.pivots,
        charts: state.charts,
        designs: state.designs
      })
    }
  )
) 