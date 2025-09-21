import { db } from "@/service/services/database/sqlite/db";
import { z } from 'zod';
import { syncStateStore } from "./states";

// const syncBaseUrl = new URL("https://coral-app-uijy2.ondigitalocean.app/");
const SYNC_BASE_URL = new URL("http://localhost:3001/"); // TODO: For testing

const ZPullRequest = z.object({
  libraryId: z.string().uuid(),
  lastSyncTimestamp: z.string().datetime().optional(),
  includeDeleted: z.boolean().default(false)
});

export type PullRequest = z.infer<typeof ZPullRequest>;

const ZPullResponse = z.object({
  papers: z.array(z.any()),
  folders: z.array(z.any()),
  feeds: z.array(z.any()),
  supplements: z.array(z.any()),
  authors: z.array(z.any()),
  tags: z.array(z.any()),
  libraries: z.array(z.any()),
  serverTimestamp: z.date()
});

export type PullResponse = z.infer<typeof ZPullResponse>;

async function pullLibrary(libraryId: string) {
  const lastSyncAt = syncStateStore.get("lastSyncAt");
  const deviceId = syncStateStore.get("deviceId");
  const pullUrl = new URL("/sync/pull", SYNC_BASE_URL);
  if (lastSyncAt) {
    pullUrl.searchParams.set("since", lastSyncAt);
  }
  pullUrl.searchParams.set("deviceId", deviceId);
  pullUrl.searchParams.set("libraryId", libraryId);
  const accessToken = syncStateStore.get("accessToken");
  if (!accessToken) {
    throw new Error("accessToken is not set");
  }
  const response = await fetch(pullUrl, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${accessToken}`
    }
  });
  const pullResponse: PullResponse = await response.json();

}

export async function pull() {
  const libraries = await db.selectFrom("library").selectAll().execute();
  for (const library of libraries) {
    await pullLibrary(library.id);
  }
}

