// markers/Marker.tsx
import React from "react";
import { Circle, Star, Group, Rect, Line } from "react-konva";
import type { Marker } from "../types";

// icon出力用
export function MarkerIcon({ marker, scale = 1 }: { marker: Marker; scale?: number }) {
    const x = marker.x * scale;
    const y = marker.y * scale;
    switch (marker.type) {
        case "red":
            return <Circle x={x} y={y} radius={20} fill="#E53E3E" stroke="#fff" strokeWidth={2} />;
        case "blue":
            return <Circle x={x} y={y} radius={20} fill="#3182CE" stroke="#fff" strokeWidth={2} />;
        case "gre":
            return <Star x={x} y={y} numPoints={5} innerRadius={10} outerRadius={16} fill="#444" stroke="#FFEE58" strokeWidth={6} />;
        case "smoke":
            return <Circle x={x} y={y} radius={30} fill="#bbb" stroke="#555" strokeWidth={2} opacity={0.7} />;
        case "trophy":
            return (
                <Group>
                    <Rect x={x - 16} y={y - 16} width={32} height={32} fill="#FFDA79" stroke="#a58e47" strokeWidth={2} cornerRadius={6} />
                    <Circle x={x} y={y} radius={10} fill="#fff" stroke="#a58e47" strokeWidth={2} />
                </Group>
            );
        case "flash":
            return <Line x={x} y={y} points={[-16, -16, 0, 16, 16, -16, 4, -4, -8, 16]} closed fill="#FFE066" stroke="#e3ba2f" strokeWidth={2} />;
        default:
            return null;
    }
}
