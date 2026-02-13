import { create } from 'zustand';

export interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    url: string;
    duration?: string;
    type?: 'song' | 'video' | 'playlist' | 'mix';
}

interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    progress: number;
    queue: Track[];
    playbackMode: 'audio' | 'video';

    setTrack: (track: Track) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    setQueue: (tracks: Track[]) => void;
    setPlaybackMode: (mode: 'audio' | 'video') => void;
    playNext: () => void;
    playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    volume: 0.5,
    progress: 0,
    queue: [],
    playbackMode: 'audio',

    setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setVolume: (volume) => set({ volume }),
    setProgress: (progress) => set({ progress }),
    setQueue: (tracks) => set({ queue: tracks }),
    setPlaybackMode: (mode) => set({ playbackMode: mode }),

    playNext: () => {
        const { queue, currentTrack } = get();
        if (queue.length === 0) return;
        const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
        if (currentIndex === -1 || currentIndex === queue.length - 1) {
            set({ currentTrack: queue[0], isPlaying: true, progress: 0 });
        } else {
            set({ currentTrack: queue[currentIndex + 1], isPlaying: true, progress: 0 });
        }
    },

    playPrevious: () => {
        const { queue, currentTrack } = get();
        if (queue.length === 0) return;
        const currentIndex = queue.findIndex((track) => track.id === currentTrack?.id);
        if (currentIndex === -1 || currentIndex === 0) {
            set({ currentTrack: queue[queue.length - 1], isPlaying: true, progress: 0 });
        } else {
            set({ currentTrack: queue[currentIndex - 1], isPlaying: true, progress: 0 });
        }
    },
}));
