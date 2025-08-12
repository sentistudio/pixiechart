import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Overview from './pages/Overview'
import TableView from './pages/TableView'
import PivotView from './pages/PivotView'
import PivotManagement from './pages/PivotManagement'
import ChartView from './pages/ChartView'
import ChartManagement from './pages/ChartManagement'
import DesignMode from './pages/DesignMode'
import DesignManagement from './pages/DesignManagement'
import { useTheme } from './store/theme'

function App() {
  const { theme } = useTheme()
  
  // Initialize theme on app load
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])
  
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/overview" element={<Overview />} />
          <Route path="/table" element={<TableView />} />
          <Route path="/pivot" element={<PivotView />} />
          <Route path="/pivot-management" element={<PivotManagement />} />
          <Route path="/chart" element={<ChartManagement />} />
          <Route path="/chart/builder" element={<ChartView />} />
          <Route path="/design" element={<DesignManagement />} />
          <Route path="/design/:chartId" element={<DesignMode />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App 