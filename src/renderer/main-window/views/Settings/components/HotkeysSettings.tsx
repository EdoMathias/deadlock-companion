import React, { useEffect, useState } from 'react';
import AnyTypeInput from '../../../../components/AnyTypeInput';
import { HotkeyData, kHotkeys } from '../../../../../shared/consts';
import { createLogger } from '../../../../../shared/services/Logger';
import { HotkeysAPI } from '../../../../../shared/services/hotkeys';

const logger = createLogger('HotkeysSettings');

const NUMPAD_LOCATION = 3;

const SHIFTED_DIGIT_MAP: Record<string, string> = {
  '!': 'Digit1', '@': 'Digit2', '#': 'Digit3', '$': 'Digit4', '%': 'Digit5',
  '^': 'Digit6', '&': 'Digit7', '*': 'Digit8', '(': 'Digit9', ')': 'Digit0',
};

const SYMBOL_CODE_MAP: Record<string, string> = {
  '-': 'Minus', '_': 'Minus', '=': 'Equal', '+': 'Equal',
  '[': 'BracketLeft', '{': 'BracketLeft', ']': 'BracketRight', '}': 'BracketRight',
  '\\': 'Backslash', '|': 'Backslash', ';': 'Semicolon', ':': 'Semicolon',
  "'": 'Quote', '"': 'Quote', ',': 'Comma', '<': 'Comma', '.': 'Period', '>': 'Period',
  '/': 'Slash', '?': 'Slash', '`': 'Backquote', '~': 'Backquote', ' ': 'Space',
};

const NAMED_KEY_MAP: Record<string, string> = {
  Escape: 'Escape', Esc: 'Escape', Backspace: 'Backspace', Tab: 'Tab',
  Enter: 'Enter', Return: 'Enter', Space: 'Space', Spacebar: 'Space',
  Delete: 'Delete', Insert: 'Insert', Home: 'Home', End: 'End',
  PageUp: 'PageUp', PageDown: 'PageDown', ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown',
  ArrowLeft: 'ArrowLeft', ArrowRight: 'ArrowRight', CapsLock: 'CapsLock',
  ScrollLock: 'ScrollLock', Pause: 'Pause', Break: 'Pause',
};

const NUMPAD_SYMBOL_MAP: Record<string, string> = {
  '+': 'NumpadAdd', '-': 'NumpadSubtract', '*': 'NumpadMultiply', '/': 'NumpadDivide',
  Enter: 'NumpadEnter', Decimal: 'NumpadDecimal', '.': 'NumpadDecimal',
};

const fallbackCodeFromKeyEvent = (event: React.KeyboardEvent<HTMLInputElement>): string | null => {
  const key = event.key;
  if (!key) return null;
  if (/^F\d{1,2}$/i.test(key)) return key.toUpperCase();
  const location = event.nativeEvent?.location ?? 0;
  if (location === NUMPAD_LOCATION) {
    if (/^\d$/.test(key)) return `Numpad${key}`;
    if (NUMPAD_SYMBOL_MAP[key]) return NUMPAD_SYMBOL_MAP[key];
  }
  if (SHIFTED_DIGIT_MAP[key]) return SHIFTED_DIGIT_MAP[key];
  if (/^\d$/.test(key)) return `Digit${key}`;
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`;
  if (SYMBOL_CODE_MAP[key]) return SYMBOL_CODE_MAP[key];
  if (NAMED_KEY_MAP[key]) return NAMED_KEY_MAP[key];
  return null;
};

/**
 * Normalize key code (e.code) to display name
 * e.g. "Digit2" -> "2", "KeyA" -> "A"
 */
const normalizeKeyFromCode = (code: string): string | null => {
  if (code.startsWith('Digit')) return code.replace('Digit', '');
  if (code.startsWith('Key')) return code.replace('Key', '').toUpperCase();
  const specials: Record<string, string> = {
    Space: 'Space', Escape: 'Esc', ArrowUp: 'Up', ArrowDown: 'Down', ArrowLeft: 'Left', ArrowRight: 'Right',
    Enter: 'Enter', Tab: 'Tab', Backspace: 'Backspace', Delete: 'Delete', Insert: 'Insert', Home: 'Home', End: 'End',
    PageUp: 'PageUp', PageDown: 'PageDown',
    Numpad0: 'Numpad0', Numpad1: 'Numpad1', Numpad2: 'Numpad2', Numpad3: 'Numpad3', Numpad4: 'Numpad4',
    Numpad5: 'Numpad5', Numpad6: 'Numpad6', Numpad7: 'Numpad7', Numpad8: 'Numpad8', Numpad9: 'Numpad9',
    NumpadAdd: 'Numpad+', NumpadSubtract: 'Numpad-', NumpadMultiply: 'Numpad*', NumpadDivide: 'Numpad/',
    NumpadEnter: 'NumpadEnter', NumpadDecimal: 'Numpad.',
    F1: 'F1', F2: 'F2', F3: 'F3', F4: 'F4', F5: 'F5', F6: 'F6', F7: 'F7', F8: 'F8', F9: 'F9', F10: 'F10', F11: 'F11', F12: 'F12',
    BracketLeft: '[', BracketRight: ']', Backslash: '\\', Semicolon: ';', Quote: "'", Comma: ',', Period: '.', Slash: '/', Backquote: '`', Minus: '-', Equal: '=',
  };
  return specials[code] || null;
};

/**
 * Convert key code (e.code) to Windows virtual keycode
 */
const getVirtualKeycode = (code: string): number => {
  if (code.startsWith('Digit')) return 48 + parseInt(code.replace('Digit', ''), 10);
  if (code.startsWith('Key')) return code.replace('Key', '').toUpperCase().charCodeAt(0);
  const vkMap: Record<string, number> = {
    Space: 32, Escape: 27, Enter: 13, Tab: 9, Backspace: 8, Delete: 46, Insert: 45, Home: 36, End: 35,
    PageUp: 33, PageDown: 34, ArrowUp: 38, ArrowDown: 40, ArrowLeft: 37, ArrowRight: 39,
    Numpad0: 96, Numpad1: 97, Numpad2: 98, Numpad3: 99, Numpad4: 100, Numpad5: 101, Numpad6: 102,
    Numpad7: 103, Numpad8: 104, Numpad9: 105, NumpadAdd: 107, NumpadSubtract: 109, NumpadMultiply: 106,
    NumpadDivide: 111, NumpadEnter: 13, NumpadDecimal: 110,
    F1: 112, F2: 113, F3: 114, F4: 115, F5: 116, F6: 117, F7: 118, F8: 119, F9: 120, F10: 121, F11: 122, F12: 123,
    BracketLeft: 219, BracketRight: 221, Backslash: 220, Semicolon: 186, Quote: 222, Comma: 188, Period: 190, Slash: 191, Backquote: 192, Minus: 189, Equal: 187,
  };
  return vkMap[code] || 0;
};

/**
 * HotKeysSettings component allows users to configure hotkeys for various actions.
 * It provides an input field where users can set a hotkey by pressing the desired key combination.
 */
const HotkeysSettings: React.FC = () => {
  const [hotkeys, setHotkeys] = useState<overwolf.settings.hotkeys.IHotkey[]>([]);
  const [error, setError] = useState<{ hotkeyName: string; message: string } | null>(null);
  const [originalMap, setOriginalMap] = useState<Record<string, string>>({});

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, hotkeyName: string) => {
    e.preventDefault();
    e.stopPropagation();

    const mods: string[] = [];
    if (e.ctrlKey && !mods.includes('Ctrl')) mods.push('Ctrl');
    if (e.altKey && !mods.includes('Alt')) mods.push('Alt');
    if (e.shiftKey && !mods.includes('Shift')) mods.push('Shift');
    if (e.metaKey && !mods.includes('Meta')) mods.push('Meta');

    const hotkeyString = mods.join('+');
    e.currentTarget.value = hotkeyString;

    const hasModifier = e.altKey || e.ctrlKey || e.shiftKey || e.metaKey;
    let keyCode = e.code;
    if ((!keyCode || keyCode === 'Unidentified') && hasModifier) {
      keyCode = fallbackCodeFromKeyEvent(e);
    }

    const ignoredCodes = ['ControlLeft', 'ControlRight', 'AltLeft', 'AltRight', 'ShiftLeft', 'ShiftRight', 'MetaLeft', 'MetaRight'];

    if (!keyCode) {
      logger.warn('Unable to resolve key code for hotkey assignment', { hotkeyName, key: e.key, mods });
      return;
    }

    if (!ignoredCodes.includes(keyCode)) {
      const normalizedKey = normalizeKeyFromCode(keyCode);
      if (normalizedKey) {
        mods.push(normalizedKey);
        logger.log('Hotkey pressed:', { hotkeyName, keyCode, normalizedKey, mods });
        const hotkeyAsString = mods.join('+');
        e.currentTarget.value = hotkeyAsString;
        hotkeyBuilder(hotkeyName, hotkeyAsString, keyCode);
        e.currentTarget.blur();
      }
    }
  };

  const hotkeyBuilder = (hotkeyName: string, hotkeyCombination: string, keyCode: string) => {
    if (isHotkeyTaken(hotkeyCombination, hotkeyName)) {
      const takenBy = hotkeys.find(h => h.binding === hotkeyCombination && h.name !== hotkeyName);
      setError({
        hotkeyName,
        message: takenBy ? `This hotkey is already assigned to "${takenBy.title}".` : 'This hotkey is already assigned to another action.',
      });
      const input = document.getElementById(hotkeyName) as HTMLInputElement;
      const original = originalMap[hotkeyName] || hotkeys.find(h => h.name === hotkeyName)?.binding || '';
      if (input) input.value = original;
      setTimeout(() => setError(null), 5000);
      return;
    }

    setError(null);
    const keyCodeNum = getVirtualKeycode(keyCode);

    if (keyCodeNum === 0) {
      logger.error('Unknown key code, cannot assign hotkey:', keyCode);
      setError({ hotkeyName, message: `Unsupported key: ${keyCode}. Please try a different key.` });
      const input = document.getElementById(hotkeyName) as HTMLInputElement;
      const original = originalMap[hotkeyName] || hotkeys.find(h => h.name === hotkeyName)?.binding || '';
      if (input) input.value = original;
      setTimeout(() => setError(null), 5000);
      return;
    }

    const parts = hotkeyCombination.split('+');
    const modifiers: overwolf.settings.hotkeys.HotkeyModifiers = {
      alt: parts.includes('Alt'),
      ctrl: parts.includes('Ctrl'),
      shift: parts.includes('Shift'),
    };

    const hotkeyObject: HotkeyData = {
      name: hotkeyName,
      title: hotkeyName,
      binding: hotkeyCombination,
      modifiers,
      virtualKeycode: keyCodeNum,
    };

    HotkeysAPI.update(hotkeyObject)
      .then(() => {
        logger.log('Hotkey updated', { hotkeyName, binding: hotkeyCombination });
        HotkeysAPI.fetchAll().then(hotkeysMap => {
          const appHotkeys = Array.from(hotkeysMap.values()).filter((h: overwolf.settings.hotkeys.IHotkey) =>
            Object.values(kHotkeys).includes(h.name)
          );
          setHotkeys(appHotkeys);
          logger.log('Hotkeys reloaded after update', { count: appHotkeys.length });
        });
      })
      .catch((err) => {
        logger.error('Error updating hotkey:', err);
        setError({ hotkeyName, message: err || 'Failed to assign hotkey' });
        const input = document.getElementById(hotkeyName) as HTMLInputElement;
        const original = originalMap[hotkeyName] || hotkeys.find(h => h.name === hotkeyName)?.binding || '';
        if (input) input.value = original;
        setTimeout(() => setError(null), 5000);
      });
  };

  const isHotkeyTaken = (combination: string, exceptName?: string): boolean =>
    hotkeys.some(h => h.name !== exceptName && h.binding === combination);

  useEffect(() => {
    const loadHotkeys = async () => {
      try {
        const hotkeysMap = await HotkeysAPI.fetchAll();
        logger.log('Hotkeys map:', hotkeysMap);
        const appHotkeys = Array.from(hotkeysMap.values()).filter((h: overwolf.settings.hotkeys.IHotkey) =>
          Object.values(kHotkeys).includes(h.name)
        );
        setHotkeys(appHotkeys);
        logger.log('Loaded hotkeys', { count: appHotkeys.length });
      } catch (err) {
        logger.error('Failed to load hotkeys:', err);
      }
    };
    loadHotkeys();

    const onHotkeyChanged = () => {
      logger.log('Hotkey changed externally, reloading...');
      loadHotkeys();
    };
    overwolf.settings.hotkeys.onChanged.addListener(onHotkeyChanged);
    return () => {
      overwolf.settings.hotkeys.onChanged.removeListener(onHotkeyChanged);
    };
  }, []);

  return (
    <div className="settings-section">
      <h3 className="settings-section-title">Hotkeys</h3>

      <div className="hotkeys-list">
        {hotkeys.map((hotkey) => (
          <div key={`${hotkey.name}-${hotkey.binding}`} className="hotkey-item">
            <AnyTypeInput
              id={hotkey.name}
              className="hotkey-input"
              labelText={hotkey.title}
              defaultValue={hotkey.binding || ''}
              onFocus={(e) => {
                const original = hotkeys.find(h => h.name === hotkey.name)?.binding || '';
                setOriginalMap(prev => ({ ...prev, [hotkey.name]: original }));
                e.currentTarget.value = '';
                if (error?.hotkeyName === hotkey.name) setError(null);
              }}
              onBlur={(e) => {
                const current = e.currentTarget.value.trim();
                if (!current) {
                  const original = originalMap[hotkey.name] || hotkeys.find(h => h.name === hotkey.name)?.binding || '';
                  e.currentTarget.value = original;
                }
                setOriginalMap(prev => {
                  const updated = { ...prev };
                  delete updated[hotkey.name];
                  return updated;
                });
              }}
              onKeyDown={(evt) => handleKeyDown(evt, hotkey.name)}
            />

            {error?.hotkeyName === hotkey.name && (
              <div className="hotkey-error">{error.message}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default HotkeysSettings;
