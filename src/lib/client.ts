// Tiny fetch wrapper for client components. Throws Error(message) on any non-2xx response.

export async function apiFetch<T = unknown>(url: string, init?: RequestInit & { json?: unknown }): Promise<T> {
  const { json, ...rest } = init ?? {};
  const res = await fetch(url, {
    ...rest,
    headers: json !== undefined ? { "Content-Type": "application/json", ...(rest.headers ?? {}) } : rest.headers,
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const issues: { message: string }[] | undefined = data?.issues;
    const detail = issues?.length ? `: ${issues.map((i) => i.message).join(", ")}` : "";
    throw new Error((data?.error ?? "Something went wrong") + detail);
  }
  return data as T;
}
