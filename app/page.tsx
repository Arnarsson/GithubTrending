'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import RepoCard from '@/app/components/RepoCard';
import CuratorSidebar from '@/app/components/CuratorSidebar';
import BottomNav from '@/app/components/BottomNav';
import type { Repo } from '@/app/types';

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
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string>('');

  const parentRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

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

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0];
        if (entry.isIntersecting && repos.length < total && !isLoading) {
          loadPage(page + 1);
        }
      },
      { root: parentRef.current, rootMargin: '200px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [repos.length, total, isLoading, loadPage, page]);

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

  const scrollTop = () => {
    parentRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
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
              {error && <div className="bg-card border border-border rounded-xl p-4 text-sm text-red-300">{error}</div>}
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
                    return (
                      <div
                        key={repo.id}
                        data-index={virtualRow.index}
                        ref={rowVirtualizer.measureElement}
                        className="absolute left-0 top-0 w-full"
                        style={{ transform: `translateY(${virtualRow.start}px)` }}
                      >
                        <RepoCard
                          repo={repo}
                          rank={virtualRow.index + 1}
                          saved={saved.has(repo.id)}
                          detailsOpen={openDetails.has(repo.id)}
                          curatorProfiles={curatorProfiles}
                          onToggleSave={toggleSave}
                          onToggleDetails={toggleDetails}
                        />
                      </div>
                    );
                  })}
                </div>
                <div ref={sentinelRef} className="h-12"></div>
              </div>

              <div className="flex justify-between items-center">
                <div className="text-xs text-gray-500">Showing {filtered.length} / {total} repos</div>
                <button
                  className="px-3 py-1.5 rounded-full border border-border text-sm text-gray-400 hover:text-white focus-ring"
                  onClick={() => loadPage(page + 1)}
                  disabled={isLoading || repos.length >= total}
                >
                  {repos.length >= total ? 'No more' : isLoading ? 'Loading...' : 'Load more'}
                </button>
              </div>
            </section>

            <CuratorSidebar
              topCurators={topCurators}
              curatorCounts={curatorCounts}
              curators={curators}
              curatorProfiles={curatorProfiles}
              onToggleCurator={toggleCurator}
            />
          </main>
        </div>
        <BottomNav savedOnly={savedOnly} onToggleSaved={setSavedOnly} onScrollTop={scrollTop} />
      </div>
    </div>
  );
}
