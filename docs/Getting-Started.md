# Getting Started with Odzai

This guide will help you set up and run the Odzai project after cloning it from the repository, with special attention to the Express API server requirements.

## Prerequisites

- Node.js (v18.12.0 or higher)
- Yarn (v3 or higher)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd odzai
   ```

2. Install dependencies:
   ```bash
   yarn install
   ```

## Build Process

Before running the project, you need to build the API package. This is a **crucial step** as the Express API server requires the generated bundle files.

```bash
# Build the API package
yarn workspace @actual-app/api build
```

This command generates the necessary files including `bundle.api.js` which is required by the Express API server.

## Running the Project

Once you've completed the build process, you can run the project using either of these commands:

```bash
# Option 1: Using the start script
cd packages/minimal-ui-next && ./start-services.sh
```

OR

```bash
# Option 2: Using yarn
cd packages/minimal-ui-next && yarn start:all
```

This will start both:
- The Express API server on port 3001
- The Next.js frontend on port 3000

## Data Directory

The application stores its data (including SQLite databases) in the `data` directory at the project root. The first time you run the application, it will:

1. Create this directory if it doesn't exist
2. Set up the necessary folder structure inside it
3. Create empty workspaces as needed

## Creating Your First Workspace

1. Visit http://localhost:3000 in your browser
2. Use the UI to create a new workspace
3. The workspace information will be stored in the data directory

## Troubleshooting

### Missing bundle.api.js
If you see an error like `Cannot find module './app/bundle.api.js'`, it means the API package hasn't been built. Run:

```bash
yarn workspace @actual-app/api build
```

### Port Already in Use
If you see an error about port 3000 or 3001 being already in use, you can find and stop the process using these commands:

```bash
# Find the process using port 3000
lsof -i:3000

# Find the process using port 3001
lsof -i:3001

# Kill the process (replace PID with the actual process ID)
kill -9 PID
```

### No Workspaces Available
If you can't create or load workspaces, check that:
1. The API server is running on port 3001
2. The data directory exists and has proper permissions
3. There is a `user-preferences` folder in the data directory

## Development Tips

When developing, you might want to run these services in separate terminals for better visibility of logs:

```bash
# Terminal 1: Run the API server
cd packages/minimal-ui-next
ACTUAL_DATA_DIR=../../data yarn start:api

# Terminal 2: Run the Next.js frontend
cd packages/minimal-ui-next
yarn dev
``` 