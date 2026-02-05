## Packages
papaparse | CSV parsing
xlsx | Excel parsing
recharts | Data visualization charts
framer-motion | Animations and transitions
lucide-react | Icons
clsx | Class name utility
tailwind-merge | Class name merging
@radix-ui/react-slot | primitive for UI components
@radix-ui/react-dialog | Modal dialogs
@radix-ui/react-scroll-area | Custom scrollbars
@radix-ui/react-dropdown-menu | Dropdowns
@radix-ui/react-tooltip | Tooltips
@radix-ui/react-select | Select inputs
@radix-ui/react-label | Form labels
@radix-ui/react-tabs | Tab interfaces
zod | Schema validation
@hookform/resolvers | Form validation

## Notes
Tailwind Config - extend fontFamily:
fontFamily: {
  display: ["var(--font-display)"],
  body: ["var(--font-body)"],
  mono: ["var(--font-mono)"],
}

Integration:
- Frontend handles file parsing (CSV/XLSX)
- Frontend handles data filtering and aggregation
- Backend (/api/analyze) provides the *plan* for visualization
