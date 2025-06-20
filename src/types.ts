export type MarkerType =
    | "red"
    | "blue"
    | "gre"
    | "smoke"
    | "trophy"
    | "flash"
    | "fov";

export type Marker = {
    id: string;
    type: MarkerType;
    x: number;
    y: number;
    size?: number;      // 三角形（視線）用
    rotation?: number;  // 三角形（視線）用
};

export type PenLine = {
    color: string;
    width: number;
    points: number[];
};

export type MapState = {
    mapUrl: string;
    markers: Marker[];
    penLines: PenLine[];
    name: string;
};
