'use client';

export interface ExtractedCodeBlock {
    language: string;
    code: string;
    name: string;
    startIndex: number;
    endIndex: number;
    fullMatch: string;
}

/**
 * Extracts code blocks from markdown text
 * Returns the code blocks and the text with code blocks replaced by placeholders
 * Only extracts substantial code blocks (complete documents/files), not inline snippets
 */
export function extractCodeBlocks(content: string): {
    codeBlocks: ExtractedCodeBlock[];
    processedContent: string;
} {
    const codeBlockRegex = /```(\w*)\n([\s\S]*?)```/g;
    const codeBlocks: ExtractedCodeBlock[] = [];
    let match;
    let blockCounter = 0;

    // Find all code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
        const language = match[1].toLowerCase() || 'plaintext';
        const code = match[2].trim();

        // Only convert SUBSTANTIAL code blocks (not inline snippets)
        // Requirements: 10+ lines OR 500+ chars AND looks like a complete file
        const lines = code.split('\n').length;
        const isSubstantial = (lines >= 10 || code.length > 500);

        // For HTML, must have complete document structure or be a styled block
        const isCompleteHTML = language === 'html' && (
            code.includes('<!DOCTYPE') ||
            code.includes('<html') ||
            (code.includes('<style') && code.includes('</style>')) ||
            (code.includes('<body') && code.includes('</body>'))
        );

        // For Markdown, must have headings or tables (structured report)
        const isCompleteMarkdown = (language === 'markdown' || language === 'md') && isSubstantial && (
            code.includes('# ') ||
            code.includes('## ') ||
            code.includes('| ')
        );

        // For other languages, must have significant code structure
        const isCompleteCode = language !== 'html' && language !== 'markdown' && language !== 'md' && isSubstantial && (
            code.includes('function') ||
            code.includes('class') ||
            code.includes('const ') ||
            code.includes('export') ||
            code.includes('import')
        );

        // Only create artifact if it's a complete substantial block
        if (isCompleteHTML || isCompleteMarkdown || isCompleteCode) {
            const name = generateCodeName(language, code, blockCounter);

            codeBlocks.push({
                language,
                code,
                name,
                startIndex: match.index,
                endIndex: match.index + match[0].length,
                fullMatch: match[0],
            });

            blockCounter++;
        }
    }

    // Replace code blocks with placeholder markers
    let processedContent = content;
    // Process in reverse order to maintain correct indices
    for (let i = codeBlocks.length - 1; i >= 0; i--) {
        const block = codeBlocks[i];
        processedContent =
            processedContent.slice(0, block.startIndex) +
            `[ARTIFACT_${i}]` +
            processedContent.slice(block.endIndex);
    }

    return { codeBlocks, processedContent };
}

/**
 * Generate a descriptive name for the code artifact
 */
function generateCodeName(language: string, code: string, index: number): string {
    // Try to extract a meaningful name from the code
    const langLabels: Record<string, string> = {
        html: 'HTML Document',
        jsx: 'React Component',
        react: 'React Component',
        tsx: 'TypeScript React',
        javascript: 'JavaScript',
        js: 'JavaScript',
        typescript: 'TypeScript',
        ts: 'TypeScript',
        css: 'Stylesheet',
        python: 'Python Script',
        sql: 'SQL Query',
        json: 'JSON Data',
        markdown: 'Financial Report',
        md: 'Financial Report',
    };

    const baseLabel = langLabels[language] || `${language.toUpperCase()} Code`;

    // Try to find a title or component name
    const htmlTitleMatch = code.match(/<title>([^<]+)<\/title>/i);
    if (htmlTitleMatch) {
        return htmlTitleMatch[1];
    }

    // React component name
    const componentMatch = code.match(/(?:function|const|class)\s+(\w+)/);
    if (componentMatch && language !== 'css') {
        return componentMatch[1];
    }

    // For tables, check if it's an expenses/data table
    if (code.toLowerCase().includes('expense') || code.toLowerCase().includes('table')) {
        return `Data Table`;
    }

    return `${baseLabel}`;
}

/**
 * Determine the artifact type from language
 */
export function getArtifactType(language: string): 'html' | 'code' | 'markdown' {
    const htmlTypes = ['html', 'htm'];
    const markdownTypes = ['markdown', 'md'];
    if (htmlTypes.includes(language)) return 'html';
    if (markdownTypes.includes(language)) return 'markdown';
    return 'code';
}
