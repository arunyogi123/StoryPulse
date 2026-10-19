export type Category = string;

export type TextSize = 'normal' | 'large' | 'xlarge';

export interface WordDefinition {
  word: string;
  pronunciation?: string;
  simpleMeaning: string;
  exampleSentence: string;
}

export interface ContentSection {
  heading?: string;
  paragraph: string;
}

export interface Article {
  id: string;
  slug?: string;
  title: string;
  simpleTitle?: string;
  category: Category;
  categoryLabel: string;
  categoryIcon: string;
  author?: string;
  date: string;
  readTime: string;
  imageUrl: string;
  imageCaption: string;
  featured?: boolean;
  shortSnippet: string;
  superSimpleSnippet?: string;
  takeaways: string[];
  whyItMatters: string;
  sections: ContentSection[];
  simpleSections?: ContentSection[];
  wordsToKnow: WordDefinition[];
}

export interface GlossaryTerm {
  term: string;
  category: string;
  simpleDefinition: string;
  example: string;
}
