import Image from "next/image";
import type { StudyQuestion } from "../types";
import DeleteButton from "./DeleteButton";
import EditField from "./EditField";
import ImageUploadButton from "./ImageUploadButton";

interface ItemProps {
  idx: number;
  q: StudyQuestion;
}

export default function Item({ idx, q }: ItemProps) {
  return (
    <div>
      <div className="bg-muted rounded-lg shadow p-6">
        <div className="flex items-start gap-4">
          <div className="shrink-0 w-8 h-8 bg-muted-hover rounded-full flex items-center justify-center text-sm font-medium">
            {idx + 1}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <EditField
                variant={"question_text"}
                textField={q.question}
                id={q.id}
              />
              <ImageUploadButton id={q.id} />
              <DeleteButton id={q.id} variant="question" name={q.question} />
            </div>
            {q.imageUrl && (
              <Image
                src={q.imageUrl}
                alt="supporting image"
                width={500}
                height={500}
                className="mt-3 rounded-md border border-muted-foreground/20"
              />
            )}
            <details className="text-sm mt-4">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                Show answer
              </summary>
              <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                <EditField
                  variant={"answer_text"}
                  textField={q.answer}
                  id={q.id}
                />
              </div>
              <div className="text-sm mt-4">
                Wrong Options
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                  <EditField
                    variant={0}
                    textField={q.options?.[0] ?? ""}
                    id={q.id}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                  <EditField
                    variant={1}
                    textField={q.options?.[1] ?? ""}
                    id={q.id}
                  />
                </div>
                <div className="flex items-center justify-between mt-2 p-4 rounded-lg bg-muted-hover">
                  <EditField
                    variant={2}
                    textField={q.options?.[2] ?? ""}
                    id={q.id}
                  />
                </div>
              </div>
            </details>
          </div>
        </div>
      </div>
    </div>
  );
}
