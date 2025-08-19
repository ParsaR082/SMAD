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
- **MongoDB** - NoSQL database (planned)
- **Prisma ORM** - Database abstraction layer (planned)

### Development Tools
- **ESLint** - Code linting
- **TypeScript** - Static type checking
- **Git** - Version control

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

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

3. **Run the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

### Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

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
│   └── utils.ts          # Common utilities
├── types/                # TypeScript type definitions
│   └── index.ts          # Main type definitions
└── utils/                # Additional utility functions
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

### 🚧 Upcoming Phases
- **Phase 2**: Mock data & MVP visualizations
- **Phase 3**: UI/UX enhancements
- **Phase 4**: Database integration
- **Phase 5**: API development
- **Phase 6**: Advanced dashboard interactivity
- **Phase 7**: Sentiment analysis
- **Phase 8**: Export & reporting
- **Phase 9**: Deployment
- **Phase 10**: Final polish & QA

## 📊 Data Schema

The application will handle the following data types:

- **Users**: Social media user profiles
- **Posts**: Social media posts with metadata
- **Hashtags**: Trending hashtag analytics
- **Sentiment**: Sentiment analysis results
- **Networks**: User interaction graphs

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
