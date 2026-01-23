# Study Sesh

AI-powered PDF-to-flashcard study tool. Uploads PowerPoint PDFs, extracts slides via poppler, generates study questions via Hyperbolic AI.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- Supabase (DB + storage)
- node-poppler (PDF→images)
- Hyperbolic API (Qwen2.5-VL-7B vision model)

## Commands

```bash
npm run build    # build
npm run start    # prod server
# dev server run separately by user
```

## Structure

- `src/app/` - Next.js App Router pages + server actions
- `src/app/actions.ts` - all server actions (upload, delete, edit, complete)
- `src/components/` - React components (FlashcardView, UploadButton, etc)
- `src/lib/ai/question-generator.ts` - PDF processing + AI prompt generation
- `src/lib/supabase/` - client/server Supabase setup
- `src/types/` - TypeScript types + generated Supabase types

## DB Tables

- `uploads` - PDF uploads (id, filename)
- `questions` - generated questions (upload_id, page_number, question_text, answer_text, completed, image_url)

## Env Vars

- `HYPERBOLIC_API_KEY` - AI API key
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase key
- `MOCK_AI=true` - skip real AI, use dummy data

## Deployment

- GitHub Actions auto-deploys on push to main
- Builds & pushes to ghcr.io/adriantwill/study-sesh:latest
- SSH deploys to VPS via docker run (port 3000)
- No VPS files needed, secrets in GitHub Actions

## Notes

- PDF processing starts at page 3 (skips title/intro slides)
- Uses server actions for all mutations + revalidatePath() for cache
- Docker uses poppler-utils runtime dep
- No test suite
- Firefox backface-visibility fix: add `rotate-x-0` to card faces when using `backface-hidden` with 3D transforms
