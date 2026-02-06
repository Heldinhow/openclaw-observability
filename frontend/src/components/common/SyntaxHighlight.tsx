import { useMemo } from 'react';
// @ts-expect-error -- missing @types/react-syntax-highlighter
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
// @ts-expect-error -- missing @types/react-syntax-highlighter
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SyntaxHighlightProps {
  code: string;
  language?: string;
  showLineNumbers?: boolean;
  wrapLines?: boolean;
  maxHeight?: string;
}

export function SyntaxHighlight({ 
  code, 
  language = 'json',
  showLineNumbers = true,
  wrapLines = false,
  maxHeight = '400px'
}: SyntaxHighlightProps) {
  const formattedCode = useMemo(() => {
    if (language === 'json') {
      try {
        const parsed = JSON.parse(code);
        return JSON.stringify(parsed, null, 2);
      } catch {
        return code;
      }
    }
    return code;
  }, [code, language]);

  if (!code || code.trim() === '') {
    return (
      <div className="text-gray-500 text-sm italic">
        (conteúdo vazio)
      </div>
    );
  }

  return (
    <div 
      className="rounded overflow-auto"
      style={{ maxHeight }}
    >
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        showLineNumbers={showLineNumbers}
        wrapLines={wrapLines}
        customStyle={{
          margin: 0,
          padding: '1rem',
          fontSize: '0.875rem',
          lineHeight: '1.5',
          background: '#1e1e1e'
        }}
        lineNumberStyle={{
          minWidth: '2em',
          paddingRight: '1em',
          color: '#6e7681',
          textAlign: 'right'
        }}
      >
        {formattedCode}
      </SyntaxHighlighter>
    </div>
  );
}

// Helper component for JSON objects with syntax highlighting
export function JsonHighlight({ 
  data, 
  maxHeight = '300px' 
}: { 
  data: unknown; 
  maxHeight?: string;
}) {
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  }, [data]);

  return (
    <SyntaxHighlight
      code={jsonString}
      language="json"
      maxHeight={maxHeight}
    />
  );
}
