// pens/PenLayer.tsx
import { Line } from "react-konva";
import type { PenLine } from "../types";

type Props = {
  penLines: PenLine[];
  scaleX: number;
  scaleY: number;
};

export function PenLayer({ penLines, scaleX, scaleY }: Props) {
  return (
    <>
      {penLines.map((line, idx) => {
        const points = line.points.flatMap((val, i) =>
          i % 2 === 0
            ? [val * scaleX, line.points[i + 1] * scaleY]
            : []
        ).flat();
        return (
          <Line
            key={idx}
            points={points}
            stroke={line.color}
            strokeWidth={line.width}
            tension={0.5}
            lineCap="round"
            lineJoin="round"
          />
        );
      })}
    </>
  );
}
