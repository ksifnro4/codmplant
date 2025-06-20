// MapStage.tsx
import { Stage, Layer, Image as KonvaImage, Group } from "react-konva";
import useImage from "use-image";
import type { Marker, MapState, PenLine, MarkerType } from "./types";
import { MarkerIcon } from "./markers/Marker";
import { FovMarker } from "./markers/FovMarker";
import { PenLayer } from "./pens/PenLayer";
import { Line } from "react-konva";

type Props = {
    mapState: MapState;
    imgSize: { width: number; height: number };
    stageRef: any;
    stageScale: number;
    stagePos: { x: number; y: number };
    onStageWheel: (e: any) => void;
    onStageDragMove: (e: any) => void;
    onFovSpread: (id: string, newSpread: number) => void;
    onMarkerDragEnd: (e: any, id: string) => void;
    onMarkerContextMenu: (e: any, id: string) => void;
    onFovResize: (id: string, delta: number) => void;
    onFovRotate: (id: string, delta: number) => void;
    penDrawing: boolean;
    onStageMouseDown: (e: any) => void;
    onStageMouseMove: (e: any) => void;
    onStageMouseUp: () => void;
    ghostMarker: { type: string; x: number; y: number } | null;
    draggingSidebar: string | null;
    eraserMode: boolean;
    erasing: boolean;
    eraserPath: number[];
    eraserWidth: number;
};

export function MapStage(props: Props) {
    const { mapState, imgSize } = props;
    const [mapImage] = useImage(mapState.mapUrl);
    const scaleX = imgSize.width / 800;
    const scaleY = imgSize.height / 600;

    return (
        <Stage
            ref={props.stageRef}
            width={imgSize.width}
            height={imgSize.height}
            style={{
                background: "#222",
                borderRadius: 12,
                boxShadow: "0 0 8px #0008",
                display: "block",
                margin: "auto",
            }}
            scaleX={props.stageScale}
            scaleY={props.stageScale}
            x={props.stagePos.x}
            y={props.stagePos.y}
            onWheel={props.onStageWheel}
            draggable
            onDragMove={props.onStageDragMove}
            onMouseDown={props.onStageMouseDown}
            onMouseMove={props.onStageMouseMove}
            onMouseUp={props.onStageMouseUp}
            onTouchStart={props.onStageMouseDown}
            onTouchMove={props.onStageMouseMove}
            onTouchEnd={props.onStageMouseUp}
        >
            <Layer>
                {/* マップ画像 */}
                {mapImage && (
                    <KonvaImage image={mapImage} x={0} y={0} width={imgSize.width} height={imgSize.height} />
                )}

                {/* ペン線 */}
                <PenLayer penLines={mapState.penLines} scaleX={scaleX} scaleY={scaleY} />

                {/* 既存マーカー */}
                {mapState.markers.map(marker =>
                    marker.type === "fov" ? (
                        <FovMarker
                            key={marker.id}
                            marker={marker}
                            scale={scaleX}
                            onResize={props.onFovResize}
                            onRotate={props.onFovRotate}
                            onSpread={props.onFovSpread}
                            onDragEnd={props.onMarkerDragEnd}
                            onContextMenu={props.onMarkerContextMenu}
                        />

                    ) : (
                        <Group
                            key={marker.id}
                            draggable
                            x={marker.x * scaleX}
                            y={marker.y * scaleY}
                            onDragEnd={e => props.onMarkerDragEnd(e, marker.id)}
                            onContextMenu={e => props.onMarkerContextMenu(e, marker.id)}
                        >
                            {/* x,y指定でGroupをずらし、中は0,0で描画 */}
                            <MarkerIcon marker={{ ...marker, x: 0, y: 0 }} scale={scaleX} />
                        </Group>
                    )
                )}

                {/* ゴースト（ドラッグ中マーカー仮表示） */}
                {props.ghostMarker && (() => {
                    // x, y: 画像エリア上のピクセル位置（stageの左上基準）
                    let x = props.ghostMarker.x, y = props.ghostMarker.y;
                    if (props.draggingSidebar && props.stageRef.current) {
                        const rect = props.stageRef.current.container().getBoundingClientRect();
                        x = x - rect.left;
                        y = y - rect.top;
                        x = Math.max(0, Math.min(x, imgSize.width));
                        y = Math.max(0, Math.min(y, imgSize.height));
                    }
                    // 三角形だけ特殊処理
                    if (props.ghostMarker.type === "fov") {
                        return (
                            <MarkerIcon
                                marker={{
                                    id: "ghost",
                                    type: "fov",
                                    x: x / scaleX,
                                    y: y / scaleY,
                                    size: 40,
                                    rotation: 0
                                }}
                                scale={scaleX}
                            />
                        );
                    }
                    // 通常マーカー
                    return (
                        <MarkerIcon
                            marker={{
                                id: "ghost",
                                type: props.ghostMarker.type as MarkerType,
                                x: x / scaleX,
                                y: y / scaleY
                            }}
                            scale={scaleX}
                        />
                    );
                })()}
                {props.eraserMode && props.erasing && (
                    <Line
                        points={props.eraserPath.map((p, i) => i % 2 === 0 ? p * scaleX : p * scaleY)}
                        stroke="#bbb"
                        strokeWidth={props.eraserWidth}
                        opacity={0.3}
                        tension={0.5}
                        lineCap="round"
                        globalCompositeOperation="destination-out"
                    />
                )}
            </Layer>
        </Stage>
    );
}
