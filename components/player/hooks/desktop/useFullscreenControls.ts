import { useCallback, useEffect, useMemo } from 'react';

interface UseFullscreenControlsProps {
    containerRef: React.RefObject<HTMLDivElement | null>;
    videoRef: React.RefObject<HTMLVideoElement | null>;
    isFullscreen: boolean;
    setIsFullscreen: (fullscreen: boolean) => void;
    isPiPSupported: boolean;
    isAirPlaySupported: boolean;
    setIsPiPSupported: (supported: boolean) => void;
    setIsAirPlaySupported: (supported: boolean) => void;
}

export function useFullscreenControls({
    containerRef,
    videoRef,
    isFullscreen,
    setIsFullscreen,
    isPiPSupported,
    isAirPlaySupported,
    setIsPiPSupported,
    setIsAirPlaySupported
}: UseFullscreenControlsProps) {
    useEffect(() => {
        if (typeof document !== 'undefined') {
            setIsPiPSupported('pictureInPictureEnabled' in document);
        }
        if (typeof window !== 'undefined') {
            setIsAirPlaySupported('WebKitPlaybackTargetAvailabilityEvent' in window);
        }
    }, [setIsPiPSupported, setIsAirPlaySupported]);

    const toggleFullscreen = useCallback(async () => {
        if (!containerRef.current) return;

        if (!isFullscreen) {
            try {
                if (containerRef.current.requestFullscreen) {
                    await containerRef.current.requestFullscreen();
                } else if ((containerRef.current as any).webkitRequestFullscreen) {
                    await (containerRef.current as any).webkitRequestFullscreen();
                } else if ((containerRef.current as any).mozRequestFullScreen) {
                    await (containerRef.current as any).mozRequestFullScreen();
                } else if ((containerRef.current as any).msRequestFullscreen) {
                    await (containerRef.current as any).msRequestFullscreen();
                } else if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
                    // Fallback for browsers that only support fullscreen on video element (like some car browsers)
                    (videoRef.current as any).webkitEnterFullscreen();
                }

                // Lock orientation to landscape on mobile devices if supported
                if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
                    try {
                        await (window.screen as any).orientation.lock('landscape');
                    } catch (e) {
                        console.warn('Orientation lock failed:', e);
                    }
                }
            } catch (error) {
                console.warn('Fullscreen request failed, trying fallback:', error);
                // Last ditch effort: try native video fullscreen if container failed
                if (videoRef.current && (videoRef.current as any).webkitEnterFullscreen) {
                    try {
                        (videoRef.current as any).webkitEnterFullscreen();
                    } catch (e) {
                        console.error('Final fullscreen fallback failed:', e);
                    }
                }
            }
        } else {
            try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await (document as any).webkitExitFullscreen();
                } else if ((document as any).mozCancelFullScreen) {
                    await (document as any).mozCancelFullScreen();
                } else if ((document as any).msExitFullscreen) {
                    await (document as any).msExitFullscreen();
                }

                // Unlock orientation when exiting fullscreen
                if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.unlock) {
                    try {
                        (window.screen as any).orientation.unlock();
                    } catch (e) {
                        console.warn('Orientation unlock failed:', e);
                    }
                }
            } catch (error) {
                console.error('Failed to exit fullscreen:', error);
            }
        }
    }, [containerRef, videoRef, isFullscreen]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isInFullscreen = !!(
                document.fullscreenElement ||
                (document as any).webkitFullscreenElement ||
                (document as any).mozFullScreenElement ||
                (document as any).msFullscreenElement
            );
            setIsFullscreen(isInFullscreen);

            // Double check orientation lock/unlock on change
            if (isInFullscreen) {
                if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.lock) {
                    (window.screen as any).orientation.lock('landscape').catch(() => { });
                }
            } else {
                if (window.screen && (window.screen as any).orientation && (window.screen as any).orientation.unlock) {
                    try {
                        (window.screen as any).orientation.unlock();
                    } catch (e) { }
                }
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', handleFullscreenChange);

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
            document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
        };
    }, [setIsFullscreen]);

    const togglePictureInPicture = useCallback(async () => {
        if (!videoRef.current || !isPiPSupported) return;
        try {
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                await videoRef.current.requestPictureInPicture();
            }
        } catch (error) {
            console.error('Failed to toggle Picture-in-Picture:', error);
        }
    }, [videoRef, isPiPSupported]);

    const showAirPlayMenu = useCallback(() => {
        if (!videoRef.current || !isAirPlaySupported) return;
        const video = videoRef.current as any;
        if (video.webkitShowPlaybackTargetPicker) {
            video.webkitShowPlaybackTargetPicker();
        }
    }, [videoRef, isAirPlaySupported]);

    const fullscreenActions = useMemo(() => ({
        toggleFullscreen,
        togglePictureInPicture,
        showAirPlayMenu
    }), [toggleFullscreen, togglePictureInPicture, showAirPlayMenu]);

    return fullscreenActions;
}
