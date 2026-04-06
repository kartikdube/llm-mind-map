const fs = require('fs');
const path = require('path');

const CATEGORIES = [
  "Power", "Freedom", "Love", "Fear", "Money", "Intelligence", "Control", "Ethics", 
  "Creativity", "Justice", "Nature", "Technology", "Time", "Death", "Life", 
  "War", "Peace", "Truth", "Beauty", "Chaos"
];

const MODELS = ["GPT-4", "Claude 3", "Gemini 1.5"];

const RICH_VOCAB = {
  "Power": ["Authority", "Sovereignty", "Hegemony", "Dominion", "Command", "Hierarchy", "Empire", "Influence", "Clout", "Regime", "Mastery", "Status", "Rank", "Might", "Force", "Dictate", "Sanction", "Leverage", "Prestige", "Control"],
  "Freedom": ["Liberty", "Autonomy", "Agency", "Independence", "Release", "Horizon", "Volition", "Will", "Choice", "Voice", "Flight", "Escape", "Openness", "Spirit", "Wild", "Untamed", "Rights", "Charter", "Flow", "Drift"],
  "Love": ["Affection", "Devotion", "Passion", "Tenderness", "Compassion", "Empathy", "Kindness", "Intimacy", "Bond", "Unity", "Heart", "Soul", "Glow", "Warmth", "Cherish", "Adoration", "Beloved", "Grace", "Mercy", "Patience"],
  "Fear": ["Anxiety", "Dread", "Terror", "Panic", "Shadow", "Nightmare", "Void", "Abyss", "Tremble", "Ghost", "Haunt", "Paranoia", "Alarm", "Shudder", "Fright", "Specter", "Doom", "Cold", "Dark", "Silence"],
  "Money": ["Wealth", "Capital", "Currency", "Economy", "Finance", "Asset", "Value", "Profit", "Revenue", "Trade", "Investment", "Portfolio", "Equity", "Bank", "Vault", "Market", "Luxury", "Gold", "Coin", "Billion"],
  "Intelligence": ["Cognition", "Wisdom", "Logic", "Reason", "Acumen", "Insight", "Learning", "Genius", "Mind", "Thought", "Pattern", "Theory", "Science", "Fact", "Data", "Memory", "Concept", "Vision", "Clarity", "Focus"],
  "Control": ["Regulation", "Order", "System", "Discipline", "Mastery", "Grid", "Structure", "Direct", "Guide", "Check", "Limit", "Barrier", "Border", "Anchor", "Fix", "Solid", "Rule", "Law", "Standard", "Steady"],
  "Ethics": ["Morality", "Integrity", "Virtue", "Principle", "Duty", "Responsibility", "Honor", "Character", "Conscience", "Judgment", "Karma", "Sin", "Bliss", "Right", "Good", "Bad", "Fair", "Kind", "Proper", "True"],
  "Creativity": ["Imagination", "Innovation", "Artistry", "Design", "Vision", "Original", "Style", "Novel", "Vivid", "Lush", "Muse", "Dream", "Image", "Sound", "Color", "Shape", "Line", "Sketch", "Paint", "Build"],
  "Justice": ["Equity", "Fairness", "Verdict", "Law", "Court", "Judge", "Scale", "Balance", "Rights", "Proof", "Evidence", "Crime", "Punish", "Reward", "Gavel", "Order", "Peace", "Standard", "Civic", "Due"],
  "Nature": ["Ecosystem", "Biology", "Wilderness", "Growth", "Flora", "Fauna", "Photosynthesis", "Mycelium", "Canopy", "Organic", "Soil", "Root", "Stem", "Leaf", "Bark", "Moss", "Fern", "Stream", "Stone", "Cloud"],
  "Technology": ["Algorithm", "Processing", "Digital", "Automation", "Robotics", "Network", "Circuit", "Software", "Hardware", "Silicon", "Cyber", "Grid", "Link", "Node", "Fiber", "Pulse", "Laser", "Machine", "Tools", "Data"],
  "Time": ["Chronology", "Eternity", "Legacy", "Moment", "Horizon", "Duration", "Epoch", "Era", "History", "Interval", "Clock", "Watch", "Second", "Hour", "Day", "Year", "Past", "Now", "Soon", "Tick"],
  "Death": ["Mortality", "Finality", "Silence", "Legacy", "Grief", "Transition", "Ending", "Nothing", "Memory", "Fade", "Dust", "Bone", "Ghost", "Ash", "Passing", "Gone", "Lost", "Deep", "Cold", "Rest"],
  "Life": ["Vitality", "Existence", "Being", "Breath", "Pulse", "Conscious", "Experience", "Flow", "Spark", "Energy", "Seed", "Bud", "Birth", "Rise", "Wake", "Fresh", "New", "Move", "Feel", "Sense"],
  "War": ["Campaign", "Strategy", "Tactics", "Soldier", "Armor", "Trench", "Siege", "Combat", "Battle", "Theater", "Weapon", "Steel", "Lead", "Blood", "Conflict", "Victory", "Defeat", "Wall", "Fort", "Shield"],
  "Peace": ["Accord", "Amity", "Serenity", "Tranquility", "Unity", "Stability", "Harmony", "Accord", "Quiet", "Rest", "Home", "Safe", "Kind", "Soft", "Blue", "White", "Clear", "Ease", "Mend", "Heal"],
  "Truth": ["Reality", "Veracity", "Fact", "Honesty", "Evidence", "Certainty", "Clarity", "Absolution", "Real", "Raw", "Pure", "Core", "Root", "Base", "Sharp", "Deep", "Main", "Key", "Sure", "True"],
  "Beauty": ["Aesthetics", "Grace", "Splendor", "Elegance", "Harmony", "Proportion", "Attraction", "Radiance", "Fine", "Thin", "Silk", "Lace", "Soft", "Pure", "Bright", "Rich", "Full", "Gold", "Flow", "Glow"],
  "Chaos": ["Entropy", "Anarchy", "Turbulence", "Disorder", "Fracture", "Confusion", "Wild", "Mad", "Odd", "Random", "Daze", "Mix", "Blur", "None", "All", "Null", "Void", "Raw", "Rough", "Torn"]
};

function generateWordsForCategory(category) {
  const baseWords = RICH_VOCAB[category] || ["Concept"];
  const modelAssociations = {};

  MODELS.forEach((model, mIdx) => {
    // Each model gets a "ranked" list of associations
    // We'll shuffle the base list and assign weights
    const shuffled = [...baseWords].sort(() => 0.5 - Math.random());
    modelAssociations[model] = shuffled.slice(0, 20).map((word, i) => ({
      word,
      similarity: parseFloat((0.95 - (i * 0.01) - (Math.random() * 0.02)).toFixed(3)),
      rank: i + 1
    }));
  });

  return {
    id: category.toLowerCase(),
    name: category,
    models: modelAssociations
  };
}

const data = {
  categories: CATEGORIES.map(generateWordsForCategory)
};

const dataPath = path.join(__dirname, 'src', 'data');
fs.writeFileSync(path.join(dataPath, 'dataset.json'), JSON.stringify(data, null, 2));
console.log('Successfully wrote Hierarchical Centric dataset.json');
