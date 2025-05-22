# Project Documentation

## Overview
This documentation covers the key aspects of the minimal-ui-next project, which is a Next.js 14 implementation of the minimal-ui application.

## Table of Contents

### Authentication
- [Supabase Auth Flow](./authentication/supabase-auth-flow.md)
  - Login/Signup process
  - Session management
  - Security considerations

### Onboarding
- [Onboarding Flow](./onboarding/onboarding-flow.md)
  - User journey
  - Data structures
  - State management

### Architecture
- [Server Components](./architecture/server-components.md)
  - Implementation details
  - Best practices
  - Performance optimization

### Dependencies
- [Core Dependencies](./dependencies/core-dependencies.md)
  - Framework and libraries
  - Development tools
  - Testing utilities
  - Version requirements

## Getting Started

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd packages/minimal-ui-next
   ```
3. Install dependencies:
   ```bash
   yarn install
   ```
4. Start the development server:
   ```bash
   yarn start:all
   ```
   or
   ```bash
   ./start-services.sh
   ```

## Development Guidelines

1. Use Server Components by default
2. Add 'use client' directive only when needed
3. Follow the established folder structure
4. Implement proper error handling
5. Write tests for new features

## Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## Support

For questions or issues:
1. Check existing documentation
2. Review issue tracker
3. Create a new issue if needed 