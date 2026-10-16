/**
 * CORS مشترك لكل الـ API Routes.
 * كل Route يجب أن:
 *   1) يصدّر OPTIONS handler يرجع 204 مع هذه الـ headers.
 *   2) يمرّر corsHeaders في كل Response بدون استثناء.
 */

export const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Device-Id, X-Requested-With",
  "Access-Control-Max-Age": "86400",
};

/** preflight */
export function corsPreflight(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
}

/** JSON response مع CORS إجباري */
export function corsJson(
  body: unknown,
  init?: { status?: number; headers?: Record<string, string> }
): Response {
  return Response.json(body, {
    status: init?.status ?? 200,
    headers: { ...corsHeaders, ...(init?.headers ?? {}) },
  });
}
