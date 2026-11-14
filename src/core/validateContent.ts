// Checks content files for mistakes (bad ids, missing fields, impossible numbers).
// Every error names the file, the entry and the field, so it can be fixed quickly.
// Runs when a game starts and in the test suite.

import type { Requirement, Ruleset } from '../content/types.ts';

export function validateContent(r: Ruleset): string[] {
  const errors: string[] = [];
  const c = r.content;
  const ids = (list: { id: string }[]) => new Set(list.map((x) => x.id));
  const partIds = ids(c.parts);
  const milestoneIds = ids(c.milestones);
  const traitIds = ids(c.traits);
  const personnelIds = ids(c.personnel);
  const favorIds = ids(c.favors);

  const checkUnique = (file: string, list: { id: string }[]) => {
    const seen = new Set<string>();
    for (const item of list) {
      if (seen.has(item.id)) errors.push(`${file}: duplicate id "${item.id}"`);
      seen.add(item.id);
    }
  };
  checkUnique('parts.ts', c.parts);
  checkUnique('missions.ts (milestones)', c.milestones);
  checkUnique('missions.ts (missions)', c.missions);
  checkUnique('crew.ts (traits)', c.traits);
  checkUnique('events.ts', c.events);
  checkUnique('people.ts (personnel)', c.personnel);
  checkUnique('people.ts (favors)', c.favors);

  for (const p of c.parts) {
    const where = `parts.ts "${p.id}"`;
    if (p.reliability < 0 || p.reliability > 100) errors.push(`${where}: reliability must be 0-100`);
    if (p.slot === 'payload' && !p.payloadKind) errors.push(`${where}: payloads need a payloadKind`);
  }
  for (const slot of ['booster', 'upper', 'payload'] as const) {
    if (!c.parts.some((p) => p.slot === slot && p.startsUnlocked)) {
      errors.push(`parts.ts: no ${slot} starts unlocked; the first hand would be unplayable`);
    }
  }

  for (const m of c.missions) {
    const where = `missions.ts "${m.id}"`;
    if (!milestoneIds.has(m.milestone)) errors.push(`${where}: milestone "${m.milestone}" does not exist`);
    for (const req of m.requires) {
      if (!milestoneIds.has(req)) errors.push(`${where}: requires unknown milestone "${req}"`);
    }
    if (m.phases.length === 0) errors.push(`${where}: needs at least one phase`);
  }
  if (!milestoneIds.has(r.goalMilestone)) errors.push(`rulesets.ts: goalMilestone "${r.goalMilestone}" does not exist`);

  const checkRequirement = (where: string, req: Requirement) => {
    if ('trait' in req && !traitIds.has(req.trait)) errors.push(`${where}: requires unknown trait "${req.trait}"`);
    if ('personnel' in req && !personnelIds.has(req.personnel)) errors.push(`${where}: requires unknown personnel "${req.personnel}"`);
    if ('favor' in req && !favorIds.has(req.favor)) errors.push(`${where}: requires unknown favor "${req.favor}"`);
  };

  for (const e of c.events) {
    if (e.options.length === 0) errors.push(`events.ts "${e.id}": needs at least one option`);
    if (!e.options.some((o) => !o.requires)) {
      errors.push(`events.ts "${e.id}": needs at least one option without a requirement (everyone must have a choice)`);
    }
    e.options.forEach((o, i) => {
      const where = `events.ts "${e.id}" option ${i + 1}`;
      if (o.odds < 0 || o.odds > 100) errors.push(`${where}: odds must be 0-100`);
      if (o.odds < 100 && !o.onFailure) errors.push(`${where}: odds below 100 need an onFailure outcome`);
      if (o.requires) checkRequirement(where, o.requires);
    });
  }

  if (c.astronautNames.length < r.balance.startCrew + 6) {
    errors.push('crew.ts: astronautNames needs more names than startCrew (room for recruits)');
  }
  if (partIds.size === 0) errors.push('parts.ts: no parts');
  return errors;
}
