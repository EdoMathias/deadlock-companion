/**
 * The type of action that a character can perform.
 */
export type RotationActionType = "final_strike" | "skill" | "combo" | "ultimate";

/**
 * An action that a character can perform like basic, skill, combo, ultimate.
 */
export interface CharacterAction {
    id: string;
    name: string;
    type: RotationActionType;
    description?: string;
    image?: string;
}

/**
 * A character in the game.
 */
export interface Character {
    id: string;
    name: string;
    image?: string;
    actions: CharacterAction[];
}

/**
 * A step in a rotation.
 */
export interface RotationStep {
    id: string;
    orderIndex: number;
    character?: Character;
    action?: CharacterAction;
}

/**
 * A rotation.
 */
export interface Rotation {
    id: string;
    name: string;
    steps: RotationStep[];
    squad?: Character[];
}