import { describe, expect, it } from 'vitest';
import {
	bookableMinutes,
	formatClock,
	nextPhase,
	phaseDurationSec,
	phaseLabel,
	phaseProgress,
	remainingSec,
	roundLabel,
	type FocusDurations
} from './session-logic';

const d: FocusDurations = {
	focusMinutes: 25,
	breakMinutes: 5,
	longBreakMinutes: 15,
	roundsUntilLongBreak: 4
};

describe('phaseDurationSec', () => {
	it('converts each phase to seconds', () => {
		expect(phaseDurationSec('focus', d)).toBe(1500);
		expect(phaseDurationSec('break', d)).toBe(300);
		expect(phaseDurationSec('long_break', d)).toBe(900);
		expect(phaseDurationSec('idle', d)).toBe(0);
	});

	it('never returns less than a minute', () => {
		expect(phaseDurationSec('break', { ...d, breakMinutes: 0 })).toBe(60);
	});
});

describe('nextPhase', () => {
	it('chains focus into a short break', () => {
		expect(nextPhase('focus', 1, d)).toBe('break');
		expect(nextPhase('focus', 3, d)).toBe('break');
	});

	it('chains focus into a long break on every nth round', () => {
		expect(nextPhase('focus', 4, d)).toBe('long_break');
		expect(nextPhase('focus', 8, d)).toBe('long_break');
	});

	it('respects a custom round count', () => {
		expect(nextPhase('focus', 2, { ...d, roundsUntilLongBreak: 2 })).toBe('long_break');
	});

	it('always returns to focus after any break', () => {
		expect(nextPhase('break', 4, d)).toBe('focus');
		expect(nextPhase('long_break', 4, d)).toBe('focus');
	});

	it('does not hand out a long break before the first round is done', () => {
		expect(nextPhase('focus', 0, d)).toBe('break');
	});
});

describe('remainingSec', () => {
	it('rounds up and never goes negative', () => {
		const now = 1_000_000;
		expect(remainingSec(now + 1500, now)).toBe(2);
		expect(remainingSec(now - 5000, now)).toBe(0);
		expect(remainingSec(null, now)).toBe(0);
	});
});

describe('formatClock', () => {
	it('formats mm:ss below an hour', () => {
		expect(formatClock(1500)).toBe('25:00');
		expect(formatClock(59)).toBe('00:59');
		expect(formatClock(0)).toBe('00:00');
	});

	it('formats h:mm:ss from an hour on', () => {
		expect(formatClock(3600)).toBe('1:00:00');
		expect(formatClock(5425)).toBe('1:30:25');
	});
});

describe('bookableMinutes', () => {
	it('ignores anything under 30 seconds', () => {
		expect(bookableMinutes(1500, 1500)).toBe(0);
		expect(bookableMinutes(1500, 1480)).toBe(0);
	});

	it('books at least one minute once 30 seconds ran', () => {
		expect(bookableMinutes(1500, 1470)).toBe(1);
	});

	it('rounds the elapsed time to whole minutes', () => {
		expect(bookableMinutes(1500, 600)).toBe(15);
		expect(bookableMinutes(1500, 0)).toBe(25);
	});
});

describe('phaseProgress', () => {
	it('goes from 0 to 1 over the phase', () => {
		expect(phaseProgress(1500, 1500)).toBe(0);
		expect(phaseProgress(1500, 750)).toBeCloseTo(0.5);
		expect(phaseProgress(1500, 0)).toBe(1);
	});

	it('returns 0 without a phase', () => {
		expect(phaseProgress(0, 0)).toBe(0);
	});
});

describe('labels', () => {
	it('names every phase', () => {
		expect(phaseLabel('focus')).toBe('Fokus');
		expect(phaseLabel('break')).toBe('Pause');
		expect(phaseLabel('long_break')).toBe('Lange Pause');
		expect(phaseLabel('idle')).toBe('Bereit');
	});

	it('numbers the round cyclically', () => {
		expect(roundLabel(0, d)).toBe('Runde 1/4');
		expect(roundLabel(3, d)).toBe('Runde 4/4');
		expect(roundLabel(4, d)).toBe('Runde 1/4');
	});
});
