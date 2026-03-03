import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import SpeedLoader from './SpeedLoader';

/**
 * Shows the SpeedLoader overlay briefly on every route change.
 * Skips the very first mount so it doesn't clash with SplashScreen.
 */
export default function RouteTransitionLoader() {
    const location = useLocation();
    const isFirstMount = useRef(true);
    const [phase, setPhase] = useState('idle'); // 'idle' | 'visible' | 'fading'

    useEffect(() => {
        /* Skip the initial page load */
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }

        setPhase('visible');

        /* Show for 600ms, then start fade-out */
        const showTimer = setTimeout(() => setPhase('fading'), 600);

        /* Remove after fade-out animation (400ms matches CSS) */
        const hideTimer = setTimeout(() => setPhase('idle'), 1000);

        return () => {
            clearTimeout(showTimer);
            clearTimeout(hideTimer);
        };
    }, [location.pathname]);

    if (phase === 'idle') return null;

    return (
        <SpeedLoader
            className={phase === 'fading' ? 'fade-out' : ''}
        />
    );
}
