# LDAP UI - Design System & Component Library

Modern B2B-SaaS UI Design based on FlowFuse/Node-RED aesthetic.

## Design Philosophy

- **Minimal, Clean**: Flat design with subtle shadows and borders
- **Technical**: Developer-focused, no unnecessary decorations
- **Accessible**: Keyboard navigation, ARIA labels, high contrast
- **Responsive**: Mobile-first, works on all screen sizes

## Color Palette

### Neutrals (Slate)
- `slate-50`: Very light background
- `slate-900`: Dark sidebar background
- `slate-800`: Sidebar hover states

### Primary (Indigo)
- `indigo-600`: Primary action buttons, links
- `indigo-700`: Hover state
- `indigo-800`: Active state
- `indigo-50`: Selected/highlight background

### Status Colors
- **Success**: `emerald-*` (green)
- **Error**: `red-*` (danger)
- **Warning**: `amber-*` (yellow)
- **Info**: `blue-*` (light blue)
- **Neutral**: `gray-*` (default)

## Layout Components

### Sidebar
Dark navigation sidebar (bg-slate-900) with icon + label items.
```vue
<Sidebar 
  :is-open="sidebarOpen"
  active-item="directory"
  @toggle="sidebarOpen = !sidebarOpen"
  @navigate="activeItem = $event"
  @logout="logout()"
/>
```

### Header
White header with breadcrumbs, user menu, and logout.
```vue
<Header
  :user-name="currentUser"
  :breadcrumbs="['Team', 'Project']"
  @toggle-sidebar="toggleSidebar()"
  @logout="logout()"
/>
```

## UI Components

### Button
Reusable button with variants: primary, secondary, danger, ghost.
```vue
<Button variant="primary" size="md" :loading="isLoading" @click="submit()">
  Save Changes
</Button>
```

**Props:**
- `variant`: 'primary' | 'secondary' | 'danger' | 'ghost' (default: 'primary')
- `size`: 'sm' | 'md' | 'lg' (default: 'md')
- `disabled`: boolean
- `loading`: boolean

### Card
Container with optional header, body, and footer slots.
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

### Badge
Status indicator badge.
```vue
<Badge status="success">Running</Badge>
<Badge status="error">Error</Badge>
<Badge status="warning">Pending</Badge>
<Badge status="neutral">Suspended</Badge>
```

**Props:**
- `status`: 'success' | 'error' | 'warning' | 'info' | 'neutral'

### Input
Text input field with validation states.
```vue
<Input
  v-model="username"
  placeholder="Enter username"
  :error="validationError"
/>
```

**Props:**
- `type`: 'text' | 'email' | 'password' | etc
- `placeholder`: string
- `modelValue`: string | number
- `disabled`: boolean
- `error`: boolean

### Modal
Accessible modal dialog with header, body, footer.
```vue
<Modal 
  :open="showModal"
  title="Confirm Action"
  ok-title="Delete"
  @ok="handleDelete()"
  @cancel="showModal = false"
>
  <p>Are you sure?</p>
</Modal>
```

**Props:**
- `open`: boolean (required)
- `title`: string
- `okTitle`: string (default: 'OK')
- `cancelTitle`: string (default: 'Cancel')
- `hideFooter`: boolean

### DropdownMenu
Context menu with items.
```vue
<DropdownMenu title="Actions">
  <li @click="edit()" role="menuitem" class="px-4 py-2 hover:bg-gray-100">
    Edit
  </li>
  <li @click="delete()" role="menuitem" class="px-4 py-2 hover:bg-gray-100 text-red-700">
    Delete
  </li>
</DropdownMenu>
```

### FormGroup
Wrapper for form labels, inputs, hints, and errors.
```vue
<FormGroup label="Username" :required="true" hint="Enter your LDAP username">
  <Input v-model="username" />
</FormGroup>
```

**Props:**
- `label`: string
- `required`: boolean
- `error`: string (error message)
- `hint`: string

### Alert
Info/warning/error message boxes.
```vue
<Alert variant="error" dismissible @dismiss="dismiss()">
  <strong>Error:</strong> Failed to save changes
</Alert>
```

**Props:**
- `variant`: 'success' | 'error' | 'warning' | 'info' (default: 'info')
- `dismissible`: boolean

### Table
Basic table with header styling.
```vue
<Table :columns="[{ key: 'name', label: 'Name' }, { key: 'status', label: 'Status' }]">
  <tr class="border-b border-gray-200 hover:bg-gray-50">
    <td class="px-4 py-3">John Doe</td>
    <td class="px-4 py-3"><Badge status="success">Active</Badge></td>
  </tr>
</Table>
```

## Typography

### Font Stack
- Primary: System sans-serif (-apple-system, BlinkMacSystemFont, Segoe UI, Roboto)
- Mono: Menlo, Monaco, Courier New

### Sizes & Weights
- **h1**: 30px, 700
- **h2**: 24px, 600
- **h3**: 20px, 600
- **body**: 16px, 400
- **sm**: 14px, 400
- **xs**: 12px, 400

## Spacing

Uses 4px base unit:
- 0, 1 (4px), 2 (8px), 3 (12px), 4 (16px), 5 (20px), 6 (24px), etc.

## Shadows

- `shadow-sm`: Subtle card shadow
- `shadow-md`: Modal shadow
- `shadow-lg`: Dropdown/popover shadow
- `shadow-xl`: Heavy elevation

## Border Radius

- `rounded-md`: 6px (inputs, buttons)
- `rounded-lg`: 8px (cards, modals)
- `rounded-full`: Pills, avatars

## Transitions

All interactive elements use smooth transitions:
- Duration: 150ms standard, 200-300ms for modals
- Easing: ease (default)

## Usage Examples

### Login Form
```vue
<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-50">
    <Card class="w-full max-w-md">
      <template #header>
        <h2>Sign In</h2>
      </template>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <FormGroup label="Server URL" :required="true">
          <Input v-model="url" type="url" placeholder="ldap://localhost:389" />
        </FormGroup>

        <FormGroup label="Username" :required="true">
          <Input v-model="username" placeholder="user@example.com" />
        </FormGroup>

        <FormGroup label="Password" :required="true">
          <Input v-model="password" type="password" />
        </FormGroup>

        <Alert v-if="error" variant="error" dismissible @dismiss="error = null">
          {{ error }}
        </Alert>

        <Button type="submit" :loading="loading" class="w-full">
          Sign In
        </Button>
      </form>
    </Card>
  </div>
</template>
```

### Directory Entry List
```vue
<template>
  <Card>
    <template #header>
      <div class="flex justify-between items-center">
        <h2>Directory Entries</h2>
        <Button size="sm" variant="primary">+ New Entry</Button>
      </div>
    </template>

    <Table :columns="columns">
      <tr v-for="entry in entries" :key="entry.dn" class="hover:bg-gray-50">
        <td class="px-4 py-3">{{ entry.name }}</td>
        <td class="px-4 py-3">
          <Badge :status="entry.status">{{ entry.status }}</Badge>
        </td>
        <td class="px-4 py-3 text-right">
          <DropdownMenu title="...">
            <li @click="edit(entry)" class="px-4 py-2 hover:bg-gray-100">Edit</li>
            <li @click="delete(entry)" class="px-4 py-2 hover:bg-gray-100 text-red-700">Delete</li>
          </DropdownMenu>
        </td>
      </tr>
    </Table>
  </Card>
</template>
```

## Accessibility

- All interactive elements are keyboard accessible
- Proper ARIA labels on buttons and form inputs
- High contrast ratios meet WCAG AA standards
- Focus states clearly visible
- Semantic HTML used throughout

## Tailwind CSS Configuration

Custom configuration in `tailwind.config.mjs`:
- Extended color palette with semantic naming
- Consistent spacing scale (4px base)
- Custom border radius values
- Optimized shadow definitions
- Font family customization

## Dark Mode

Currently not implemented, but design system is structured to support dark mode via Tailwind's `dark:` prefix in future releases.

## Browser Support

- Modern evergreen browsers (Chrome, Firefox, Safari, Edge)
- iOS Safari 14+
- No IE11 support
