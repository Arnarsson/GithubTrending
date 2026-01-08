'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

type Repo = {
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

type FeedResponse = {
  updatedAt: string;
  total: number;
  page: number;
  limit: number;
  repos: Repo[];
};

const curatorProfiles: Record<string, string> = {
  bentossell: 'https://github.com/bentossell.png',
  steipete: 'https://github.com/steipete.png',
  shadcn: 'https://github.com/shadcn.png',
  torvalds: 'https://github.com/torvalds.png',
  danielgross: 'https://github.com/danielgross.png',
  swyx: 'https://github.com/swyx.png',
  theo: 'https://github.com/theo.png',
  bruce: 'https://github.com/bruce.png',
  t3dotgg: 'https://github.com/t3dotgg.png',
  matklad: 'https://github.com/matklad.png',
  dtolnay: 'https://github.com/dtolnay.png',
  rauchg: 'https://github.com/rauchg.png',
  geohot: 'https://github.com/geohot.png',
  karpathy: 'https://github.com/karpathy.png'
};

const PRESETS = {
  'ai-labs': {
    ecosystem: 'AI/ML',
    timeframe: 'week',
    newOnly: true,
    curators: ['karpathy', 'danielgross', 'swyx']
  },
  'rust-core': {
    ecosystem: 'Rust',
    timeframe: 'month',
    newOnly: false,
    curators: ['matklad', 'dtolnay']
  },
  'indie-devs': {
    ecosystem: 'Frontend',
    timeframe: 'week',
    newOnly: true,
    curators: ['shadcn', 'theo', 'bentossell']
  }
} as const;

const LANGUAGE_STYLES: Record<string, { pill: string; dot: string }> = {
  yellow: { pill: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500', dot: 'bg-yellow-500' },
  orange: { pill: 'bg-orange-500/10 border-orange-500/20 text-orange-500', dot: 'bg-orange-500' },
  emerald: { pill: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', dot: 'bg-emerald-500' },
  sky: { pill: 'bg-sky-500/10 border-sky-500/20 text-sky-400', dot: 'bg-sky-500' }
};

export default function Page() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [ecosystem, setEcosystem] = useState('All');
  const [newOnly, setNewOnly] = useState(false);
  const [savedOnly, setSavedOnly] = useState(false);
  const [density, setDensity] = useState<'comfortable' | 'compact'>('comfortable');
  const [curators, setCurators] = useState<Set<string>>(new Set());
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());

  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('devpulse:saved');
    if (stored) {
      setSaved(new Set(JSON.parse(stored)));
    }
  }, []);

  useEffect(() => {
    document.body.classList.toggle('density-compact', density === 'compact');
  }, [density]);

  const loadPage = useCallback(async (nextPage: number) => {
    setIsLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/feed?page=${nextPage}&limit=20`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Failed to load feed');
      const payload = (await res.json()) as FeedResponse;
      setUpdatedAt(payload.updatedAt);
      setTotal(payload.total);
      setRepos(prev => (nextPage === 1 ? payload.repos : [...prev, ...payload.repos]));
      setPage(payload.page);
    } catch (err) {
      setError('Failed to load feed. Check the API endpoint.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  const withinTimeframe = useCallback(
    (repo: Repo) => {
      if (timeframe === 'today') return repo.starredDaysAgo <= 0;
      if (timeframe === 'week') return repo.starredDaysAgo <= 7;
      return repo.starredDaysAgo <= 30;
    },
    [timeframe]
  );

  const filtered = useMemo(() => {
    return repos
      .filter(repo => {
        if (!withinTimeframe(repo)) return false;
        if (ecosystem !== 'All' && repo.ecosystem !== ecosystem) return false;
        if (newOnly && repo.ageDays > 30) return false;
        if (savedOnly && !saved.has(repo.id)) return false;
        if (curators.size > 0 && !repo.curators.some(handle => curators.has(handle))) return false;
        return true;
      })
      .sort((a, b) => b.trend - a.trend);
  }, [repos, ecosystem, newOnly, savedOnly, curators, saved, withinTimeframe]);

  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (density === 'compact' ? 160 : 220),
    overscan: 6
  });

  const toggleSave = (id: string) => {
    setSaved(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      window.localStorage.setItem('devpulse:saved', JSON.stringify([...next]));
      return next;
    });
  };

  const toggleCurator = (handle: string) => {
    setCurators(prev => {
      const next = new Set(prev);
      if (next.has(handle)) {
        next.delete(handle);
      } else {
        next.add(handle);
      }
      return next;
    });
  };

  const toggleDetails = (id: string) => {
    setOpenDetails(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePreset = (key: keyof typeof PRESETS) => {
    const preset = PRESETS[key];
    setEcosystem(preset.ecosystem);
    setTimeframe(preset.timeframe as 'today' | 'week' | 'month');
    setNewOnly(preset.newOnly);
    setCurators(new Set(preset.curators));
  };

  const curatorCounts = useMemo(() => {
    const counts: Record<string, { count: number; total: number }> = {};
    repos.forEach(repo => {
      repo.curators.forEach(curator => {
        if (!counts[curator]) counts[curator] = { count: 0, total: 0 };
        counts[curator].total += 1;
      });
    });
    filtered.forEach(repo => {
      repo.curators.forEach(curator => {
        if (!counts[curator]) counts[curator] = { count: 0, total: 0 };
        counts[curator].count += 1;
      });
    });
    return counts;
  }, [repos, filtered]);

  const topCurators = useMemo(() => {
    return Object.keys(curatorCounts)
      .map(handle => ({ handle, ...curatorCounts[handle] }))
      .sort((a, b) => b.count - a.count || b.total - a.total)
      .slice(0, 5);
  }, [curatorCounts]);

  const loadMore = () => {
    if (repos.length < total && !isLoading) {
      loadPage(page + 1);
    }
  };

  return (
    <div className="min-h-screen bg-texture">
      <div className="noise min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <header className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-mono text-gray-500">DevPulse • High Signal Feed</div>
                <h1 className="text-3xl sm:text-4xl font-semibold text-white tracking-tight">
                  {savedOnly ? 'Saved Repos' : 'Today’s Top Picks'}
                </h1>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500 font-mono">
                <span className="px-2 py-1 rounded-full border border-border">
                  {updatedAt ? `Updated ${new Date(updatedAt).toLocaleString()}` : 'Updated just now'}
                </span>
                <span className="px-2 py-1 rounded-full border border-border">{ecosystem}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${!savedOnly ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setSavedOnly(false)}>
                Feed
              </button>
              <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${savedOnly ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setSavedOnly(true)}>
                Saved
              </button>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">Density</span>
                <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${density === 'comfortable' ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setDensity('comfortable')}>
                  Comfortable
                </button>
                <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${density === 'compact' ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setDensity('compact')}>
                  Compact
                </button>
              </div>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">Presets</span>
                <button className="px-3 py-1.5 rounded-full border border-border text-sm text-gray-400 hover:text-white focus-ring" onClick={() => handlePreset('ai-labs')}>
                  AI Labs
                </button>
                <button className="px-3 py-1.5 rounded-full border border-border text-sm text-gray-400 hover:text-white focus-ring" onClick={() => handlePreset('rust-core')}>
                  Rust Core
                </button>
                <button className="px-3 py-1.5 rounded-full border border-border text-sm text-gray-400 hover:text-white focus-ring" onClick={() => handlePreset('indie-devs')}>
                  Indie Devs
                </button>
              </div>
            </div>

            <nav className="hidden sm:flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">Timeframe</span>
                <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${timeframe === 'week' ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setTimeframe('week')}>
                  This Week
                </button>
                <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${timeframe === 'today' ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setTimeframe('today')}>
                  Today
                </button>
                <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${timeframe === 'month' ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setTimeframe('month')}>
                  This Month
                </button>
              </div>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">Ecosystem</span>
                {['All', 'Frontend', 'AI/ML', 'Rust'].map(item => (
                  <button
                    key={item}
                    className={`px-3 py-1.5 rounded-full border border-border text-sm ${ecosystem === item ? 'chip-active' : 'text-gray-400'} focus-ring`}
                    onClick={() => setEcosystem(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <div className="h-6 w-px bg-border hidden sm:block"></div>
              <button className={`px-3 py-1.5 rounded-full border border-border text-sm ${newOnly ? 'chip-active' : 'text-gray-400'} focus-ring`} onClick={() => setNewOnly(!newOnly)}>
                New Only
              </button>
            </nav>

            <div className="sm:hidden mt-2">
              <button className="w-full flex items-center justify-between px-4 py-2 rounded-lg border border-border text-sm text-gray-300 focus-ring" onClick={() => setSavedOnly(!savedOnly)}>
                <span className="font-mono text-xs text-gray-500">View</span>
                <span className="text-xs text-gray-400">{savedOnly ? 'Saved' : 'Feed'}</span>
              </button>
            </div>
          </header>

          <main className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
            <section className="flex flex-col gap-4">
              {error && (
                <div className="bg-card border border-border rounded-xl p-4 text-sm text-red-300">{error}</div>
              )}
              {isLoading && repos.length === 0 && (
                <div className="space-y-3">
                  {[0, 1, 2].map(item => (
                    <div key={item} className="w-full bg-card border border-border rounded-xl p-5 animate-pulse">
                      <div className="h-4 bg-gray-700/40 rounded w-1/3 mb-3"></div>
                      <div className="h-3 bg-gray-700/30 rounded w-2/3 mb-2"></div>
                      <div className="h-3 bg-gray-700/20 rounded w-1/2"></div>
                    </div>
                  ))}
                </div>
              )}
              {!isLoading && filtered.length === 0 && (
                <div className="bg-card border border-border rounded-xl p-6 text-sm text-gray-400">
                  No repos match your filters. Try widening the timeframe or clearing curator filters.
                </div>
              )}
              <div ref={parentRef} className="relative h-[70vh] overflow-auto">
                <div style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                  {rowVirtualizer.getVirtualItems().map(virtualRow => {
                    const repo = filtered[virtualRow.index];
                    if (!repo) return null;
                    const languageStyle = LANGUAGE_STYLES[repo.languageColor] || LANGUAGE_STYLES.sky;
                    const savedActive = saved.has(repo.id);
                    const detailsOpen = openDetails.has(repo.id);

                    return (
                      <div
                        key={repo.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="absolute left-0 top-0 w-full"
                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                      >
                        <article className="relative w-full bg-card border border-border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-5 md:gap-6 shadow-soft hover:shadow-glow hover:border-gray-600 transition-all cursor-pointer group card-body">
                          <div className="absolute left-0 top-4 bottom-4 w-1 rounded-full bg-gradient-to-b from-authority via-accent to-success opacity-70"></div>
                          <div className="flex items-center gap-4 md:gap-5 flex-1 min-w-0 pl-2 w-full">
                            <div className="font-mono text-2xl md:text-3xl font-bold text-gray-500 w-10 text-center">#{virtualRow.index + 1}</div>
                            <div className="flex flex-col gap-1 min-w-0">
                              <div className="flex items-center gap-3 flex-wrap">
                                <h3 className="text-xl font-semibold text-white truncate hover:text-accent transition-colors">{repo.title}</h3>
                                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-mono ${languageStyle.pill}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${languageStyle.dot}`} />
                                  {repo.language}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${repo.ageDays <= 30 ? 'bg-freshness/10 border border-freshness/20 text-freshness' : 'bg-gray-500/10 border border-gray-500/20 text-gray-400'}`}>
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
                                  <div className="w-7 h-7 rounded-full border-2 border-card bg-gray-800 flex items-center justify-center text-[10px] font-medium text-gray-400">+{repo.curators.length - 3}</div>
                                )}
                              </div>
                              <span className="text-xs text-gray-400 font-mono">{repo.curators.length} curators</span>
                            </div>
                            <div className="text-xs text-gray-400 md:text-right">
                              Starred by <span className="text-accent font-medium">@{repo.primaryCurator}</span> {repo.starredDaysAgo === 0 ? 'today' : `${repo.starredDaysAgo}d ago`}
                            </div>
                            <div className="text-[11px] text-success font-mono">+{repo.stars24} stars / 24h</div>
                          </div>

                          <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-start gap-3 md:gap-2 min-w-[120px] relative w-full md:w-auto">
                            <div className="flex items-center gap-2">
                              <div className="text-3xl font-mono font-bold text-white tracking-tighter">{repo.trend}</div>
                              <div className="relative group/why">
                                <button className="text-gray-500 hover:text-gray-200 focus-ring" aria-label="Why this score">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M12 18a6 6 0 100-12 6 6 0 000 12z"/></svg>
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
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                {repo.stars24} / 24h
                              </div>
                              <button className={`text-xs font-mono ${savedActive ? 'text-authority' : 'text-gray-500'} hover:text-white focus-ring`} onClick={() => toggleSave(repo.id)}>
                                {savedActive ? 'Saved' : 'Save'}
                              </button>
                              <button className="text-xs font-mono text-gray-500 hover:text-white focus-ring" onClick={() => toggleDetails(repo.id)}>
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
                                      <span key={handle} className="px-2 py-0.5 rounded-full border border-border text-gray-400">@{handle}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </article>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">Showing {filtered.length} / {total} repos</div>
                <button className="px-3 py-1.5 rounded-full border border-border text-sm text-gray-400 hover:text-white focus-ring" onClick={loadMore} disabled={isLoading || repos.length >= total}>
                  {repos.length >= total ? 'No more' : isLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            </section>

            <aside className="bg-card border border-border rounded-xl p-4 h-fit lg:sticky lg:top-6">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-mono text-gray-400">Top Curators This Week</h2>
                <button className="text-xs text-gray-500 hover:text-gray-300">View all</button>
              </div>
              <div className="mt-4 flex flex-col gap-3">
                {topCurators.map(curator => (
                  <button
                    key={curator.handle}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border border-border hover:border-gray-600 transition-all hover:shadow-glow focus-ring ${curators.has(curator.handle) ? 'border-authority' : ''}`}
                    onClick={() => toggleCurator(curator.handle)}
                  >
                    <div className="flex items-center gap-3">
                      <img className="w-8 h-8 rounded-full" src={curatorProfiles[curator.handle]} alt={curator.handle} loading="lazy" />
                      <div className="text-left">
                        <div className="text-sm text-white">@{curator.handle}</div>
                        <div className="text-[11px] text-gray-500 font-mono">Found {curator.count} trending</div>
                      </div>
                    </div>
                    <span className="text-xs text-authority font-mono">{90 + curator.count}</span>
                  </button>
                ))}
              </div>

              <div className="mt-6 border-t border-border pt-4">
                <h3 className="text-xs font-mono text-gray-500">Filter by Curator</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {Object.keys(curatorCounts).slice(0, 8).map(handle => (
                    <button
                      key={handle}
                      className={`px-2.5 py-1 rounded-full border border-border text-xs text-gray-400 hover:text-white focus-ring ${curators.has(handle) ? 'chip-active' : ''}`}
                      onClick={() => toggleCurator(handle)}
                    >
                      @{handle}
                    </button>
                  ))}
                </div>
              </div>
            </aside>
          </main>
        </div>
      </div>
    </div>
  );
}
