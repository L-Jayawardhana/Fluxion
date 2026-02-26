import { useState, useEffect, useRef } from 'react';
import './SplashScreen.css';

const STATUS_MESSAGES = [
    'Loading workspace...',
    'Initialising asset registry...',
    'Establishing secure connection...',
    'Preparing your dashboard...',
    'Ready.',
];

export default function SplashScreen({ onComplete }) {
    const [statusIdx, setStatusIdx] = useState(0);
    const [exiting, setExiting] = useState(false);
    const [hidden, setHidden] = useState(false);
    const intervalRef = useRef(null);
    const statusRef = useRef(null);

    useEffect(() => {
        // Cycle status messages
        intervalRef.current = setInterval(() => {
            setStatusIdx(prev => {
                if (prev >= STATUS_MESSAGES.length - 1) {
                    clearInterval(intervalRef.current);
                    return prev;
                }
                // Fade out then in
                if (statusRef.current) {
                    statusRef.current.style.opacity = '0';
                    setTimeout(() => {
                        if (statusRef.current) statusRef.current.style.opacity = '1';
                    }, 200);
                }
                return prev + 1;
            });
        }, 500);

        // Exit splash after 3.2s
        const exitTimer = setTimeout(() => {
            setExiting(true);
            setTimeout(() => {
                setHidden(true);
                onComplete?.();
            }, 750);
        }, 3200);

        return () => {
            clearInterval(intervalRef.current);
            clearTimeout(exitTimer);
        };
    }, [onComplete]);

    if (hidden) return null;

    return (
        <>
            <div className="splash-noise" style={{ display: exiting ? 'none' : undefined }}></div>
            <div id="splash-screen" className={exiting ? 'splash-exit' : ''}>
                {/* Scan line */}
                <div className="splash-scan-line"></div>

                {/* Corners */}
                <div className="splash-corner sc-tl">SYS:BOOT<br />v4.0.0</div>
                <div className="splash-corner sc-tr">FLUXION<br />INITIALIZING</div>
                <div className="splash-corner sc-bl">© 2025 FLUXION</div>
                <div className="splash-corner sc-br">ASSET MGMT<br />PLATFORM</div>

                {/* Center */}
                <div className="splash-center">
                    <div className="splash-logo-wrap">
                        <div className="splash-orbit splash-orbit-1"></div>
                        <div className="splash-orbit splash-orbit-2"></div>
                        <div className="splash-orbit splash-orbit-3"></div>
                        <div className="splash-orbit-spin"></div>
                        <div className="splash-orbit-dot"></div>
                        <div className="splash-orbit-dot"></div>

                        <div className="splash-logo-square">
                            <img src="/LOGOblack.png" alt="FLUXION" className="splash-logo-img" />
                        </div>
                    </div>

                    {/* Wordmark */}
                    <div className="splash-wordmark">
                        <div className="splash-wordmark-inner">
                            <span>F</span><span>L</span><span>U</span><span>X</span><span>I</span><span>O</span><span>N</span>
                        </div>
                    </div>

                    {/* Tagline */}
                    <div className="splash-tagline">
                        <div className="splash-tagline-inner">Enterprise Asset &amp; Maintenance Management</div>
                    </div>
                </div>

                {/* Progress */}
                <div className="splash-progress-wrap">
                    <div className="splash-progress-bar"></div>
                </div>

                {/* Status */}
                <div className="splash-status" ref={statusRef}>{STATUS_MESSAGES[statusIdx]}</div>
            </div>
        </>
    );
}
