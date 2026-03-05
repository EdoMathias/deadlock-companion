import React from 'react';
import { RotationStep } from '../types/rotations.types';
import { ACTION_TYPE_CONFIG } from '../consts/rotations.consts';

interface RotationStepNodeProps {
    step: RotationStep;
    index: number;
    isEditing: boolean;
    onClick: () => void;
    onRemove: () => void;
    /** When set, shown instead of character name (e.g. squad index "1", "2"). */
    characterLabel?: string;
}

const RotationStepNode: React.FC<RotationStepNodeProps> = ({ step, index, isEditing, onClick, onRemove, characterLabel }) => {

    const isEmpty = !step.action;
    const typeConfig = step.action ? ACTION_TYPE_CONFIG[step.action.type] : null;
    const borderColor = !isEmpty && !isEditing && typeConfig ? typeConfig.color : undefined;
    const nameOrLabel = characterLabel ?? step.character?.name ?? '—';

    return (
        <div className="rotation-step-node">
            <div className="rotation-step-node-circle">
                <button
                    type='button'
                    className={`rotation-step-node-circle-button ${isEmpty ? 'rotation-step-node-circle-button--empty' : ''} ${isEditing ? 'rotation-step-node-circle-button--editing' : ''}`}
                    style={borderColor != null ? { borderColor } : undefined}
                    onClick={onClick}
                >
                    {isEmpty ? (
                        <>
                            <span className="rotation-step-node-circle-empty">+</span>
                            <span className="rotation-step-node-circle-empty-text">Add Action</span>
                        </>
                    ) : (
                        <>
                            <div className="rotation-step-node-ability">
                                {nameOrLabel}
                            </div>
                            <div className="rotation-step-node-action-type">
                                {ACTION_TYPE_CONFIG[step.action?.type].shortLabel}
                            </div>
                        </>
                    )}
                </button>

                {/* Delete step button */}
                <button type='button'
                    className="rotation-step-node-delete-button"
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove();
                    }}>
                    <span className="rotation-step-node-delete-button-icon">×</span>
                </button>
            </div>
        </div>
    );
};

export default RotationStepNode;