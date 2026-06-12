# LDAP UI - Frontend

Modern B2B-SaaS Directory Management Interface built with Vue 3, TypeScript, and Tailwind CSS.

## 🎨 Design System

This frontend has been redesigned with a modern B2B-SaaS aesthetic inspired by FlowFuse/Node-RED platforms.

### Key Design Features

#### Color Palette
- **Primary**: Indigo (`indigo-600`) for actions and buttons
- **Neutrals**: Slate colors for backgrounds and text
- **Status**: Green (success), Red (error), Amber (warning), Blue (info)
- **Light Background**: `gray-50` for main content area
- **Dark Sidebar**: `slate-900` for navigation

#### Typography
- **Font Stack**: System sans-serif (Inter, Segoe UI, Roboto)
- **Sizes**: Semantic sizing from `xs` to `3xl`
- **Weights**: Clean hierarchy with 400/500/600/700 weights

#### Component Library
- **Button**: 4 variants (primary, secondary, danger, ghost)
- **Card**: Container with optional header, body, footer
- **Input**: Modern text inputs with focus states
- **Modal**: Accessible dialogs with transitions
- **Sidebar**: Dark navigation with icon + label items
- **Header**: White navigation bar with user menu
- **Badge**: Status indicators
- **Alert**: Info/error/warning/success messages
- **Table**: Accessible data tables
- **FormGroup**: Label + input + hint + error wrapper

## 🏗️ Layout Structure

```
App.vue
├── Sidebar (Dark navigation)
├── Header (White top bar)
└── Main Content
    ├── TreeExplorer (Left sidebar)
    └── EntryEditor (Main editor)
```

### Responsive Design
- **Mobile**: Hamburger menu, stacked layout
- **Tablet**: Sidebar toggleable
- **Desktop**: Full 2-column + sidebar layout

## 📦 Technology Stack

- **Vue 3**: Latest composition API
- **TypeScript**: Full type safety
- **Tailwind CSS**: Utility-first styling
- **Headless UI**: Accessible components (Dialogs, Dropdowns)
- **Heroicons**: Beautiful SVG icons
- **Vite**: Fast build tool and dev server
- **Pinia**: State management

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd packages/frontend
npm install
```

### Development

```bash
npm run dev
```

Starts Vite dev server on `http://localhost:5173`

### Build

```bash
npm run build
```

Generates optimized production build in `dist/`

## 📁 Project Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── Header.vue      # Top navigation bar
│   │   ├── Sidebar.vue     # Left navigation sidebar
│   │   └── SidebarItem.vue # Navigation item component
│   ├── ui/
│   │   ├── Button.vue      # Reusable button
│   │   ├── Card.vue        # Container card
│   │   ├── Input.vue       # Text input
│   │   ├── Modal.vue       # Dialog modal
│   │   ├── Badge.vue       # Status badge
│   │   ├── Alert.vue       # Alert message
│   │   ├── FormGroup.vue   # Form wrapper
│   │   ├── Table.vue       # Data table
│   │   ├── DropdownMenu.vue # Context menu
│   │   └── Popover.vue     # Popover
│   ├── editor/
│   │   ├── EntryEditor.vue        # Main entry form
│   │   ├── AttributeRow.vue       # Attribute input
│   │   ├── DeleteEntryDialog.vue  # Delete confirmation
│   │   ├── PasswordChangeDialog.vue # Password form
│   │   └── ... (other dialogs)
│   ├── TreeExplorer.vue   # Directory tree
│   └── ...
├── views/
│   └── LoginView.vue      # Login form
├── stores/
│   └── auth.ts            # Pinia auth store
├── api/
│   └── ldap-client.ts     # LDAP API client
├── App.vue                # Root component
├── main.ts                # App entry
└── app.css                # Global styles + Tailwind

tailwind.config.mjs         # Tailwind configuration
```

## 🎯 Key Components

### Button
```vue
<Button 
  variant="primary" 
  size="md" 
  :loading="isLoading"
  @click="submit()"
>
  Save Changes
</Button>
```

### Card
```vue
<Card>
  <template #header>
    <h2>Entry Details</h2>
  </template>
  
  <p>Content here</p>
  
  <template #footer>
    <Button>Save</Button>
  </template>
</Card>
```

### Modal
```vue
<Modal 
  :open="showModal"
  title="Confirm"
  @ok="handleSubmit()"
  @cancel="showModal = false"
>
  <p>Are you sure?</p>
</Modal>
```

### FormGroup
```vue
<FormGroup 
  label="Username" 
  :required="true"
  hint="Enter LDAP username"
>
  <Input v-model="username" />
</FormGroup>
```

## 🎨 Tailwind CSS Customization

Custom configuration in `tailwind.config.mjs`:

- Extended color palette with semantic naming
- 4px spacing base unit (1, 2, 3, 4, ... = 4px, 8px, 12px, 16px, ...)
- Custom border radius (sm: 4px, md: 6px, lg: 8px, xl: 12px)
- Shadow definitions optimized for cards and modals
- Font family customization (system sans-serif + monospace)

## 🔧 Development Guidelines

### Component Creation
1. Place UI components in `components/ui/`
2. Place feature components in `components/` or feature folders
3. Use TypeScript for type safety
4. Use Tailwind CSS for styling (no inline styles)

### Styling
- Use semantic Tailwind classes: `text-gray-900`, `bg-indigo-600`
- Leverage `@layer` utilities in `app.css` for reusable styles
- Use transitions for interactive states: `transition-colors duration-150`
- Always include hover/active/disabled states

### Accessibility
- Use semantic HTML (`<button>`, `<label>`, `<input>`)
- Add ARIA labels where necessary
- Ensure keyboard navigation works (Tab, Enter, Esc)
- Maintain color contrast (WCAG AA minimum)
- Focus states clearly visible

## 📝 CSS Architecture

### Global Styles (`app.css`)
- **@layer base**: Reset, semantic tags, fonts
- **@layer components**: Button, card, badge variants
- **@layer utilities**: Helper classes like `flex-center`, `sidebar-nav-item`

### Component Styles
- Scoped component styles only
- Tailwind utility classes preferred over custom CSS
- Use `scoped` attribute on `<style>` tags

## 🧪 Testing

Run tests:
```bash
npm run test        # Run once
npm run test:watch  # Watch mode
```

## 📖 Design System Documentation

See [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md) for:
- Complete component library reference
- Usage examples
- Accessibility guidelines
- Color palette details
- Typography system

## 🔐 Authentication

Login flow uses LDAP credentials:
1. User provides LDAP server URL
2. Enters username and password
3. Backend validates against LDAP server
4. Session token stored in auth store

## 🚦 Status

### Implemented
- ✅ Modern layout with Sidebar + Header
- ✅ Component library (Button, Card, Input, Modal, etc)
- ✅ LoginView redesign
- ✅ EntryEditor modernization
- ✅ Dialog improvements (DeleteEntry, PasswordChange)
- ✅ TreeExplorer updates
- ✅ Responsive design

### In Progress / Future
- [ ] Dark mode support
- [ ] Additional dialog components
- [ ] Search/filter enhancements
- [ ] Batch operations UI
- [ ] Admin dashboard view

## 📚 Further Reading

- [Vue 3 Documentation](https://vuejs.org/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/)
- [DESIGN_SYSTEM.md](../../DESIGN_SYSTEM.md)

## 📄 License

Same as main project.
