// Embed shim — Apps Script always provides google.script.run, so this is never called.
export const askDashboard = async (_args: unknown): Promise<{ answer: string }> => {
  throw new Error("askAI no disponible: ejecuta este HTML dentro de Google Apps Script.");
};
