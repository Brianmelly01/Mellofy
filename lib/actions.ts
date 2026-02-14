"use server";

// This file is kept for backwards compatibility but search now uses 
// the /api/search API route with youtube-sr instead.
// See: app/api/search/route.ts

export async function searchYouTube(query: string) {
    // Redirect to the API route approach
    return [];
}
