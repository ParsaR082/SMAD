# 📊 Social Media Analytics Dashboard

A modern, full-stack web application for analyzing social media data with interactive visualizations, sentiment analysis, and user network graphs. Built with Next.js 14, featuring a sleek dark theme with neon highlights and smooth animations.

## ✨ Features

- **📈 Interactive Dashboards** - Real-time data visualization with customizable filters
- **📊 Multiple Chart Types** - Bar charts, line charts, pie charts, and force-directed graphs
- **🎨 Dark Theme UI** - Modern dark interface with neon cyan and magenta highlights
- **🔍 Advanced Filtering** - Filter by date range, hashtags, users, and sentiment
- **📱 Responsive Design** - Optimized for desktop, tablet, and mobile devices
- **📄 Export Capabilities** - Download charts as PNG and reports as PDF
- **🚀 Smooth Animations** - Powered by Framer Motion for enhanced UX

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling with custom dark theme
- **Framer Motion** - Smooth animations and transitions
- **Recharts** - Standard charts (bar, line, pie)
- **D3.js** - Advanced visualizations (force-directed graphs)

### Backend
- **Next.js API Routes** - RESTful API endpoints
- **MongoDB** - NoSQL database with Docker Compose
- **Prisma ORM** - Database abstraction layer with type-safe queries

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Git** - Version control

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git
- Docker and Docker Compose (for MongoDB)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smad-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**
   ```bash
   # Start MongoDB with Docker Compose
   docker compose -f docker-compose.dev.yml up -d mongo
   
   # Initialize Prisma and push schema to database
   npm run db:push
   
   # Generate Prisma client
   npm run db:generate
   ```

4. **Configure environment variables**
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Update DATABASE_URL in .env if needed
   # Default: mongodb://admin:password@localhost:27017/smad?authSource=admin
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push Prisma schema to database
- `npm run db:generate` - Generate Prisma client
- `npm run seed` - Seed database with mock data (requires replica set)

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── globals.css        # Global styles with dark theme
│   ├── layout.tsx         # Root layout component
│   └── page.tsx           # Home page
├── components/            # Reusable React components
│   ├── charts/           # Chart components (Recharts, D3)
│   ├── filters/          # Filter components
│   ├── layout/           # Layout components (sidebar, header)
│   └── ui/               # Basic UI components
├── hooks/                # Custom React hooks
├── lib/                  # Utility functions and configurations
│   ├── prisma.ts         # Prisma client singleton
│   └── utils.ts          # Common utilities
├── types/                # TypeScript type definitions
│   └── index.ts          # Main type definitions
└── utils/                # Additional utility functions
prisma/
└── schema.prisma         # Database schema definition
scripts/
├── seed.ts              # Database seeding script
└── test-db.ts           # Database connection test
```

## 🎨 Design System

### Color Palette
- **Background**: `#0a0a0a` (Deep black)
- **Foreground**: `#ededed` (Light gray)
- **Primary**: `#00ffff` (Neon cyan)
- **Accent**: `#ff00ff` (Neon magenta)
- **Secondary**: `#1a1a1a` (Dark gray)

### Typography
- **Font Family**: System UI, -apple-system, sans-serif
- **Monospace**: Courier New, monospace

### Animations
- Smooth transitions (0.2s ease-in-out)
- Framer Motion for complex animations
- Neon glow effects for interactive elements

## 🔧 Development Phases

### ✅ Phase 1: Project Initialization (Completed)
- [x] Next.js 14 project setup
- [x] Tailwind CSS configuration with dark theme
- [x] Library installation (Recharts, D3.js, Framer Motion)
- [x] Project folder structure
- [x] TypeScript configuration
- [x] README documentation

### ✅ Phase 2: Mock Data & MVP Visualizations (Completed)
- [x] Mock data structure and generation
- [x] Basic dashboard components
- [x] Chart implementations (bar, line, pie, network)
- [x] Interactive filtering system

### ✅ Phase 3: Database Integration (Completed)
- [x] MongoDB setup with Docker Compose
- [x] Prisma ORM configuration
- [x] Database schema definition
- [x] API routes with database integration
- [x] Graceful fallback to mock data

### 🚧 Upcoming Phases
- **Phase 4**: Data seeding and production setup
- **Phase 5**: Advanced dashboard interactivity
- **Phase 6**: Enhanced sentiment analysis
- **Phase 7**: Export & reporting features
- **Phase 8**: Performance optimization
- **Phase 9**: Deployment
- **Phase 10**: Final polish & QA

## 🗄️ Database Architecture

### Data Models

The application uses MongoDB with Prisma ORM and includes the following models:

- **User**: Social media user profiles with follower counts and metadata
- **Post**: Social media posts with content, sentiment, and engagement metrics
- **Edge**: User relationship connections (follows, mentions, etc.)
- **HashtagDaily**: Daily hashtag usage statistics and trends
- **SentimentDaily**: Daily sentiment analysis aggregations

### API Endpoints

All API routes support both database queries and mock data fallback:

- `GET /api/hashtags/top` - Top trending hashtags with usage counts
- `GET /api/hashtags/trend?hashtag=#AI` - Trend data for specific hashtag
- `GET /api/sentiment/summary` - Sentiment distribution and daily trends
- `GET /api/graph` - User network graph data (nodes and edges)

### Database Features

- **Graceful Fallback**: All routes automatically fall back to mock data if database is unavailable
- **Type Safety**: Full TypeScript support with Prisma-generated types
- **Performance**: Optimized queries with proper indexing and limits
- **Development Ready**: Docker Compose setup for local development

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [Recharts](https://recharts.org)
- [D3.js](https://d3js.org)

---

**Built with ❤️ for social media analytics**
