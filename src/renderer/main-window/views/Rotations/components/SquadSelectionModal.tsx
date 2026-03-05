import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Character } from '../types/rotations.types';
import RotationsOperatorCard from './RotationsOperatorCard';

const MAX_SQUAD_SIZE = 4;

interface SquadSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    characters: Character[];
    squad: Character[];
    onAddCharacterToSquad: (character: Character) => void;
    onRemoveCharacterFromSquad: (characterId: string) => void;
    containerRef?: React.RefObject<HTMLElement>;
}

const SquadSelectionModal: React.FC<SquadSelectionModalProps> = ({
    isOpen,
    onClose,
    characters,
    squad,
    onAddCharacterToSquad,
    onRemoveCharacterFromSquad,
    containerRef,
}) => {
    const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
    const overlayRef = useRef<HTMLDivElement>(null);

    const squadIds = useMemo(() => new Set(squad.map(c => c.id)), [squad]);
    const canAddMore = squad.length < MAX_SQUAD_SIZE;

    useEffect(() => {
        if (isOpen && containerRef?.current) {
            const updatePosition = () => {
                const container = containerRef.current;
                if (container) {
                    const rect = container.getBoundingClientRect();
                    setOverlayStyle({
                        position: 'fixed',
                        top: `${rect.top}px`,
                        left: `${rect.left}px`,
                        width: `${rect.width}px`,
                        height: `${rect.height}px`,
                    });
                }
            };
            updatePosition();
            window.addEventListener('resize', updatePosition);
            window.addEventListener('scroll', updatePosition, true);
            return () => {
                window.removeEventListener('resize', updatePosition);
                window.removeEventListener('scroll', updatePosition, true);
            };
        }
    }, [isOpen, containerRef]);

    if (!isOpen) return null;

    return (
        <div
            ref={overlayRef}
            className="squad-selection-modal-overlay"
            style={overlayStyle}
            onClick={onClose}
        >
            <div className="squad-selection-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="squad-selection-modal-header">
                    <h3 className="squad-selection-modal-title">
                        Edit Squad ({squad.length}/{MAX_SQUAD_SIZE})
                    </h3>
                    <button
                        type="button"
                        className="squad-selection-modal-close"
                        onClick={onClose}
                        aria-label="Close"
                    >
                        ×
                    </button>
                </div>
                <div className="squad-selection-modal-body">
                    <div className="squad-selection-modal-cards">
                        {characters.map((character) => {
                            const isSelected = squadIds.has(character.id);
                            return (
                                <RotationsOperatorCard
                                    key={character.id}
                                    character={character}
                                    selected={isSelected}
                                    onAdd={onAddCharacterToSquad}
                                    onRemove={onRemoveCharacterFromSquad}
                                    disabled={!canAddMore && !isSelected}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SquadSelectionModal;