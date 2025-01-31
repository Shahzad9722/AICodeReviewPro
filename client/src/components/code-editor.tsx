import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { EditorView, basicSetup } from "codemirror";
import { javascript } from "@codemirror/lang-javascript";

interface CodeEditorProps {
  code: string;
  onChange: (value: string) => void;
}

export default function CodeEditor({ code, onChange }: CodeEditorProps) {
  const editorRef = useRef<EditorView>();
  const editorContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorContainerRef.current) return;

    const updateListener = EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        onChange(update.state.doc.toString());
      }
    });

    const view = new EditorView({
      doc: code,
      extensions: [basicSetup, javascript(), updateListener],
      parent: editorContainerRef.current,
    });

    editorRef.current = view;

    return () => {
      view.destroy();
    };
  }, []);

  useEffect(() => {
    const view = editorRef.current;
    if (view && code !== view.state.doc.toString()) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: code,
        },
      });
    }
  }, [code]);

  return (
    <Card className="border rounded-lg overflow-hidden min-h-[300px]">
      <div
        ref={editorContainerRef}
        className="h-full [&_.cm-editor]:h-full [&_.cm-scroller]:min-h-[300px]"
      />
    </Card>
  );
}