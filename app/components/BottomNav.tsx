'use client';

type BottomNavProps = {
  savedOnly: boolean;
  onToggleSaved: (value: boolean) => void;
  onScrollTop: () => void;
};

export default function BottomNav({ savedOnly, onToggleSaved, onScrollTop }: BottomNavProps) {
  return (
    <div className="sm:hidden fixed bottom-0 left-0 right-0 bg-card/95 border-t border-border backdrop-blur px-4 py-3 flex items-center justify-between z-50">
      <button className={`flex flex-col items-center text-xs ${!savedOnly ? 'text-white' : 'text-gray-400'}`} onClick={() => { onToggleSaved(false); onScrollTop(); }}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"/></svg>
        Feed
      </button>
      <button className={`flex flex-col items-center text-xs ${savedOnly ? 'text-white' : 'text-gray-400'}`} onClick={() => onToggleSaved(true)}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3-7 3V5z"/></svg>
        Saved
      </button>
      <button className="flex flex-col items-center text-xs text-gray-400" onClick={() => onScrollTop()}>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h18M6 12h12M10 19h4"/></svg>
        Top
      </button>
    </div>
  );
}
