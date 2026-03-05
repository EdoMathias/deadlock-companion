import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Character, CharacterAction } from '../types/rotations.types';
import { ACTION_TYPE_CONFIG } from '../consts/rotations.consts';

interface AbilityPickerProps {
    squad: Character[];
    anchorEl: HTMLElement | null;
    onSelect: (action: CharacterAction, character: Character) => void;
    onClose: () => void;
}

const AbilityPicker: React.FC<AbilityPickerProps> = ({ squad, anchorEl, onSelect, onClose }) => {

    const [hoveredCharacterId, setHoveredCharacterId] = useState<string | null>(null);
    const [placement, setPlacement] = useState<'right' | 'left'>('right');
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const pickerRef = useRef<HTMLDivElement>(null);

    const hoveredCharacter = squad.find(c => c.id === hoveredCharacterId) ?? null;

    // Position picker next to the anchor using fixed viewport coordinates
    useLayoutEffect(() => {
        if (!anchorEl || !pickerRef.current) return;

        const stepRect = anchorEl.getBoundingClientRect();
        const top = stepRect.top + stepRect.height / 2;

        // Check if it fits on the right, otherwise flip left
        const pickerWidth = pickerRef.current.offsetWidth;
        if (stepRect.right + 12 + pickerWidth > window.innerWidth) {
            setPlacement('left');
            setPosition({ top, left: stepRect.left - 12 });
        } else {
            setPosition({ top, left: stepRect.right + 12 });
        }
    }, [anchorEl]);

    // Close picker when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return createPortal(
        <div
            className={`ability-picker ${placement === 'left' ? 'ability-picker--left' : ''}`}
            ref={pickerRef}
            style={{
                top: position.top,
                left: placement === 'right' ? position.left : undefined,
                right: placement === 'left' ? window.innerWidth - position.left : undefined,
            }}
        >
            {/* Left panel: Character list */}
            <div className="ability-picker-characters">
                <div className="ability-picker-panel-header">
                    Select Character
                </div>
                <div className="ability-picker-characters-list">
                    {squad.map((character) => (
                        <div
                            key={character.id}
                            className={`ability-picker-character-item ${hoveredCharacterId === character.id ? 'ability-picker-character-item--active' : ''}`}
                            onMouseEnter={() => setHoveredCharacterId(character.id)}
                        >
                            <div className="ability-picker-character-info">
                                <div className="ability-picker-character-name">
                                    {character.name}
                                </div>
                            </div>
                            <span className="ability-picker-character-chevron">&#8250;</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right panel: Action list (shown when hovering a character) */}
            {hoveredCharacter && (
                <div className="ability-picker-actions">
                    <div className="ability-picker-panel-header">
                        Select Action
                    </div>
                    <div className="ability-picker-actions-list">
                        {hoveredCharacter.actions.map((action) => {
                            const config = ACTION_TYPE_CONFIG[action.type];
                            return (
                                <button
                                    key={action.id}
                                    type="button"
                                    className="ability-picker-action-item"
                                    onClick={() => onSelect(action, hoveredCharacter)}
                                >
                                    <span
                                        className="ability-picker-action-dot"
                                        style={{ backgroundColor: config.color }}
                                    />
                                    <span className="ability-picker-action-name">
                                        {action.name}
                                    </span>
                                    <span className="ability-picker-action-type">
                                        {config.shortLabel}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>,
        document.body
    );
};

export default AbilityPicker;