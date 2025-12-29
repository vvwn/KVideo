import { useMemo } from 'react';
import { usePlaybackControls } from './desktop/usePlaybackControls';
import { useVolumeControls } from './desktop/useVolumeControls';
import { useProgressControls } from './desktop/useProgressControls';
import { useSkipControls } from './desktop/useSkipControls';
import { useFullscreenControls } from './desktop/useFullscreenControls';
import { useControlsVisibility } from './desktop/useControlsVisibility';
import { useUtilities } from './desktop/useUtilities';
import { useDesktopShortcuts } from './desktop/useDesktopShortcuts';
import { useDesktopPlayerState } from './useDesktopPlayerState';
import { getCopyUrl } from '../utils/urlUtils';
import { useCastControls } from './desktop/useCastControls';

type DesktopPlayerState = ReturnType<typeof useDesktopPlayerState>;

interface UseDesktopPlayerLogicProps {
    src: string;
    initialTime: number;
    shouldAutoPlay: boolean;
    onError?: (error: string) => void;
    onTimeUpdate?: (currentTime: number, duration: number) => void;
    refs: DesktopPlayerState['refs'];
    data: DesktopPlayerState['data'];
    actions: DesktopPlayerState['actions'];
}

export function useDesktopPlayerLogic({
    src,
    initialTime,
    shouldAutoPlay,
    onError,
    onTimeUpdate,
    refs,
    data,
    actions
}: UseDesktopPlayerLogicProps) {
    const {
        videoRef, containerRef, progressBarRef, volumeBarRef,
        controlsTimeoutRef, speedMenuTimeoutRef, skipForwardTimeoutRef,
        skipBackwardTimeoutRef, volumeBarTimeoutRef, isDraggingProgressRef,
        isDraggingVolumeRef, mouseMoveThrottleRef, toastTimeoutRef
    } = refs;

    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isFullscreen,
        showControls,
        isLoading,
        playbackRate,
        showSpeedMenu,
        isPiPSupported,
        isAirPlaySupported,
        skipForwardAmount,
        skipBackwardAmount,
        showSkipForwardIndicator,
        showSkipBackwardIndicator,
        showMoreMenu
    } = data;

    const {
        setIsPlaying,
        setCurrentTime,
        setDuration,
        setVolume,
        setIsMuted,
        setIsFullscreen,
        setShowControls,
        setIsLoading,
        setPlaybackRate,
        setShowSpeedMenu,
        setIsPiPSupported,
        setIsAirPlaySupported,
        setSkipForwardAmount,
        setSkipBackwardAmount,
        setShowSkipForwardIndicator,
        setShowSkipBackwardIndicator,
        setIsSkipForwardAnimatingOut,
        setIsSkipBackwardAnimatingOut,
        setShowVolumeBar,
        setToastMessage,
        setShowToast,
        setIsCastAvailable,
        setIsCasting,
        setShowMoreMenu
    } = actions;

    const playbackControls = usePlaybackControls({
        videoRef, isPlaying, setIsPlaying, setIsLoading,
        initialTime, shouldAutoPlay, setDuration, setCurrentTime, onTimeUpdate, onError,
        isDraggingProgressRef, speedMenuTimeoutRef, setPlaybackRate, setShowSpeedMenu
    });

    const volumeControls = useVolumeControls({
        videoRef, volumeBarRef, volume, isMuted,
        setVolume, setIsMuted, setShowVolumeBar,
        volumeBarTimeoutRef, isDraggingVolumeRef
    });

    const progressControls = useProgressControls({
        videoRef, progressBarRef, duration,
        setCurrentTime, isDraggingProgressRef
    });

    const skipControls = useSkipControls({
        videoRef, duration, setCurrentTime,
        showSkipForwardIndicator, showSkipBackwardIndicator,
        skipForwardAmount, skipBackwardAmount,
        setShowSkipForwardIndicator, setShowSkipBackwardIndicator,
        setSkipForwardAmount, setSkipBackwardAmount,
        setIsSkipForwardAnimatingOut, setIsSkipBackwardAnimatingOut,
        skipForwardTimeoutRef, skipBackwardTimeoutRef
    });

    const fullscreenControls = useFullscreenControls({
        containerRef, videoRef, isFullscreen, setIsFullscreen,
        isPiPSupported, isAirPlaySupported, setIsPiPSupported, setIsAirPlaySupported
    });

    const controlsVisibility = useControlsVisibility({
        isPlaying, showControls, showSpeedMenu, showMoreMenu,
        setShowControls, setShowSpeedMenu, setShowMoreMenu,
        controlsTimeoutRef, speedMenuTimeoutRef, mouseMoveThrottleRef
    });

    const utilities = useUtilities({
        src, setToastMessage, setShowToast, toastTimeoutRef
    });

    const castControls = useCastControls({
        src, videoRef, setIsCastAvailable, setIsCasting
    });

    useDesktopShortcuts({
        videoRef, isPlaying, volume, isPiPSupported,
        togglePlay: playbackControls.togglePlay,
        toggleMute: volumeControls.toggleMute,
        toggleFullscreen: fullscreenControls.toggleFullscreen,
        togglePictureInPicture: fullscreenControls.togglePictureInPicture,
        skipForward: skipControls.skipForward,
        skipBackward: skipControls.skipBackward,
        showVolumeBarTemporarily: volumeControls.showVolumeBarTemporarily,
        setShowControls, setVolume, setIsMuted, controlsTimeoutRef
    });

    return useMemo(() => ({
        handleMouseMove: controlsVisibility.handleMouseMove,
        togglePlay: playbackControls.togglePlay,
        handlePlay: playbackControls.handlePlay,
        handlePause: playbackControls.handlePause,
        handleTimeUpdateEvent: playbackControls.handleTimeUpdateEvent,
        handleLoadedMetadata: playbackControls.handleLoadedMetadata,
        handleVideoError: playbackControls.handleVideoError,
        handleProgressClick: progressControls.handleProgressClick,
        handleProgressMouseDown: progressControls.handleProgressMouseDown,
        toggleMute: volumeControls.toggleMute,
        showVolumeBarTemporarily: volumeControls.showVolumeBarTemporarily,
        handleVolumeChange: volumeControls.handleVolumeChange,
        handleVolumeMouseDown: volumeControls.handleVolumeMouseDown,
        toggleFullscreen: fullscreenControls.toggleFullscreen,
        togglePictureInPicture: fullscreenControls.togglePictureInPicture,
        showAirPlayMenu: fullscreenControls.showAirPlayMenu,
        showCastMenu: castControls.showCastMenu,
        skipForward: skipControls.skipForward,
        skipBackward: skipControls.skipBackward,
        changePlaybackSpeed: playbackControls.changePlaybackSpeed,
        handleCopyLink: (type: 'original' | 'proxy' = 'original') => {
            const urlToCopy = getCopyUrl(src, type);
            utilities.handleCopyLink(urlToCopy);
        },
        startSpeedMenuTimeout: controlsVisibility.startSpeedMenuTimeout,
        clearSpeedMenuTimeout: controlsVisibility.clearSpeedMenuTimeout,
        formatTime: playbackControls.formatTime
    }), [
        src,
        controlsVisibility,
        playbackControls,
        progressControls,
        volumeControls,
        fullscreenControls,
        castControls,
        skipControls,
        utilities
    ]);
}
