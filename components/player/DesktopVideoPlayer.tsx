'use client';

import React from 'react';
import { useDesktopPlayerState } from './hooks/useDesktopPlayerState';
import { useDesktopPlayerLogic } from './hooks/useDesktopPlayerLogic';
import { useHlsPlayer } from './hooks/useHlsPlayer';
import { useAutoSkip } from './hooks/useAutoSkip';
import { DesktopControlsWrapper } from './desktop/DesktopControlsWrapper';
import { DesktopOverlayWrapper } from './desktop/DesktopOverlayWrapper';

interface DesktopVideoPlayerProps {
  src: string;
  poster?: string;
  onError?: (error: string) => void;
  onTimeUpdate?: (currentTime: number, duration: number) => void;
  initialTime?: number;
  shouldAutoPlay?: boolean;
  // Episode navigation props for auto-skip/auto-next
  totalEpisodes?: number;
  currentEpisodeIndex?: number;
  onNextEpisode?: () => void;
  isReversed?: boolean;
}

export function DesktopVideoPlayer({
  src,
  poster,
  onError,
  onTimeUpdate,
  initialTime = 0,
  shouldAutoPlay = false,
  totalEpisodes = 1,
  currentEpisodeIndex = 0,
  onNextEpisode,
  isReversed = false,
}: DesktopVideoPlayerProps) {
  const { refs, data, actions } = useDesktopPlayerState();

  // Initialize HLS Player
  useHlsPlayer({
    videoRef: refs.videoRef,
    src,
    autoPlay: shouldAutoPlay
  });

  const {
    videoRef,
    containerRef,
  } = refs;

  const {
    isPlaying,
    currentTime,
    duration,
  } = data;

  const {
    setShowControls,
    setIsLoading,
    setCurrentTime,
    setDuration,
  } = actions;

  // Reset loading state and show spinner when source changes
  React.useEffect(() => {
    setIsLoading(true);
  }, [src, setIsLoading]);

  const logic = useDesktopPlayerLogic({
    src,
    initialTime,
    shouldAutoPlay,
    onError,
    onTimeUpdate,
    refs,
    data,
    actions
  });

  // Auto-skip intro/outro and auto-next episode
  const { isOutroActive } = useAutoSkip({
    videoRef,
    currentTime,
    duration,
    isPlaying,
    totalEpisodes,
    currentEpisodeIndex,
    onNextEpisode,
    isReversed,
    src,
  });

  const {
    handleMouseMove,
    togglePlay,
    handlePlay,
    handlePause,
    handleTimeUpdateEvent,
    handleLoadedMetadata,
    handleVideoError,
  } = logic;

  return (
    <div
      ref={containerRef}
      className="relative aspect-video bg-black rounded-[var(--radius-2xl)] overflow-hidden group"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        poster={poster}
        x-webkit-airplay="allow"
        onPlay={handlePlay}
        onPause={handlePause}
        onTimeUpdate={handleTimeUpdateEvent}
        onLoadedMetadata={handleLoadedMetadata}
        onError={handleVideoError}
        onWaiting={() => setIsLoading(true)}
        onCanPlay={() => setIsLoading(false)}
        onClick={togglePlay}
      />

      <DesktopOverlayWrapper
        data={data}
        actions={actions}
        showControls={data.showControls}
        onTogglePlay={togglePlay}
        onSkipForward={logic.skipForward}
        onSkipBackward={logic.skipBackward}
        // More Menu Props
        showMoreMenu={data.showMoreMenu}
        isProxied={src.includes('/api/proxy')}
        onToggleMoreMenu={() => actions.setShowMoreMenu(!data.showMoreMenu)}
        onMoreMenuMouseEnter={() => {
          if (refs.moreMenuTimeoutRef.current) {
            clearTimeout(refs.moreMenuTimeoutRef.current);
            refs.moreMenuTimeoutRef.current = null;
          }
        }}
        onMoreMenuMouseLeave={() => {
          if (refs.moreMenuTimeoutRef.current) {
            clearTimeout(refs.moreMenuTimeoutRef.current);
          }
          refs.moreMenuTimeoutRef.current = setTimeout(() => {
            actions.setShowMoreMenu(false);
            refs.moreMenuTimeoutRef.current = null;
          }, 800); // Increased timeout for better stability
        }}
        onCopyLink={logic.handleCopyLink}
        // Speed Menu Props
        playbackRate={data.playbackRate}
        showSpeedMenu={data.showSpeedMenu}
        speeds={[0.5, 0.75, 1, 1.25, 1.5, 2]}
        onToggleSpeedMenu={() => actions.setShowSpeedMenu(!data.showSpeedMenu)}
        onSpeedChange={logic.changePlaybackSpeed}
        onSpeedMenuMouseEnter={logic.clearSpeedMenuTimeout}
        onSpeedMenuMouseLeave={logic.startSpeedMenuTimeout}
        // Portal container
        containerRef={containerRef}
      />

      <DesktopControlsWrapper
        src={src}
        data={data}
        actions={actions}
        logic={logic}
        refs={refs}
      />
    </div>
  );
}
