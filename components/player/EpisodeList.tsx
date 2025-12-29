'use client';

import { useRef, useCallback, useState, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Icons } from '@/components/ui/Icon';
import { useKeyboardNavigation } from '@/lib/hooks/useKeyboardNavigation';
import { settingsStore } from '@/lib/store/settings-store';

interface Episode {
  name?: string;
  url: string;
}

interface EpisodeListProps {
  episodes: Episode[] | null;
  currentEpisode: number;
  isReversed?: boolean;
  onEpisodeClick: (episode: Episode, index: number) => void;
  onToggleReverse?: (reversed: boolean) => void;
}

export function EpisodeList({
  episodes,
  currentEpisode,
  isReversed = false,
  onEpisodeClick,
  onToggleReverse
}: EpisodeListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Memoized display episodes - reversed if toggle is on
  const displayEpisodes = useMemo(() => {
    if (!episodes) return null;
    return isReversed ? [...episodes].reverse() : episodes;
  }, [episodes, isReversed]);

  // Map display index to original index
  const getOriginalIndex = useCallback((displayIndex: number) => {
    if (!episodes || !isReversed) return displayIndex;
    return episodes.length - 1 - displayIndex;
  }, [episodes, isReversed]);

  // Map original index to display index (for highlighting current episode)
  const getDisplayIndex = useCallback((originalIndex: number) => {
    if (!episodes || !isReversed) return originalIndex;
    return episodes.length - 1 - originalIndex;
  }, [episodes, isReversed]);

  // Keyboard navigation
  useKeyboardNavigation({
    enabled: true,
    containerRef: listRef,
    currentIndex: getDisplayIndex(currentEpisode),
    itemCount: episodes?.length || 0,
    orientation: 'vertical',
    onNavigate: useCallback((index: number) => {
      buttonRefs.current[index]?.focus();
      buttonRefs.current[index]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }, []),
    onSelect: useCallback((displayIndex: number) => {
      if (episodes) {
        const originalIndex = getOriginalIndex(displayIndex);
        if (episodes[originalIndex]) {
          onEpisodeClick(episodes[originalIndex], originalIndex);
        }
      }
    }, [episodes, onEpisodeClick, getOriginalIndex]),
  });

  const showReverseToggle = episodes && episodes.length > 1;

  return (
    <Card hover={false}>
      <h3 className="text-lg sm:text-xl font-bold text-[var(--text-color)] mb-4 flex items-center gap-2">
        <Icons.List size={20} className="sm:w-6 sm:h-6" />
        <span>选集</span>
        {episodes && (
          <Badge variant="primary">{episodes.length}</Badge>
        )}
        {/* Reverse order toggle button - only show when more than 1 episode */}
        {showReverseToggle && (
          <button
            onClick={() => onToggleReverse?.(!isReversed)}
            className={`
              ml-auto p-1.5 rounded-[var(--radius-2xl)] transition-all duration-200
              ${isReversed
                ? 'bg-[var(--accent-color)] text-white'
                : 'bg-[var(--glass-bg)] text-[var(--text-color-secondary)] hover:bg-[var(--glass-hover)] border border-[var(--glass-border)]'
              }
            `}
            aria-label={isReversed ? '恢复正序' : '倒序排列'}
            title={isReversed ? '恢复正序' : '倒序排列'}
          >
            <Icons.ArrowUpDown size={16} />
          </button>
        )}
      </h3>

      <div
        ref={listRef}
        className="max-h-[400px] sm:max-h-[600px] overflow-y-auto space-y-2 pr-2"
        role="radiogroup"
        aria-label="剧集选择"
      >
        {displayEpisodes && displayEpisodes.length > 0 ? (
          displayEpisodes.map((episode, displayIndex) => {
            const originalIndex = getOriginalIndex(displayIndex);
            const isCurrentEpisode = currentEpisode === originalIndex;

            return (
              <button
                key={originalIndex}
                ref={(el) => { buttonRefs.current[displayIndex] = el; }}
                onClick={() => onEpisodeClick(episode, originalIndex)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onEpisodeClick(episode, originalIndex);
                  }
                }}
                tabIndex={0}
                role="radio"
                aria-checked={isCurrentEpisode}
                aria-current={isCurrentEpisode ? 'true' : undefined}
                aria-label={`${episode.name || `第 ${originalIndex + 1} 集`}${isCurrentEpisode ? '，当前播放' : ''}`}
                className={`
                  w-full px-3 py-2 sm:px-4 sm:py-3 rounded-[var(--radius-2xl)] text-left transition-[var(--transition-fluid)] cursor-pointer
                  ${isCurrentEpisode
                    ? 'bg-[var(--accent-color)] text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent-color)_50%,transparent)] brightness-110'
                    : 'bg-[var(--glass-bg)] hover:bg-[var(--glass-hover)] text-[var(--text-color)] border border-[var(--glass-border)]'
                  }
                  focus-visible:ring-2 focus-visible:ring-[var(--accent-color)] focus-visible:ring-offset-2
                `}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-sm sm:text-base">
                    {episode.name || `第 ${originalIndex + 1} 集`}
                  </span>
                  {isCurrentEpisode && (
                    <Icons.Play size={16} />
                  )}
                </div>
              </button>
            );
          })
        ) : (
          <div className="text-center py-8 text-[var(--text-secondary)]">
            <Icons.Inbox size={48} className="text-[var(--text-color-secondary)] mx-auto mb-2" />
            <p>暂无剧集信息</p>
          </div>
        )}
      </div>
    </Card>
  );
}
