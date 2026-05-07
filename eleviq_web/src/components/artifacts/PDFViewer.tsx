'use client';

interface PDFViewerProps {
    content: string; // base64 encoded PDF
    name: string;
}

export default function PDFViewer({ content, name }: PDFViewerProps) {
    // Create blob URL from base64 content
    const pdfUrl = `data:application/pdf;base64,${content}`;

    return (
        <div className="h-full flex flex-col bg-[#1a1a1a]">
            <iframe
                src={pdfUrl}
                className="flex-1 w-full border-0"
                title={name}
            />
        </div>
    );
}
