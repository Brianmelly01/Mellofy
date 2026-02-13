import { create } from 'zustand';

interface Track {
    id: string;
    title: string;
    artist: string;
    thumbnail: string;
    url: string;
    duration?: number;
    isVideo?: boolean;
}

interface PlayerState {
    currentTrack: Track | null;
    isPlaying: boolean;
    volume: number;
    progress: number;
    queue: Track[];
    history: Track[];

    setTrack: (track: Track) => void;
    togglePlay: () => void;
    setVolume: (volume: number) => void;
    setProgress: (progress: number) => void;
    addToQueue: (track: Track) => void;
    playNext: () => void;
    playPrevious: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
    currentTrack: null,
    isPlaying: false,
    volume: 0.5,
    progress: 0,
    queue: [],
    history: [],

    setTrack: (track) => set({ currentTrack: track, isPlaying: true, progress: 0 }),
    togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
    setVolume: (volume) => set({ volume }),
    setProgress: (progress) => set({ progress }),
    addToQueue: (track) => set((state) => ({ queue: [...state.queue, track] })),
    playNext: () => {
        const { queue, history, currentTrack } = get();
        if (queue.length > 0) {
            const nextTrack = queue[0];
            set({
                currentTrack: nextTrack,
                queue: queue.slice(1),
                history: currentTrack ? [...history, currentTrack] : history,
                isPlaying: true,
                progress: 0
            });
        }
    },
    playPrevious: () => {
        const { history, currentTrack } = get();
        if (history.length > 0) {
            const prevTrack = history[history.length - 1];
            set({
                currentTrack: prevTrack,
                history: history.slice(0, -1),
                queue: currentTrack ? [currentTrack, ...get().queue] : get().queue,
                isPlaying: true,
                progress: 0
            });
        }
    },
}));
