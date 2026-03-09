import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Track } from './usePlayerStore';
import { set, get, del } from 'idb-keyval';

export interface DownloadedTrack extends Track {
    downloadedAt: number;
    downloadType: 'audio' | 'video' | 'both';
}

interface DownloadStore {
    downloadedTracks: DownloadedTrack[];
    saveTrack: (track: Track, type: 'audio' | 'video' | 'both', blob: Blob) => Promise<void>;
    removeTrack: (id: string) => Promise<void>;
    getTrackBlob: (id: string) => Promise<Blob | undefined>;
    isDownloaded: (id: string) => boolean;
}

export const useDownloadStore = create<DownloadStore>()(
    persist(
        (setHook, getHook) => ({
            downloadedTracks: [],

            saveTrack: async (track, type, blob) => {
                const downloadedTrack: DownloadedTrack = {
                    ...track,
                    downloadedAt: Date.now(),
                    downloadType: type,
                };

                // Store the blob in IndexedDB
                await set(`track-${track.id}`, blob);

                setHook((state) => {
                    const existing = state.downloadedTracks.filter(t => t.id !== track.id);
                    return { downloadedTracks: [downloadedTrack, ...existing] };
                });
            },

            removeTrack: async (id) => {
                await del(`track-${id}`);
                setHook((state) => ({
                    downloadedTracks: state.downloadedTracks.filter(t => t.id !== id)
                }));
            },

            getTrackBlob: async (id) => {
                return await get<Blob>(`track-${id}`);
            },

            isDownloaded: (id) => {
                return getHook().downloadedTracks.some(t => t.id === id);
            }
        }),
        {
            name: 'mellofy-downloads',
        }
    )
);
