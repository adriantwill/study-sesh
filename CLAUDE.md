# Study Sesh - AI-Powered Study Question Generator

## Project Overview
Next.js app that generates study questions from PowerPoint slides (exported as PNG/APNG). Uses Hyperbolic vision AI (Qwen2-VL-7B-Instruct) to analyze slide images and create short-answer questions. Stores questions in Supabase database.

## Tech Stack
- **Framework:** Next.js 16.0.7 (React 19.2.0, App Router)
- **Language:** TypeScript 5 (strict mode)
- **Styling:** Tailwind CSS v4
- **AI:** Hyperbolic Inference API (Qwen2-VL-7B-Instruct vision model)
- **Database:** Supabase (PostgreSQL)
- **Image Processing:** apng-js for APNG frame extraction
- **Deployment:** Docker + Docker Compose, Nginx reverse proxy

## Architecture

### Directory Structure
```
src/
├── app/
│   ├── api/generate-questions/route.ts  # Vision AI endpoint
│   ├── page.tsx                          # Main upload & mode controller
│   ├── layout.tsx                        # Root layout
│   └── globals.css                       # Global styles
└── components/
    └── ReviewMode.tsx                    # Expandable Q&A list
```

### Key Files
- `Dockerfile` - Multi-stage production build (Node 20 alpine)
- `docker-compose.yml` - Container orchestration
- `setup-vps.sh` - Automated Ubuntu/Debian deployment
- `next.config.ts` - Standalone output, 30MB body limit

## Core Features

### Image Processing
- Upload PNG/APNG files (30MB max)
- Extract APNG frames (multi-page PowerPoint exports)
- Base64 encode for Hyperbolic API

### AI Question Generation
- Sequential processing per slide
- 2-3 short-answer questions per slide
- Returns: question text, answer, page number 
- Error handling per frame (continues on failure)

### Study Modes
1. **Review:** View all questions, click to reveal answers

## Important Patterns

### Type Safety
- `StudyQuestion` interface shared across components (exported from `route.ts`)
- Explicit TypeScript interfaces for all props
- Strict mode enabled

### Component Structure
- Client components marked `"use client"`
- State lifted to main page component
- Mode switching: upload → review 
- Answered questions tracked in `Record<number, string>`

### Error Handling
- Try-catch with detailed logging
- API returns status codes + error messages
- Frontend alerts for user feedback
- Continues processing remaining frames on error

### Styling
- Tailwind utility classes
- Dark mode via `dark:` variants (system preference)
- Responsive design
- Geist font family

## Development

### Setup
```bash
npm install
# Create .env.local with API keys
npm run dev  # localhost:3000
```

### Environment Variables
- `HYPERBOLIC_API_KEY` - **Required** for Hyperbolic API
- `NEXT_PUBLIC_SUPABASE_URL` - **Required** for Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - **Required** for Supabase

### Scripts
- `npm run dev` - Dev server
- `npm run build` - Production build
- `npm start` - Start production
- `npm run lint` - ESLint

## Deployment

### Docker
```bash
docker build -t study-sesh .
docker run -p 3000:3000 -e HYPERBOLIC_API_KEY=your_key -e NEXT_PUBLIC_SUPABASE_URL=your_url -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key study-sesh
```

### Docker Compose
```bash
# Add API keys to .env
docker compose up -d
```

### VPS (Automated)
```bash
./setup-vps.sh
# Installs Docker, Nginx, sets up reverse proxy, optional SSL
```

## Configuration Notes

### API Limits
- **Page limit:** 3 (hardcoded at `route.ts:50`)
- **Upload size:** 30MB max
- **AI tokens:** 500 max per request
- Processing: sequential (not parallel)

### Docker
- Standalone Next.js output
- Non-root user (nextjs:nodejs, uid 1001)
- Telemetry disabled
- Port 3000

### Nginx (VPS)
- Client max body size: 100MB
- Reverse proxy to localhost:3000
- Optional Let's Encrypt SSL

## Code Conventions
- Functional components only
- useState for state management
- No global state/database (client-side only)
- Dark mode classes: `dark:bg-gray-900`, etc.
- Path alias: `@/*` → `src/*`

## Historical Notes
- Originally supported PDF input (changed to PNG)
- Page limit was configurable (now hardcoded at 3)
- Model: Qwen/Qwen2.5-VL-7B-Instruct (vision-language model)
- Recent Docker support added

## Known Limitations
- No persistence (sessions lost on refresh)
- Sequential processing (slow for many slides)
- No direct PDF support
- Fixed page limit
- No export/import functionality
- Client-side only (no database)

## Future Enhancement Ideas
- Add persistence (save/load sessions)
- Parallel frame processing
- Configurable page limits
- Export question sets (JSON/CSV)
- Multiple AI model options
- Restore PDF support
