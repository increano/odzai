# Minimal UI Next: UI Structure Overview

The UI of the minimal-ui-next project is structured with modern frontend technologies. Here's where you can find the styling and components:

## Main UI Framework

The minimal-ui-next uses Next.js with Tailwind CSS for styling:

1. **Tailwind Configuration**:
   - `packages/minimal-ui-next/tailwind.config.js` - Contains theme configuration
   - `packages/minimal-ui-next/src/app/globals.css` - Base styles and Tailwind imports

2. **Component Libraries**:
   - **Shadcn UI**: The project uses shadcn/ui component system (based on Radix UI)
   - **Radix UI**: Low-level primitives for accessible components (see dependencies in package.json)

## UI Component Structure

The UI components are organized in these main directories:

1. **Base UI Components**: `packages/minimal-ui-next/src/components/ui/`
   - Contains reusable UI primitives: button.tsx, card.tsx, dialog.tsx, etc.
   - These are shadcn-style components built with Tailwind and Radix UI

2. **Feature/Domain Components**: `packages/minimal-ui-next/src/components/`
   - Specific components organized by feature:
     - `transactions/` - Transaction-related components
     - `accounts/` - Account management components
   - Also includes `dashboard-layout.tsx` and `sidebar.tsx` for layout structure

3. **Page Components**: `packages/minimal-ui-next/src/app/`
   - Page components organized following Next.js App Router structure
   - Each directory represents a route with its own page.tsx

## Additional Styling Resources

1. **Component Library**: `packages/component-library/`
   - Common component definitions that might be shared across UIs
   - Contains base styles in `styles.ts` and `theme.ts`

2. **Styling Dependencies**:
   - `class-variance-authority` - For component variants
   - `tailwind-merge` - For merging Tailwind classes
   - `tailwindcss-animate` - For animations

## Styling Approach

The UI styling follows modern practices with:
- CSS-in-JS via Tailwind utility classes
- Component composition through shadcn/ui patterns
- CSS variables for theming (dark/light mode support)
- Responsive design built into the Tailwind configuration

For development, you'll primarily work with the components in `src/components/ui/` for base elements and create feature-specific components in the appropriate directories.
