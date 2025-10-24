# ActivityPub Relay Frontend

A modern Vue 3 + Vite frontend for the ActivityPub Relay server.

## Features

- 📱 Responsive design that works on desktop, tablet, and mobile
- 🌙 Dark/Light theme toggle with localStorage persistence
- ⚡ Fast development with Vite hot reload
- 🎨 Clean, modern UI with CSS custom properties
- 🔧 API integration with TypeScript support
- 📦 Reusable Vue 3 components

## Project Structure

```
src/frontend/
├── main.ts              # Application entry point
├── App.vue              # Root component
├── style.css            # Global styles
├── api/
│   └── client.ts        # API client for backend communication
├── components/
│   ├── NavBar.vue       # Navigation bar with theme toggle
│   ├── Footer.vue       # Footer component
│   ├── Card.vue         # Reusable card component
│   └── Alert.vue        # Alert/notification component
├── composables/
│   └── useAdmin.ts      # Admin state management
├── pages/
│   ├── Home.vue         # Landing page
│   └── Admin.vue        # Admin panel
└── router/
    └── index.ts         # Vue Router configuration
```

## Setup

### Prerequisites

- Node.js 16+ and pnpm

### Installation

```bash
# Install dependencies
pnpm install
```

### Development

```bash
# Start development server with hot reload
pnpm run dev:frontend

# The app will be available at http://localhost:5173
```

### Building

```bash
# Build for production
pnpm run build:frontend

# Preview production build
pnpm run preview
```

## Available Scripts

- `pnpm run dev:frontend` - Start Vite development server
- `pnpm run build:frontend` - Build for production
- `pnpm run preview` - Preview production build locally

## Components

### NavBar
Navigation bar with active route highlighting and theme toggle.

```vue
<NavBar />
```

### Card
Reusable card component for content sections.

```vue
<Card title="Section Title" variant="default">
  <template #default>
    Content goes here
  </template>
  <template #footer>
    Footer actions
  </template>
</Card>
```

Props:
- `title` (string, optional) - Card header title
- `variant` (string, optional) - 'default', 'success', 'error', 'warning'

### Alert
Alert/notification component.

```vue
<Alert message="Success!" type="success" :closeable="true" />
```

Props:
- `message` (string, required) - Alert message
- `type` (string, optional) - 'success', 'error', 'warning', 'info' (default: 'info')
- `closeable` (boolean, optional) - Show close button (default: true)

## Composables

### useAdmin
State management for admin panel with API integration.

```typescript
const {
  apiKey,
  authenticated,
  loading,
  followRequests,
  domainRules,
  settings,
  authenticate,
  loadData,
  approveFollow,
  rejectFollow,
  addRule,
  deleteRule,
  updateSettings,
} = useAdmin()
```

## API Integration

The frontend communicates with the backend via the `apiClient`:

```typescript
import apiClient from '@/api/client'

// Authenticate
apiClient.setApiKey('your-api-key')

// Get follow requests
const requests = await apiClient.getFollowRequests()

// Approve a follow request
await apiClient.approveFollowRequest(id)

// Get domain rules
const rules = await apiClient.getDomainRules()

// Add a domain rule
await apiClient.createDomainRule({ domain: 'example.com', type: 'whitelist' })
```

## Styling

The app uses CSS custom properties (variables) for theming:

```css
:root {
  --bg-primary: #f5f7fa;
  --bg-secondary: #ffffff;
  --text-primary: #2d3748;
  --button-primary: #4299e1;
  /* ... more variables */
}
```

Theme is automatically switched between light and dark modes based on:
1. Saved preference in localStorage
2. System preference if no saved preference

## Pages

### Home Page
- Landing page with relay information
- Feature highlights
- Getting started guide
- ActivityPub/Relay explanations
- Server statistics (when available)

### Admin Panel
- API key authentication
- Follow request management (approve/reject)
- Domain rule management (add/delete)
- Settings management
- Real-time status updates

## Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

## Development Tips

### Hot Module Replacement (HMR)
Vite provides automatic hot reload during development. Changes to Vue components will be reflected immediately without page refresh.

### TypeScript
All code uses TypeScript for type safety. Make sure to maintain type definitions when adding new features.

### Linting
Run the biome linter:
```bash
pnpm run check
pnpm run fix
```

## Deployment

The frontend is built as a static SPA and should be served from the `/public` directory. The Vite build output goes to `public/dist/`.

For production deployment:
1. Run `pnpm run build:frontend`
2. Serve the contents of `public/` directory via your web server or CDN
3. Ensure all static assets are properly cached
4. Configure your server to serve `index.html` for any route not found (SPA fallback)

## License

Same as the main ActivityPub-Relay-Bun project.
