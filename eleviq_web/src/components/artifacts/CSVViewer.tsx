'use client';

import { useMemo } from 'react';

interface CSVViewerProps {
    content: string;
    name: string;
}

export default function CSVViewer({ content, name }: CSVViewerProps) {
    // Parse CSV content
    const { headers, rows } = useMemo(() => {
        const lines = content.trim().split('\n');
        if (lines.length === 0) return { headers: [], rows: [] };

        // Parse header row
        const headerLine = lines[0];
        const headers = parseCSVLine(headerLine);

        // Parse data rows
        const rows = lines.slice(1).map(line => parseCSVLine(line));

        return { headers, rows };
    }, [content]);

    // Generate column letters (A, B, C, ...)
    const columnLetters = useMemo(() => {
        return headers.map((_, i) => {
            if (i < 26) return String.fromCharCode(65 + i);
            return String.fromCharCode(65 + Math.floor(i / 26) - 1) + String.fromCharCode(65 + (i % 26));
        });
    }, [headers]);

    if (headers.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-white/50">
                No data to display
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#1a1a1a]">
            {/* Spreadsheet-style table */}
            <div className="flex-1 overflow-auto">
                <table className="min-w-full border-collapse">
                    {/* Column letters row */}
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[#252525]">
                            {/* Row number header (empty corner) */}
                            <th className="w-12 min-w-12 px-2 py-2 text-center text-xs font-medium text-white/40 border-r border-b border-white/10 bg-[#252525] sticky left-0 z-20">

                            </th>
                            {/* Column letter headers */}
                            {columnLetters.map((letter, i) => (
                                <th
                                    key={i}
                                    className="min-w-[120px] px-3 py-2 text-center text-xs font-medium text-white/40 border-r border-b border-white/10 bg-[#252525]"
                                >
                                    {letter}
                                </th>
                            ))}
                        </tr>
                        {/* Actual header row with data */}
                        <tr className="bg-[#2a2a2a]">
                            <th className="w-12 min-w-12 px-2 py-2 text-center text-xs font-medium text-white/50 border-r border-b border-white/10 bg-[#2a2a2a] sticky left-0 z-20">
                                1
                            </th>
                            {headers.map((header, i) => (
                                <th
                                    key={i}
                                    className="min-w-[120px] px-3 py-2 text-left text-sm font-semibold text-white/90 border-r border-b border-white/10 bg-[#2a2a2a]"
                                >
                                    {header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, rowIndex) => (
                            <tr
                                key={rowIndex}
                                className="hover:bg-white/5 transition-colors"
                            >
                                {/* Row number */}
                                <td className="w-12 min-w-12 px-2 py-2 text-center text-xs font-medium text-white/50 border-r border-b border-white/10 bg-[#1e1e1e] sticky left-0">
                                    {rowIndex + 2}
                                </td>
                                {/* Data cells */}
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className="min-w-[120px] px-3 py-2 text-sm text-white/80 border-r border-b border-white/10"
                                    >
                                        {cell}
                                    </td>
                                ))}
                                {/* Fill empty cells if row has fewer columns */}
                                {Array(Math.max(0, headers.length - row.length)).fill(null).map((_, i) => (
                                    <td
                                        key={`empty-${i}`}
                                        className="min-w-[120px] px-3 py-2 text-sm text-white/80 border-r border-b border-white/10"
                                    />
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Helper function to parse CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];

        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (nextChar === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }

    result.push(current.trim());
    return result;
}
