import { Sparkles } from "lucide-react";

export default function UpcomingEventsCard() {
  return (
    <section className="flex w-80 h-full max-w-xs flex-col overflow-hidden rounded-xl border border-border bg-muted shadow-sm">
      <header className="border-b border-border bg-primary px-4 py-3">
        <h2 className="text-2xl font-bold leading-tight text-primary-foreground">
          Upcoming Events
        </h2>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3">
        <div className="flex items-start gap-3 py-2">
          <Sparkles className="mt-1 size-5 shrink-0 text-foreground" />
          <div>
            <p className="text-xl font-semibold leading-tight text-foreground">
              BMS Exam 3
            </p>
            <p className="text-lg leading-tight text-foreground/90">
              Tuesday March 19
            </p>
            <p className="text leading-tight text-muted-foreground">
              19 Days Until
            </p>
          </div>
        </div>

        <hr className="my-3 border-border" />
        <div className="flex items-start gap-3 py-2">
          <Sparkles className="mt-1 size-5 shrink-0 text-foreground" />
          <div>
            <p className="text-xl font-semibold leading-tight text-foreground">
              BMS Exam 3
            </p>
            <p className="text-lg leading-tight text-foreground/90">
              Tuesday March 19
            </p>
            <p className="text leading-tight text-muted-foreground">
              19 Days Until
            </p>
          </div>
        </div>

        <hr className="my-3 border-border" />
        <div className="flex items-start gap-3 py-2">
          <Sparkles className="mt-1 size-5 shrink-0 text-foreground" />
          <div>
            <p className="text-xl font-semibold leading-tight text-foreground">
              BMS Exam 3
            </p>
            <p className="text-lg leading-tight text-foreground/90">
              Tuesday March 19
            </p>
            <p className="text leading-tight text-muted-foreground">
              19 Days Until
            </p>
          </div>
        </div>

        <hr className="my-3 border-border" />
        <div className="flex items-start gap-3 py-2">
          <Sparkles className="mt-1 size-5 shrink-0 text-foreground" />
          <div>
            <p className="text-xl font-semibold leading-tight text-foreground">
              BMS Exam 3
            </p>
            <p className="text-lg leading-tight text-foreground/90">
              Tuesday March 19
            </p>
            <p className="text leading-tight text-muted-foreground">
              19 Days Until
            </p>
          </div>
        </div>

        <hr className="my-3 border-border" />

      </div>
    </section>
  );
}
