import React from 'react';
import { DesktopOverlay } from './DesktopOverlay';
import { useDesktopPlayerState } from '../hooks/useDesktopPlayerState';

interface DesktopOverlayWrapperProps {
    data: ReturnType<typeof useDesktopPlayerState>['data'];
    actions: ReturnType<typeof useDesktopPlayerState>['actions'];
    showControls: boolean;
    onTogglePlay: () => void;
    onSkipForward: () => void;
    onSkipBackward: () => void;
    showMoreMenu: boolean;
    isProxied: boolean;
    onToggleMoreMenu: () => void;
    onMoreMenuMouseEnter: () => void;
    onMoreMenuMouseLeave: () => void;
    onCopyLink: (type?: 'original' | 'proxy') => void;
    // Speed Menu Props
    playbackRate: number;
    showSpeedMenu: boolean;
    speeds: number[];
    onToggleMoreMenu?: () => void; // Unused but kept for type safety if needed
    onToggleSpeedMenu: () => void;
    onSpeedChange: (speed: number) => void;
    onSpeedMenuMouseLeave: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function DesktopOverlayWrapper({
    data,
    actions,
    showControls,
    onTogglePlay,
    onSkipForward,
    onSkipBackward,
    showMoreMenu,
    isProxied,
    onToggleMoreMenu,
    onMouseEnter, // Note: The prop name was actually missing in destructuring or renamed? Let me check previous view_file.
    // Wait, the previous view_file of DesktopOverlayWrapper had these:
    onMoreMenuMouseEnter,
    onMoreMenuMouseLeave,
    onCopyLink,
    playbackRate,
    showSpeedMenu,
    speeds,
    onToggleSpeedMenu,
    onSpeedChange,
    onSpeedMenuMouseEnter,
    onSpeedMenuMouseLeave,
    containerRef,
}: DesktopOverlayWrapperProps) {
    const {
        isLoading,
        isPlaying,
        showSkipForwardIndicator,
        showSkipBackwardIndicator,
        skipForwardAmount,
        skipBackwardAmount,
        isSkipForwardAnimatingOut,
        isSkipBackwardAnimatingOut,
        showToast,
        toastMessage,
    } = data;

    return (
        <DesktopOverlay
            isLoading={isLoading}
            isPlaying={isPlaying}
            showSkipForwardIndicator={showSkipForwardIndicator}
            showSkipBackwardIndicator={showSkipBackwardIndicator}
            skipForwardAmount={skipForwardAmount}
            skipBackwardAmount={skipBackwardAmount}
            isSkipForwardAnimatingOut={isSkipForwardAnimatingOut}
            isSkipBackwardAnimatingOut={isSkipBackwardAnimatingOut}
            showToast={showToast}
            toastMessage={toastMessage}
            showControls={showControls}
            onTogglePlay={onTogglePlay}
            onSkipForward={onSkipForward}
            onSkipBackward={onSkipBackward}
            showMoreMenu={showMoreMenu}
            isProxied={isProxied}
            onToggleMoreMenu={onToggleMoreMenu}
            onMoreMenuMouseEnter={onMoreMenuMouseEnter}
            onMoreMenuMouseLeave={onMoreMenuMouseLeave}
            onCopyLink={onCopyLink}
            playbackRate={playbackRate}
            showSpeedMenu={showSpeedMenu}
            speeds={speeds}
            onToggleSpeedMenu={onToggleSpeedMenu}
            onSpeedChange={onSpeedChange}
            onSpeedMenuMouseEnter={onSpeedMenuMouseEnter}
            onSpeedMenuMouseLeave={onSpeedMenuMouseLeave}
            containerRef={containerRef}
        />
    );
}
