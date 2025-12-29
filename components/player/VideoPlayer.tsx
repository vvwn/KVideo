'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card } from '@/components/ui/Card';
import { useHistoryStore } from '@/lib/store/history-store';
import { settingsStore } from '@/lib/store/settings-store';
import { CustomVideoPlayer } from './CustomVideoPlayer';
import { VideoPlayerError } from './VideoPlayerError';
import { VideoPlayerEmpty } from './VideoPlayerEmpty';

interface VideoPlayerProps {
  playUrl: string;
  videoId?: string;
  currentEpisode: number;
  onBack: () => void;
  // Episode navigation props for auto-skip/auto-next
  totalEpisodes?: number;
  onNextEpisode?: () => void;
  isReversed?: boolean;
}

export function VideoPlayer({
  playUrl,
  videoId,
  currentEpisode,
  onBack,
  totalEpisodes,
  onNextEpisode,
  isReversed = false
}: VideoPlayerProps) {
  const [videoError, setVideoError] = useState<string>('');
  const [useProxy, setUseProxy] = useState(false);
  const [shouldAutoPlay, setShouldAutoPlay] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_MANUAL_RETRIES = 20;
  const lastSaveTimeRef = useRef(0);
  const currentTimeRef = useRef(0);
  const durationRef = useRef(0);
  const SAVE_INTERVAL = 5000; // 5 seconds throttle

  // Get showModeIndicator setting
  const [showModeIndicator, setShowModeIndicator] = useState(false);
  useEffect(() => {
    setShowModeIndicator(settingsStore.getSettings().showModeIndicator);
  }, []);

  // Use reactive hook to subscribe to history updates
  // This ensures the component re-renders when history is hydrated from localStorage
  const viewingHistory = useHistoryStore(state => state.viewingHistory);
  const searchParams = useSearchParams();
  const { addToHistory } = useHistoryStore();

  // Get video metadata from URL params
  const source = searchParams.get('source') || '';
  const title = searchParams.get('title') || '未知视频';

  // Get saved progress for this video
  const getSavedProgress = () => {
    if (!videoId) return 0;

    // Directly check HistoryStore for progress
    // We prioritize a strict match (including source), but fall back to any match for this video/episode
    // This fixes issues where the source parameter might be missing or different
    const historyItem = viewingHistory.find(item =>
      item.videoId.toString() === videoId?.toString() &&
      item.episodeIndex === currentEpisode &&
      (source ? item.source === source : true)
    ) || viewingHistory.find(item =>
      item.videoId.toString() === videoId?.toString() &&
      item.episodeIndex === currentEpisode
    );

    return historyItem ? historyItem.playbackPosition : 0;
  };

  // Save progress function (used by throttle and beforeunload)
  const saveProgress = useCallback((currentTime: number, duration: number) => {
    if (!videoId || !playUrl || duration === 0 || currentTime <= 1) return;
    addToHistory(
      videoId,
      title,
      playUrl,
      currentEpisode,
      source,
      currentTime,
      duration,
      undefined,
      []
    );
  }, [videoId, playUrl, title, currentEpisode, source, addToHistory]);

  // Handle time updates and save progress (throttled to every 5 seconds)
  const handleTimeUpdate = useCallback((currentTime: number, duration: number) => {
    // Always track current time for beforeunload
    currentTimeRef.current = currentTime;
    durationRef.current = duration;

    if (!videoId || !playUrl || duration === 0) return;

    const now = Date.now();
    // Only save if enough time has passed since last save
    if (currentTime > 1 && now - lastSaveTimeRef.current >= SAVE_INTERVAL) {
      lastSaveTimeRef.current = now;
      saveProgress(currentTime, duration);
    }
  }, [videoId, playUrl, saveProgress]);

  // Save on page leave/refresh
  useEffect(() => {
    const handleBeforeUnload = () => {
      // Save current progress before leaving
      if (currentTimeRef.current > 1 && durationRef.current > 0) {
        saveProgress(currentTimeRef.current, durationRef.current);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveProgress]);

  // Handle video errors
  const handleVideoError = (error: string) => {
    console.error('Video playback error:', error);

    // Auto-retry with proxy if not already using it
    if (!useProxy) {
      setUseProxy(true);
      setShouldAutoPlay(true); // Force autoplay after proxy retry
      setVideoError('');
      return;
    }

    setVideoError(error);
  };

  const handleRetry = () => {
    if (retryCount >= MAX_MANUAL_RETRIES) return;

    setRetryCount(prev => prev + 1);
    setVideoError('');
    setShouldAutoPlay(true);
    // Toggle proxy to try different path, but since we are already in error state which likely means proxy failed (or direct failed),
    // we can try toggling or just force re-render.
    // Requirement says: "try without proxy and proxy and same as before"
    // We will just toggle useProxy state to force a refresh with/without proxy.
    // However, if we want to cycle, we can just toggle.
    // But the requirement says "proxy attempt count to 20".
    // So we just increment count and maybe toggle proxy or keep it.
    // Let's toggle it to give best chance.
    // Actually requirement says "try no proxy and proxy and same as before".
    // So simple toggle is fine.
    setUseProxy(prev => !prev);
  };

  const finalPlayUrl = useProxy
    ? `/api/proxy?url=${encodeURIComponent(playUrl)}&retry=${retryCount}` // Add retry param to force fresh request
    : playUrl;

  if (!playUrl) {
    return <VideoPlayerEmpty />;
  }

  return (
    <Card hover={false} className="p-0 overflow-hidden relative">
      {/* Mode Indicator Badge - controlled by settings */}
      {showModeIndicator && (
        <div className="absolute top-3 right-3 z-30">
          <span className={`px-2 py-1 text-xs font-medium rounded-full backdrop-blur-md transition-all duration-300 ${useProxy
            ? 'bg-orange-500/80 text-white'
            : 'bg-green-500/80 text-white'
            }`}>
            {useProxy ? '代理模式' : '直连模式'}
          </span>
        </div>
      )}
      {videoError ? (
        <VideoPlayerError
          error={videoError}
          onBack={onBack}
          onRetry={handleRetry}
          retryCount={retryCount}
          maxRetries={MAX_MANUAL_RETRIES}
        />
      ) : (
        <CustomVideoPlayer
          key={`${useProxy ? 'proxy' : 'direct'}-${retryCount}-${finalPlayUrl}`} // Force remount when switching modes, retrying, or changing source
          src={finalPlayUrl}
          onError={handleVideoError}
          onTimeUpdate={handleTimeUpdate}
          initialTime={getSavedProgress()}
          shouldAutoPlay={shouldAutoPlay}
          totalEpisodes={totalEpisodes}
          currentEpisodeIndex={currentEpisode}
          onNextEpisode={onNextEpisode}
          isReversed={isReversed}
        />
      )}
    </Card>
  );
}
