import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { useStore } from '../store';

export function CodeEditor({ value, onChange, height = '340px', label }: { value: string; onChange: (v: string) => void; height?: string; label: string }) {
  const theme = useStore((s) => s.theme);
  return (
    <div className="overflow-hidden rounded-xl border border-line" aria-label={label}>
      <CodeMirror
        value={value}
        height={height}
        theme={theme === 'dark' ? oneDark : 'light'}
        extensions={[javascript()]}
        onChange={onChange}
        basicSetup={{ lineNumbers: true, foldGutter: false, autocompletion: true, bracketMatching: true, closeBrackets: true, tabSize: 2 }}
      />
    </div>
  );
}
