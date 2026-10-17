import { describe, it, expect } from 'vitest';
import { renderToString } from 'react-dom/server';
import { LEGAL_DOCS } from '../components/legalDocs';
import { renderBlocks } from '../components/legalMarkup';

const files = import.meta.glob('./*.js', { eager: true });

describe('translated legal documents', () => {
  for (const [path, mod] of Object.entries(files)) {
    const code = path.replace('./', '').replace('.js', '');
    it(`${code} mirrors the English structure`, () => {
      const pack = mod.default;
      expect(pack.notice).toBeTruthy();
      for (const en of LEGAL_DOCS) {
        const tr = pack.docs[en.id];
        expect(tr, `${code}:${en.id}`).toBeDefined();
        expect(tr.sections.length, `${code}:${en.id} sections`).toBe(en.sections.length);
        for (const s of tr.sections) {
          expect(s.heading).toBeTruthy();
          expect(s.body.length).toBeGreaterThan(0);
          expect(renderToString(<div>{renderBlocks(s.body)}</div>)).not.toContain('**');
        }
      }
    });
  }
});
