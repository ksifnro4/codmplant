// Sidebar.tsx
import type { MarkerType } from "./types";

type MarkerTypeDef = { type: MarkerType; label: string; icon: React.ReactNode };

type Props = {
    patternIdx: number;
    patternNames: string[];
    onPatternChange: (idx: number) => void;
    onSaveName: () => void;
    mapList: { label: string; url: string }[];
    mapUrl: string;
    onMapUrlChange: (url: string) => void;
    markerTypes: { type: MarkerType; label: string; icon: React.ReactNode }[];
    onMarkerDragStart: (type: MarkerType, e?: React.MouseEvent | React.TouchEvent) => void;
    currentPen: { color: string; width: number };
    penColors: string[];
    penWidths: number[];
    penEnabled: boolean;
    onTogglePen: () => void;
    onPenColor: (color: string) => void;
    onPenWidth: (width: number) => void;
    onErase: () => void;
    eraserMode: boolean;
    onToggleEraser: () => void;
};

export function Sidebar(props: Props) {
    return (
        <div style={{
            width: "20vw",
            minWidth: 80,
            background: "#181F2A",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: 16,
        }}>
            {/* パターン切り替え */}
            <div style={{ marginBottom: 12 }}>
                {props.patternNames.map((name, i) => (
                    <button
                        key={i}
                        onClick={() => props.onPatternChange(i)}
                        style={{
                            margin: 4,
                            padding: 8,
                            borderRadius: 8,
                            background: props.patternIdx === i ? "#4d81ee" : "#292c38",
                            color: "#fff",
                            fontWeight: props.patternIdx === i ? "bold" : "normal",
                            border: "none",
                            cursor: "pointer"
                        }}
                    >
                        {name}
                    </button>
                ))}
            </div>
            {/* 保存 */}
            <button style={{ marginBottom: 16 }} onClick={props.onSaveName}>保存（名前変更）</button>
            {/* 画像切替 */}
            <select
                style={{ width: "90%", marginBottom: 24, fontSize: 16, padding: 4, borderRadius: 4 }}
                value={props.mapUrl}
                onChange={e => props.onMapUrlChange(e.target.value)}
            >
                {props.mapList.map(map => (
                    <option key={map.url} value={map.url}>{map.label}</option>
                ))}
            </select>
            {/* マーカーアイコン */}
            {props.markerTypes.map(m => (
                <div
                    key={m.type}
                    style={{ marginBottom: 24, cursor: "grab" }}
                    onMouseDown={e => {
                        console.log("Sidebar: mousedown!", m.type); // ← ここ追加！
                        props.onMarkerDragStart(m.type, e);
                    }}
                    onTouchStart={e => {
                        props.onMarkerDragStart(m.type, e);
                    }}
                >
                    {m.icon}
                </div>
            ))}


            {/* ペンUI */}
            <div style={{ margin: "18px 0", width: "90%", textAlign: "center" }}>
                <button
                    style={{
                        marginBottom: 10,
                        background: props.penEnabled ? "#19c37d" : "#666",
                        color: "#fff"
                    }}
                    onClick={props.onTogglePen}
                >
                    ペン {props.penEnabled ? "ON" : "OFF"}
                </button>
                <div style={{ marginBottom: 4 }}>ペン色</div>
                {props.penColors.map(color => (
                    <button
                        key={color}
                        style={{
                            background: color,
                            border: props.currentPen.color === color ? "3px solid #fff" : "1px solid #333",
                            width: 24, height: 24, margin: 2, borderRadius: "50%", cursor: "pointer"
                        }}
                        onClick={() => props.onPenColor(color)}
                    />
                ))}
                <div style={{ margin: "10px 0 4px" }}>太さ</div>
                {props.penWidths.map(width => (
                    <button
                        key={width}
                        style={{
                            background: "#fff",
                            border: props.currentPen.width === width ? "3px solid #444" : "1px solid #333",
                            width: 24, height: 24, margin: 2, borderRadius: "50%", cursor: "pointer"
                        }}
                        onClick={() => props.onPenWidth(width)}
                    >
                        <div style={{
                            width: width,
                            height: width,
                            background: props.currentPen.color,
                            borderRadius: "50%",
                            margin: "auto"
                        }} />
                    </button>
                ))}
                <button
                    style={{
                        marginBottom: 10,
                        background: props.eraserMode ? "#19c37d" : "#666",
                        color: "#fff"
                    }}
                    onClick={props.onToggleEraser}
                >
                    消しゴム {props.eraserMode ? "ON" : "OFF"}
                </button>
                <div style={{ margin: "10px 0" }}>
                    <button onClick={props.onErase}>1つ消す</button>
                </div>
            </div>
        </div>
    );
}
