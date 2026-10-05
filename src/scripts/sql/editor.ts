// CodeMirror SQL editor: keyword + table + column autocomplete, Tab to accept, Ctrl/Cmd+Enter to run.
import { basicSetup } from 'codemirror';
import { EditorView, keymap } from '@codemirror/view';
import { Prec } from '@codemirror/state';
import { acceptCompletion } from '@codemirror/autocomplete';
import { indentWithTab } from '@codemirror/commands';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags } from '@lezer/highlight';
import { duck, sqlCompletion } from './keywords';

// Colours come from the site tokens, so the editor follows light/dark mode.
const theme = EditorView.theme({
  '&': { fontSize: 'var(--step--1)', border: '1px solid var(--color-border)', background: 'var(--color-bg)', color: 'var(--color-text)' },
  '&.cm-focused': { outline: '2px solid var(--color-accent)', outlineOffset: '-1px' },
  '.cm-scroller': { fontFamily: 'var(--font-mono)', minHeight: '9rem', maxHeight: '24rem' },
  '.cm-content': { caretColor: 'var(--color-accent)' },
  '.cm-gutters': { background: 'transparent', color: 'var(--color-muted)', border: 'none' },
  '.cm-activeLine, .cm-activeLineGutter': { background: 'color-mix(in srgb, var(--color-text) 5%, transparent)' },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': { background: 'color-mix(in srgb, var(--color-accent) 30%, transparent)' },
  '.cm-tooltip': { background: 'var(--color-bg)', border: '1px solid var(--color-border)', fontFamily: 'var(--font-mono)' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { background: 'var(--color-accent)', color: 'var(--color-on-accent)' },
  '.cm-completionDetail': { color: 'var(--color-muted)' },
});
const highlight = HighlightStyle.define([
  { tag: tags.keyword, color: 'var(--color-accent-ink)', fontWeight: '600' },
  { tag: [tags.string, tags.special(tags.string)], color: 'var(--color-text)', fontStyle: 'italic' },
  { tag: [tags.number, tags.bool, tags.null], color: 'var(--color-accent-ink)' },
  { tag: [tags.comment, tags.lineComment, tags.blockComment], color: 'var(--color-muted)', fontStyle: 'italic' },
  { tag: [tags.typeName, tags.standard(tags.name)], color: 'var(--color-muted)' },
]);

export function createEditor(parent: HTMLElement, doc: string, onRun: () => void, onChange: (s: string) => void) {
  return new EditorView({
    doc,
    parent,
    extensions: [
      Prec.highest(keymap.of([
        { key: 'Tab', run: acceptCompletion },
        { key: 'Mod-Enter', run: () => (onRun(), true) },
      ])),
      basicSetup,
      keymap.of([indentWithTab]),
      duck.extension,
      sqlCompletion,
      syntaxHighlighting(highlight),
      theme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ 'aria-label': 'SQL editor' }),
      EditorView.updateListener.of((u) => u.docChanged && onChange(u.state.doc.toString())),
    ],
  });
}

export const setDoc = (view: EditorView, text: string) =>
  view.dispatch({ changes: { from: 0, to: view.state.doc.length, insert: text } });
