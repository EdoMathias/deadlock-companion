import React, { useEffect, useState } from 'react';
import { Character, Rotation } from '../types/rotations.types';
import RotationsOperatorCard from './RotationsOperatorCard';
import { HotkeysAPI } from '../../../../../shared/services/hotkeys';
import { kHotkeys } from '../../../../../shared/consts';

interface RotationsHeaderProps {
    characters: Character[];
    squad: Character[];
    onAddCharacterToSquad: (character: Character) => void;
    onRemoveCharacterFromSquad: (characterId: string) => void;
    currentRotation: Rotation | null;
    onCurrentRotationChange: (rotation: Rotation) => void;
    rotationsPresets: Rotation[];
    selectedPresetId: string;
    onSelectedPresetIdChange: (presetId: string) => void;
    onSavePreset: (name: string) => string | null;
    onRemovePreset: (presetId: string) => void;
    onLoadPreset: (presetId: string) => void;
    onEditSquad: () => void;
    containerRef?: React.RefObject<HTMLElement>;
}

const RotationsHeader: React.FC<RotationsHeaderProps> = ({ squad, currentRotation, rotationsPresets, selectedPresetId, onSelectedPresetIdChange, onSavePreset, onRemovePreset, onLoadPreset, onEditSquad, containerRef }) => {
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [overlayStyle, setOverlayStyle] = useState<React.CSSProperties>({});
    const [rotationHotkey, setRotationHotkey] = useState<string>('');

    const isModalOpen = showSaveModal || showDeleteModal;

    // Load the rotation in-game window hotkey
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const hotkeysMap = await HotkeysAPI.fetchAll();
                const hk = hotkeysMap.get(kHotkeys.toggleRotationIngameWindow);
                if (!cancelled) {
                    const binding = hk?.binding;
                    const unassigned = hk?.IsUnassigned ?? true;
                    setRotationHotkey(
                        unassigned || !binding || binding === 'Unassigned' || binding.trim() === ''
                            ? ''
                            : binding
                    );
                }
            } catch {
                if (!cancelled) setRotationHotkey('');
            }
        };
        load();
        const onChanged = () => load();
        overwolf.settings.hotkeys.onChanged.addListener(onChanged);
        return () => {
            cancelled = true;
            overwolf.settings.hotkeys.onChanged.removeListener(onChanged);
        };
    }, []);

    // Scope modal overlays to the container
    useEffect(() => {
        if (isModalOpen && containerRef?.current) {
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
    }, [isModalOpen, containerRef]);

    const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const presetId = e.target.value;
        onSelectedPresetIdChange(presetId);
        if (presetId) {
            onLoadPreset(presetId);
        }
    };

    const handleSavePreset = () => {
        if (!presetName.trim()) return;
        onSavePreset(presetName.trim());
        setPresetName('');
        setShowSaveModal(false);
    };

    const handleConfirmDelete = () => {
        if (selectedPresetId) {
            onRemovePreset(selectedPresetId);
        }
        setShowDeleteModal(false);
    };

    const selectedPreset = rotationsPresets.find(p => p.id === selectedPresetId);

    return (
        <div className="rotations-header" data-ftue="rotations-header">
            {/* Row 1: Title + in-game hotkey hint */}
            <div className="rotations-header-row-1">
                <h1 className="rotations-header-title">Rotations</h1>
                {rotationHotkey && (
                    <span className="rotations-header-hotkey-hint">
                        In-Game Window: <kbd>{rotationHotkey}</kbd>
                    </span>
                )}
            </div>

            {/* Row 2: Preset controls */}
            <div className="rotations-header-row-2">
                <label className="rotations-header-label">
                    Preset
                    <select
                        className="rotations-header-select"
                        value={selectedPresetId}
                        onChange={handlePresetChange}
                    >
                        <option value="">Select a preset...</option>
                        {rotationsPresets.map(preset => (
                            <option key={preset.id} value={preset.id}>{preset.name}</option>
                        ))}
                    </select>
                </label>
                {selectedPresetId && (
                    <button
                        type="button"
                        className="rotations-header-button rotations-header-button--danger"
                        onClick={() => setShowDeleteModal(true)}
                    >
                        Delete Preset
                    </button>
                )}
                <button
                    type="button"
                    className="rotations-header-button"
                    onClick={() => setShowSaveModal(true)}
                    disabled={!currentRotation || currentRotation.steps.length === 0}
                >
                    Save as Preset
                </button>
            </div>

            {/* Row 3: Squad selection + Edit Squad button */}
            <div className="rotations-header-row-3">
                <div className="rotations-header-squad-selection">
                    {squad.map(character => (
                        <RotationsOperatorCard key={character.id} character={character} />
                    ))}
                </div>
                <button type="button" className="rotations-header-button" onClick={onEditSquad}>Edit Squad</button>
            </div>

            {/* Delete preset confirmation modal */}
            {showDeleteModal && (
                <div
                    className="rotations-modal-overlay"
                    style={overlayStyle}
                    onClick={() => setShowDeleteModal(false)}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Delete Preset</h3>
                        <p className="modal-message">
                            Are you sure you want to delete &ldquo;{selectedPreset?.name ?? ''}&rdquo;? This action cannot be undone.
                        </p>
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="modal-button modal-button-cancel"
                                onClick={() => setShowDeleteModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="modal-button modal-button-confirm modal-button-danger"
                                onClick={handleConfirmDelete}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Save preset modal */}
            {showSaveModal && (
                <div
                    className="rotations-modal-overlay"
                    style={overlayStyle}
                    onClick={() => { setShowSaveModal(false); setPresetName(''); }}
                >
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h3 className="modal-title">Save as Preset</h3>
                        <p className="modal-message">Enter a name for this rotation preset.</p>
                        <input
                            type="text"
                            className="rotations-header-preset-input"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSavePreset(); }}
                            placeholder="e.g., DPS Burst Rotation"
                            autoFocus
                        />
                        <div className="modal-actions">
                            <button
                                type="button"
                                className="modal-button modal-button-cancel"
                                onClick={() => { setShowSaveModal(false); setPresetName(''); }}
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="modal-button modal-button-confirm"
                                onClick={handleSavePreset}
                                disabled={!presetName.trim()}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RotationsHeader;