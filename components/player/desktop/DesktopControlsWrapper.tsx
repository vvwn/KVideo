import React from 'react';
import { DesktopControls } from './DesktopControls';
import { useDesktopPlayerState } from '../hooks/useDesktopPlayerState';
import { useDesktopPlayerLogic } from '../hooks/useDesktopPlayerLogic';

interface DesktopControlsWrapperProps {
    src: string;
    data: ReturnType<typeof useDesktopPlayerState>['data'];
    actions: ReturnType<typeof useDesktopPlayerState>['actions'];
    logic: ReturnType<typeof useDesktopPlayerLogic>;
    refs: ReturnType<typeof useDesktopPlayerState>['refs'];
}

export function DesktopControlsWrapper({ src, data, actions, logic, refs }: DesktopControlsWrapperProps) {
    const {
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        isFullscreen,
        showControls,
        showVolumeBar,
        isPiPSupported,
        isAirPlaySupported,
        isCastAvailable,
    } = data;

    const {
        togglePlay,
        toggleMute,
        handleVolumeChange,
        handleVolumeMouseDown,
        toggleFullscreen,
        togglePictureInPicture,
        showAirPlayMenu,
        showCastMenu,
        handleProgressClick,
        handleProgressMouseDown,
        formatTime,
    } = logic;

    const {
        progressBarRef,
        volumeBarRef,
    } = refs;

    const isProxied = src.includes('/api/proxy');

    return (
        <DesktopControls
            showControls={showControls}
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isMuted={isMuted}
            isFullscreen={isFullscreen}
            showVolumeBar={showVolumeBar}
            isPiPSupported={isPiPSupported}
            isAirPlaySupported={isAirPlaySupported}
            isCastAvailable={isCastAvailable}
            isProxied={isProxied}
            progressBarRef={progressBarRef}
            volumeBarRef={volumeBarRef}
            onTogglePlay={togglePlay}
            onToggleMute={toggleMute}
            onVolumeChange={handleVolumeChange}
            onVolumeMouseDown={handleVolumeMouseDown}
            onToggleFullscreen={toggleFullscreen}
            onTogglePictureInPicture={togglePictureInPicture}
            onShowAirPlayMenu={showAirPlayMenu}
            onShowCastMenu={showCastMenu}
            onProgressClick={handleProgressClick}
            onProgressMouseDown={handleProgressMouseDown}
            formatTime={formatTime}
        />
    );
}
