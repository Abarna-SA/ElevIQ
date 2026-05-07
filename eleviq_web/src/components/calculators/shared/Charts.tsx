'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// Pie Chart Component with Hover Tooltips
interface PieChartProps {
    data: { label: string; value: number; color: string }[];
    size?: number;
    showLegend?: boolean;
}

export function PieChart({ data, size = 180, showLegend = true }: PieChartProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -90; // Start from top

    const slices = data.map((d) => {
        const percentage = (d.value / total) * 100;
        const angle = (d.value / total) * 360;
        const startAngle = currentAngle;
        currentAngle += angle;

        // Calculate path
        const startRad = (startAngle * Math.PI) / 180;
        const endRad = ((startAngle + angle) * Math.PI) / 180;
        const radius = size / 2 - 10;
        const cx = size / 2;
        const cy = size / 2;

        const x1 = cx + radius * Math.cos(startRad);
        const y1 = cy + radius * Math.sin(startRad);
        const x2 = cx + radius * Math.cos(endRad);
        const y2 = cy + radius * Math.sin(endRad);

        const largeArc = angle > 180 ? 1 : 0;

        const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

        // Tooltip position (midpoint of arc)
        const midAngle = startAngle + angle / 2;
        const midRad = (midAngle * Math.PI) / 180;
        const tooltipRadius = radius * 0.65;
        const tooltipX = cx + tooltipRadius * Math.cos(midRad);
        const tooltipY = cy + tooltipRadius * Math.sin(midRad);

        return { ...d, percentage, path, tooltipX, tooltipY };
    });

    return (
        <div className="flex flex-col items-center gap-4">
            <div className="relative">
                <svg width={size} height={size} className="drop-shadow-lg">
                    {slices.map((slice, i) => (
                        <motion.path
                            key={slice.label}
                            d={slice.path}
                            fill={slice.color}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: hoveredIndex !== null && hoveredIndex !== i ? 0.6 : 1 }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                            className="cursor-pointer transition-opacity"
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                            style={{ transformOrigin: `${size / 2}px ${size / 2}px` }}
                        />
                    ))}
                    {/* Center circle for donut effect */}
                    <circle cx={size / 2} cy={size / 2} r={size / 4} fill="white" className="dark:fill-[#171717]" />

                    {/* Center text when hovering */}
                    {hoveredIndex !== null && (
                        <>
                            <text
                                x={size / 2}
                                y={size / 2 - 6}
                                textAnchor="middle"
                                className="text-[11px] fill-gray-500 dark:fill-gray-400 font-medium"
                            >
                                {slices[hoveredIndex].label}
                            </text>
                            <text
                                x={size / 2}
                                y={size / 2 + 10}
                                textAnchor="middle"
                                className="text-[13px] fill-gray-900 dark:fill-white font-bold"
                            >
                                {slices[hoveredIndex].percentage.toFixed(1)}%
                            </text>
                        </>
                    )}
                </svg>
            </div>

            {showLegend && (
                <div className="flex flex-wrap justify-center gap-4">
                    {slices.map((slice, i) => (
                        <div
                            key={slice.label}
                            className={`flex items-center gap-2 cursor-pointer transition-opacity ${hoveredIndex !== null && hoveredIndex !== i ? 'opacity-50' : ''}`}
                            onMouseEnter={() => setHoveredIndex(i)}
                            onMouseLeave={() => setHoveredIndex(null)}
                        >
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: slice.color }} />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                                {slice.label} ({slice.percentage.toFixed(0)}%)
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Progress Gauge Component
interface GaugeProps {
    value: number;
    max: number;
    label: string;
    sublabel?: string;
    color?: string;
}

export function ProgressGauge({ value, max, label, sublabel, color = '#3b82f6' }: GaugeProps) {
    const percentage = Math.min((value / max) * 100, 100);
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percentage / 100) * circumference * 0.75; // 270deg arc

    return (
        <div className="flex flex-col items-center">
            <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-[135deg]" viewBox="0 0 100 100">
                    {/* Background arc */}
                    <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference * 0.75}
                        className="text-gray-200 dark:text-white/10"
                    />
                    {/* Progress arc */}
                    <motion.circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="none"
                        stroke={color}
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={circumference * 0.75}
                        initial={{ strokeDashoffset: circumference * 0.75 }}
                        animate={{ strokeDashoffset }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        {percentage.toFixed(0)}%
                    </span>
                    {sublabel && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">{sublabel}</span>
                    )}
                </div>
            </div>
            <span className="mt-2 text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </div>
    );
}

// Bar Chart Component
interface BarChartProps {
    data: { label: string; value: number; color?: string }[];
    maxValue?: number;
    formatValue?: (v: number) => string;
}

export function BarChart({ data, maxValue, formatValue }: BarChartProps) {
    const max = maxValue || Math.max(...data.map((d) => d.value));

    return (
        <div className="space-y-3">
            {data.map((item, i) => (
                <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {formatValue ? formatValue(item.value) : item.value.toLocaleString()}
                        </span>
                    </div>
                    <div className="h-3 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: item.color || '#3b82f6' }}
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.value / max) * 100}%` }}
                            transition={{ delay: i * 0.1, duration: 0.5 }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
}

// Growth Line Chart Component with Hover Tooltips & Bezier Curves
interface LineChartProps {
    data: { year: number; value: number; invested?: number }[];
    height?: number;
    formatValue?: (v: number) => string;
}

export function GrowthChart({ data, height = 200, formatValue }: LineChartProps) {
    const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
    const maxValue = Math.max(...data.map((d) => d.value));
    const minValue = 0;
    const range = maxValue - minValue;

    const getY = (value: number) => height - 40 - ((value - minValue) / range) * (height - 60);
    const getX = (index: number) => 50 + (index / (data.length - 1)) * (300 - 70);

    // Create smooth bezier curve path
    const createSmoothPath = (points: { x: number; y: number }[]) => {
        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const curr = points[i];
            const next = points[i + 1];
            const prev = i > 0 ? points[i - 1] : curr;
            const afterNext = i < points.length - 2 ? points[i + 2] : next;

            const tension = 0.3;
            const cp1x = curr.x + (next.x - prev.x) * tension;
            const cp1y = curr.y + (next.y - prev.y) * tension;
            const cp2x = next.x - (afterNext.x - curr.x) * tension;
            const cp2y = next.y - (afterNext.y - curr.y) * tension;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
        }

        return path;
    };

    const mainPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.value) }));
    const linePath = createSmoothPath(mainPoints);

    // Create area fill path using the smooth curve
    const areaPath = `${linePath} L ${getX(data.length - 1)} ${height - 40} L ${getX(0)} ${height - 40} Z`;

    // Invested path if available
    const investedPoints = data[0]?.invested !== undefined
        ? data.map((d, i) => ({ x: getX(i), y: getY(d.invested || 0) }))
        : null;
    const investedPath = investedPoints ? createSmoothPath(investedPoints) : null;

    return (
        <div className="relative">
            <svg width="100%" height={height} viewBox={`0 0 300 ${height}`} preserveAspectRatio="xMidYMid meet">
                {/* Grid lines */}
                {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
                    <g key={pct}>
                        <line
                            x1="50"
                            y1={height - 40 - pct * (height - 60)}
                            x2="290"
                            y2={height - 40 - pct * (height - 60)}
                            stroke="currentColor"
                            strokeOpacity="0.1"
                            strokeDasharray="4"
                        />
                        <text
                            x="45"
                            y={height - 40 - pct * (height - 60)}
                            textAnchor="end"
                            className="text-[10px] fill-gray-400"
                        >
                            {formatValue ? formatValue(minValue + pct * range) : Math.round(minValue + pct * range).toLocaleString()}
                        </text>
                    </g>
                ))}

                {/* Area fill */}
                <motion.path
                    d={areaPath}
                    fill="url(#gradient)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 0.3 }}
                    transition={{ duration: 1 }}
                />

                {/* Invested area if available */}
                {investedPath && (
                    <motion.path
                        d={`${investedPath} L ${getX(data.length - 1)} ${height - 40} L ${getX(0)} ${height - 40} Z`}
                        fill="#a855f7"
                        fillOpacity="0.2"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1 }}
                    />
                )}

                {/* Main line (smooth bezier) */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: 1 }}
                    transition={{ duration: 1.5, ease: 'easeOut' }}
                />

                {/* Invested line if available */}
                {investedPath && (
                    <motion.path
                        d={investedPath}
                        fill="none"
                        stroke="#a855f7"
                        strokeWidth="2"
                        strokeDasharray="4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.5, ease: 'easeOut' }}
                    />
                )}

                {/* Data points */}
                {data.map((d, i) => (
                    <g key={i}>
                        {/* Invisible larger hitbox for hover */}
                        <circle
                            cx={getX(i)}
                            cy={getY(d.value)}
                            r="12"
                            fill="transparent"
                            className="cursor-pointer"
                            onMouseEnter={() => setHoveredPoint(i)}
                            onMouseLeave={() => setHoveredPoint(null)}
                        />
                        <motion.circle
                            cx={getX(i)}
                            cy={getY(d.value)}
                            r={hoveredPoint === i ? 6 : 4}
                            fill={hoveredPoint === i ? '#2563eb' : '#3b82f6'}
                            stroke={hoveredPoint === i ? 'white' : 'none'}
                            strokeWidth={hoveredPoint === i ? 2 : 0}
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.5 + i * 0.1 }}
                            className="pointer-events-none"
                        />
                    </g>
                ))}

                {/* Hover tooltip */}
                {hoveredPoint !== null && (
                    <g>
                        {/* Vertical guideline */}
                        <line
                            x1={getX(hoveredPoint)}
                            y1={20}
                            x2={getX(hoveredPoint)}
                            y2={height - 40}
                            stroke="#3b82f6"
                            strokeOpacity="0.3"
                            strokeDasharray="3"
                        />
                        {/* Tooltip background */}
                        <rect
                            x={getX(hoveredPoint) - 45}
                            y={getY(data[hoveredPoint].value) - 38}
                            width="90"
                            height="28"
                            rx="6"
                            fill="#1f2937"
                            className="dark:fill-white"
                            fillOpacity="0.95"
                        />
                        {/* Tooltip text */}
                        <text
                            x={getX(hoveredPoint)}
                            y={getY(data[hoveredPoint].value) - 20}
                            textAnchor="middle"
                            className="text-[10px] fill-white dark:fill-gray-900 font-semibold"
                        >
                            Yr {data[hoveredPoint].year}: {formatValue ? formatValue(data[hoveredPoint].value) : data[hoveredPoint].value.toLocaleString()}
                        </text>
                    </g>
                )}

                {/* X-axis labels */}
                {data.filter((_, i) => i % Math.ceil(data.length / 5) === 0 || i === data.length - 1).map((d) => {
                    const originalIndex = data.findIndex(item => item === d);
                    return (
                        <text
                            key={d.year}
                            x={getX(originalIndex)}
                            y={height - 15}
                            textAnchor="middle"
                            className="text-[10px] fill-gray-400"
                        >
                            Yr {d.year}
                        </text>
                    );
                })}

                {/* Gradient definition */}
                <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                    </linearGradient>
                </defs>
            </svg>

            {/* Legend */}
            <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-0.5 bg-blue-500 rounded" />
                    <span className="text-xs text-gray-500">Total Value</span>
                </div>
                {data[0]?.invested !== undefined && (
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 bg-purple-500 rounded border-dashed" />
                        <span className="text-xs text-gray-500">Invested</span>
                    </div>
                )}
            </div>
        </div>
    );
}
