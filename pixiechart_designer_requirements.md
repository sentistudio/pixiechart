# Pixiechart Designer — Product Requirements & Technical Solution

## 1. Product Vision

Create a web‑based companion to Notion (and CSV files) called PixieChart that lets knowledge‑workers explore, visualise, and *polish* their data — from raw tables to pivot summaries to presentation‑ready charts — **without leaving a single interface**.  Think *"Notion tables × Excel pivots × Figma canvas"*.

## 2. Core User Stories

| ID | As a…                | I want to…                                                                | So that…                                        |
| -- | -------------------- | ------------------------------------------------------------------------- | ----------------------------------------------- |
| U1 | Notion power‑user    | Connect any database via OAuth                                            | my data stays in sync                           |
| U2 | Analyst              | Upload a CSV when I don’t have a Notion DB                                | I can prototype quickly                         |
| U3 | Product manager      | Sort, filter, and edit values inline                                      | I can fix data mistakes fast                    |
| U4 | Finance lead         | Build a pivot table with drag‑&‑drop                                      | I see totals by region, month, etc.             |
| U5 | Designer             | Create multiple charts with live preview                                  | I iterate on the story visually                 |
| U6 | Presenter            | Toggle a chart’s underlying table                                         | I can answer “where did that number come from?” |
| U7 | Design‑perfectionist | Enter a Figma‑like mode to tweak colours, move labels, or add annotations | my final slide looks pixel‑perfect              |
| U8 | Any user             | Undo or reset a design session                                            | I’m never stuck with accidental changes         |

## 3. Functional Requirements

### 3.1 Data Connections

- **Notion connector** — OAuth2 flow; user chooses workspace & database(s).
- **CSV import** — drag‑and‑drop; client‑side parse (e.g. Papa Parse); store as *Dataset* object.

### 3.2 Table View

- Grid with virtualised rows (100k+) using AG‑Grid or TanStack Virtual Table.
- Column operations: sort, multi‑filter, resize, re‑order, hide/show.
- Inline editing → dirty state → bulk sync back to Notion (PATCH).
- Change‑history badge per cell (future).

### 3.3 Pivot View

- UI model: Rows, Columns, Values, Filters trays.
- Aggregations: count, sum, avg, min, max, % of total.
- Export pivot → new Dataset for charting.
- Column re‑naming / formatting (e.g. currency, #, %).

### 3.4 Chart Builder View

- **Chart types**: Vertical Bar, Horizontal Bar, Line, Pie, Doughnut.
- **Data config panel**
  - X‑axis / Category field selector.
  - Y‑axis metric(s) with aggregation picker.
  - Grouping → stacked vs side‑by‑side (bars), multi‑lines.
- **Chart settings panel**
  - Title text & font size.
  - Colour scheme: single colour → palette switch.
  - Legend toggle, label toggles (value, %, category).
  - Y‑axis scale: auto | manual (min, max, step).
- Multi‑chart sidebar → select active chart; duplicate; delete.

### 3.5 Chart ↔ Table Toggle

- “Show data” button reveals the Dataset or pivot feeding that chart in a side‑panel grid.

### 3.6 Design Mode (Detached Canvas)

- Action: **Enter Design Mode**
  - Takes a snapshot of the current chart JSON and detaches it from live data.
  - Opens a vector canvas (Fabric.js / Konva) where every bar/segment/label is a selectable element.
- Editing capabilities
  - Move, resize, delete, recolour any element.
  - Add new SVG/text objects (arrows, annotations).
  - Layer panel + alignment tools.
- Session management
  - Unsaved changes indicator.
  - Undo/Redo stack (Ctrl‑Z/Y) per session.
- Exit options: **Save** (stores Design JSON), **Cancel** (discard), **Reset to Original** (delete Design JSON).
- UI cue: charts with an active Design JSON show a ✏️ badge in the sidebar.

## 4. Non‑Functional Requirements

| Category       | Target                                                                   |
| -------------- | ------------------------------------------------------------------------ |
| Performance    | <200 ms UI interactions, <2 s initial data load for 10k rows             |
| Scalability    | 100 simultaneous users per workspace; stateless API + horizontal scaling |
| Security       | OAuth scopes least privilege; encrypted rest & transit; SOC2 roadmap     |
| Cross‑platform | Latest Chrome, Safari, Edge; responsive down to iPad portrait            |
| Accessibility  | WCAG AA: focus states, ARIA labels, keyboard nav                         |

## 5. System Architecture

```mermaid
flowchart LR
Client[React SPA]
subgraph Backend (NodeJS)
  API[GraphQL / REST]
  NotionProxy[Notion Service]
  Storage[PostgreSQL]
  Assets[S3 (Chart SVGs)]
end
Client -- HTTPS --> API
API -- fetch --> NotionProxy
NotionProxy -- Notion SDK --> Notion
API -- read/write --> Storage
Client == WebSocket == API
```

- **Frontend**: React + TypeScript, Vite, **TailwindCSS with Apple HIG design tokens** (typography tokens, Cupertino accent palette), **Radix UI primitives**, Zustand, React Router. Chart.js (data stage) + Fabric.js (design stage).
- **Backend**: Node 20 + Fastify; Postgres for metadata; Redis for session & pub/sub; S3/GCS for design snapshots.
- **Sync workers**: BullMQ jobs to pull Notion deltas, respect rate limits (3 rps/user).
- **Real‑time collab (phase 2)**: Socket.io or Liveblocks.

## 6. Data Model (simplified)

```ts
Dataset { id, name, source (notion|csv), schema, rowCount, createdBy, createdAt }
Pivot { id, datasetId, configJSON, createdBy, ... }
Chart { id, datasetId|pivotId, configJSON, designId?, title, order }
Design { id, chartId, fabricJSON, updatedAt, updatedBy }
```

## 7. Minimal Viable Product (MVP)

1. **CSV import & raw table view** (read‑only).
2. **Pivot builder** with sum/count.
3. **Chart builder** (bar, line, pie) with live preview, title, colours.
4. **Chart ↔ table toggle**.
5. **Design Mode v1**: colour & text edits only.
6. **Export chart as PNG/SVG**.

## 8. Phase‑2 Enhancements

- Notion live sync & inline editing.
- Full detach/edit canvas with shape tools.
- Undo/Redo history across modes.
- Team collaboration & comment layer.
- Template gallery + theming.

## 9. Open Questions

1. **Granular Notion perms** — how to respect workspace/database‑level sharing?
2. **Large datasets** — need server‑side aggregation for >100k rows?
3. **Licensing** — seat‑based vs chart‑based pricing?
4. **Offline** — local cache & queue or online‑only for v1?

## 10. Timeline (aggressive estimate)

| Phase                  | Duration | Milestones                         |
| ---------------------- | -------- | ---------------------------------- |
| Discovery & UX mockups | 2 weeks  | Clickable Figma prototype          |
| MVP Sprint 1           | 4 weeks  | CSV + Table view + Chart builder   |
| MVP Sprint 2           | 4 weeks  | Pivot + basic Design Mode + export |
| Private beta           | 2 weeks  | Collect feedback, fix bugs         |
| Public launch          | N/A      | Depends on beta findings           |

## 11. Visual Design System (Apple HIG‑inspired)

- **Layout** – Grid‑based, generous whitespace, large touch targets; optional translucency overlays (`backdrop-filter`) for depth.
- **Typography** – San Francisco variable fonts via `@font-face`; dynamic type scaling with CSS `clamp()` ensuring ≥16 px body.
- **Colour tokens** – Semantic palette (`clr-bg`, `clr-primary`, `clr-info`…) mapping to light/dark schemes echoing Apple accent colours; exported to Tailwind config for use across components.
- **Iconography** – Prefer SF Symbols 5; fall back to custom SVG set for data‑viz elements.
- **Motion & Gestures** – Subtle iOS cubic‑bezier (`.25,.1,.25,1`) for fades and slides; spring animations for panel transitions; honour *prefers‑reduced‑motion*.
- **Components** – Built atop Radix primitives + custom chart widgets; 4‑pt spacing grid, 8‑pt corner radius; shadows at 5 % opacity.
- **Accessibility** – WCAG AA contrast, keyboard navigation, ARIA labels; dynamic type & high‑contrast palette toggle.

---

*Prepared 17 Jul 2025 — v0.1*

