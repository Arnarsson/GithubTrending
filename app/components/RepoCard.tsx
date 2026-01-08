'use client';

import type { Repo } from '@/app/types';

const LANGUAGE_STYLES: Record<string, { pill: string; dot: string }> = {
  yellow: { pill: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500', dot: 'bg-yellow-500' },
  orange: { pill: 'bg-orange-500/10 border-orange-500/20 text-orange-500', dot: 'bg-orange-500' },
  emerald: { pill: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
  sky: { pill: 'bg-sky-500/10 border-sky-500/20 text-sky-400', dot: 'bg-sky-500' }
};

export type RepoCardProps = {
  repo: Repo;
  rank: number;
  saved: boolean;
  detailsOpen: boolean;
  curatorProfiles: Record<string, string>;
  onToggleSave: (id: string) => void;
  onToggleDetails: (id: string) => void;
};

export default function RepoCard({
  repo,
  rank,
  saved,
  detailsOpen,
  curatorProfiles,
  onToggleSave,
  onToggleDetails
}: RepoCardProps) {
  const languageStyle = LANGUAGE_STYLES[repo.languageColor] || LANGUAGE_STYLES.sky;

  return (
    <article className="relative w-full bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-5 md:gap-6 shadow-soft hover:shadow-glow hover:border-gray-600 transition-all cursor-pointer group card-body">
      <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-authority via-accent to-success opacity-70"></div>
      <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 pl-2 w-full">
        <div className="font-mono text-2xl md:text-3xl font-bold text-gray-500 w-10 text-center">#{rank}</div>
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-xl font-semibold text-white truncate hover:text-accent transition-colors">{repo.title}</h3>
            <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${languageStyle.pill}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${languageStyle.dot}`} />
              {repo.language}
            </span>
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                repo.ageDays <= 30
                  ? 'bg-freshness/10 border border-freshness/20 text-freshness'
                  : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'
              }`}
            >
              {repo.ageDays <= 30 ? `New (${repo.ageDays}d)` : `Established (${repo.ageDays}d)`}
            </span>
          </div>
          <p className="text-sm text-gray-400 line-clamp-2 card-description">{repo.description}</p>
          <div className="text-xs text-gray-400 sm:hidden">Starred by @{repo.primaryCurator}</div>
          <div className="flex items-center gap-2 text-xs text-gray-500 font-mono">
            <span>{repo.ecosystem}</span>
            <span>•</span>
            <span>Commit: {repo.lastCommitDays}d ago</span>
          </div>
        </div>
      </div>

      <div className="flex md:flex flex-col gap-2 md:gap-1.5 md:items-end md:border-r md:border-border md:pr-6 md:mr-2 min-w-[170px] w-full md:w-auto">
        <div className="flex items-center gap-2 rounded-full border border-border px-2 py-1 bg-black/20 w-fit">
          <div className="flex items-center -space-x-2">
            {repo.curators.slice(0, 3).map(handle => (
              <img key={handle} src={curatorProfiles[handle]} alt={handle} className="w-7 h-7 rounded-full border-2 border-card" loading="lazy" />
            ))}
            {repo.curators.length > 3 && (
              <div className="w-7 h-7 rounded-full border-2 border-card bg-gray-800 flex items-center justify-center text-[10px] font-medium text-gray-400">
                +{repo.curators.length - 3}
              </div>
            )}
          </div>
          <span className="text-xs text-gray-400 font-mono">{repo.curators.length} curators</span>
        </div>
        <div className="text-xs text-gray-400 md:text-right">
          Starred by <span className="text-accent font-medium">@{repo.primaryCurator}</span>{' '}
          {repo.starredDaysAgo === 0 ? 'today' : `${repo.starredDaysAgo}d ago`}
        </div>
        <div className="text-[11px] text-success font-mono">+{repo.stars24} stars / 24h</div>
      </div>

      <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 md:gap-2 min-w-[120px] relative w-full md:w-auto">
        <div className="flex items-center gap-2">
          <div className="text-3xl font-mono font-bold text-white tracking-tighter">{repo.trend}</div>
          <div className="relative group/why">
            <button className="text-gray-500 hover:text-gray-200 focus-ring" aria-label="Why this score">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 18a6 6 0 100-12 6 6 0 000 12z" />
              </svg>
            </button>
            <div className="absolute right-0 mt-2 w-60 rounded-lg border border-border bg-card text-xs text-gray-300 p-3 shadow-soft opacity-0 translate-y-1 pointer-events-none group-hover/why:opacity-100 group-hover/why:translate-y-0 transition-all">
              <div className="font-mono text-gray-400 mb-1">Trend Score: {repo.trend}</div>
              <div>Authority: {repo.authority} (@{repo.primaryCurator})</div>
              <div>Velocity: {repo.stars24} stars / 24h</div>
              <div>Freshness: {repo.ageDays} days old</div>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-1 text-success text-xs font-mono font-medium">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
            </svg>
            {repo.stars24} / 24h
          </div>
          <button className={`text-xs font-mono ${saved ? 'text-authority' : 'text-gray-500'} hover:text-white focus-ring`} onClick={() => onToggleSave(repo.id)}>
            {saved ? 'Saved' : 'Save'}
          </button>
          <button className="text-xs font-mono text-gray-500 hover:text-white focus-ring" onClick={() => onToggleDetails(repo.id)}>
            {detailsOpen ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {detailsOpen && (
        <div className="w-full mt-4 md:mt-3 border-t border-border pt-4 text-xs text-gray-400">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <div className="font-mono text-gray-500 mb-1">Why this?</div>
              <div>Authority {repo.authority}, velocity {repo.stars24}/24h, freshness {repo.ageDays} days.</div>
            </div>
            <div>
              <div className="font-mono text-gray-500 mb-1">Curator context</div>
              <div className="flex flex-wrap gap-2">
                {repo.curators.slice(0, 5).map(handle => (
                  <span key={handle} className="px-2 py-0.5 rounded-full border border-border text-gray-400">
                    @{handle}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}
