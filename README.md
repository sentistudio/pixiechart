# PixieChart - Data Visualization Made Simple

A lightweight, web-based data visualization tool that lets you explore, analyze, and create beautiful charts from your CSV data without leaving a single interface.

## Features

### ✨ Current Features (MVP)
- **CSV Import**: Drag-and-drop CSV files with automatic schema detection
- **Table View**: Sort, filter, and explore your data in a responsive table
- **Pivot Tables**: Create pivot tables with drag-and-drop interface
- **Chart Builder**: Build interactive charts (Bar, Line, Pie, Doughnut) with live preview
- **Design Mode**: Customize chart appearance with a Figma-like canvas editor using Fabric.js
- **Export**: Export charts as PNG images
- **Session Storage**: All data persists in your browser session

### 🎨 Design System
- **Apple HIG Inspired**: Clean, modern interface following Apple Human Interface Guidelines
- **Responsive Design**: Works on desktop and tablet devices
- **Dark/Light Mode**: Automatic theme switching based on system preference
- **Accessibility**: WCAG AA compliant with proper focus states and keyboard navigation

### 🔧 Technical Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: TailwindCSS with custom Apple HIG design tokens
- **UI Components**: Radix UI primitives + custom components
- **State Management**: Zustand with persistence
- **Routing**: React Router DOM
- **Charts**: Chart.js + react-chartjs-2
- **Canvas Editor**: Fabric.js for design mode
- **CSV Parsing**: PapaParse
- **Drag & Drop**: React Beautiful DnD (for pivot tables)

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Clone the repository** (or use the current directory)
```bash
git clone <repository-url>
cd pixiechart
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser** and navigate to `http://localhost:3000`

### Usage

1. **Import Data**: Click "Import CSV" to upload your data file
2. **Explore**: Use the Table view to sort, filter, and explore your data
3. **Create Pivots**: Build pivot tables by dragging fields to rows, columns, and values
4. **Build Charts**: Create visualizations with the Chart Builder
5. **Customize**: Enter Design Mode to fine-tune your chart appearance
6. **Export**: Download your visualizations as PNG images

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main application layout
│   └── CSVImport.tsx   # CSV import modal
├── pages/              # Route components
│   ├── Dashboard.tsx   # Main dashboard
│   ├── TableView.tsx   # Data table view
│   ├── PivotView.tsx   # Pivot table builder
│   ├── ChartView.tsx   # Chart builder
│   └── DesignMode.tsx  # Canvas editor
├── store/              # State management
│   └── index.ts        # Zustand store
├── utils/              # Utility functions
│   └── index.ts        # Helper functions
├── App.tsx             # Main app component
├── main.tsx            # Application entry point
└── index.css           # Global styles
```

## Data Model

The application uses a simple data model stored in the browser:

```typescript
Dataset {
  id: string
  name: string
  source: 'csv' | 'notion'
  schema: Record<string, string>
  data: any[]
  rowCount: number
  createdAt: string
  updatedAt: string
}

Chart {
  id: string
  datasetId: string
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  title: string
  data: { xField: string, yFields: Array<{field: string, aggregation: string}> }
  style: { colors: string[], showLegend: boolean, ... }
  designId?: string
  createdAt: string
  updatedAt: string
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Building for Production

```bash
npm run build
```

The build artifacts will be stored in the `dist/` directory.

## Roadmap

### Phase 2 Features
- [ ] Notion integration with OAuth
- [ ] Real-time collaboration
- [ ] Advanced chart types (Scatter, Radar, etc.)
- [ ] Template gallery
- [ ] Advanced pivot table features
- [ ] Export to PDF/SVG
- [ ] Data filters and transformations
- [ ] Undo/Redo functionality
- [ ] Mobile responsive design

### Phase 3 Features
- [ ] Backend API for data persistence
- [ ] User authentication
- [ ] Team workspaces
- [ ] Advanced analytics
- [ ] Custom themes
- [ ] Plugin system

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Acknowledgments

- Inspired by the need for a simple, intuitive data visualization tool
- Design system based on Apple Human Interface Guidelines
- Built with modern web technologies for optimal performance

---

**Note**: This is a lightweight, session-based version of PixieChart. All data is stored in your browser and will be lost when you clear your browser data or switch devices. For persistent storage, consider the planned backend integration in Phase 2. 