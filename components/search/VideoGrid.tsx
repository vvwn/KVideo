'use client';

import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { VideoCard } from './VideoCard';
import { VideoGroupCard, GroupedVideo } from './VideoGroupCard';
import { settingsStore } from '@/lib/store/settings-store';
import { Video } from '@/lib/types';

interface VideoGridProps {
  videos: Video[];
  className?: string;
}

export const VideoGrid = memo(function VideoGrid({ videos, className = '' }: VideoGridProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const [displayMode, setDisplayMode] = useState<'normal' | 'grouped'>('normal');
  const gridRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Load display mode from settings
  useEffect(() => {
    const settings = settingsStore.getSettings();
    setDisplayMode(settings.searchDisplayMode);

    const unsubscribe = settingsStore.subscribe(() => {
      const newSettings = settingsStore.getSettings();
      setDisplayMode(newSettings.searchDisplayMode);
    });

    return () => unsubscribe();
  }, []);

  if (videos.length === 0) {
    return null;
  }

  // Group videos by name when in grouped mode
  const groupedVideos = useMemo<GroupedVideo[]>(() => {
    if (displayMode !== 'grouped') return [];

    const groups = new Map<string, Video[]>();

    videos.forEach(video => {
      const name = video.vod_name.toLowerCase().trim();
      if (!groups.has(name)) {
        groups.set(name, []);
      }
      groups.get(name)!.push(video);
    });

    return Array.from(groups.entries()).map(([, groupVideos]) => {
      // Sort by latency (lowest first) 
      const sorted = [...groupVideos].sort((a, b) => {
        if (a.latency === undefined) return 1;
        if (b.latency === undefined) return -1;
        return a.latency - b.latency;
      });

      return {
        representative: sorted[0],
        videos: sorted,
        name: sorted[0].vod_name,
      };
    });
  }, [videos, displayMode]);

  // Callback ref for the load more trigger
  const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();

    if (node) {
      observerRef.current = new IntersectionObserver(entries => {
        if (entries[0].isIntersecting) {
          setVisibleCount(prev => prev + 24);
        }
      }, { rootMargin: '400px' });

      observerRef.current.observe(node);
    }
  }, []);

  // Memoize the click handler
  const handleCardClick = useCallback((e: React.MouseEvent, videoId: string, videoUrl: string) => {
    const isMobile = window.innerWidth < 1024;

    if (isMobile) {
      if (activeCardId === videoId) {
        window.location.href = videoUrl;
      } else {
        e.preventDefault();
        setActiveCardId(videoId);
      }
    }
  }, [activeCardId]);

  // Normal mode items
  const videoItems = useMemo(() => {
    if (displayMode === 'grouped') return [];

    return videos.map((video, index) => {
      const videoUrl = `/player?${new URLSearchParams({
        id: String(video.vod_id),
        source: video.source,
        title: video.vod_name,
      }).toString()}`;

      const cardId = `${video.vod_id}-${index}`;

      return { video, videoUrl, cardId };
    });
  }, [videos, displayMode]);

  // Grouped mode items
  const groupItems = useMemo(() => {
    if (displayMode !== 'grouped') return [];

    return groupedVideos.map((group, index) => ({
      group,
      cardId: `group-${group.representative.vod_id}-${index}`,
    }));
  }, [groupedVideos, displayMode]);

  const totalItems = displayMode === 'grouped' ? groupItems.length : videoItems.length;

  return (
    <>
      <div
        ref={gridRef}
        className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-6 gap-3 md:gap-4 lg:gap-6 max-w-[1920px] mx-auto ${className}`}
        role="list"
        aria-label="视频搜索结果"
      >
        {displayMode === 'grouped' ? (
          // Grouped mode
          groupItems.slice(0, visibleCount).map(({ group, cardId }) => {
            const isActive = activeCardId === cardId;
            return (
              <VideoGroupCard
                key={cardId}
                group={group}
                cardId={cardId}
                isActive={isActive}
                onCardClick={handleCardClick}
              />
            );
          })
        ) : (
          // Normal mode
          videoItems.slice(0, visibleCount).map(({ video, videoUrl, cardId }) => {
            const isActive = activeCardId === cardId;
            return (
              <VideoCard
                key={cardId}
                video={video}
                videoUrl={videoUrl}
                cardId={cardId}
                isActive={isActive}
                onCardClick={handleCardClick}
              />
            );
          })
        )}
      </div>

      {/* Load more trigger */}
      {visibleCount < totalItems && (
        <div
          ref={loadMoreRef}
          className="h-20 w-full flex items-center justify-center opacity-0 pointer-events-none"
          aria-hidden="true"
        />
      )}
    </>
  );
});

