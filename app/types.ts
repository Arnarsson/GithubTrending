export type Repo = {
  id: string;
  title: string;
  description: string;
  language: string;
  languageColor: string;
  ecosystem: string;
  ageDays: number;
  lastCommitDays: number;
  stars24: number;
  trend: number;
  starredDaysAgo: number;
  curators: string[];
  primaryCurator: string;
  spark: number[];
  authority: number;
};
