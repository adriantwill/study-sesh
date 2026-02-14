import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  const id =
    segments[0] === "study" || segments[0] === "quiz"
      ? segments[1]
      : segments[0];

  if (id && !UUID_REGEX.test(id)) {
    return NextResponse.rewrite(new URL("/404", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/:reviewId([0-9a-fA-F-]+)",
    "/study/:studyId([0-9a-fA-F-]+)",
    "/quiz/:quizId([0-9a-fA-F-]+)",
  ],
};
