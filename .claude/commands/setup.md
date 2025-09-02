# Project Setup Instructions

You are helping build an internal tool for CroMetrics. This setup will automatically create a complete project with GitHub repository.

## Prerequisites Check

### Node.js and npm Installation

First, ensure Node.js v22 and npm are installed:

```bash
#!/bin/bash

# Function to check Node version
check_node_version() {
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -ge 22 ]; then
      echo "✓ Node.js v$(node -v) is installed"
      return 0
    else
      echo "⚠️ Node.js is installed but version is $(node -v). Need v22+"
      return 1
    fi
  else
    echo "⚠️ Node.js is not installed"
    return 1
  fi
}

# Function to install Node.js v22
install_node() {
  echo "📦 Installing Node.js v22..."
  
  # Detect OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
      echo "Installing Homebrew first..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      
      # Add Homebrew to PATH for Apple Silicon Macs
      if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
      fi
    fi
    
    # Install Node.js v22
    brew install node@22
    brew link --overwrite node@22
    
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    
    # Using NodeSource repository for Node.js v22
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "🪟 Detected Windows"
    
    # Check if winget is available
    if command -v winget &> /dev/null; then
      winget install OpenJS.NodeJS.LTS --version 22
    else
      echo "Please install Node.js v22 manually from: https://nodejs.org/"
      echo "Download the Windows Installer (.msi) for Node.js v22 LTS"
      exit 1
    fi
    
  else
    echo "⚠️ Unsupported OS: $OSTYPE"
    echo "Please install Node.js v22 manually from: https://nodejs.org/"
    exit 1
  fi
  
  # Verify installation
  if check_node_version; then
    echo "✅ Node.js v22 installed successfully"
  else
    echo "❌ Failed to install Node.js v22"
    echo "Please install manually from: https://nodejs.org/"
    exit 1
  fi
}

# Check and install Node.js if needed
if ! check_node_version; then
  read -p "Would you like to install Node.js v22 now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    install_node
  else
    echo "Please install Node.js v22 manually from: https://nodejs.org/"
    exit 1
  fi
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
  echo "✓ npm v$(npm -v) is installed"
else
  echo "⚠️ npm is not installed. This should have been installed with Node.js."
  echo "Please reinstall Node.js from: https://nodejs.org/"
  exit 1
fi
```

### GitHub CLI Installation

```bash
# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
  echo "✓ GitHub CLI is installed"
  # Check if authenticated
  if gh auth status &> /dev/null; then
    echo "✓ GitHub CLI is authenticated"
  else
    echo "⚠️ Setting up GitHub authentication..."
    gh auth login
  fi
else
  echo "⚠️ Installing GitHub CLI..."
  # Mac
  if [[ "$OSTYPE" == "darwin"* ]]; then
    brew install gh
  # Windows (if using WSL or Git Bash)
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
    winget install --id GitHub.cli
  # Linux
  else
    curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
    sudo apt update
    sudo apt install gh
  fi
  
  # Authenticate after installation
  gh auth login
fi
```

## Complete Automated Setup Script

This is the full setup script that includes all prerequisite checks:

```bash
#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 CroMetrics Project Setup Script${NC}"
echo "=================================="

# Function to check Node version
check_node_version() {
  if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
    if [ "$NODE_VERSION" -ge 22 ]; then
      echo -e "${GREEN}✓ Node.js v$(node -v) is installed${NC}"
      return 0
    else
      echo -e "${YELLOW}⚠️ Node.js is installed but version is $(node -v). Need v22+${NC}"
      return 1
    fi
  else
    echo -e "${YELLOW}⚠️ Node.js is not installed${NC}"
    return 1
  fi
}

# Function to install Node.js v22
install_node() {
  echo -e "${YELLOW}📦 Installing Node.js v22...${NC}"
  
  # Detect OS
  if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    echo "🍎 Detected macOS"
    
    # Check if Homebrew is installed
    if ! command -v brew &> /dev/null; then
      echo "Installing Homebrew first..."
      /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
      
      # Add Homebrew to PATH for Apple Silicon Macs
      if [[ -f "/opt/homebrew/bin/brew" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
      fi
    fi
    
    # Install Node.js v22
    brew install node@22
    brew link --overwrite node@22
    
  elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    echo "🐧 Detected Linux"
    
    # Check if running as root or with sudo
    if [ "$EUID" -ne 0 ]; then 
      # Using NodeSource repository for Node.js v22
      curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
      sudo apt-get install -y nodejs
    else
      curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
      apt-get install -y nodejs
    fi
    
  elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    echo "🪟 Detected Windows"
    
    # Try using winget
    if command -v winget &> /dev/null; then
      winget install OpenJS.NodeJS.LTS --version 22
    # Try using chocolatey
    elif command -v choco &> /dev/null; then
      choco install nodejs --version=22
    else
      echo -e "${RED}Please install Node.js v22 manually from: https://nodejs.org/${NC}"
      echo "Download the Windows Installer (.msi) for Node.js v22 LTS"
      exit 1
    fi
    
  else
    echo -e "${RED}⚠️ Unsupported OS: $OSTYPE${NC}"
    echo "Please install Node.js v22 manually from: https://nodejs.org/"
    exit 1
  fi
  
  # Reload PATH
  export PATH=$PATH:/usr/local/bin:/usr/bin
  
  # Verify installation
  if check_node_version; then
    echo -e "${GREEN}✅ Node.js v22 installed successfully${NC}"
  else
    echo -e "${RED}❌ Failed to install Node.js v22${NC}"
    echo "Please install manually from: https://nodejs.org/"
    exit 1
  fi
}

# Function to check and install GitHub CLI
check_and_install_gh() {
  if command -v gh &> /dev/null; then
    echo -e "${GREEN}✓ GitHub CLI is installed${NC}"
    # Check if authenticated
    if gh auth status &> /dev/null; then
      echo -e "${GREEN}✓ GitHub CLI is authenticated${NC}"
      return 0
    else
      echo -e "${YELLOW}⚠️ Setting up GitHub authentication...${NC}"
      gh auth login
      return $?
    fi
  else
    echo -e "${YELLOW}⚠️ GitHub CLI not found. Installing...${NC}"
    
    # Install based on OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
      if command -v brew &> /dev/null; then
        brew install gh
      else
        echo -e "${RED}Homebrew not found. Please install GitHub CLI manually.${NC}"
        return 1
      fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      if [ "$EUID" -ne 0 ]; then
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        sudo apt update
        sudo apt install gh -y
      else
        curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
        echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | tee /etc/apt/sources.list.d/github-cli.list > /dev/null
        apt update
        apt install gh -y
      fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
      if command -v winget &> /dev/null; then
        winget install --id GitHub.cli
      elif command -v choco &> /dev/null; then
        choco install gh
      else
        echo -e "${RED}Please install GitHub CLI manually from: https://cli.github.com/${NC}"
        return 1
      fi
    fi
    
    # Authenticate after installation
    if command -v gh &> /dev/null; then
      echo -e "${YELLOW}Setting up GitHub authentication...${NC}"
      gh auth login
      return $?
    else
      echo -e "${RED}Failed to install GitHub CLI${NC}"
      return 1
    fi
  fi
}

# Function to check Git
check_git() {
  if command -v git &> /dev/null; then
    echo -e "${GREEN}✓ Git v$(git --version | cut -d' ' -f3) is installed${NC}"
    return 0
  else
    echo -e "${YELLOW}⚠️ Git is not installed. Installing...${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
      brew install git
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      if [ "$EUID" -ne 0 ]; then
        sudo apt-get update && sudo apt-get install git -y
      else
        apt-get update && apt-get install git -y
      fi
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
      if command -v winget &> /dev/null; then
        winget install --id Git.Git
      else
        echo -e "${RED}Please install Git manually from: https://git-scm.com/${NC}"
        return 1
      fi
    fi
    
    if command -v git &> /dev/null; then
      echo -e "${GREEN}✅ Git installed successfully${NC}"
      return 0
    else
      echo -e "${RED}Failed to install Git${NC}"
      return 1
    fi
  fi
}

# =======================
# MAIN SETUP STARTS HERE
# =======================

echo ""
echo "Step 1: Checking prerequisites..."
echo "---------------------------------"

# Check Node.js
if ! check_node_version; then
  read -p "Would you like to install Node.js v22 now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    install_node
  else
    echo -e "${RED}Cannot proceed without Node.js v22. Exiting.${NC}"
    exit 1
  fi
fi

# Check npm
if command -v npm &> /dev/null; then
  echo -e "${GREEN}✓ npm v$(npm -v) is installed${NC}"
else
  echo -e "${RED}⚠️ npm is not installed. This should have been installed with Node.js.${NC}"
  echo "Please reinstall Node.js from: https://nodejs.org/"
  exit 1
fi

# Check Git
if ! check_git; then
  echo -e "${RED}Cannot proceed without Git. Exiting.${NC}"
  exit 1
fi

# Check GitHub CLI
if ! check_and_install_gh; then
  echo -e "${YELLOW}⚠️ GitHub CLI setup failed. You'll need to manually push to GitHub later.${NC}"
  GH_AVAILABLE=false
else
  GH_AVAILABLE=true
fi

# =======================
# PROJECT SETUP
# =======================

# Use current directory name as project name
PROJECT_NAME=$(basename "$PWD")
PROJECT_DESC="CroMetrics prototype: $PROJECT_NAME"
REPO_NAME="$PROJECT_NAME"

echo ""
echo -e "${GREEN}Step 2: Setting up project${NC}"
echo "Project name: $REPO_NAME"
echo "Location: $(pwd)"
echo "---------------------------------"

# Create all directories in current folder
echo "📁 Creating directory structure..."
mkdir -p backend/src/{routes,controllers,services,types}
mkdir -p frontend/src/{components,pages,services,types}
mkdir -p frontend/public
mkdir -p .husky

# [REST OF THE ORIGINAL SETUP SCRIPT CONTINUES HERE]
# Create all configuration files
echo "📝 Creating configuration files..."

# Backend package.json
cat > backend/package.json << 'EOF'
{
  "name": "backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "express": "latest",
    "cors": "latest",
    "dotenv": "latest",
    "zod": "latest"
  },
  "devDependencies": {
    "@types/express": "latest",
    "@types/cors": "latest",
    "@types/node": "latest",
    "typescript": "latest",
    "nodemon": "latest",
    "ts-node": "latest"
  }
}
EOF

# Frontend package.json
cat > frontend/package.json << 'EOF'
{
  "name": "frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "latest",
    "react-dom": "latest",
    "axios": "latest"
  },
  "devDependencies": {
    "@types/react": "latest",
    "@types/react-dom": "latest",
    "@vitejs/plugin-react": "latest",
    "autoprefixer": "latest",
    "postcss": "latest",
    "tailwindcss": "latest",
    "typescript": "latest",
    "vite": "latest"
  }
}
EOF

# Root package.json
cat > package.json << 'EOF'
{
  "name": "project-root",
  "scripts": {
    "install:all": "npm install && cd backend && npm install && cd ../frontend && npm install",
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "lint": "eslint . --ext .ts,.tsx,.js,.jsx",
    "lint:fix": "eslint . --ext .ts,.tsx,.js,.jsx --fix",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md}\"",
    "type-check": "tsc --noEmit && cd backend && tsc --noEmit && cd ../frontend && tsc --noEmit",
    "prepare": "husky install"
  },
  "devDependencies": {
    "concurrently": "latest",
    "husky": "latest",
    "lint-staged": "latest",
    "@commitlint/cli": "latest",
    "@commitlint/config-conventional": "latest",
    "eslint": "latest",
    "eslint-config-prettier": "latest",
    "eslint-plugin-react": "latest",
    "eslint-plugin-react-hooks": "latest",
    "@typescript-eslint/eslint-plugin": "latest",
    "@typescript-eslint/parser": "latest",
    "prettier": "latest"
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ],
    "*.{json,md}": [
      "prettier --write"
    ]
  }
}
EOF

# Backend tsconfig.json
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Frontend tsconfig.json
cat > frontend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

# Frontend tsconfig.node.json
cat > frontend/tsconfig.node.json << 'EOF'
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}
EOF

# ESLint config
cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint", "react", "react-hooks"],
  "rules": {
    "react/react-in-jsx-scope": "off",
    "react/prop-types": "off",
    "@typescript-eslint/explicit-module-boundary-types": "off",
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
  },
  "settings": {
    "react": {
      "version": "detect"
    }
  }
}
EOF

# Prettier config
cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
EOF

# Commitlint config
cat > commitlint.config.js << 'EOF'
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'perf']
    ]
  }
};
EOF

# Tailwind config
cat > frontend/tailwind.config.js << 'EOF'
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
EOF

# Tailwind CSS
cat > frontend/src/index.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# PostCSS config
cat > frontend/postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF

# Vite config
cat > frontend/vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      }
    }
  }
})
EOF

# Frontend index.html
cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>CroMetrics Prototype</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
EOF

# Frontend main.tsx
cat > frontend/src/main.tsx << 'EOF'
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
EOF

# Backend index.ts
cat > backend/src/index.ts << 'EOF'
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Add routes here

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
EOF

# Frontend App.tsx
cat > frontend/src/App.tsx << 'EOF'
import React, { useEffect, useState } from 'react';
import axios from 'axios';

function App() {
  const [health, setHealth] = useState<string>('');

  useEffect(() => {
    axios.get('/api/health')
      .then(response => setHealth(response.data.status))
      .catch(error => console.error('Error:', error));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900">
          CroMetrics Internal Tool
        </h1>
        <p className="mt-4 text-gray-600">
          API Status: {health || 'Checking...'}
        </p>
      </div>
    </div>
  );
}

export default App;
EOF

# .gitignore
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Production
dist/
build/

# Environment
.env
.env.local
.env.production.local
.env.development.local
.env.test.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*
*.log

# OS Files
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*.swn
*.bak

# Testing
coverage/
.nyc_output/

# TypeScript
*.tsbuildinfo

# Optional npm cache
.npm

# Optional eslint cache
.eslintcache

# Misc
*.pid
*.seed
*.pid.lock
EOF

# Backend .env
cat > backend/.env << 'EOF'
PORT=3001
NODE_ENV=development
DATABASE_URL=your_database_url_here
EOF

# Frontend .env
cat > frontend/.env << 'EOF'
VITE_API_URL=http://localhost:3001
EOF

# Husky pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

# Husky pre-push hook
cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npm run type-check
EOF

# Make hooks executable
chmod +x .husky/pre-commit 2>/dev/null
chmod +x .husky/pre-push 2>/dev/null

# Initialize git
echo ""
echo -e "${GREEN}Step 3: Initializing Git repository${NC}"
echo "---------------------------------"
git init
git branch -M main

# Initial commit
git add .
git commit -m "feat: initial project setup with Node/React/TypeScript"

# Create GitHub repository if gh is available
if [ "$GH_AVAILABLE" = true ]; then
  echo ""
  echo -e "${GREEN}Step 4: Creating GitHub repository${NC}"
  echo "---------------------------------"
  
  gh repo create "CROmetrics/$REPO_NAME" \
    --public \
    --description "$PROJECT_DESC" \
    --source=. \
    --remote=origin \
    --push
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Repository created: https://github.com/CROmetrics/$REPO_NAME${NC}"
    
    # Switch to develop branch
    git checkout -b develop
    git push -u origin develop
    
    echo -e "${GREEN}✅ Switched to develop branch${NC}"
    GITHUB_CREATED=true
  else
    echo -e "${YELLOW}⚠️ Failed to create GitHub repository automatically${NC}"
    GITHUB_CREATED=false
  fi
else
  echo ""
  echo -e "${YELLOW}Step 4: Skipping GitHub repository creation (CLI not available)${NC}"
  GITHUB_CREATED=false
fi

# Install dependencies
echo ""
echo -e "${GREEN}Step 5: Installing dependencies${NC}"
echo "---------------------------------"
echo "This may take a few minutes..."

# Install root dependencies
npm install

# Install backend dependencies
cd backend && npm install
cd ..

# Install frontend dependencies
cd frontend && npm install
cd ..

# Setup git hooks
echo ""
echo -e "${GREEN}Step 6: Setting up git hooks${NC}"
echo "---------------------------------"
npm run prepare

# Final status
echo ""
echo "======================================"
echo -e "${GREEN}✅ Project setup complete!${NC}"
echo "======================================"
echo ""
echo "📁 Project location: $(pwd)"

if [ "$GITHUB_CREATED" = true ]; then
  echo "🌐 GitHub repository: https://github.com/CROmetrics/$REPO_NAME"
  echo "🔧 Current branch: develop"
else
  echo -e "${YELLOW}⚠️ GitHub repository not created. To create manually:${NC}"
  echo "   1. Create repository at: https://github.com/CROmetrics/new"
  echo "   2. Repository name: $REPO_NAME"
  echo "   3. Then run:"
  echo "      git remote add origin https://github.com/CROmetrics/$REPO_NAME.git"
  echo "      git push -u origin main"
  echo "      git checkout -b develop"
  echo "      git push -u origin develop"
fi

echo ""
echo "To start development:"
echo -e "${GREEN}  npm run dev${NC}"
echo ""
echo "📱 Frontend: http://localhost:3000"
echo "🖥️  Backend:  http://localhost:3001"
echo ""
echo "Happy coding! 🚀"
```

## Quick Install Command

For a one-liner installation, save the script as `setup.sh` and run:

```bash
curl -o setup.sh https://raw.githubusercontent.com/CROmetrics/setup-scripts/main/setup.sh && chmod +x setup.sh && ./setup.sh
```

Or if you prefer to copy and paste directly:

```bash
bash <(curl -s https://raw.githubusercontent.com/CROmetrics/setup-scripts/main/setup.sh)
```

## Manual Installation References

If automatic installation fails, here are the manual installation links:

### Node.js v22
- **All platforms**: https://nodejs.org/en/download/
- **macOS**: `brew install node@22`
- **Windows**: Download installer from nodejs.org
- **Linux (Ubuntu/Debian)**: 
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```

### GitHub CLI
- **All platforms**: https://cli.github.com/
- **macOS**: `brew install gh`
- **Windows**: `winget install --id GitHub.cli`
- **Linux**: Follow instructions at https://github.com/cli/cli/blob/trunk/docs/install_linux.md

### Git
- **All platforms**: https://git-scm.com/downloads
- **macOS**: `brew install git`
- **Windows**: Download from git-scm.com
- **Linux**: `sudo apt-get install git`

## Troubleshooting

### Node.js Installation Issues

If Node.js v22 installation fails:

1. **Check existing Node installation**:
   ```bash
   node -v
   npm -v
   ```

2. **Use Node Version Manager (nvm)**:
   ```bash
   # Install nvm
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   
   # Install Node v22
   nvm install 22
   nvm use 22
   nvm alias default 22
   ```

3. **Windows Users**: Consider using WSL2 (Windows Subsystem for Linux) for better compatibility

### Permission Issues

If you encounter permission errors:

```bash
# macOS/Linux
sudo npm install -g npm@latest

# Windows (run as Administrator)
npm install -g npm@latest
```

### GitHub CLI Authentication

If GitHub CLI authentication fails:

```bash
# Try with specific protocol
gh auth login --protocol https

# Or use personal access token
gh auth login --with-token < token.txt
```