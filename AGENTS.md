# Study Sesh

AI-powered PDF-to-flashcard study tool. Uploads PowerPoint PDFs, extracts slides via poppler, generates study questions via Gemini.

## Stack

- Next.js 16 + React 19 + TypeScript
- Tailwind CSS 4
- PSQL DB
- node-poppler (PDF→images)
- Fine tuned Qwen model via RunPod
- R2 Storage

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
- `src/types/` - TypeScript types 

## DB Tables

- `uploads` - PDF uploads (id, filename)
- `questions` - generated questions (upload_id, page_number, question_text, answer_text, completed, image_url)

## Deployment

- GitHub Actions auto-deploys on push to main
- Builds & pushes to ghcr.io/adriantwill/study-sesh:latest
- SSH deploys to VPS via docker run (port 3000)
- No VPS files needed, secrets in GitHub Actions

## Notes

- Generally avoid using bracket values in tailwind class names, but ok if need like in grid
- PDF processing starts at page 3 (skips title/intro slides)
- Uses server actions for all mutations + revalidatePath() for cache
- Docker uses poppler-utils runtime dep
- No test suite
- Firefox backface-visibility fix: add `rotate-x-0` to card faces when using `backface-hidden` with 3D transforms
- Storage abstracted in `src/lib/storage.ts` for future migration
- Always use npm
