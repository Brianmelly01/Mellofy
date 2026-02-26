import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Track } from './usePlayerStore';

interface LibraryState {
    likedTracks: Track[];
    playlists: { id: string; name: string; tracks: Track[]; cover?: string }[];

    toggleLike: (track: Track) => void;
    isLiked: (trackId: string) => boolean;
    createPlaylist: (name: string) => void;
    deletePlaylist: (playlistId: string) => void;
    addToPlaylist: (playlistId: string, track: Track) => void;
    removeFromPlaylist: (playlistId: string, trackId: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
    persist(
        (set, get) => ({
            likedTracks: [],
            playlists: [],

            toggleLike: (track) => {
                const { likedTracks } = get();
                const exists = likedTracks.find((t) => t.id === track.id);

                if (exists) {
                    set({ likedTracks: likedTracks.filter((t) => t.id !== track.id) });
                } else {
                    set({ likedTracks: [...likedTracks, track] });
                }
            },

            isLiked: (trackId) => {
                return get().likedTracks.some((t) => t.id === trackId);
            },

            createPlaylist: (name) => {
                const newPlaylist = {
                    id: Math.random().toString(36).substring(7),
                    name,
                    tracks: [],
                };
                set((state) => ({ playlists: [...state.playlists, newPlaylist] }));
            },

            deletePlaylist: (playlistId) => {
                set((state) => ({
                    playlists: state.playlists.filter(p => p.id !== playlistId)
                }));
            },

            addToPlaylist: (playlistId, track) => {
                set((state) => ({
                    playlists: state.playlists.map((p) => {
                        if (p.id === playlistId) {
                            // Prevent duplicates
                            const exists = p.tracks.some(t => t.id === track.id);
                            if (exists) return p;
                            return { ...p, tracks: [...p.tracks, track] };
                        }
                        return p;
                    })
                }));
            },

            removeFromPlaylist: (playlistId, trackId) => {
                set((state) => ({
                    playlists: state.playlists.map((p) =>
                        p.id === playlistId
                            ? { ...p, tracks: p.tracks.filter(t => t.id !== trackId) }
                            : p
                    )
                }));
            },
        }),
        {
            name: 'mellofy-library',
            storage: createJSONStorage(() => localStorage),
        }
    )
);
