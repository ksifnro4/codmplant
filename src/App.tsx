import React, { useRef, useState, useEffect, useCallback } from "react";
import { Sidebar } from "./Sidebar";
import { MapStage } from "./MapStage";
import { useLocalPatterns } from "./hooks/useLocalPatterns";
import type { MarkerType, MapState } from "./types";

// マップ画像リスト
const mapList = [
  { label: "Standoff", url: "/maps/standoff.jpg" },
  { label: "Raid", url: "/maps/raid.jpg" },
  { label: "Summit", url: "/maps/summit.jpg" },
];

const markerTypes: { type: MarkerType; label: string; icon: React.ReactNode }[] = [
  { type: "red", label: "赤点", icon: <svg width={40} height={40}><circle cx={20} cy={20} r={13} fill="#E53E3E" stroke="#fff" strokeWidth={2} /></svg> },
  { type: "blue", label: "青点", icon: <svg width={40} height={40}><circle cx={20} cy={20} r={13} fill="#3182CE" stroke="#fff" strokeWidth={2} /></svg> },
  { type: "gre", label: "グレ", icon: <svg width={40} height={40}><polygon points="20,7 24,17 34,17 26,24 28,33 20,28 12,33 14,24 6,17 16,17" fill="#444" stroke="#FFEE58" strokeWidth={3} /></svg> },
  { type: "smoke", label: "モク", icon: <svg width={40} height={40}><circle cx={20} cy={20} r={13} fill="#bbb" stroke="#555" strokeWidth={2} opacity={0.7} /></svg> },
  { type: "trophy", label: "トロフィー", icon: <svg width={40} height={40}><rect x={8} y={12} width={24} height={24} fill="#FFDA79" stroke="#a58e47" strokeWidth={2} rx={4} /><circle cx={20} cy={24} r={6} fill="#fff" stroke="#a58e47" strokeWidth={1} /></svg> },
  { type: "flash", label: "フラッシュ", icon: <svg width={40} height={40}><polygon points="12,12 20,30 28,12 22,17 16,30" fill="#FFE066" stroke="#e3ba2f" strokeWidth={2} /></svg> },
  { type: "fov", label: "視線", icon: <svg width={40} height={40}><polygon points="20,5 35,33 5,33" fill="#08f" stroke="#fff" strokeWidth={2} /></svg> },
];

const PEN_COLORS = ["#ff4b4b", "#19c37d", "#316fff"];
const PEN_WIDTHS = [2, 6, 12];
const MAP_WIDTH = 800;
const MAP_HEIGHT = 600;

const getDefaultState = (mapUrl: string): MapState => ({
  mapUrl,
  markers: [],
  penLines: [],
  name: "",
});

function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function eraseLines(
  lines: any[],
  eraserPoints: number[],
  eraserWidth: number
): any[] {
  return lines
    .map((line: any) => {
      const newPoints: number[] = [];
      for (let i = 0; i < line.points.length; i += 2) {
        const lx = line.points[i],
          ly = line.points[i + 1];
        let erased = false;
        for (let j = 0; j < eraserPoints.length; j += 2) {
          const ex = eraserPoints[j],
            ey = eraserPoints[j + 1];
          if (dist(lx, ly, ex, ey) < eraserWidth) {
            erased = true;
            break;
          }
        }
        if (!erased) {
          newPoints.push(lx, ly);
        }
      }
      return { ...line, points: newPoints };
    })
    .filter((line: any) => line.points.length >= 4); // 2点未満は削除
}

export default function App() {
  // 5パターン保存
  const [patternIdx, setPatternIdx] = useState(0);
  const [imgSize, setImgSize] = useState({ width: MAP_WIDTH, height: MAP_HEIGHT });
  const stageRef = useRef<any>(null);

  const [patterns, setPatterns] = useLocalPatterns(
    Array(5).fill(0).map(() => getDefaultState(mapList[0].url))
  );

  // 現在の編集内容
  const state = patterns[patternIdx];
  type MapStatePatch = Partial<MapState> | ((prev: MapState) => MapState);

  const setState = (patch: MapStatePatch) =>
    setPatterns(ps =>
      ps.map((st, idx) =>
        idx === patternIdx
          ? typeof patch === "function"
            ? (patch as (prev: MapState) => MapState)(st)
            : { ...st, ...patch }
          : st
      )
    );

  // ウィンドウリサイズ対応
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const areaW = rect.width;
      const areaH = rect.height;
      const aspect = MAP_WIDTH / MAP_HEIGHT;
      let width = areaW, height = areaH;
      if (areaW / areaH > aspect) {
        height = areaH;
        width = height * aspect;
      } else {
        width = areaW;
        height = width / aspect;
      }
      setImgSize({ width, height });
    };
    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

  // --- D&D マーカー ---
  const [draggingSidebar, setDraggingSidebar] = useState<string | null>(null);
  const [ghostMarker, setGhostMarker] = useState<{ type: string, x: number, y: number } | null>(null);
  const handleSidebarDragStart = (type: MarkerType, e?: React.MouseEvent | React.TouchEvent) => {
    console.log("App: handleSidebarDragStart", type);
    setDraggingSidebar(type);
    let x = 0, y = 0;
    if (e) {
      if ("touches" in e && e.touches.length > 0) {
        x = e.touches[0].clientX;
        y = e.touches[0].clientY;
      } else if ("clientX" in e) {
        x = (e as React.MouseEvent).clientX;
        y = (e as React.MouseEvent).clientY;
      }
    } else {
      x = window.innerWidth / 2;
      y = window.innerHeight / 2;
    }
    setGhostMarker({ type, x, y });
    window.addEventListener("mousemove", handleGhostMove);
    window.addEventListener("mouseup", handleGhostUp);
    window.addEventListener("touchmove", handleGhostMoveTouch, { passive: false });
    window.addEventListener("touchend", handleGhostUpTouch, { passive: false });
    window.addEventListener("touchstart", e => e.preventDefault(), { passive: false });
  };

  // ゴースト追従
  const handleGhostMove = useCallback((e: MouseEvent) => {
    console.log("move!", e.clientX, e.clientY);
    setGhostMarker(draggingSidebar
      ? { type: draggingSidebar, x: e.clientX, y: e.clientY }
      : null
    );
  }, [draggingSidebar]);
  const handleGhostMoveTouch = (e: TouchEvent) => {
    if (e.touches.length > 0 && draggingSidebar) {
      setGhostMarker({ type: draggingSidebar, x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  // D&Dドロップ
  let markerId = useRef(0);
  const handleGhostUp = useCallback((e: MouseEvent) => {
    // 消しゴム操作時
    if (eraserMode && erasing) {
      setErasing(false);
      setState({
        penLines: eraseLines(state.penLines, eraserPath, ERASER_WIDTH)
      });
      setEraserPath([]);
      return;
    }

    // マーカーD&D操作時
    if (draggingSidebar) {
      const stage = stageRef.current;
      if (stage) {
        const rect = stage.container().getBoundingClientRect();
        const scaleX = imgSize.width / MAP_WIDTH;
        const scaleY = imgSize.height / MAP_HEIGHT;
        const x = (e.clientX - rect.left) / scaleX;
        const y = (e.clientY - rect.top) / scaleY;
        if (x >= 0 && x <= MAP_WIDTH && y >= 0 && y <= MAP_HEIGHT) {
          let newMarker: any = {
            id: `marker-${markerId.current++}`,
            type: draggingSidebar,
            x, y
          };
          if (draggingSidebar === "fov") {
            newMarker.size = 40;
            newMarker.rotation = 0;
          }
          setState(prev => ({
            ...prev,
            markers: [...prev.markers, newMarker]
          }));
        }
      }
      cleanupSidebarDrag();
      return;
    }

    // それ以外（ペン描画など）
    setDrawing(false);
  }, [

    state.penLines,
    draggingSidebar,
    imgSize,
    setState,
    stageRef,
  ]);

  useEffect(() => {
    if (!draggingSidebar) return;
    window.addEventListener("mousemove", handleGhostMove);
    window.addEventListener("mouseup", handleGhostUp);
    window.addEventListener("touchmove", handleGhostMoveTouch, { passive: false });
    window.addEventListener("touchend", handleGhostUpTouch, { passive: false });

    return () => {
      window.removeEventListener("mousemove", handleGhostMove);
      window.removeEventListener("mouseup", handleGhostUp);
      window.removeEventListener("touchmove", handleGhostMoveTouch);
      window.removeEventListener("touchend", handleGhostUpTouch);

    };
  }, [draggingSidebar, handleGhostMove, handleGhostUp]);

  const handleGhostUpTouch = useCallback((e: TouchEvent) => {
    if (!draggingSidebar) return cleanupSidebarDrag();
    if (e.changedTouches.length === 0) return cleanupSidebarDrag();

    const stage = stageRef.current;
    if (stage) {
      const rect = stage.container().getBoundingClientRect();
      const scaleX = imgSize.width / MAP_WIDTH;
      const scaleY = imgSize.height / MAP_HEIGHT;
      const touch = e.changedTouches[0];
      const x = (touch.clientX - rect.left) / scaleX;
      const y = (touch.clientY - rect.top) / scaleY;
      if (x >= 0 && x <= MAP_WIDTH && y >= 0 && y <= MAP_HEIGHT) {
        let newMarker: any = {
          id: `marker-${markerId.current++}`,
          type: draggingSidebar,
          x, y
        };
        if (draggingSidebar === "fov") {
          newMarker.size = 40;
          newMarker.rotation = 0;
        }
        setState(prev => ({
          ...prev,
          markers: [...prev.markers, newMarker]
        }));
      }
    }
    cleanupSidebarDrag();
  }, [draggingSidebar, imgSize, setState, stageRef]);


  const cleanupSidebarDrag = () => {
    setDraggingSidebar(null);
    setGhostMarker(null);
    window.removeEventListener("mousemove", handleGhostMove);
    window.removeEventListener("mouseup", handleGhostUp);
    window.removeEventListener("touchmove", handleGhostMoveTouch);
    window.removeEventListener("touchend", handleGhostUpTouch);
  };

  // --- マーカー操作 ---
  const handleMarkerDragEnd = (e: any, id: string) => {
    const { x, y } = e.target.position();
    const scaleX = imgSize.width / MAP_WIDTH;
    const scaleY = imgSize.height / MAP_HEIGHT;
    setState({
      markers: state.markers.map(m =>
        m.id === id ? { ...m, x: x / scaleX, y: y / scaleY } : m
      )
    });
  };
  const handleMarkerContextMenu = (e: any, id: string) => {
    e.evt.preventDefault();
    setState({ markers: state.markers.filter(m => m.id !== id) });
  };

  // --- FOV（三角形）操作 ---
  const handleFovResize = (id: string, newSize: number) => {
    setState(prev => ({
      ...prev,
      markers: prev.markers.map(m =>
        m.id === id && m.type === "fov"
          ? { ...m, size: newSize }
          : m
      )
    }));
  };

  const handleFovRotate = (id: string, newRotation: number) => {
    setState(prev => ({
      ...prev,
      markers: prev.markers.map(m =>
        m.id === id && m.type === "fov"
          ? { ...m, rotation: newRotation }
          : m
      )
    }));
  };

  const handleFovSpread = (id: string, newSpread: number) => {
    setState(prev => ({
      ...prev,
      markers: prev.markers.map(m =>
        m.id === id && m.type === "fov"
          ? { ...m, spread: newSpread }
          : m
      )
    }));
  };

  // --- ズームイン・アウト ---
  const [stageScale, setStageScale] = useState(1);
  const [stagePos, setStagePos] = useState({ x: 0, y: 0 });

  const handleStageWheel = (e: any) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    let newScale = stageScale;
    if (e.evt.deltaY < 0) {
      newScale = stageScale * scaleBy;
    } else {
      newScale = stageScale / scaleBy;
    }
    // ズームの中心をマウスポインタ位置に合わせる
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    if (!pointer) return;
    const mousePointTo = {
      x: (pointer.x - stagePos.x) / stageScale,
      y: (pointer.y - stagePos.y) / stageScale
    };
    setStageScale(newScale);
    setStagePos({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale
    });
  };
  // App.tsx
  useEffect(() => {
    let lastDist = 0;
    function getDistance(touches: TouchList) {
      const [a, b] = [touches[0], touches[1]];
      return Math.sqrt(
        Math.pow(a.clientX - b.clientX, 2) + Math.pow(a.clientY - b.clientY, 2)
      );
    }
    function handleTouchMove(e: TouchEvent) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDistance(e.touches);
        if (lastDist) {
          const scaleBy = dist / lastDist;
          setStageScale(s => Math.max(0.5, Math.min(4, s * scaleBy)));
        }
        lastDist = dist;
      }
    }
    function handleTouchEnd(e: TouchEvent) {
      if (e.touches.length < 2) lastDist = 0;
    }
    window.addEventListener("touchmove", handleTouchMove, { passive: false });
    window.addEventListener("touchend", handleTouchEnd);
    return () => {
      window.removeEventListener("touchmove", handleTouchMove);
      window.removeEventListener("touchend", handleTouchEnd);
    };
  }, []);


  // ドラッグ移動対応（タッチやドラッグで画像位置変更）
  const handleStageDragMove = (e: any) => {
    setStagePos(e.target.position());
  };


  // --- ペン ---
  const [penEnabled, setPenEnabled] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [currentPen, setCurrentPen] = useState({ color: PEN_COLORS[0], width: PEN_WIDTHS[1] });

  // --- 消しゴム ---
  const [eraserMode, setEraserMode] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [eraserPath, setEraserPath] = useState<number[]>([]);
  const ERASER_WIDTH = 20;

  // 線を描画
  const handleStageMouseDown = (e: any) => {
    const scaleX = imgSize.width / MAP_WIDTH;
    const scaleY = imgSize.height / MAP_HEIGHT;
    if (eraserMode) {
      setErasing(true);
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      setEraserPath([pos.x / scaleX, pos.y / scaleY]);
      return;
    }
    if (!penEnabled) return;
    if (draggingSidebar) return; // D&D時は無効
    if (e.evt.button === 2) return; // 右クリック
    setDrawing(true);
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setState({ penLines: [...state.penLines, { color: currentPen.color, width: currentPen.width, points: [pos.x / scaleX, pos.y / scaleY] }] });
  };
  const handleStageMouseMove = (e: any) => {
    const scaleX = imgSize.width / MAP_WIDTH;
    const scaleY = imgSize.height / MAP_HEIGHT;
    if (eraserMode && erasing) {
      const pos = e.target.getStage().getPointerPosition();
      if (!pos) return;
      setEraserPath(path => {
        const newPath = [...path, pos.x / scaleX, pos.y / scaleY];
        setState({
          penLines: eraseLines(state.penLines, newPath, ERASER_WIDTH)
        });
        return newPath;
      });
      return;
    }
    if (!drawing) return;
    const pos = e.target.getStage().getPointerPosition();
    if (!pos) return;
    setState({
      penLines: state.penLines.map((line, idx) =>
        idx === state.penLines.length - 1
          ? { ...line, points: [...line.points, pos.x / scaleX, pos.y / scaleY] }
          : line
      )
    });
  };
  const handleStageMouseUp = () => {
    if (eraserMode && erasing) {
      setErasing(false);
      setState({
        penLines: eraseLines(state.penLines, eraserPath, ERASER_WIDTH)
      });
      setEraserPath([]);
      return;
    }
    setDrawing(false);
  };

  // ペン消しゴム
  const handleEraseLastLine = () => {
    setState({ penLines: state.penLines.slice(0, -1) });
  };

  // --- 保存名 ---
  const handleSaveName = () => {
    const name = prompt("保存名を入力してください", state.name || "");
    if (name !== null && name.trim() !== "") {
      setState({ name });
    }
  };

  // --- UI ---
  return (
    <div style={{ display: "flex", minHeight: "100vh", width: "100vw" }}>
      <Sidebar
        patternIdx={patternIdx}
        patternNames={patterns.map((p, i) => p.name || `セット${i + 1}`)}
        onPatternChange={setPatternIdx}
        onSaveName={handleSaveName}
        mapList={mapList}
        mapUrl={state.mapUrl}
        onMapUrlChange={url => setState({ mapUrl: url })}
        markerTypes={markerTypes}
        onMarkerDragStart={handleSidebarDragStart}
        currentPen={currentPen}
        penColors={PEN_COLORS}
        penWidths={PEN_WIDTHS}
        onPenColor={color => setCurrentPen(pen => ({ ...pen, color }))}
        onPenWidth={width => setCurrentPen(pen => ({ ...pen, width }))}
        onErase={handleEraseLastLine}
        penEnabled={penEnabled}
        onTogglePen={() => setPenEnabled(e => !e)}
        eraserMode={eraserMode}
        onToggleEraser={() => setEraserMode(e => !e)}
      />
      <div
        ref={containerRef}
        style={{
          width: "80vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#222",
        }}
      >
        <MapStage
          mapState={state}
          imgSize={imgSize}
          stageRef={stageRef}
          stageScale={stageScale}
          stagePos={stagePos}
          onStageWheel={handleStageWheel}
          onStageDragMove={handleStageDragMove}
          onFovSpread={handleFovSpread}
          onMarkerDragEnd={handleMarkerDragEnd}
          onMarkerContextMenu={handleMarkerContextMenu}
          onFovResize={handleFovResize}
          onFovRotate={handleFovRotate}
          penDrawing={drawing}
          onStageMouseDown={handleStageMouseDown}
          onStageMouseMove={handleStageMouseMove}
          onStageMouseUp={handleStageMouseUp}
          ghostMarker={ghostMarker}
          draggingSidebar={draggingSidebar}
          eraserMode={eraserMode}
          erasing={erasing}
          eraserPath={eraserPath}
          eraserWidth={ERASER_WIDTH}
        />
      </div>
    </div>
  );
}