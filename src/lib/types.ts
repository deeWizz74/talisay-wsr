export interface Person {
  id: string;
  name: string;
  photo: string;
  messenger: string;
  phone: string;
  email: string;
}

export interface Group {
  role: string;
  people: Person[];
  viceChair?: Group;
}

export interface Ward {
  slug: string;
  name: string;
  isStake?: boolean;
  leadership?: Group[];
  lead: Group;
  roles: Group[];
  secretary?: Group;
}

export interface DirectoryMeta {
  title: string;
  updatedAt: string;
  roleLegend: Record<string, string>;
}

export interface FaqEntry {
  id: string;
  question: string;
  answer: string;
}

export interface EffortTextBlock {
  id: string;
  type: "text";
  text: string;
}

export interface EffortImageBlock {
  id: string;
  type: "image";
  url: string;
  caption: string;
}

export type EffortBlock = EffortTextBlock | EffortImageBlock;

export interface EffortPost {
  id: string;
  title: string;
  date: string;
  photo: string;
  content: EffortBlock[];
}

export interface SpotlightEntry {
  id: string;
  name: string;
  photo: string;
  calling: string;
  family: string;
  workSchool: string;
  hobbies: string;
  funFact: string;
  favoriteScripture: string;
  gratefulFor: string;
  messageToWard: string;
}

export interface InfoContent {
  pefFaq: FaqEntry[];
  spotlight: SpotlightEntry[];
  wsrEfforts: EffortPost[];
}

export interface DirectoryData {
  meta: DirectoryMeta;
  wards: Ward[];
  info: InfoContent;
}

export interface WardSummary {
  slug: string;
  name: string;
  isStake: boolean;
}

export interface Stats {
  wardsCount: number;
  totalRoleSlots: number;
  filledRoleSlots: number;
  vacantRoleSlots: number;
  totalPeople: number;
  peopleWithMessenger: number;
}
