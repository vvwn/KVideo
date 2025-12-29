import React from 'react';
import { Icons } from '@/components/ui/Icon';

import { DesktopMoreMenu } from './DesktopMoreMenu';
import { DesktopSpeedMenu } from './DesktopSpeedMenu';

interface DesktopOverlayProps {
    isLoading: boolean;
    isPlaying: boolean;
    showSkipForwardIndicator: boolean;
    showSkipBackwardIndicator: boolean;
    skipForwardAmount: number;
    skipBackwardAmount: number;
    isSkipForwardAnimatingOut: boolean;
    isSkipBackwardAnimatingOut: boolean;
    showToast: boolean;
    toastMessage: string | null;
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
    onToggleSpeedMenu: () => void;
    onSpeedChange: (speed: number) => void;
    onSpeedMenuMouseEnter: () => void;
    onSpeedMenuMouseLeave: () => void;
    containerRef: React.RefObject<HTMLDivElement | null>;
}

export function DesktopOverlay({
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
    onTogglePlay,
    onSkipForward,
    onSkipBackward,
    showControls,
    showMoreMenu,
    isProxied,
    onToggleMoreMenu,
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
}: DesktopOverlayProps) {
    // Show navigation buttons when controls are visible or when paused (controls usually show when paused anyway)
    const showNavButtons = showControls || !isPlaying;

    return (
        <>
            {/* More Menu (Top Left) */}
            <div className={`absolute top-6 left-6 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} style={{ pointerEvents: showControls ? 'auto' : 'none' }}>
                <DesktopMoreMenu
                    showMoreMenu={showMoreMenu}
                    isProxied={isProxied}
                    onToggleMoreMenu={onToggleMoreMenu}
                    onMouseEnter={onMoreMenuMouseEnter}
                    onMouseLeave={onMoreMenuMouseLeave}
                    onCopyLink={onCopyLink}
                    containerRef={containerRef}
                />
            </div>

            {/* Speed Menu (Top Right) */}
            <div className={`absolute top-6 right-6 z-50 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`} style={{ pointerEvents: showControls ? 'auto' : 'none' }}>
                <DesktopSpeedMenu
                    showSpeedMenu={showSpeedMenu}
                    playbackRate={playbackRate}
                    speeds={speeds}
                    onSpeedChange={onSpeedChange}
                    onToggleSpeedMenu={onToggleSpeedMenu}
                    onMouseEnter={onSpeedMenuMouseEnter}
                    onMouseLeave={onSpeedMenuMouseLeave}
                    containerRef={containerRef}
                />
            </div>

            {/* Loading Spinner - Glass Effect */}
            {isLoading && (
                <div className="loading-overlay-glass">
                    <div className="spinner-glass"></div>
                </div>
            )}

            {/* Skip Backward Indicator (Animation) */}
            {showSkipBackwardIndicator && (
                <div className="absolute top-1/2 left-24 -translate-y-1/2 pointer-events-none transition-all duration-300 z-20">
                    <div className={`text-white text-3xl font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] ${isSkipBackwardAnimatingOut ? 'animate-scale-out' : 'animate-scale-in'
                        }`}>
                        -{skipBackwardAmount}s
                    </div>
                </div>
            )}

            {/* Skip Forward Indicator (Animation) */}
            {showSkipForwardIndicator && (
                <div className="absolute top-1/2 right-24 -translate-y-1/2 pointer-events-none transition-all duration-300 z-20">
                    <div className={`text-white text-3xl font-bold drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] ${isSkipForwardAnimatingOut ? 'animate-scale-out' : 'animate-scale-in'
                        }`}>
                        +{skipForwardAmount}s
                    </div>
                </div>
            )}

            {/* Previous Button (Method: Skip Backward) */}
            <div
                className={`absolute left-0 top-0 bottom-0 flex items-center justify-center p-4 md:p-8 transition-opacity duration-300 z-10 ${showNavButtons ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{ pointerEvents: showNavButtons ? 'auto' : 'none' }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSkipBackward();
                    }}
                    className="group flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95"
                    aria-label="Skip Backward 10s"
                >
                    <Icons.SkipBack className="w-6 h-6 md:w-8 md:h-8 text-white/80 group-hover:text-white" />
                </button>
            </div>

            {/* Next Button (Method: Skip Forward) - Refined to use FastForward icon */}
            <div
                className={`absolute right-0 top-0 bottom-0 flex items-center justify-center p-4 md:p-8 transition-opacity duration-300 z-10 ${showNavButtons ? 'opacity-100' : 'opacity-0'
                    }`}
                style={{ pointerEvents: showNavButtons ? 'auto' : 'none' }}
            >
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onSkipForward();
                    }}
                    className="group flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm transition-all duration-300 hover:scale-110 active:scale-95"
                    aria-label="Skip Forward 10s"
                >
                    <Icons.FastForward className="w-6 h-6 md:w-8 md:h-8 text-white/80 group-hover:text-white" />
                </button>
            </div>

            {/* Center Play Button (when paused) */}
            {!isPlaying && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
                    <button
                        onClick={onTogglePlay}
                        className="pointer-events-auto w-16 h-16 md:w-20 md:h-20 rounded-full bg-[var(--glass-bg)] backdrop-blur-[25px] saturate-[180%] border border-[var(--glass-border)] flex items-center justify-center transition-all duration-300 hover:scale-110 hover:bg-[var(--accent-color)] shadow-[var(--shadow-md)] will-change-transform cursor-pointer"
                        aria-label="Play"
                    >
                        <Icons.Play className="w-8 h-8 md:w-10 md:h-10 text-white ml-1" />
                    </button>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && toastMessage && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[200] animate-slide-up">
                    <div className="bg-[rgba(28,28,30,0.95)] backdrop-blur-[25px] rounded-[var(--radius-2xl)] border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.6)] px-6 py-3 flex items-center gap-3 min-w-[200px]">
                        <Icons.Check size={18} className="text-[#34c759] flex-shrink-0" />
                        <span className="text-white text-sm font-medium">{toastMessage}</span>
                    </div>
                </div>
            )}
        </>
    );
}
