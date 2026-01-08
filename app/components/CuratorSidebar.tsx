'use client';

type CuratorCount = {
  handle: string;
  count: number;
  total: number;
};

type CuratorSidebarProps = {
  topCurators: CuratorCount[];
  curatorCounts: Record<string, { count: number; total: number }>;
  curators: Set<string>;
  curatorProfiles: Record<string, string>;
  onToggleCurator: (handle: string) => void;
};

export default function CuratorSidebar({
  topCurators,
  curatorCounts,
  curators,
  curatorProfiles,
  onToggleCurator
}: CuratorSidebarProps) {
  return (
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
            onClick={() => onToggleCurator(curator.handle)}
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
          {Object.keys(curatorCounts)
            .slice(0, 8)
            .map(handle => (
              <button
                key={handle}
                className={`px-2.5 py-1 rounded-full border border-border text-xs text-gray-400 hover:text-white focus-ring ${curators.has(handle) ? 'chip-active' : ''}`}
                onClick={() => onToggleCurator(handle)}
              >
                @{handle}
              </button>
            ))}
        </div>
      </div>
    </aside>
  );
}
