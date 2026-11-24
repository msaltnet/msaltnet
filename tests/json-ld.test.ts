import { describe, expect, it } from 'vitest';
import { jsonLdText } from '../src/lib/json-ld';

describe('jsonLdText', () => {
  it('cannot close the surrounding script element', () => {
    const text = jsonLdText({ headline: 'A </script><b>x</b> <연금술사>' });
    expect(text).not.toContain('</script');
    expect(text).not.toContain('<');
    expect(JSON.parse(text).headline).toBe('A </script><b>x</b> <연금술사>');
  });
});
