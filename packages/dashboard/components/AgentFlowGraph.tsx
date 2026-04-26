"use client";

import React from "react";
import { TraceSpan } from "@/lib/api";

interface AgentFlowGraphProps {
  spans: TraceSpan[];
}

export default function AgentFlowGraph({ spans }: AgentFlowGraphProps) {
  if (!spans || spans.length === 0) return null;

  // Sort by start_time to preserve chronological flow
  const sortedSpans = [...spans].sort((a, b) => 
    new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const rectWidth = 180;
  const rectHeight = 44;
  const spacingY = 60;
  const svgWidth = 220;
  const svgHeight = sortedSpans.length * spacingY + 40;

  const riskColors = {
    low: "#14b8a6", // teal-500
    moderate: "#f59e0b", // amber-500
    high: "#f97316", // orange-500
    critical: "#ef4444", // red-500
    default: "#3b82f6", // blue-500
  };

  return (
    <div className="flex justify-center p-4 bg-white/[0.02] rounded-3xl border border-white/5 overflow-x-auto custom-scrollbar">
      <svg 
        width={svgWidth} 
        height={svgHeight} 
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="font-sans"
      >
        {/* Define Arrowhead */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#334155" />
          </marker>
        </defs>

        {sortedSpans.map((span, index) => {
          const x = (svgWidth - rectWidth) / 2;
          const y = 20 + index * spacingY;
          const riskKey = (span.risk_tier?.toLowerCase() as keyof typeof riskColors) || "default";
          const color = riskColors[riskKey] || riskColors.default;

          return (
            <React.Fragment key={span.id}>
              {/* Arrow Connection (to previous span) */}
              {index > 0 && (
                <line 
                  x1={svgWidth / 2} 
                  y1={y - spacingY + rectHeight} 
                  x2={svgWidth / 2} 
                  y2={y - 1} 
                  stroke="#334155" 
                  strokeWidth="2" 
                  markerEnd="url(#arrowhead)"
                />
              )}

              {/* Span Node Rect */}
              <g className="cursor-default group">
                <rect
                  x={x}
                  y={y}
                  width={rectWidth}
                  height={rectHeight}
                  rx="12"
                  fill="#111827"
                  stroke={span.safety_gate_triggered ? "#ef4444" : "#1e293b"}
                  strokeWidth={span.safety_gate_triggered ? "2" : "1"}
                  className="transition-all group-hover:fill-[#1e293b]"
                />
                
                {/* Node Label */}
                <text
                  x={x + 12}
                  y={y + 18}
                  fill="white"
                  className="text-[10px] font-bold uppercase tracking-tight"
                >
                  {span.span_name.length > 20 ? span.span_name.slice(0, 18) + "..." : span.span_name}
                </text>

                {/* Latency / Marker */}
                <text
                   x={x + 12}
                   y={y + 32}
                   fill="#64748b"
                   className="text-[8px] font-mono tracking-widest font-bold"
                >
                  {span.latency_ms?.toFixed(0)}MS • {span.risk_tier?.toUpperCase()}
                </text>

                {/* Risk Indicator Strip */}
                <rect 
                  x={x} 
                  y={y + 12} 
                  width={3} 
                  height={20} 
                  fill={color} 
                  rx={1}
                />

                {/* Safety Shield */}
                {span.safety_gate_triggered && (
                  <path 
                    d={`M${x + rectWidth - 20} ${y + 12} l4 8 l4 -8`} 
                    fill="#ef4444" 
                    className="animate-pulse"
                  />
                )}
              </g>
            </React.Fragment>
          );
        })}
      </svg>
    </div>
  );
}
