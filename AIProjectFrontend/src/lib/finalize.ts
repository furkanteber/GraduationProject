export async function finalizeSession(sessionId: string) {
  const res = await fetch(
    `http://127.0.0.1:8000/finalize-session?sessionId=${sessionId}`
  );

  if (!res.ok) throw new Error("Failed to finalize");
  return res.json();
}
