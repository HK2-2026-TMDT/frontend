# SanMayMac - Sewing Machine Customization Platform

A modern e-commerce platform for sewing machine customization with AI-powered design studio, workshop management, and multi-role support.

## 🏗️ Project Structure

The project follows a feature-based architecture with clear separation of concerns:

- **`/public`** - Static assets (logos, favicons)
- **`/src`** - Application source code
  - **`/assets`** - Images, fonts, icons
  - **`/components`** - Reusable UI components (common, form, layout)
  - **`/features`** - Feature-specific logic (auth, bidding, design-studio, finance, products, users)
  - **`/layouts`** - Role-based layouts (Customer, Workshop, Admin, Auth)
  - **`/pages`** - Page components organized by role
  - **`/routes`** - Routing configuration and protected routes
  - **`/services`** - API calls and backend integration
  - **`/store`** - Global state management (Zustand)
  - **`/hooks`** - Custom React hooks
  - **`/utils`** - Helper functions
  - **`/types`** - TypeScript type definitions

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## 📦 Available Scripts

- **`npm run dev`** - Start development server
- **`npm run build`** - Build for production
- **`npm run preview`** - Preview production build locally
- **`npm run lint`** - Run ESLint
- **`npm run type-check`** - Check TypeScript types

## 🎯 Key Features

- ✨ **AI Design Studio** - Create custom designs with AI assistance
- 🏪 **Multi-role Support** - Customer, Workshop, and Admin interfaces
- 💰 **Finance Management** - Wallet, payments, and transaction history
- 🔨 **Workshop Dashboard** - Order management and marketplace
- 🎨 **Bidding System** - Create and submit bids for projects
- 👥 **User Profiles** - Customer and workshop profiles with reviews

## 🛠️ Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Axios** - HTTP client
- **Zustand** - State management

## 📝 Environment Variables

```env
VITE_API_URL=http://localhost:8080/api
VITE_ENABLE_DESIGN_STUDIO=true
VITE_ENABLE_BIDDING=true
```

## 🔐 Protected Routes

Routes are protected based on user role:
- Customer routes - require `customer` role
- Workshop routes - require `workshop` role
- Admin routes - require `admin` role

See `/src/routes/index.tsx` for route configuration.

## 📚 Development Guidelines

### Component Structure
- Place UI components in `/components/common`
- Feature-specific components in feature folders
- Use TypeScript for type safety

### State Management
- Use Zustand hooks for global state
- Local state for component-specific data
- Persist user/cart data to localStorage

### API Integration
- Use Axios instance from `/services/api.ts`
- Create service methods in `/services/endpoints`
- Handle errors with interceptors

## 🐛 Debugging

1. Check console for errors
2. Use React Developer Tools browser extension
3. Verify environment variables in `.env`
4. Check network requests in browser DevTools

## 📄 License

Proprietary - All rights reserved

## 👥 Contributing

Please follow the existing code structure and naming conventions when adding new features.

---

**Made with ❤️ for SanMayMac**
