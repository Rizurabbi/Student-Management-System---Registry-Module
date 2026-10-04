import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { ApiError } from "./errors";

type Ctx<P> = { params: Promise<P> };

/** Wraps a route handler: returns JSON, and turns every thrown error into a clean JSON error. */
export function handler<P extends Record<string, string> = Record<string, never>>(
  fn: (req: NextRequest, ctx: { params: P }) => Promise<unknown>,
) {
  return async (req: NextRequest, ctx: Ctx<P>): Promise<Response> => {
    try {
      const params = (await ctx?.params) ?? ({} as P);
      const result = await fn(req, { params });
      return result instanceof Response ? result : NextResponse.json(result ?? { ok: true });
    } catch (err) {
      return errorResponse(err);
    }
  };
}

export function errorResponse(err: unknown): Response {
  if (err instanceof ApiError) {
    return NextResponse.json({ error: err.message }, { status: err.status });
  }
  if (err instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Please check the highlighted fields",
        issues: err.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
      },
      { status: 400 },
    );
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return NextResponse.json({ error: "That value already exists" }, { status: 409 });
  }
  console.error("Unhandled API error:", err);
  return NextResponse.json({ error: "Unexpected server error" }, { status: 500 });
}

/** Parse a JSON body and throw a readable 400 if it is not valid JSON. */
export async function readJson(req: NextRequest): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new ApiError(400, "Request body must be valid JSON");
  }
}
