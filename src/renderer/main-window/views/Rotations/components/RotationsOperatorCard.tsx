import React from 'react';
import { Character } from '../types/rotations.types';

interface RotationsOperatorCardProps {
    character: Character;
    /** When set, shows a remove button (e.g. in edit squad modal). */
    onRemove?: (characterId: string) => void;
    /** When set, card is clickable to add (e.g. in edit squad modal). */
    onAdd?: (character: Character) => void;
    /** Disables click-to-add when true (e.g. squad full). */
    disabled?: boolean;
    /** When true, card is shown as selected (e.g. in squad). */
    selected?: boolean;
}

const RotationsOperatorCard: React.FC<RotationsOperatorCardProps> = ({
    character,
    onRemove,
    onAdd,
    disabled = false,
    selected = false,
}) => {
    const canAdd = Boolean(onAdd && !disabled);
    const canRemove = Boolean(selected && onRemove);
    const isClickable = canAdd || canRemove;
    const handleClick = () => {
        if (canRemove) onRemove?.(character.id);
        else if (canAdd) onAdd?.(character);
    };
    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onRemove?.(character.id);
    };

    return (
        <div
            className={`rotations-operator-card ${isClickable ? 'rotations-operator-card--clickable' : ''} ${disabled ? 'rotations-operator-card--disabled' : ''} ${selected ? 'rotations-operator-card--selected' : ''}`}
            onClick={handleClick}
            role={isClickable ? 'button' : undefined}
        >
            {selected && onRemove && (
                <button
                    type="button"
                    className="rotations-operator-card-remove"
                    onClick={handleRemove}
                    aria-label={`Remove ${character.name} from squad`}
                >
                    ×
                </button>
            )}
            <div className="rotations-operator-card-image">
                <img src={character.image} alt={character.name} />
            </div>
            <div className="rotations-operator-card-name">
                {character.name}
            </div>
        </div>
    );
};

export default RotationsOperatorCard;