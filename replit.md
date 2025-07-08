# Promptever - Prompt Management Platform

## Overview

Promptever is a modern full-stack web application for managing prompt templates with variables. It allows users to create, edit, and deploy prompt templates through a secure API. The application features a clean, minimalist design inspired by Vercel's aesthetic and provides a comprehensive solution for prompt management across different applications and workflows.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Framework**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom design tokens
- **State Management**: TanStack Query for server state management
- **Routing**: React Router for client-side navigation
- **Authentication**: Supabase Auth integration

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless database
- **ORM**: Drizzle ORM for type-safe database operations
- **API**: RESTful API with Express routes
- **Development**: Hot reload with Vite middleware integration

### Database Design
- **Primary Database**: PostgreSQL hosted on Neon
- **Schema Management**: Drizzle Kit for migrations
- **Connection**: Serverless connection pooling via @neondatabase/serverless
- **Schema Location**: Shared schema definitions in `/shared/schema.ts`

## Key Components

### Authentication System
- **Provider**: Supabase Auth with email/password authentication
- **Context**: React Context API for auth state management
- **Protected Routes**: Route-level authentication guards
- **Session Management**: Persistent sessions with localStorage

### Database Layer
- **ORM**: Drizzle ORM with type-safe queries
- **Schema**: Shared TypeScript schema definitions
- **Migrations**: Automated database migrations via Drizzle Kit
- **Connection**: Serverless PostgreSQL connection with WebSocket support

### UI Components
- **Design System**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS variables for theming
- **Accessibility**: ARIA-compliant components with keyboard navigation
- **Responsive**: Mobile-first responsive design

### API Integration
- **Client**: TanStack Query for data fetching and caching
- **Error Handling**: Centralized error boundary components
- **Loading States**: Skeleton loaders and loading indicators
- **Toast Notifications**: Sonner for user feedback

## Data Flow

1. **User Authentication**: Users sign up/login through Supabase Auth
2. **Project Management**: Authenticated users can create and manage projects
3. **Prompt Templates**: Users create prompt templates with variable placeholders
4. **API Key Generation**: Projects can generate API keys for external access
5. **Template Rendering**: External applications use API keys to render templates with variables
6. **Version Control**: Template changes are tracked with version history

## External Dependencies

### Core Dependencies
- **@supabase/supabase-js**: Authentication and database client
- **@neondatabase/serverless**: PostgreSQL serverless driver
- **drizzle-orm**: Type-safe ORM for database operations
- **@tanstack/react-query**: Server state management
- **react-router-dom**: Client-side routing

### UI Dependencies
- **@radix-ui/***: Primitive UI components
- **tailwindcss**: Utility-first CSS framework
- **lucide-react**: Icon library
- **sonner**: Toast notifications
- **cmdk**: Command palette component

### Development Dependencies
- **vite**: Build tool and development server
- **typescript**: Type checking and compilation
- **@replit/vite-plugin-***: Replit-specific development tools

## Deployment Strategy

### Build Process
1. **Frontend Build**: Vite builds React app to `dist/public`
2. **Backend Build**: esbuild compiles TypeScript server to `dist/index.js`
3. **Database Setup**: Drizzle Kit handles schema migrations
4. **Environment Configuration**: Environment variables for database and auth

### Production Setup
- **Server**: Node.js Express server serving both API and static files
- **Database**: Neon PostgreSQL with connection pooling
- **Authentication**: Supabase Auth with custom domain support
- **Static Assets**: Served directly from Express for SPA routing

### Development Workflow
- **Hot Reload**: Vite middleware integrated with Express
- **Database Migrations**: `npm run db:push` for schema updates
- **Type Safety**: Shared TypeScript definitions between client and server
- **Error Handling**: Runtime error overlay in development

## Changelog

```
Changelog:
- July 08, 2025. Initial setup
- July 08, 2025. Successfully migrated from Lovable to Replit
  - Preserved Supabase integration as requested
  - Moved Edge Functions to server routes for compatibility
  - Fixed API key display with copy functionality
  - Updated API documentation with correct endpoints
  - Set up secure environment variables
- July 08, 2025. Added premium dark mode with metallic animated borders
  - Implemented Vercel-style black background theme
  - Added animated metallic border effects on hover
  - Premium styling applied to all cards and components
  - Theme toggle added to all main pages
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```