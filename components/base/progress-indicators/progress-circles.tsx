"use client";

import type React from "react";

type HalfCircleSize = "xxs" | "xs" | "sm" | "md" | "lg";

interface ProgressBarHalfCircleProps {
  size?: HalfCircleSize;
  min?: number;
  max?: number;
  value?: number;
  /** Optional center label, e.g. "40%" */
  centerLabel?: string;
  /** Text label under the gauge, e.g. "Users" */
  label?: string;
}

interface SizeConfig {
  width: number;
  stroke: number;
}

const SIZE_MAP: Record<HalfCircleSize, SizeConfig> = {
  xxs: { width: 72, stroke: 8 },
  xs: { width: 88, stroke: 8 },
  sm: { width: 104, stroke: 9 },
  md: { width: 120, stroke: 10 },
  lg: { width: 144, stroke: 11 },
};

export const ProgressBarHalfCircle: React.FC<ProgressBarHalfCircleProps> = ({
  size = "xs",
  min = 0,
  max = 100,
  value = 0,
  centerLabel,
  label,
}) => {
  const config = SIZE_MAP[size] ?? SIZE_MAP.xs;

  const safeMin = Number.isFinite(min) ? min : 0;
  const safeMax = Number.isFinite(max) && max !== min ? max : safeMin + 1;
  const clamped = Math.min(Math.max(value, safeMin), safeMax);
  const percent = ((clamped - safeMin) / (safeMax - safeMin)) * 100;
  const clampedPercent = Math.max(0, Math.min(100, percent));

  const width = config.width;
  const strokeWidth = config.stroke;
  const radius = width / 2 - strokeWidth;
  const cx = width / 2;
  const cy = radius + strokeWidth / 2;
  const height = cy + strokeWidth / 2;

  const pathD = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${
    cx + radius
  } ${cy}`;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width, height }}>
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="block overflow-visible"
        >
          <path
            d={pathD}
            fill="none"
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
          />
          <path
            d={pathD}
            fill="none"
            stroke="#22c55e"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={100 - clampedPercent}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center pt-1 text-xs font-semibold text-foreground">
          {centerLabel ?? `${Math.round(clampedPercent)}%`}
        </div>
      </div>
      {label && (
        <div className="text-xs font-medium text-foreground text-center">
          {label}
        </div>
      )}
    </div>
  );
};
