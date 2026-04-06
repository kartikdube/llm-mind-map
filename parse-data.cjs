const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const OUTPUT_FILE = path.join(__dirname, 'src', 'data', 'dataset.json');

const MODELS_MAP = [
  { file: 'gpt_data.md', model: 'GPT-4' },
  { file: 'claude_data.md', model: 'Claude 3' },
  { file: 'gemini_data.md', model: 'Gemini 1.5' }
];

// Parse a single markdown file, returning { [categoryName]: [{word, similarity}] }
function parseFile(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const result = {};

  // Split on "## <Category>" headings
  const sectionRegex = /^##\s+(.+)$/gm;
  let match;
  let sections = [];

  while ((match = sectionRegex.exec(raw)) !== null) {
    sections.push({ name: match[1].trim(), index: match.index });
  }

  sections.forEach((sec, i) => {
    const start = sec.index;
    const end = i + 1 < sections.length ? sections[i + 1].index : raw.length;
    const block = raw.slice(start, end);
    const lines = block.split('\n').slice(1); // Drop the heading line itself

    const neighbors = [];
    lines.forEach(line => {
      // Handles both:  "* word (0.93)"  and  "word (0.93)"
      const m = line.match(/^\*?\s*([\w][\w\s\-]*?)\s*\((\d\.\d+)\)/);
      if (m) {
        neighbors.push({
          word: m[1].trim(),
          similarity: parseFloat(m[2])
        });
      }
    });

    if (neighbors.length > 0) {
      result[sec.name] = neighbors;
    }
  });

  return result;
}

function main() {
  // Collect all unique categories across all files
  const allData = {};
  const allCategories = new Set();

  MODELS_MAP.forEach(({ file, model }) => {
    const fp = path.join(DATA_DIR, file);
    if (!fs.existsSync(fp)) { console.warn(`Missing: ${fp}`); return; }
    const parsed = parseFile(fp);
    allData[model] = parsed;
    Object.keys(parsed).forEach(cat => allCategories.add(cat));
    console.log(`Parsed ${file}: ${Object.keys(parsed).length} categories`);
  });

  const categories = [...allCategories].sort().map(name => {
    const models = {};
    MODELS_MAP.forEach(({ model }) => {
      if (allData[model] && allData[model][name]) {
        models[model] = allData[model][name];
      }
    });
    return { id: name.toLowerCase().replace(/\s+/g, '-'), name, models };
  });

  const dataset = { categories };

  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dataset, null, 2));

  console.log(`\nWritten to ${OUTPUT_FILE}`);
  console.log(`Total categories: ${categories.length}`);

  // Quick sanity-check Power
  const power = categories.find(c => c.name === 'Power');
  if (power) {
    Object.entries(power.models).forEach(([m, words]) => {
      console.log(`  ${m}: ${words.length} words  (top: ${words[0]?.word} @ ${words[0]?.similarity})`);
    });
  }
}

main();
