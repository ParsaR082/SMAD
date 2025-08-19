# Social Media Analytics Dashboard

## 📌 Project Overview
The **Social Media Analytics Dashboard** is a full-stack web application designed to collect, process, and visualize social media data (from Twitter/X API or simulated datasets). The primary goal is to allow end-users (analysts, marketers, researchers) to explore trending hashtags, analyze sentiment, and view user interaction networks with a **modern, dark-themed UI featuring smooth animations**.

The final product should provide:
- **Interactive and responsive dashboards** with customizable filters.
- **High-quality data visualizations** (bar, line, pie charts, and graphs).
- **Engaging UI/UX** with animations, transitions, and dark mode styling.
- **Report exporting capabilities** (PDF/PNG).

---

## 🎯 Main Features
### Data Ingestion
- Connect to Twitter/X API (future phase, optional if API access is unavailable).
- Support **mock datasets** in JSON or CSV for development/testing.
- Store posts, hashtags, mentions, likes, retweets, and sentiment values.

### Data Analytics
- **Top Hashtags:** Identify most used hashtags across a given time range.
- **Hashtag Trends:** Track hashtag frequency evolution over time.
- **Sentiment Analysis:** Classify posts into positive/negative/neutral categories.
- **User Interaction Network:** Build graphs showing mentions and retweets.

### Data Visualization
- **Bar Chart** → Top hashtags usage.
- **Line Chart** → Temporal hashtag trends.
- **Pie Chart** → Sentiment distribution ratios.
- **Force-Directed Graph** → User network visualization.

### Dashboard Interactivity
- Filter by **date range**, **hashtags**, and **users**.
- Search functionality for specific hashtags or users.
- Hover tooltips, zooming (for graph), and drill-down details.
- Export chart visuals to PNG and reports to PDF.

---

## 🛠️ Tech Stack

### Frontend
- **Next.js 14 (React + App Router)** → main frontend framework.
- **Tailwind CSS** → utility-first styling, customized dark theme.
- **Framer Motion** → smooth animations and transitions.
- **Recharts** → standard charts (bar, line, pie).
- **D3.js** → advanced visualization for force-directed graphs.

### Backend
- **Next.js API Routes** → REST API endpoints for MVP.
- **Optional (Advanced Sentiment Analysis):**  
  A **FastAPI microservice (Python)** using HuggingFace transformers for NLP.

### Database
- **MongoDB** → NoSQL database for flexible schema storage.
- **Prisma ORM** → abstraction layer to interact with MongoDB.

### Infrastructure
- **Docker** → containerized environment for reproducibility.
- **Nginx** → reverse proxy with SSL support.
- **BullMQ + Redis (optional, later phases)** → for background jobs and data aggregation.

### Tools
- **Git & GitHub/GitLab** for version control.
- **html2canvas / jsPDF** for PDF and image export.
- **CI/CD pipeline** for automated deployment (optional).

---

## 🗄️ Database Schema

### **User Collection**
- `id` (String, Primary Key)
- `handle` (String, unique identifier, e.g., @username)
- `name` (String)
- `followers` (Int, follower count at ingestion time)
- `createdAt` (DateTime, when user added to DB)

### **Post Collection**
- `id` (String, Primary Key)
- `userId` (String, reference to User)
- `text` (String, raw post text)
- `createdAt` (DateTime, original posting time)
- `likes` (Int)
- `retweets` (Int)
- `hashtags` (Array of String)
- `mentions` (Array of String)
- `sentiment` (Enum: POS | NEG | NEU)
- `score` (Float, sentiment intensity)

### **Edge Collection (User Network)**
- `id` (String, Primary Key)
- `srcUserId` (String, source user)
- `dstUserId` (String, target user)
- `type` (Enum: mention | retweet)
- `weight` (Int, number of times interaction occurred)
- `timestamp` (DateTime)

### **HashtagDaily Collection**
- `id` (String, Primary Key)
- `hashtag` (String)
- `date` (DateTime, daily resolution)
- `count` (Int)

### **SentimentDaily Collection**
- `id` (String, Primary Key)
- `scope` (String: "global" | "hashtag" | "user")
- `key` (String: identifier for scope, e.g., "#AI" or "@user")
- `date` (DateTime)
- `pos` (Int, positive count)
- `neg` (Int, negative count)
- `neu` (Int, neutral count)

---

## 🎨 UI/UX Requirements
- **Theme**: Dark mode as default with neon highlights.
- **Layout**: Sidebar navigation, top filter/search bar, central dashboard panel.
- **Animations**: Smooth transitions (Framer Motion) for page loads, filter updates, chart refresh.
- **Interactive Charts**:
  - Hover effects with tooltips.
  - Animated graph layouts (D3 force simulation).
  - Transition effects when filters are applied.
- **Responsive Design**: Adaptive layout for desktop, tablet, and mobile devices.
- **Exporting**: Downloadable reports in PNG/PDF format.

---

## ✅ Development Phases & Detailed Checklists

### Phase 1: Project Initialization
- [x] Create repository and initialize Next.js 14 project.  
- [x] Configure Tailwind CSS with custom dark theme.  
- [x] Install libraries: Recharts, D3.js, Framer Motion.  
- [x] Define project folder structure (`app/`, `components/`, `api/`, `lib/`).  
- [x] Write README with setup instructions.  
- [x] Set up Dockerfile base for Node.js app.  

---

### Phase 2: Mock Data & MVP Visualizations
- [ ] Generate mock JSON dataset with posts, hashtags, mentions, and sentiment.  
- [ ] Build Top Hashtags **Bar Chart** with Recharts.  
- [ ] Build Hashtag Trend **Line Chart**.  
- [ ] Build Sentiment **Pie Chart**.  
- [ ] Display simple **D3 Force Graph** for user interactions.  

---

### Phase 3: UI/UX Enhancements
- [ ] Apply **dark theme styling** (Tailwind custom colors).  
- [ ] Add **Framer Motion animations** to sidebar, filters, and charts.  
- [ ] Implement **responsive layout** for desktop/tablet/mobile.  
- [ ] Create reusable **FilterBar** component.  
- [ ] Add loading states and skeleton UI for better UX.  

---

### Phase 4: Database Integration
- [ ] Deploy MongoDB instance (local or Docker container).  
- [ ] Define Prisma schema (User, Post, Edge, HashtagDaily, SentimentDaily).  
- [ ] Run migrations and seed database with mock data.  
- [ ] Connect Prisma client to Next.js API routes.  

---

### Phase 5: API Development
- [ ] `/api/hashtags/top` → fetch most popular hashtags.  
- [ ] `/api/hashtags/trend` → fetch time-series data for hashtags.  
- [ ] `/api/sentiment/summary` → fetch global or filtered sentiment.  
- [ ] `/api/graph` → fetch user interaction network data.  

---

### Phase 6: Advanced Dashboard Interactivity
- [ ] Implement **date range filters** (apply across charts).  
- [ ] Implement **hashtag filter** (chart + sentiment).  
- [ ] Implement **user search** (chart + graph).  
- [ ] Synchronize filters between all components.  
- [ ] Add tooltips, zoom, and pan features to graph visualization.  

---

### Phase 7: Sentiment Analysis
- [ ] MVP: Implement a **lexicon-based sentiment function** in Node.js.  
- [ ] Store sentiment classification in MongoDB.  
- [ ] Aggregate daily sentiment stats into SentimentDaily collection.  
- [ ] Advanced: Build **FastAPI service with HuggingFace models** for high-accuracy sentiment.  
- [ ] Integrate FastAPI with Next.js backend.  

---

### Phase 8: Export & Reporting
- [ ] Add "Export to PNG" feature for all charts (using html2canvas).  
- [ ] Implement "Export to PDF" option with jsPDF.  
- [ ] Build PDF layout with multiple charts and metadata.  
- [ ] Provide download button in dashboard header.  

---

### Phase 9: Deployment
- [ ] Write production-ready Dockerfile (multi-stage).  
- [ ] Set up Nginx reverse proxy with SSL certificate.  
- [ ] Deploy to VPS server.  
- [ ] Configure CI/CD pipeline (optional).  

---

### Phase 10: Final Polish & QA
- [ ] Refine UI animations for smooth experience.  
- [ ] Optimize chart performance for large datasets.  
- [ ] Add accessibility improvements (contrast ratios, ARIA roles).  
- [ ] Conduct final QA testing across browsers/devices.  
- [ ] Prepare production documentation.  

---

## 📊 Summary
This project plan provides a **step-by-step roadmap** for building a Social Media Analytics Dashboard.  
It defines **technologies, database schema, UI/UX design, and phased development tasks**.  
By following the phases and checklists, the team can incrementally develop the dashboard, ensuring clarity and no ambiguity throughout the process.
