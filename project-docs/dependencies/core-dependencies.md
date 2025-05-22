# Core Dependencies

## Framework
- **Next.js 14**
  - App Router
  - React Server Components
  - Server Actions
  - Edge Runtime support

## Backend & Database
- **Supabase**
  - Version: Latest stable
  - Authentication
  - PostgreSQL Database
  - Real-time subscriptions
  ```json
  "@supabase/auth-helpers-nextjs": "^0.8.7",
  "@supabase/supabase-js": "^2.39.3"
  ```

## UI Components
- **Shadcn/ui**
  - Component library
  - Tailwind CSS based
  - Fully customizable
  ```json
  "@radix-ui/react-dialog": "^1.0.5",
  "@radix-ui/react-slot": "^1.0.2",
  "class-variance-authority": "^0.7.0",
  "clsx": "^2.1.0",
  "tailwind-merge": "^2.2.0"
  ```

## Styling
- **Tailwind CSS**
  - Version: 3.x
  - PostCSS
  - Autoprefixer
  ```json
  "tailwindcss": "^3.4.1",
  "postcss": "^8.4.33",
  "autoprefixer": "^10.4.17"
  ```

## State Management
- **Zustand**
  - Lightweight state management
  - React hooks based
  ```json
  "zustand": "^4.5.0"
  ```

## Form Handling
- **React Hook Form**
  - Form validation
  - Form state management
  ```json
  "react-hook-form": "^7.49.3",
  "@hookform/resolvers": "^3.3.4"
  ```

## Data Fetching
- **SWR**
  - React Hooks for data fetching
  - Caching and revalidation
  ```json
  "swr": "^2.2.4"
  ```

## Validation
- **Zod**
  - TypeScript-first schema validation
  ```json
  "zod": "^3.22.4"
  ```

## Development Tools
- **TypeScript**
  - Static type checking
  - Latest ECMAScript features
  ```json
  "typescript": "^5.3.3",
  "@types/node": "^20.11.5",
  "@types/react": "^18.2.48",
  "@types/react-dom": "^18.2.18"
  ```

- **ESLint**
  - Code linting
  - Next.js configuration
  ```json
  "eslint": "^8.56.0",
  "eslint-config-next": "14.1.0"
  ```

## Testing
- **Jest**
  - Unit testing
  - Integration testing
  ```json
  "@testing-library/react": "^14.1.2",
  "@testing-library/jest-dom": "^6.2.0",
  "jest": "^29.7.0"
  ```

## Package Management
- **Yarn**
  - Version: Latest stable
  - Workspace support
  - Fast installation

## Environment Variables
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SITE_URL=your_site_url
```

## Version Requirements
- Node.js >= 18.17.0
- npm >= 9.x.x
- yarn >= 1.22.x

## Installation

```bash
# Install dependencies
yarn install

# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Dependency Management

### Adding Dependencies
```bash
# Add a production dependency
yarn add package-name

# Add a development dependency
yarn add -D package-name
```

### Updating Dependencies
```bash
# Update all dependencies
yarn upgrade

# Update specific package
yarn upgrade package-name
```

## Best Practices

1. Keep dependencies up to date
2. Use exact versions in package.json
3. Regularly audit dependencies
4. Document breaking changes
5. Test after major updates 