import { LoremIpsum } from 'lorem-ipsum';

// Configure lorem ipsum generator
const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
});

// Different text types for variety
const textTypes = [
  'programming',
  'literature',
  'science',
  'business',
  'technology'
];

// Programming-related words for technical typing practice
const programmingWords = [
  'function', 'variable', 'array', 'object', 'string', 'number', 'boolean', 'null', 'undefined',
  'const', 'let', 'var', 'if', 'else', 'for', 'while', 'switch', 'case', 'break', 'continue',
  'return', 'import', 'export', 'class', 'interface', 'type', 'async', 'await', 'promise',
  'callback', 'event', 'listener', 'component', 'props', 'state', 'hook', 'effect', 'context',
  'reducer', 'action', 'dispatch', 'middleware', 'router', 'route', 'navigate', 'redirect',
  'database', 'query', 'schema', 'model', 'controller', 'service', 'repository', 'entity',
  'authentication', 'authorization', 'token', 'session', 'cookie', 'header', 'request', 'response',
  'api', 'endpoint', 'method', 'parameter', 'payload', 'json', 'xml', 'html', 'css', 'javascript'
];

// Topic-specific word pools
const topicWords = {
  literature: [
    'narrative', 'character', 'protagonist', 'antagonist', 'plot', 'theme', 'metaphor', 'symbolism',
    'allegory', 'irony', 'foreshadowing', 'climax', 'resolution', 'setting', 'dialogue', 'monologue',
    'poetry', 'prose', 'verse', 'stanza', 'rhyme', 'rhythm', 'meter', 'alliteration', 'assonance',
    'novel', 'short story', 'essay', 'biography', 'autobiography', 'memoir', 'fiction', 'non-fiction'
  ],
  science: [
    'hypothesis', 'theory', 'experiment', 'observation', 'analysis', 'conclusion', 'variable', 'control',
    'molecule', 'atom', 'electron', 'proton', 'neutron', 'element', 'compound', 'reaction', 'catalyst',
    'evolution', 'genetics', 'chromosome', 'DNA', 'RNA', 'protein', 'enzyme', 'cell', 'organism',
    'ecosystem', 'biodiversity', 'photosynthesis', 'respiration', 'metabolism', 'homeostasis'
  ],
  business: [
    'strategy', 'management', 'leadership', 'innovation', 'entrepreneurship', 'marketing', 'sales',
    'revenue', 'profit', 'investment', 'stakeholder', 'shareholder', 'customer', 'client', 'service',
    'product', 'brand', 'market', 'competition', 'analysis', 'planning', 'execution', 'performance',
    'efficiency', 'productivity', 'quality', 'improvement', 'optimization', 'automation', 'digital'
  ],
  technology: [
    'artificial intelligence', 'machine learning', 'deep learning', 'neural network', 'algorithm',
    'data science', 'big data', 'analytics', 'cloud computing', 'cybersecurity', 'blockchain',
    'cryptocurrency', 'internet of things', 'virtual reality', 'augmented reality', 'robotics',
    'automation', 'software', 'hardware', 'network', 'protocol', 'encryption', 'decryption'
  ]
};

const generateTopicText = (topic: keyof typeof topicWords, length: number): string => {
  const words = topicWords[topic];
  const sentences: string[] = [];
  
  for (let i = 0; i < Math.ceil(length / 100); i++) {
    const sentenceLength = Math.floor(Math.random() * 12) + 8; // 8-20 words per sentence
    const sentenceWords: string[] = [];
    
    for (let j = 0; j < sentenceLength; j++) {
      const randomWord = words[Math.floor(Math.random() * words.length)];
      sentenceWords.push(j === 0 ? randomWord.charAt(0).toUpperCase() + randomWord.slice(1) : randomWord);
    }
    
    sentences.push(sentenceWords.join(' ') + '.');
  }
  
  return sentences.join(' ').substring(0, length);
};

const generateProgrammingText = (length: number): string => {
  const sentences: string[] = [];
  const commonPhrases = [
    'The function returns a',
    'We need to implement a',
    'This component renders a',
    'The variable stores a',
    'You can use this method to',
    'The API endpoint accepts a',
    'This hook manages the',
    'The reducer handles the',
    'We should validate the',
    'The service connects to the'
  ];
  
  for (let i = 0; i < Math.ceil(length / 80); i++) {
    const phrase = commonPhrases[Math.floor(Math.random() * commonPhrases.length)];
    const additionalWords: string[] = [];
    
    for (let j = 0; j < Math.floor(Math.random() * 8) + 3; j++) {
      additionalWords.push(programmingWords[Math.floor(Math.random() * programmingWords.length)]);
    }
    
    sentences.push(phrase + ' ' + additionalWords.join(' ') + '.');
  }
  
  return sentences.join(' ').substring(0, length);
};

export const generateRandomText = (minLength: number = 200, maxLength: number = 400): string => {
  const targetLength = Math.floor(Math.random() * (maxLength - minLength)) + minLength;
  const textType = textTypes[Math.floor(Math.random() * textTypes.length)];
  
  let generatedText = '';
  
  switch (textType) {
      
    case 'programming':
      generatedText = generateProgrammingText(targetLength);
      break;
      
    case 'literature':
      generatedText = generateTopicText('literature', targetLength);
      break;
      
    case 'science':
      generatedText = generateTopicText('science', targetLength);
      break;
      
    case 'business':
      generatedText = generateTopicText('business', targetLength);
      break;
      
    case 'technology':
      generatedText = generateTopicText('technology', targetLength);
      break;
      
    default:
      generatedText = lorem.generateParagraphs(Math.ceil(targetLength / 100));
  }
  
  // Ensure we don't exceed the target length and clean up the text
  generatedText = generatedText.substring(0, targetLength).trim();
  
  // Make sure we don't cut off in the middle of a word
  const lastSpaceIndex = generatedText.lastIndexOf(' ');
  if (lastSpaceIndex > targetLength * 0.9) {
    generatedText = generatedText.substring(0, lastSpaceIndex);
  }
  
  // Add a proper ending if needed
  if (!generatedText.endsWith('.') && !generatedText.endsWith('!') && !generatedText.endsWith('?')) {
    generatedText += '.';
  }
  
  return generatedText;
};

// Generate text with specific difficulty levels
export const generateTextByDifficulty = (difficulty: 'easy' | 'medium' | 'hard'): string => {
  switch (difficulty) {
    case 'easy':
      // Shorter sentences, common words
      return generateRandomText(150, 250);
    case 'medium':
      // Medium length with mixed content
      return generateRandomText(250, 350);
    case 'hard':
      // Longer text with more complex vocabulary
      return generateRandomText(350, 500);
    default:
      return generateRandomText();
  }
};

// Generate text focused on specific skills
export const generateTextByFocus = (focus: 'speed' | 'accuracy' | 'programming'): string => {
  switch (focus) {
    case 'speed':
      // Simple, repetitive patterns for speed building
      return lorem.generateSentences(8);
    case 'accuracy':
      // Complex punctuation and mixed case
      return generateTopicText('literature', 300);
    case 'programming':
      // Programming-focused content
      return generateProgrammingText(300);
    default:
      return generateRandomText();
  }
};

export const calculateWPM = (correctChars: number, timeInSeconds: number): number => {
  if (timeInSeconds === 0) return 0;
  const words = correctChars / 5; // Standard: 5 characters = 1 word
  const minutes = timeInSeconds / 60;
  return Math.round(words / minutes);
};

export const calculateAccuracy = (correct: number, incorrect: number): number => {
  const total = correct + incorrect;
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
};

/**
 * Generates a random text based on difficulty and focus.
 * Uses your existing generators for best results.
 */
export function generateText(
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
  focus: 'speed' | 'accuracy' | 'programming' | 'general' = 'general'
): string {
  // If focus is programming, always use programming generator
  if (focus === 'programming') {
    return generateProgrammingText(
      difficulty === 'easy' ? 200 : difficulty === 'medium' ? 300 : 400
    );
  }
  if (focus === 'speed') {
    // For speed, use simple sentences, length based on difficulty
    const sentenceCount = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 10 : 14;
    return lorem.generateSentences(sentenceCount);
  }
  if (focus === 'accuracy') {
    // For accuracy, use literature topic with length based on difficulty
    const length = difficulty === 'easy' ? 200 : difficulty === 'medium' ? 300 : 400;
    return generateTopicText('literature', length);
  }
  // Default/general: use difficulty-based generator
  return generateTextByDifficulty(difficulty);
}