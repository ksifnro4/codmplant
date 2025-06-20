// hooks/useLocalPatterns.ts
import { useEffect, useState } from "react";
import type { MapState } from "../types";

const LOCAL_KEY = "maptool-patterns";

export function useLocalPatterns(defaults: MapState[]) {
    const [patterns, setPatterns] = useState<MapState[]>(defaults);

    useEffect(() => {
        const saved = localStorage.getItem(LOCAL_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length === defaults.length) {
                    setPatterns(parsed);
                }
            } catch { }
        }
        // eslint-disable-next-line
    }, []);

    useEffect(() => {
        localStorage.setItem(LOCAL_KEY, JSON.stringify(patterns));
    }, [patterns]);

    return [patterns, setPatterns] as const;
}
