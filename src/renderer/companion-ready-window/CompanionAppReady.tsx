import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import '../styles/index.css';
import { HotkeysAPI } from '../../shared/services/hotkeys';
import { kHotkeys } from '../../shared/consts';

const DISMISS_SECONDS = 10;

type HotkeyInfo = {
    label: string;
    binding: string;
};

function displayHotkey(binding: string | undefined, isUnassigned: boolean): string {
    if (isUnassigned || !binding || binding === 'Unassigned' || binding.trim() === '') {
        return 'Not set';
    }
    return binding;
}

const CompanionAppReady: React.FC = () => {
    const [secondsLeft, setSecondsLeft] = useState(DISMISS_SECONDS);
    const [hotkeys, setHotkeys] = useState<HotkeyInfo[]>([]);

    // Load hotkeys
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const hotkeysMap = await HotkeysAPI.fetchAll();

                const entries: HotkeyInfo[] = [
                    {
                        label: 'Toggle In-Game Main Window',
                        binding: displayHotkey(
                            hotkeysMap.get(kHotkeys.toggleMainIngameWindow)?.binding,
                            hotkeysMap.get(kHotkeys.toggleMainIngameWindow)?.IsUnassigned ?? true
                        ),
                    },
                    {
                        label: 'Toggle In-Game Rotation Window',
                        binding: displayHotkey(
                            hotkeysMap.get(kHotkeys.toggleRotationIngameWindow)?.binding,
                            hotkeysMap.get(kHotkeys.toggleRotationIngameWindow)?.IsUnassigned ?? true
                        ),
                    },
                ];

                if (!cancelled) setHotkeys(entries);
            } catch {
                if (!cancelled) {
                    setHotkeys([
                        { label: 'Toggle In-Game Main Window', binding: 'Not set' },
                        { label: 'Toggle In-Game Rotation Window', binding: 'Not set' },
                    ]);
                }
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    // Countdown timer
    useEffect(() => {
        if (secondsLeft <= 0) {
            // Close ourselves
            try {
                overwolf.windows.getCurrentWindow((result) => {
                    if (result.success && result.window) {
                        overwolf.windows.close(result.window.id);
                    }
                });
            } catch (e) {
                console.error('Failed to close companion ready window', e);
            }
            return;
        }

        const timer = setTimeout(() => {
            setSecondsLeft((prev) => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [secondsLeft]);

    const progress = ((DISMISS_SECONDS - secondsLeft) / DISMISS_SECONDS) * 100;

    return (
        <div className="companion-ready-window">
            <div className="companion-ready-content">
                <div className="companion-ready-title">Companion app is ready!</div>

                <div className="companion-ready-hotkeys">
                    <div className="companion-ready-hotkeys-label">Hotkeys</div>
                    {hotkeys.map((hk) => (
                        <div key={hk.label} className="companion-ready-hotkey-row">
                            <span className="companion-ready-hotkey-name">{hk.label}</span>
                            <span className="companion-ready-hotkey-binding">{hk.binding}</span>
                        </div>
                    ))}
                </div>

                <div className="companion-ready-timer">
                    <div className="companion-ready-timer-bar">
                        <div
                            className="companion-ready-timer-bar-fill"
                            style={{ width: `${100 - progress}%` }}
                        />
                    </div>
                    <span className="companion-ready-timer-text">
                        Closing in {secondsLeft}s
                    </span>
                </div>
            </div>
        </div>
    );
};

const mountApp = () => {
    const container = document.getElementById('root');
    if (!container) {
        console.error('Companion ready root element not found');
        return;
    }

    const root = createRoot(container);
    root.render(<CompanionAppReady />);
};

const bootstrap = async () => {
    mountApp();
};

bootstrap().catch((error) => {
    console.error('Failed to bootstrap companion ready window', error);
});
