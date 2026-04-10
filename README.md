# Bloom

**Build apps and websites by chatting with AI**

Bloom is an AI-powered code generation platform that transforms natural language descriptions into fully functional Next.js applications. Simply describe what you want to build, and watch as AI creates, iterates, and refines your application in real-time.

![Bloom Banner](public/logo.svg)

## ✨ Features

### 🤖 AI-Powered Code Generation
- **Conversational Interface** - Chat naturally with AI to build apps
- **Multi-Agent System** - Powered by Inngest Agent Kit with Google Gemini
- **Prompt Enhancement** - One-click AI prompt improvement for better results

### 🎨 Modern Developer Experience
- **Live Preview** - Instant preview of generated apps in isolated E2B sandboxes
- **Code Explorer** - Browse and review generated code with syntax highlighting
- **Quick Actions** - One-click iterations (Improve Design, Fix Bugs, Add Features, Make Responsive)
- **Mobile-Optimized** - Smooth sliding tabs between Chat and Preview on mobile
- **Real-time Updates** - See your app being built in real-time

### 🛠️ Project Management
- **Smart Organization** - AI-generated descriptive project names
- **Full CRUD** - Create, rename, and delete projects
- **Project History** - Track all conversations and iterations
- **Fragment System** - Each generation creates a reusable fragment with its own sandbox

### 🎯 User Experience
- **Beautiful UI** - Built with Shadcn UI and Tailwind CSS
- **Dark/Light Mode** - Full theme support with system preference detection
- **Responsive Design** - Desktop, tablet, and mobile optimized
- **Usage Tracking** - Credit system with free and pro tiers
- **Loading States** - Skeleton loaders and smooth animations

## 🏗️ Tech Stack

### Frontend
- **[Next.js 15](https://nextjs.org)** - React framework with App Router
- **[React 19](https://react.dev)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type safety
- **[Tailwind CSS 4](https://tailwindcss.com)** - Utility-first styling
- **[Shadcn UI](https://ui.shadcn.com)** - Beautiful component library
- **[Lucide Icons](https://lucide.dev)** - Icon system

### Backend & Infrastructure
- **[tRPC](https://trpc.io)** - End-to-end typesafe APIs
- **[Prisma](https://www.prisma.io/)** - Database ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Production database
- **[Clerk](https://clerk.com)** - Authentication & user management
- **[Inngest](https://www.inngest.com/)** - Durable workflow engine
- **[E2B](https://e2b.dev/)** - Secure code sandboxes

### AI & Agent System
- **[Inngest Agent Kit](https://www.inngest.com/docs/agent-kit)** - Multi-agent orchestration
- **[Google Gemini](https://ai.google.dev/)** - AI models (2.0 Flash & 2.5 Flash)
- **Custom Agent System** - Specialized agents for code generation, naming, and enhancement

### State Management & Data Fetching
- **[TanStack Query](https://tanstack.com/query)** - Async state management
- **[React Hook Form](https://react-hook-form.com/)** - Form handling
- **[Zod](https://zod.dev/)** - Schema validation

## 📦 Project Structure

```
bloom/
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── public/                        # Static assets
├── sandbox-templates/
│   └── nextjs/                    # E2B sandbox configuration
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── (home)/               # Public pages (home, pricing, auth)
│   │   ├── projects/[id]/        # Project detail pages
│   │   └── api/                  # API routes (tRPC, Inngest)
│   ├── components/
│   │   ├── ui/                   # Shadcn UI components
│   │   ├── code-view/            # Code syntax highlighting
│   │   ├── file-explorer.tsx     # File tree viewer
│   │   └── theme-toggle.tsx      # Theme switcher
│   ├── modules/
│   │   ├── home/                 # Home page components
│   │   ├── projects/             # Project CRUD & UI
│   │   ├── messages/             # Chat message handling
│   │   ├── prompt-enhancer/      # AI prompt enhancement
│   │   └── usage/                # Credit tracking system
│   ├── inngest/
│   │   ├── client.ts             # Inngest client setup
│   │   ├── functions.ts          # AI agent workflows
│   │   └── utils.ts              # Helper functions
│   ├── trpc/                     # tRPC setup & routers
│   ├── lib/                      # Utilities & database
│   └── hooks/                    # React hooks
└── ...config files
```

## 🚀 Getting Started

### Prerequisites

- **Node.js 18.17+**
- **PostgreSQL** database
- **API Keys:**
  - [Clerk](https://clerk.com) - Authentication
  - [Google AI](https://ai.google.dev/) - Gemini API
  - [E2B](https://e2b.dev/) - Code sandboxes
  - [Inngest](https://www.inngest.com/) - Workflow engine

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd bloom
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env` file in the root directory:
   
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/bloom"

   # Clerk Authentication
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

   # Google Gemini AI
   GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key

   # E2B Code Sandboxes
   E2B_API_KEY=your-e2b-api-key

   # Inngest
   INNGEST_SIGNING_KEY=your-inngest-signing-key
   INNGEST_EVENT_KEY=your-inngest-event-key
   INNGEST_APP_ID=bloom-development

   # Optional: For production
   NEXT_PUBLIC_API_URL=https://your-production-url.com
   ```

4. **Set up the database**
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

5. **Set up E2B Sandbox Template**
   
   The project uses a custom E2B sandbox template for Next.js apps:
   ```bash
   cd sandbox-templates/nextjs
   e2b template build
   ```
   
   Update `src/inngest/functions.ts` with your template ID if needed.

6. **Run the development server**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:3000](http://localhost:3000)

7. **Set up Inngest Dev Server** (for local testing)
   ```bash
   npx inngest-cli@latest dev
   ```
   
   This enables local testing of AI agent workflows.

## 🗄️ Database Schema

### Models

**Project** - User's projects
- Smart AI-generated names
- Associated messages and fragments
- Timestamps for tracking

**Message** - Conversation history
- User and Assistant messages
- Links to generated fragments
- Error handling support

**Fragment** - Generated code artifacts
- Live sandbox URL
- File system snapshot
- Reusable and shareable

**Usage** - Credit tracking
- Rate limiting per user
- Free tier: 5 credits/month
- Pro tier: 100 credits/month

## 🤖 AI Agent Architecture

### Multi-Agent System

Bloom uses a sophisticated multi-agent architecture powered by Inngest and Google Gemini:

#### 1. **Code Agent** (Primary)
- **Model:** Gemini 2.5 Flash
- **Purpose:** Generates full-stack Next.js applications
- **Tools:**
  - `terminal` - Run shell commands in sandbox
  - `CreateOrUpdateFiles` - Write/modify files
  - `read_files` - Read file contents
- **Workflow:** Iterative development with up to 15 steps

#### 2. **Project Name Generator**
- **Model:** Gemini 2.0 Flash
- **Purpose:** Creates relevant project names from user prompts
- **Example:** "build a calculator" → "calculator-app"

#### 3. **Prompt Enhancer**
- **Model:** Gemini 2.0 Flash
- **Purpose:** Expands brief ideas into detailed technical prompts
- **Usage:** Sparkles button (✨) in chat input

#### 4. **Fragment Title Generator**
- **Model:** Gemini 2.0 Flash
- **Purpose:** Creates concise titles for generated fragments

#### 5. **Response Generator**
- **Model:** Gemini 2.0 Flash
- **Purpose:** Generates user-friendly summaries of what was built

### Sandbox Environment

Each code generation runs in an isolated **E2B sandbox**:
- Pre-configured Next.js 15.3.3 environment
- All Shadcn UI components pre-installed
- Tailwind CSS configured
- Auto-reloading development server
- 1-hour timeout for long-running builds

## 🔐 Authentication & Authorization

- **Clerk** handles all authentication
- **Protected routes** via middleware
- **User isolation** - Users only see their own projects
- **Pro tier** - Managed through Clerk subscriptions

## 💳 Usage & Credits

### Free Tier
- 5 credits per month
- Resets every 30 days
- Perfect for trying out Bloom

### Pro Tier
- 100 credits per month
- Early access to new features
- Priority support
- Managed via Clerk pricing tables

### Credit Consumption
- **1 credit** = 1 code generation
- Quick actions use the same credit system
- Prompt enhancement is free

## 🎨 UI/UX Highlights

### Responsive Design
- **Desktop:** Resizable split view with chat and preview
- **Mobile:** Sliding tabs (Lovable-style) for optimal mobile experience
- **Smooth animations** throughout

### Quick Actions
Every generated fragment includes one-click actions:
- ✨ **Improve Design** - Enhance visual polish
- 🐛 **Fix Issues** - Debug and improve
- ➕ **Add Feature** - Intelligent feature additions
- 📱 **Make Responsive** - Mobile optimization

### Developer-Friendly
- Syntax-highlighted code viewer
- File tree navigation
- Copy code snippets
- Live sandbox previews
- Theme toggle (light/dark/system)

## 🚀 Deployment

### Vercel (Recommended)

1. **Push to GitHub**
   ```bash
   git push origin main
   ```

2. **Import to Vercel**
   - Connect your GitHub repository
   - Vercel auto-detects Next.js

3. **Add Environment Variables**
   
   In Vercel Dashboard → Settings → Environment Variables:
   ```
   DATABASE_URL
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   CLERK_SECRET_KEY
   GOOGLE_GENERATIVE_AI_API_KEY
   E2B_API_KEY
   INNGEST_SIGNING_KEY
   INNGEST_EVENT_KEY
   INNGEST_APP_ID
   ```

4. **Deploy**
   - Vercel automatically deploys on push
   - Prisma generates on build
   - Database migrations run automatically

5. **Sync Inngest**
   - Go to Inngest Dashboard
   - Sync your production URL: `https://your-app.vercel.app/api/inngest`

### Database Setup

Use any PostgreSQL provider:
- [Neon](https://neon.tech) - Serverless Postgres (recommended)
- [Supabase](https://supabase.com) - Open source alternative
- [Railway](https://railway.app) - Simple deployment

## 🧪 Development Workflow

### Local Development
```bash
npm run dev          # Start Next.js dev server
npx inngest-cli dev  # Start Inngest dev server (separate terminal)
```

### Database Management
```bash
npx prisma studio              # Open Prisma Studio (GUI)
npx prisma migrate dev         # Create new migration
npx prisma db push             # Push schema changes (dev only)
npx prisma generate            # Regenerate Prisma Client
```

### Building for Production
```bash
npm run build        # Build for production
npm start            # Start production server
```

## 📝 Key Concepts

### Fragments
A **fragment** is a generated code artifact that includes:
- All source files (React components, utilities, etc.)
- Live sandbox URL for instant preview
- File system snapshot
- Metadata (title, creation time)

### Projects
- Container for related conversations
- AI-generated descriptive names
- Message history and fragments
- Isolated per user

### Agent Workflow
1. User sends a message
2. Inngest triggers code agent function
3. Agent iteratively builds the app using tools
4. Sandbox is created with hot-reload server
5. Results saved to database
6. User sees summary + live preview

## 🔧 Configuration

### Clerk Setup

1. Create a Clerk application
2. Enable email/password authentication
3. Set up pricing tiers:
   - Create a "pro" plan in Clerk
   - Configure pricing tables

### Inngest Setup

1. Create Inngest account and app
2. Sync your development server
3. The app automatically registers these functions:
   - `code-agent` - Main code generation workflow

### E2B Sandbox

1. Create E2B account
2. Build custom template:
   ```bash
   cd sandbox-templates/nextjs
   e2b template build
   ```
3. Update template ID in `src/inngest/functions.ts`

## 📊 Database Models

### Project
```prisma
model Project {
  id        String    @id @default(uuid())
  name      String
  userId    String
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  messages  Message[]
}
```

### Message
```prisma
model Message {
  id        String      @id @default(uuid())
  content   String
  role      MessageRole
  type      MessageType
  createdAt DateTime    @default(now())
  updatedAt DateTime    @updatedAt
  projectId String?
  project   Project?    @relation(fields: [projectId], references: [id], onDelete: Cascade)
  fragments Fragment?
}
```

### Fragment
```prisma
model Fragment {
  id         String   @id @default(uuid())
  messageId  String   @unique
  message    Message  @relation(fields: [messageId], references: [id], onDelete: Cascade)
  sandboxUrl String?
  title      String
  files      Json
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

### Usage
```prisma
model Usage {
  key    String    @id
  points Int
  expire DateTime?
}
```

## 🎨 Customization

### Theming

Theme colors are defined in `src/app/globals.css`:
- Modify CSS custom properties for brand colors
- Primary color: Orange (#F97316)
- Supports light and dark modes

### AI Model Configuration

Update models in `src/inngest/functions.ts`:
```typescript
// Main code agent
model: gemini({ model: "gemini-2.5-flash" })

// Quick tasks (naming, titles, enhancement)
model: gemini({ model: "gemini-2.5-flash" })
```

To switch to Claude (Anthropic):
```typescript
import { anthropic } from "@inngest/agent-kit"
model: anthropic({ model: "claude-3-5-sonnet-20241022" })
```

### Sandbox Template

Customize the Next.js sandbox in `sandbox-templates/nextjs/`:
- `e2b.Dockerfile` - Container configuration
- `compile_page.sh` - Build script
- Modify to add pre-installed packages or configurations

## 🛡️ Security

- **Environment variables** - Never committed to git
- **User isolation** - Row-level security via Clerk user IDs
- **Sandboxed execution** - E2B isolated environments
- **Rate limiting** - Credit system prevents abuse
- **Input validation** - Zod schemas on all inputs
- **Protected routes** - Clerk middleware authentication

## 📈 Performance

- **Turbopack** - Fast development builds
- **React Server Components** - Optimized rendering
- **Database connection pooling** - Prisma handles connections
- **Edge-ready** - Works on Vercel Edge Network
- **Optimistic updates** - TanStack Query for instant UI updates

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. **Code Style** - Follow existing patterns
2. **TypeScript** - Maintain type safety
3. **Components** - Keep components modular and reusable
4. **Testing** - Test locally before pushing
5. **Commits** - Use descriptive commit messages

## 📄 License

This project is private and proprietary.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org)
- UI components from [Shadcn UI](https://ui.shadcn.com)
- Agent orchestration by [Inngest](https://www.inngest.com/)
- Code execution by [E2B](https://e2b.dev/)
- AI powered by [Google Gemini](https://ai.google.dev/)

---

**Made with by Bloom**

*Transform your ideas into reality - one conversation at a time.*
