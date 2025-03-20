# Thelios Gestione

A comprehensive management system built with Next.js 15 and React 19, designed for tracking packages and managing delivery workflows.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/)
- **UI Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Development Tools**:
  - [ESLint](https://eslint.org/) for code linting
  - [Prettier](https://prettier.io/) for code formatting
  - [TypeScript](https://www.typescriptlang.org/) for type safety
  - [DevContainer](https://code.visualstudio.com/docs/remote/containers) for containerized development

## Getting Started

### Prerequisites

- Node.js 19+
- npm

### Installation

1. Clone the repository
   ```bash
   git clone https://your-repository-url.git
   cd thelios-gestione
   ```

2. Install dependencies
   ```bash
   npm install --force
   ```
   Note: The `--force` flag is needed due to React 19 compatibility.

3. Start the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## Project Structure

```
thelios-gestione/
├── .devcontainer/         # DevContainer configuration
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable components
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions and shared logic
│   ├── app/               # Application routes and pages
│   └── app/globals.css    # Global styles
├── .eslintrc.json         # ESLint configuration
├── .prettierrc.js         # Prettier configuration
├── .prettierignore        # Files to be ignored by Prettier
├── components.json        # shadcn/ui configuration
├── next.config.ts         # Next.js configuration
├── package.json           # Project dependencies and scripts
├── postcss.config.mjs     # PostCSS configuration for Tailwind
├── tailwind.config.ts     # Tailwind CSS configuration
└── tsconfig.json          # TypeScript configuration
```

## Development Workflow

### Code Formatting

The project uses Prettier for code formatting. Format your code with:

```bash
npx prettier . --write
```

### Linting

Run ESLint to check for code quality issues:

```bash
next lint --fix
```

### Building for Production

```bash
npm run build
```

This command runs Prettier, ESLint, and then builds the application for production.

### Running in Production Mode

```bash
npm run start
```

## DevContainer Support

This project includes DevContainer configuration for a consistent development environment across team members. To use it:

1. Install [Docker](https://www.docker.com/products/docker-desktop)
2. Install the [Remote - Containers](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.remote-containers) extension for VS Code
3. Open the project in VS Code and select \"Reopen in Container\" when prompted

