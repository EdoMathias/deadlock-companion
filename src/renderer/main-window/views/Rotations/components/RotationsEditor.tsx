import React, { useCallback, useRef, useState } from 'react';
import { Character, CharacterAction, Rotation, RotationStep } from '../types/rotations.types';
import RotationStepNode from './RotationStepNode';
import AbilityPicker from './AbilityPicker';
import { useShowSquadIndexSetting } from '../hooks/useShowSquadIndexSetting';

interface RotationsEditorProps {
    squad: Character[];
    currentRotation: Rotation | null;
    onAddRotationStep: (step: RotationStep) => void;
    onRemoveRotationStep: (stepId: string) => void;
    onSetRotationStepAction: (stepId: string, action: CharacterAction, character: Character) => void;
    onClearCurrentRotation: () => void;
}

const RotationsEditor: React.FC<RotationsEditorProps> = ({ squad, currentRotation, onAddRotationStep, onRemoveRotationStep, onSetRotationStepAction, onClearCurrentRotation }) => {

    const [editingStepId, setEditingStepId] = useState<string | null>(null);
    const stepRefs = useRef<Map<string, HTMLDivElement>>(new Map());
    const [showSquadIndex, setShowSquadIndex] = useShowSquadIndexSetting();

    const steps = currentRotation?.steps ?? [];

    const getCharacterLabel = useCallback(
        (characterId: string | undefined) => {
            if (!showSquadIndex || !characterId) return undefined;
            const idx = squad.findIndex((c) => c.id === characterId);
            return idx >= 0 ? String(idx + 1) : undefined;
        },
        [squad, showSquadIndex]
    );

    const setStepRef = useCallback((stepId: string, el: HTMLDivElement | null) => {
        if (el) stepRefs.current.set(stepId, el);
        else stepRefs.current.delete(stepId);
    }, []);

    const handleAddStep = () => {
        const newStep: RotationStep = {
            id: `step-${Date.now()}-${Math.random()}`,
            orderIndex: steps.length,
        };
        onAddRotationStep(newStep);
    };

    const handleSelectAction = (stepId: string, action: CharacterAction, character: Character) => {
        onSetRotationStepAction(stepId, action, character);
        setEditingStepId(null);
    };

    return (
        <div className="rotations-editor" data-ftue="rotations-editor">
            <div className="rotations-editor-header">
                <div className="rotations-editor-header-top">
                    <h2 className="rotations-editor-title">Rotation Editor</h2>
                    <label className="rotations-editor-show-squad-index">
                        <input
                            type="checkbox"
                            checked={showSquadIndex}
                            onChange={(e) => setShowSquadIndex(e.target.checked)}
                            className="rotations-editor-show-squad-index-checkbox"
                        />
                        <span>Show squad index in steps</span>
                    </label>
                </div>
                <p className="rotations-editor-description">
                    {steps.length === 0
                        ? 'Click the + button to add a step to your rotation.'
                        : `${steps.length} step${steps.length === 1 ? '' : 's'} in your rotation.`}
                </p>
            </div>

            <div className="rotations-editor-body">
                <div className="rotations-editor-timeline">
                    {steps.map((step, index) => (
                        <div key={step.id} className="rotations-editor-step-wrapper">
                            <div
                                className="rotations-editor-step"
                                ref={(el) => setStepRef(step.id, el)}
                            >
                                <RotationStepNode
                                    step={step}
                                    index={index}
                                    isEditing={editingStepId === step.id}
                                    onClick={() => setEditingStepId(editingStepId === step.id ? null : step.id)}
                                    onRemove={() => onRemoveRotationStep(step.id)}
                                    characterLabel={getCharacterLabel(step.character?.id)}
                                />
                            </div>

                            {index < steps.length - 1 && (
                                <span className="rotations-editor-arrow">&#8594;</span>
                            )}
                        </div>
                    ))}

                    {/* Add step button */}
                    <button
                        type="button"
                        className="rotations-editor-add-step"
                        onClick={handleAddStep}
                    >
                        <span className="rotations-editor-add-step-icon">+</span>
                    </button>
                </div>
            </div>

            {/* Rendered outside the overflow container so it's never clipped */}
            {editingStepId && (
                <AbilityPicker
                    squad={squad}
                    anchorEl={stepRefs.current.get(editingStepId) ?? null}
                    onSelect={(action, character) => handleSelectAction(editingStepId, action, character)}
                    onClose={() => setEditingStepId(null)}
                />
            )}
        </div>
    );
};

export default RotationsEditor;