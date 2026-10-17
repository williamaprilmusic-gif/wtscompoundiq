// Renders the translated legal documents (src/legal/<lang>.js). English stays as JSX in
// legalDocs.jsx; translations are plain strings in a tiny markup so ten languages don't
// each need a copy of the JSX tree:
//   "text"            paragraph        "- item"   list item (consecutive items form one list)
//   "#### heading"    sub-heading      "| a | b | c | d"  table row ("|| " for the header row)
//   **bold**  *emphasis*  and bare URLs become links.
import React from 'react';

const inline = (text) => {
  const parts = [];
  const re = /\*\*(.+?)\*\*|\*(.+?)\*|(https?:\/\/[^\s)]+)/g;
  let last = 0; let m; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[1] != null) parts.push(<strong key={k++}>{m[1]}</strong>);
    else if (m[2] != null) parts.push(<em key={k++}>{m[2]}</em>);
    else parts.push(<a key={k++} href={m[3]} target="_blank" rel="noopener noreferrer">{m[3].replace(/^https?:\/\//, '')}</a>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
};

export function renderBlocks(blocks) {
  const out = [];
  let list = null; let table = null;
  const flush = () => {
    if (list) { out.push(<ul key={`u${out.length}`}>{list.map((x, i) => <li key={i}>{inline(x)}</li>)}</ul>); list = null; }
    if (table) {
      out.push(
        <div className="legal-tbl-wrap" key={`t${out.length}`}>
          <table className="legal-rate">
            <thead><tr>{table.head.map((c, i) => <th key={i}>{c}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      table = null;
    }
  };
  for (const b of blocks) {
    if (b.startsWith('- ')) { if (table) flush(); (list = list || []).push(b.slice(2)); continue; }
    if (b.startsWith('|| ')) { flush(); table = { head: b.slice(3).split(' | '), rows: [] }; continue; }
    if (b.startsWith('| ')) { table.rows.push(b.slice(2).split(' | ')); continue; }
    flush();
    if (b.startsWith('#### ')) out.push(<h4 key={out.length}>{b.slice(5)}</h4>);
    else out.push(<p key={out.length}>{inline(b)}</p>);
  }
  flush();
  return out;
}
