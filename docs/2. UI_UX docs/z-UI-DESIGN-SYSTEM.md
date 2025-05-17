# Productivity App UI Design System

## Overview
This design system serves as the foundation for our productivity app portfolio, ensuring consistency across all applications while maintaining a clean, minimal, and efficient user interface.

## Tech Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Runtime**: Node.js 18+
- **Package Manager**: pnpm

### UI Framework & Styling
- **CSS Framework**: Tailwind CSS
- **Component Library**: shadcn/ui
- **CSS-in-JS**: Tailwind CSS with CSS Modules
- **Icons**: Lucide React + Radix UI Icons
- **Animations**: Framer Motion

### State Management
- **Global State**: Zustand
- **Server State**: TanStack Query (React Query)
- **Form State**: React Hook Form
- **Form Validation**: Zod

### Development Tools
- **Build Tool**: Vite
- **Linting**: ESLint + Prettier
- **Type Checking**: TypeScript
- **Testing**: 
  - Jest
  - React Testing Library
  - Cypress (E2E)
- **Code Quality**: 
  - Husky (Git Hooks)
  - lint-staged
  - SonarQube

### Development Dependencies
```json
{
  "dependencies": {
    "@hookform/resolvers": "^3.3.4",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-slot": "^1.0.2",
    "@tanstack/react-query": "^5.24.1",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "framer-motion": "^11.0.5",
    "lucide-react": "^0.330.0",
    "next": "^14.1.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hook-form": "^7.50.1",
    "tailwind-merge": "^2.2.1",
    "zod": "^3.22.4",
    "zustand": "^4.5.1"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^6.4.2",
    "@testing-library/react": "^14.2.1",
    "@types/node": "^20.11.19",
    "@types/react": "^18.2.57",
    "@types/react-dom": "^18.2.19",
    "@typescript-eslint/eslint-plugin": "^7.0.1",
    "@typescript-eslint/parser": "^7.0.1",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.17",
    "cypress": "^13.6.4",
    "eslint": "^8.56.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-react": "^7.33.2",
    "eslint-plugin-react-hooks": "^4.6.0",
    "husky": "^9.0.11",
    "jest": "^29.7.0",
    "lint-staged": "^15.2.2",
    "postcss": "^8.4.35",
    "prettier": "^3.2.5",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.3.3",
    "vite": "^5.1.3"
  }
}
```

### Project Structure
```
├── app/                    # Next.js app directory
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Dashboard routes
│   ├── api/               # API routes
│   └── layout.tsx         # Root layout
├── components/            # React components
│   ├── ui/               # Base UI components
│   ├── forms/            # Form components
│   ├── layout/           # Layout components
│   └── shared/           # Shared components
├── lib/                   # Utility functions
│   ├── hooks/            # Custom hooks
│   ├── utils/            # Helper functions
│   └── constants/        # Constants
├── styles/               # Global styles
├── types/                # TypeScript types
├── public/               # Static assets
└── tests/                # Test files
```

### Development Workflow
1. **Setup**
   ```bash
   pnpm install
   pnpm dev
   ```

2. **Building**
   ```bash
   pnpm build
   ```

3. **Testing**
   ```bash
   pnpm test        # Unit tests
   pnpm test:e2e    # E2E tests
   ```

4. **Linting & Formatting**
   ```bash
   pnpm lint
   pnpm format
   ```

### Performance Considerations
- **Bundle Size**: Keep bundle size under 200KB (gzipped)
- **Code Splitting**: Use dynamic imports for large components
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement proper caching strategies
- **Lazy Loading**: Use React.lazy for route-based code splitting

### Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)

## Design Philosophy
- **Minimalism First**: Strip interfaces to their essential elements
- **Consistency**: Maintain visual and interaction patterns across apps
- **Efficiency**: Optimize for quick actions and information retrieval
- **Accessibility**: Ensure all users can effectively use the applications

## Color Palette

### Primary Colors
```css
--primary: #0F172A;    /* Deep blue-gray */
--primary-foreground: #FFFFFF;
--primary-muted: #1E293B;
```

### Secondary Colors
```css
--secondary: #F1F5F9;  /* Light gray */
--secondary-foreground: #0F172A;
--secondary-muted: #E2E8F0;
```

### Accent Colors
```css
--accent: #3B82F6;     /* Blue */
--accent-foreground: #FFFFFF;
--accent-muted: #60A5FA;
```

### Semantic Colors
```css
--success: #22C55E;    /* Green */
--warning: #F59E0B;    /* Amber */
--error: #EF4444;      /* Red */
--info: #3B82F6;       /* Blue */
```

## Typography

### Font Family
```css
--font-sans: 'Inter', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
```

### Font Sizes
```css
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
```

### Font Weights
```css
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

## Spacing System
```css
--space-1: 0.25rem;    /* 4px */
--space-2: 0.5rem;     /* 8px */
--space-3: 0.75rem;    /* 12px */
--space-4: 1rem;       /* 16px */
--space-6: 1.5rem;     /* 24px */
--space-8: 2rem;       /* 32px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
```

## Component Library

### Buttons
```tsx
// Primary Button
<Button variant="primary">
  Primary Action
</Button>

// Secondary Button
<Button variant="secondary">
  Secondary Action
</Button>

// Ghost Button
<Button variant="ghost">
  Ghost Action
</Button>
```

### Cards
```tsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content goes here
  </CardContent>
</Card>
```

### Input Fields
```tsx
<Input
  type="text"
  placeholder="Enter text..."
  className="w-full"
/>
```

### Dropdowns
```tsx
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

### Common Productivity Components

#### Task List
```tsx
<TaskList>
  <TaskItem
    title="Task Title"
    description="Task Description"
    status="in-progress"
    priority="high"
  />
</TaskList>
```

#### Calendar View
```tsx
<Calendar
  events={events}
  onEventClick={handleEventClick}
  view="week"
/>
```

#### Search Bar
```tsx
<SearchBar
  placeholder="Search..."
  onSearch={handleSearch}
  filters={availableFilters}
/>
```

#### Tags Input
```tsx
<TagsInput
  value={tags}
  onChange={setTags}
  placeholder="Add tags..."
/>
```

## Layout Patterns

### Container
```tsx
<div className="container mx-auto px-4 max-w-7xl">
  {/* Content */}
</div>
```

### Grid System
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Grid Items */}
</div>
```

### Flex Layouts
```tsx
<div className="flex flex-col md:flex-row gap-4">
  {/* Flex Items */}
</div>
```

## Technical Implementation

### Setup Instructions

1. Install Dependencies:
```bash
npm install @radix-ui/react-icons @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react @hookform/resolvers zod react-hook-form
```

2. Configure Tailwind CSS:
```javascript
// tailwind.config.js
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Add custom colors here
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
```

3. Global Styles:
```css
/* globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* Add CSS variables here */
  }
}
```

### Component Implementation

1. Create a components directory structure:
```
components/
  ├── ui/           # Base UI components
  ├── forms/        # Form-related components
  ├── layout/       # Layout components
  └── shared/       # Shared components
```

2. Example Component Implementation:
```tsx
// components/ui/button.tsx
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
  {
    variants: {
      variant: {
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
```

## Best Practices

### Component Design
1. Keep components small and focused
2. Use composition over inheritance
3. Implement proper TypeScript types
4. Follow atomic design principles

### State Management
1. Use Zustand for global state
2. Implement React Query for server state
3. Keep component state minimal
4. Use React Context sparingly

### Performance Optimization
1. Implement proper code splitting
2. Use React.memo for expensive components
3. Optimize images and assets
4. Implement proper loading states

### Accessibility
1. Use semantic HTML elements
2. Implement proper ARIA attributes
3. Ensure keyboard navigation
4. Maintain sufficient color contrast

## Responsive Design

### Breakpoints
```css
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
```

### Mobile-First Approach
1. Design for mobile first
2. Use responsive utilities
3. Implement touch-friendly interactions
4. Consider mobile performance

## Animation Guidelines

### Transitions
```css
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;
```

### Animation Types
1. Fade transitions
2. Slide animations
3. Scale transforms
4. Loading states

## Error Handling

### Error States
1. Form validation errors
2. Network errors
3. Loading states
4. Empty states

### Error Components
```tsx
<ErrorBoundary fallback={<ErrorFallback />}>
  {/* Component content */}
</ErrorBoundary>
```

## Testing Guidelines

### Component Testing
1. Unit tests for components
2. Integration tests for features
3. E2E tests for critical paths
4. Accessibility testing

## Documentation

### Component Documentation
1. Props documentation
2. Usage examples
3. Accessibility considerations
4. Performance notes

## Version Control

### Branch Strategy
1. Feature branches
2. Component branches
3. Documentation updates
4. Version tagging

## Deployment

### Build Process
1. Development build
2. Staging build
3. Production build
4. Asset optimization

## Maintenance

### Regular Updates
1. Dependency updates
2. Security patches
3. Performance monitoring
4. Accessibility audits 