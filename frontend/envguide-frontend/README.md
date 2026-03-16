# EnviGuide Frontenda

This is a modern React-based frontend application for the EnviGuide Management Suite, built with Vite, TypeScript, and Tailwind CSS.

## Features

- **Modern React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for utility-first styling
- **React Router** for client-side routing
- **Lucide React** for beautiful icons
- **Responsive Design** for all devices
- **Dark Theme** support
- **Authentication** system
- **Protected Routes** with role-based access

## Tech Stack

- **Frontend Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Routing**: React Router DOM
- **Icons**: Lucide React
- **State Management**: React Context API
- **HTTP Client**: Fetch API

## Getting Started

### Prerequisites

- Node.js 20.19+ or 22.12+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone https://github.com/your-org/envguide-frontend.git
```

2. Navigate to the project directory:

```bash
cd envguide-frontend
```

3. Install dependencies:

```bash
npm install
```

4. Start the development server:

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── contexts/           # React contexts
├── lib/                # Utility functions
├── types/              # TypeScript type definitions
├── config/             # Configuration files
└── routes/             # Routing configuration
```

## Features Overview

### Authentication

- User login/logout
- Multi-factor authentication (MFA)
- Password reset functionality
- Protected routes

### Navigation

- Responsive sidebar navigation
- Collapsible menu structure
- Breadcrumb navigation
- Role-based menu access

### User Management

- User creation and editing
- Role and permission management
- Department management
- Employee ID management

### Settings

- System configuration
- Notification settings
- Hardware management
- Report generation

## Development

### Code Style

- Use TypeScript for type safety
- Follow ESLint rules
- Use Tailwind CSS for styling
- Component-based architecture

### Adding New Pages

1. Create a new component in `src/pages/`
2. Add the route in `src/routes/index.tsx`
3. Add menu item in `src/config/menu.ts`
4. Update types if needed

### Styling Guidelines

- Use Tailwind CSS utility classes
- Follow the established color scheme
- Ensure responsive design
- Maintain accessibility standards

## Building for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## Deployment

The application can be deployed to any static hosting service:

- **Vercel**: Connect your GitHub repository
- **Netlify**: Drag and drop the `dist/` folder
- **AWS S3**: Upload the `dist/` contents
- **GitHub Pages**: Use the `dist/` folder

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is proprietary software for EnviGuide.



