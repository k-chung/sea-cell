// The planning screen's unsent choices (mission, rocket, crew, options). UI-only until LAUNCH.

import type { LaunchPlan } from '../core/index.ts';

export interface Draft {
  missionId: string | null;
  booster: string | null;
  upper: string | null;
  payload: string | null;
  crewIds: string[];
  testFlight: boolean;
  redundancy: boolean;
}

export const emptyDraft = (): Draft => ({
  missionId: null,
  booster: null,
  upper: null,
  payload: null,
  crewIds: [],
  testFlight: false,
  redundancy: false,
});

/** A launch plan from the draft, or null while a slot is empty. */
export function draftPlan(d: Draft): LaunchPlan | null {
  if (!d.missionId || !d.booster || !d.upper || !d.payload) return null;
  const { missionId, booster, upper, payload, crewIds, testFlight, redundancy } = d;
  return { missionId, rocket: { booster, upper, payload }, crewIds, testFlight, redundancy };
}
