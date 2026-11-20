import { devAuth, supabase } from "../auth/supabase";
import createClient from "openapi-fetch";
import type { paths } from "./schema";
export const api = createClient<paths>({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000",
});
api.use({
  async onRequest({ request }) {
    if (devAuth)
      request.headers.set("Authorization", "Bearer local-development-only");
    else if (supabase) {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (data.session)
        request.headers.set(
          "Authorization",
          `Bearer ${data.session.access_token}`,
        );
    }
    return request;
  },
  async onResponse({ response }) {
    if (response.ok) return response;
    if (response.status === 401)
      throw new Error(
        "Your session could not be verified. Sign out and sign in again.",
      );
    if (response.status === 403)
      throw new Error("Set up your household before continuing.");
    if (response.status === 422)
      throw new Error("Check your item details and try again.");
    throw failure();
  },
});
export function failure(): Error {
  return new Error(
    "Could not save or load your household. Check your connection and try again.",
  );
}
