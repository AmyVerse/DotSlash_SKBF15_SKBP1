import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

const ScatterPlot = ({ data, xKey, yKey, xAxisLabel, yAxisLabel, onNodeClick, activeNodeId, colorLogic }) => {
  // Config parameters
  const padding = { top: 40, right: 40, bottom: 60, left: 80 };
  const width = 800; // Intrinsic viewBox width
  const height = 500; // Intrinsic viewBox height

  // Scale calculations based on dynamic data
  const { xScale, yScale, xTicks, yTicks } = useMemo(() => {
    if (!data || data.length === 0) return { xScale: () => 0, yScale: () => 0, xTicks: [], yTicks: [] };

    let maxX = Math.max(...data.map(d => d[xKey] || 0));
    let maxY = Math.max(...data.map(d => d[yKey] || 0));
    
    // Add 10% buffer
    maxX = maxX * 1.1 || 100;
    maxY = maxY * 1.1 || 100;

    const scaleX = (val) => padding.left + (val / maxX) * (width - padding.left - padding.right);
    const scaleY = (val) => height - padding.bottom - (val / maxY) * (height - padding.top - padding.bottom);

    const formatCurrency = (val) => `₹${(val / 1000000).toFixed(1)}M`;
    const formatNumber = (val) => `${(val / 1000).toFixed(1)}k`;

    // Generating roughly 5 ticks per axis
    const ticksX = Array.from({length: 6}).map((_, i) => ({
      value: (maxX / 5) * i,
      pos: scaleX((maxX / 5) * i),
      label: formatCurrency((maxX / 5) * i)
    }));

    const ticksY = Array.from({length: 6}).map((_, i) => ({
      value: (maxY / 5) * i,
      pos: scaleY((maxY / 5) * i),
      label: formatNumber((maxY / 5) * i)
    }));

    return { xScale: scaleX, yScale: scaleY, xTicks: ticksX, yTicks: ticksY, maxX, maxY };
  }, [data, xKey, yKey]);

  // Determine quadrant colors or apply custom color logic
  const getNodeStyle = (item) => {
    if (colorLogic) return colorLogic(item);
    
    // Default Color Logic if none provided
    return { fill: "#3B82F6", stroke: "#2563EB" }; // Generic blue
  };

  return (
    <div className="w-full h-full min-h-[400px] relative font-sans text-xs">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="xMidYMid meet">
        {/* Grid Lines */}
        {yTicks.map((tick, i) => (
          <line
            key={`grid-y-${i}`}
            x1={padding.left}
            x2={width - padding.right}
            y1={tick.pos}
            y2={tick.pos}
            stroke="#1F2937"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {xTicks.map((tick, i) => (
          <line
            key={`grid-x-${i}`}
            x1={tick.pos}
            x2={tick.pos}
            y1={padding.top}
            y2={height - padding.bottom}
            stroke="#1F2937"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        ))}

        {/* Axes */}
        <line x1={padding.left} y1={height - padding.bottom} x2={width - padding.right} y2={height - padding.bottom} stroke="#374151" strokeWidth="2" />
        <line x1={padding.left} y1={padding.top} x2={padding.left} y2={height - padding.bottom} stroke="#374151" strokeWidth="2" />

        {/* Ticks and Labels */}
        {xTicks.map((tick, i) => (
          <g key={`tick-x-${i}`} transform={`translate(${tick.pos}, ${height - padding.bottom + 15})`}>
            <line x1="0" y1="-15" x2="0" y2="-10" stroke="#374151" />
            <text textAnchor="middle" fill="#9CA3AF" className="font-mono">{tick.label}</text>
          </g>
        ))}

        {yTicks.map((tick, i) => (
          <g key={`tick-y-${i}`} transform={`translate(${padding.left - 10}, ${tick.pos})`}>
            <line x1="10" y1="0" x2="5" y2="0" stroke="#374151" />
            <text textAnchor="end" alignmentBaseline="middle" fill="#9CA3AF" className="font-mono">{tick.label}</text>
          </g>
        ))}

        {/* Axis Titles */}
        <text x={width / 2} y={height - 15} textAnchor="middle" fill="#D1D5DB" className="font-medium tracking-wide">
          {xAxisLabel}
        </text>
        <text transform={`rotate(-90) translate(${-height / 2}, 25)`} textAnchor="middle" fill="#D1D5DB" className="font-medium tracking-wide">
          {yAxisLabel}
        </text>

        {/* Data Nodes */}
        {data.map((d, i) => {
          const cx = xScale(d[xKey]);
          const cy = yScale(d[yKey]);
          const style = getNodeStyle(d);
          const isActive = activeNodeId === d.id;

          return (
            <motion.g
              key={d.id}
              initial={false}
              animate={{ x: cx, y: cy }}
              transition={{ type: "spring", stiffness: 60, damping: 15 }}
              onClick={() => onNodeClick && onNodeClick(d)}
              className="cursor-pointer group"
            >
              {/* Tooltip Hover Area (Invisible larger circle for easier hover) */}
              <circle r="20" fill="transparent" />
              
              {/* Dropdown line to X-Axis */}
              <line 
                x1="0" 
                y1="0" 
                x2="0" 
                y2={height - padding.bottom - cy} 
                stroke={style.fill} 
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.6"
                className="transition-all duration-300"
              />

              {/* Outer Glow for Active Node */}
              {isActive && <circle r="16" fill={style.fill} opacity="0.2" className="animate-pulse" />}
              
              {/* Main Node */}
              <circle
                r={isActive ? 10 : 8}
                fill={style.fill}
                stroke={style.stroke}
                strokeWidth={isActive ? 3 : 2}
                className="transition-all duration-300"
                style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.4))' }}
              />

              {/* Label */}
              <text
                x="14"
                y="4"
                fill={isActive ? "#F3F4F6" : "#9CA3AF"}
                className={`font-medium transition-opacity ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
              >
                {d.name || d.title}
              </text>
            </motion.g>
          );
        })}
      </svg>
    </div>
  );
};

export default ScatterPlot;
