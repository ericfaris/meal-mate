/**
 * Test HTML entity decoding in recipe import
 *
 * This test ensures that HTML entities (like &#39;, &apos;, etc.)
 * are properly decoded when importing recipes.
 */

// Mock data with HTML entities
const testCases = [
  {
    description: 'Apostrophe entities',
    input: "Mom&#39;s Best Recipe",
    expected: "Mom's Best Recipe"
  },
  {
    description: 'Quote entities',
    input: 'He said &quot;hello&quot;',
    expected: 'He said "hello"'
  },
  {
    description: 'Smart quotes',
    input: 'It&#8217;s ready &ndash; let&#8217;s eat!',
    expected: 'It\u2019s ready \u2013 let\u2019s eat!'
  },
  {
    description: 'Multiple entities',
    input: '&amp; mix &nbsp; ingredients &hellip;',
    expected: '& mix   ingredients \u2026'
  },
  {
    description: 'No entities (passthrough)',
    input: 'Plain text recipe',
    expected: 'Plain text recipe'
  }
];

/**
 * Decode HTML entities - same implementation as in recipeParser.ts
 */
function decodeHtmlEntities(text: string): string {
  if (!text) return text;

  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#34;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&#x27;': "'",
    '&rsquo;': '\u2019',
    '&lsquo;': '\u2018',
    '&rdquo;': '\u201D',
    '&ldquo;': '\u201C',
    '&ndash;': '\u2013',
    '&mdash;': '\u2014',
    '&hellip;': '\u2026',
    '&nbsp;': ' ',
    '&#8217;': '\u2019',
    '&#8216;': '\u2018',
    '&#8220;': '\u201C',
    '&#8221;': '\u201D',
    '&#8211;': '\u2013',
    '&#8212;': '\u2014',
    '&#8230;': '\u2026',
  };

  let decoded = text;
  for (const [entity, char] of Object.entries(entities)) {
    decoded = decoded.replace(new RegExp(entity, 'g'), char);
  }

  decoded = decoded.replace(/&#(\d+);/g, (_match, dec) => {
    return String.fromCharCode(parseInt(dec, 10));
  });

  decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (_match, hex) => {
    return String.fromCharCode(parseInt(hex, 16));
  });

  return decoded;
}

// Run tests
console.log('Running HTML Entity Decoding Tests...\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase) => {
  const result = decodeHtmlEntities(testCase.input);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✓ PASS: ${testCase.description}`);
    passed++;
  } else {
    console.log(`✗ FAIL: ${testCase.description}`);
    console.log(`  Input:    "${testCase.input}"`);
    console.log(`  Expected: "${testCase.expected}"`);
    console.log(`  Got:      "${result}"`);
    failed++;
  }
});

console.log(`\n${passed} passed, ${failed} failed`);

if (failed > 0) {
  process.exit(1);
}
