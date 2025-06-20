import React, { useRef, useState } from "react";
import { Group, Line, Circle } from "react-konva";
import type { Marker } from "../types";

type Props = {
    marker: Marker & { size?: number; rotation?: number; spread?: number };
    scale: number;
    onResize: (id: string, newSize: number) => void;
    onRotate: (id: string, newRotation: number) => void;
    onSpread: (id: string, newSpread: number) => void;
    onDragEnd: (e: any, id: string) => void;
    onContextMenu: (e: any, id: string) => void;
};

export function FovMarker(props: Props) {
    const { marker, scale, onResize, onRotate, onSpread, onDragEnd, onContextMenu } = props;

    // ローカル描画用
    const temp = useRef<{ size?: number; rotation?: number; spread?: number }>({});
    const [, setRerender] = useState(0);

    // 優先順位: temp > marker
    const size = temp.current.size ?? marker.size ?? 40;
    const rotation = temp.current.rotation ?? marker.rotation ?? 0;
    const spread = temp.current.spread ?? marker.spread ?? 30;

    const toXY = (angleDeg: number, len: number) => [
        Math.sin((angleDeg - 90) * Math.PI / 180) * len,
        Math.cos((angleDeg - 90) * Math.PI / 180) * len
    ];
    const [x0, y0] = [0, 0];
    const [x1, y1] = toXY(rotation + spread, size);
    const [x2, y2] = toXY(rotation - spread, size);
    const [xt, yt] = toXY(rotation, size);

    const handleRadius = 9;
    const rotateRadius = 8;

    // 描画用: temp更新＋強制再描画
    function setTempValue(key: "size" | "rotation" | "spread", val: number | undefined) {
        temp.current[key] = val;
        setRerender(x => x + 1); // 強制再描画（state更新は絶対しない）
    }

    return (
        <Group
            key={marker.id}
            x={marker.x * scale}
            y={marker.y * scale}
            draggable
            onDragEnd={e => onDragEnd(e, marker.id)}
            onContextMenu={e => onContextMenu(e, marker.id)}
        >
            {/* 三角形 */}
            <Line
                points={[x0, y0, x1, y1, x2, y2]}
                closed
                fill="#08f"
                stroke="#fff"
                strokeWidth={2}
                opacity={0.6}
            />

            {/* サイズハンドル（先端） */}
            <Circle
                x={xt}
                y={yt}
                radius={handleRadius}
                fill="#fff"
                stroke="#08f"
                strokeWidth={2}
                draggable
                onDragMove={e => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    const newSize = Math.max(20, Math.sqrt(nx * nx + ny * ny));
                    setTempValue("size", newSize);
                }}
                onDragEnd={e => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    const newSize = Math.max(20, Math.sqrt(nx * nx + ny * ny));
                    onResize(marker.id, newSize);
                    setTempValue("size", undefined);
                }}
            />

            {/* 回転ハンドル（底辺右） */}
            <Circle
                x={x1}
                y={y1}
                radius={rotateRadius}
                fill="#fff"
                stroke="#f80"
                strokeWidth={2}
                draggable
                onDragMove={e => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    let angleRad = Math.atan2(ny, nx);
                    let deg = angleRad * 180 / Math.PI - 90;
                    setTempValue("rotation", deg);
                }}
                onDragEnd={e => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    let angleRad = Math.atan2(ny, nx);
                    let deg = angleRad * 180 / Math.PI - 90;
                    onRotate(marker.id, ((deg % 360) + 360) % 360);
                    setTempValue("rotation", undefined);
                }}
            />

            {/* spread（頂角）ハンドル（底辺左） */}
            <Circle
                x={x2}
                y={y2}
                radius={rotateRadius}
                fill="#fff"
                stroke="#0f8"
                strokeWidth={2}
                draggable
                onDragMove={e => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    let angleRad = Math.atan2(ny, nx);
                    let deg = angleRad * 180 / Math.PI - 90;
                    let newSpread = Math.abs(deg - rotation);
                    if (newSpread > 180) newSpread = 360 - newSpread;
                    setTempValue("spread", Math.max(5, Math.min(80, newSpread)));
                }}
                onDragEnd={e => {
                    const nx = e.target.x();
                    const ny = e.target.y();
                    let angleRad = Math.atan2(ny, nx);
                    let deg = angleRad * 180 / Math.PI - 90;
                    let newSpread = Math.abs(deg - rotation);
                    if (newSpread > 180) newSpread = 360 - newSpread;
                    onSpread(marker.id, Math.max(5, Math.min(80, newSpread)));
                    setTempValue("spread", undefined);
                }}
            />
        </Group>
    );
}
