import React from 'react';
import { Search, Filter, X } from 'lucide-react';

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  activeFilter: 'all' | 'unread' | 'groups' | 'archived';
  setActiveFilter: (filter: 'all' | 'unread' | 'groups' | 'archived') => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  setSearchTerm,
  activeFilter,
  setActiveFilter,
}) => {
  return (
    <div className="p-3 bg-white dark:bg-[#1e293b] border-b border-slate-200 dark:border-slate-700/50 space-y-2.5 transition-colors">
      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search messages or users"
          className="w-full bg-slate-100 dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-8 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pt-0.5 text-xs font-semibold">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setActiveFilter('unread')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'unread'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Unread
        </button>
        <button
          onClick={() => setActiveFilter('groups')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'groups'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Groups
        </button>
        <button
          onClick={() => setActiveFilter('archived')}
          className={`px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
            activeFilter === 'archived'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
          }`}
        >
          Archived
        </button>
      </div>
    </div>
  );
};
