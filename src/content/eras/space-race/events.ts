// Crisis events: the hard calls mid-flight.
// - major crises happen when a part fails its reliability roll in that phase
// - minor crises are anomalies that can happen on any smooth flight
// Results: success (objective met), abort (crew safe, no objective), lost (vehicle lost, crew escape),
// disaster (vehicle and crew lost). Blue options (with `requires`) only show when you qualify.

import type { EventDef } from '../../types.ts';

export const events: EventDef[] = [
  // ---------------- Launch ----------------
  {
    id: 'pogo', title: 'Pogo oscillation', phases: ['launch'], severity: 'major', crewed: 'any',
    text: 'At T+90 seconds the booster starts shaking violently along its length. Telemetry is a blur.',
    options: [
      {
        text: 'Throttle back and ride it out', odds: 55, skill: 'nerve',
        onSuccess: { result: 'success', text: 'The shaking damps out. Orbit achieved, barely.' },
        onFailure: { result: 'lost', text: 'A feed line ruptures. The vehicle breaks up; any crew escape on the abort system.' },
      },
      {
        text: 'Abort the flight', odds: 100,
        onSuccess: { result: 'abort', text: 'Engines cut. The flight ends in the Atlantic, no objective reached.' },
      },
      {
        text: 'Shift the propellant mixture to detune the resonance', odds: 85, skill: 'repair',
        requires: { trait: 'engineer' },
        onSuccess: { result: 'success', text: '{commander} recognizes the resonance and calls the fix. Smooth ride to orbit.' },
        onFailure: { result: 'abort', text: 'The fix half-works. Ground calls an abort to be safe.' },
      },
    ],
  },
  {
    id: 'guidanceTumble', title: 'Guidance platform tumbles', phases: ['launch'], severity: 'major', crewed: 'any',
    text: 'The inertial platform has lost its reference. The rocket is drifting off course.',
    options: [
      {
        text: 'Switch to backup radio guidance', odds: 60, skill: 'repair',
        onSuccess: { result: 'success', text: 'Ground radar steers it home. Orbit achieved.' },
        onFailure: { result: 'lost', text: 'The backup cannot keep up. Range safety destroys the vehicle.' },
      },
      {
        text: 'Destroy it before it endangers anyone', odds: 100,
        onSuccess: { result: 'lost', text: 'Range safety does its job. An expensive firework.' },
      },
      {
        text: "Hale's team steers it by hand from the ground", odds: 90,
        requires: { personnel: 'hale' },
        onSuccess: { result: 'success', text: 'Dr. Hale reads the numbers aloud like a metronome. Perfect insertion.' },
        onFailure: { result: 'lost', text: 'Even Hale cannot save it. Range safety ends the flight.' },
      },
    ],
  },
  {
    id: 'engineOut', title: 'Engine out', phases: ['launch'], severity: 'major', crewed: 'any',
    text: 'One engine shuts down at T+2:10. The rest are still firing.',
    options: [
      {
        text: 'Burn the remaining engines longer', odds: 50,
        onSuccess: { result: 'success', text: 'The other engines compensate. Lower orbit, but orbit.' },
        onFailure: { result: 'lost', text: 'Not enough thrust. The vehicle falls back; any crew escape.' },
      },
      {
        text: 'Abort to the ocean', odds: 100,
        onSuccess: { result: 'abort', text: 'The flight ends early, safely.' },
      },
      {
        text: 'Hand-fly the rest of the ascent', odds: 80, skill: 'piloting',
        requires: { trait: 'testPilot' },
        onSuccess: { result: 'success', text: '{commander} flies the trajectory by feel. Mission control is speechless.' },
        onFailure: { result: 'abort', text: '{commander} keeps it stable long enough for a clean abort.' },
      },
    ],
  },
  {
    id: 'highWinds', title: 'High winds over the Cape', phases: ['launch'], severity: 'minor', crewed: 'any',
    text: 'Upper-level winds are near the limit. The launch director wants your call.',
    options: [
      {
        text: 'Launch anyway', odds: 85, skill: 'nerve',
        onSuccess: { result: 'success', text: 'A bumpy ride, but a good one.' },
        onFailure: { result: 'lost', text: 'Wind shear tears the rocket apart. Any crew escape.' },
      },
      {
        text: 'Scrub and roll back', odds: 100,
        onSuccess: { result: 'abort', text: 'Scrubbed. The money for this flight is gone.', public: -2 },
      },
    ],
  },
  {
    id: 'padLeak', title: 'Propellant leak on the pad', phases: ['launch'], severity: 'minor', crewed: 'any',
    text: 'A valve is venting propellant. The countdown is holding at T-10 minutes.',
    options: [
      {
        text: 'Send a crew to fix it on the pad', odds: 75, skill: 'repair',
        onSuccess: { result: 'success', text: 'Wrench, gloves, nerve. Launch on time.' },
        onFailure: { result: 'abort', text: 'The fix fails. Scrubbed.' },
      },
      {
        text: 'Scrub and investigate', odds: 100,
        onSuccess: { result: 'abort', text: 'Scrubbed. Safe, expensive, slow.' },
      },
      {
        text: 'The stage is storable; drain and reload it today', odds: 95,
        requires: { fuel: 'hypergolic' },
        onSuccess: { result: 'success', text: 'Hypergolics sit happily in the tanks. Fixed and launched by sunset.' },
        onFailure: { result: 'abort', text: 'The reload takes too long. Scrubbed.' },
      },
    ],
  },

  // ---------------- Orbit ----------------
  {
    id: 'powerBus', title: 'Power bus failure', phases: ['orbit'], severity: 'major', crewed: 'any',
    text: 'The main power bus drops out. Batteries are draining.',
    options: [
      {
        text: 'Shed every non-essential load and limp on', odds: 60, skill: 'repair',
        onSuccess: { result: 'success', text: 'Dim and cold, but the objective is met.' },
        onFailure: { result: 'lost', text: 'Power dies. Any crew ride home on the emergency system; the spacecraft is lost.' },
      },
      {
        text: 'End the mission now', odds: 100,
        onSuccess: { result: 'abort', text: 'Early return. No objective.' },
      },
    ],
  },
  {
    id: 'stuckThruster', title: 'Stuck thruster', phases: ['orbit', 'rendezvous'], severity: 'major', crewed: true,
    text: 'A thruster is stuck open. The capsule is spinning faster every second and {commander} is struggling to stay conscious.',
    options: [
      {
        text: 'Use reentry thrusters to stop the spin', odds: 70, skill: 'piloting',
        onSuccess: { result: 'abort', text: 'The spin stops. Reentry fuel is spent, so they come home now.' },
        onFailure: { result: 'disaster', text: 'The spin wins. Contact is lost.' },
      },
      {
        text: 'Keep troubleshooting', odds: 40, skill: 'repair',
        onSuccess: { result: 'success', text: 'They find the bad circuit. Mission continues.' },
        onFailure: { result: 'abort', text: 'No luck. They burn reentry fuel to stop the spin and come home.' },
      },
      {
        text: 'Manual control, the hard way', odds: 85, skill: 'piloting',
        requires: { trait: 'testPilot' },
        onSuccess: { result: 'success', text: '{commander} isolates the thruster and steadies the ship. Mission continues.' },
        onFailure: { result: 'abort', text: '{commander} stops the spin but has to come home.' },
      },
    ],
  },
  {
    id: 'satSpin', title: 'Satellite spinning out of control', phases: ['orbit'], severity: 'major', crewed: false,
    text: 'The spacecraft is tumbling. Its antenna sweeps past Earth once every few seconds.',
    options: [
      {
        text: 'Command a despin sequence', odds: 60, skill: 'repair',
        onSuccess: { result: 'success', text: 'It steadies. Signal locked.' },
        onFailure: { result: 'lost', text: 'Silence. It will orbit, dead, for decades.' },
      },
      {
        text: 'Accept partial data', odds: 100,
        onSuccess: { result: 'abort', text: 'Scraps of data. Not enough to claim success.' },
      },
    ],
  },
  {
    id: 'telemetryLost', title: 'Telemetry lost', phases: ['orbit', 'transfer'], severity: 'minor', crewed: 'any',
    text: 'All signal lost over the Pacific. The next tracking station is twenty minutes away.',
    options: [
      {
        text: 'Wait for the next pass', odds: 85, skill: 'nerve',
        onSuccess: { result: 'success', text: 'Twenty long minutes. Then: signal.' },
        onFailure: { result: 'lost', text: 'The signal never comes back.' },
      },
      {
        text: 'Command an early return on the next contact', odds: 100,
        onSuccess: { result: 'abort', text: 'Played safe. No objective.' },
      },
    ],
  },
  {
    id: 'co2Rising', title: 'Cabin CO2 rising', phases: ['orbit', 'eva', 'rendezvous'], severity: 'minor', crewed: true,
    text: 'The CO2 scrubber is underperforming. {commander} reports a headache.',
    options: [
      {
        text: 'Press on', odds: 75, skill: 'nerve',
        onSuccess: { result: 'success', text: 'Headaches all round, objective complete.' },
        onFailure: { result: 'abort', text: 'It gets worse. Early return.' },
      },
      {
        text: 'Cut the flight short but grab what you can', odds: 100,
        onSuccess: { result: 'success', text: 'Objective met in a hurry. Less to show the press.', prestige: -3 },
      },
    ],
  },
  {
    id: 'solarFlare', title: 'Solar flare warning', phases: ['orbit', 'transfer'], severity: 'minor', crewed: true,
    text: 'The Sun has flared. A radiation storm will arrive within hours.',
    options: [
      {
        text: 'Shelter in the capsule and ride it out', odds: 80, skill: 'nerve',
        onSuccess: { result: 'success', text: 'The storm is weaker than feared.' },
        onFailure: { result: 'abort', text: 'Dosimeters climb. Flight surgeon orders them home.' },
      },
      {
        text: 'Come home now', odds: 100,
        onSuccess: { result: 'abort', text: 'Safe, no objective.' },
      },
    ],
  },

  // ---------------- Rendezvous / docking ----------------
  {
    id: 'radarDead', title: 'Rendezvous radar dead', phases: ['rendezvous'], severity: 'major', crewed: true,
    text: 'The radar is out. The target is a speck of light somewhere ahead.',
    options: [
      {
        text: 'Eyeball the approach', odds: 50, skill: 'piloting',
        onSuccess: { result: 'success', text: 'A sextant, a pencil and good eyes. Docked.' },
        onFailure: { result: 'abort', text: 'They miss, and fuel runs low. Heading home.' },
      },
      {
        text: 'Abort the rendezvous', odds: 100,
        onSuccess: { result: 'abort', text: 'Back to Earth. No objective.' },
      },
      {
        text: 'Hale computes the burns by hand', odds: 88,
        requires: { personnel: 'hale' },
        onSuccess: { result: 'success', text: 'Dr. Hale reads up the numbers. Contact and capture.' },
        onFailure: { result: 'abort', text: 'Close, but not close enough. Heading home.' },
      },
    ],
  },
  {
    id: 'overshoot', title: 'Overshot the target', phases: ['rendezvous'], severity: 'minor', crewed: true,
    text: 'Orbital mechanics bites: thrusting toward the target pushed them away from it.',
    options: [
      {
        text: 'Burn retrograde and try again', odds: 75, skill: 'piloting',
        onSuccess: { result: 'success', text: 'Lesson learned. Docked on the second try.' },
        onFailure: { result: 'abort', text: 'Out of fuel for another try.' },
      },
      {
        text: 'Call it and come home', odds: 100,
        onSuccess: { result: 'abort', text: 'No docking today.' },
      },
    ],
  },

  // ---------------- Spacewalk ----------------
  {
    id: 'suitBalloon', title: 'Spacesuit ballooning', phases: ['eva'], severity: 'major', crewed: true,
    text: "{commander}'s suit has stiffened like a balloon. They can't bend enough to get back through the hatch.",
    options: [
      {
        text: 'Bleed suit pressure to dangerous levels', odds: 65, skill: 'nerve',
        onSuccess: { result: 'success', text: 'Dizzy, but inside. The spacewalk counts.' },
        onFailure: { result: 'disaster', text: 'They black out at the hatch.' },
      },
      {
        text: 'Crewmate hauls them in by the tether', odds: 80,
        onSuccess: { result: 'abort', text: 'Dragged in, bruised. Ground rules the EVA incomplete.' },
        onFailure: { result: 'disaster', text: 'The tether snaps.' },
      },
      {
        text: 'Talk through it calmly, one inch at a time', odds: 92, skill: 'nerve',
        requires: { trait: 'iceWater' },
        onSuccess: { result: 'success', text: "{commander}'s heart rate never goes above 90. Inside, spacewalk complete." },
        onFailure: { result: 'abort', text: 'Inside at last, but the EVA is scrubbed.' },
      },
    ],
  },
  {
    id: 'tangledTether', title: 'Tangled tether', phases: ['eva'], severity: 'minor', crewed: true,
    text: 'The tether has looped around an antenna.',
    options: [
      {
        text: 'Work it loose', odds: 80, skill: 'repair',
        onSuccess: { result: 'success', text: 'Free. The spacewalk continues.' },
        onFailure: { result: 'abort', text: 'They cut the EVA short to be safe.' },
      },
      {
        text: 'Cut the EVA short', odds: 100,
        onSuccess: { result: 'success', text: 'A short spacewalk is still a spacewalk.', prestige: -2 },
      },
    ],
  },

  // ---------------- Transfer (to the Moon) ----------------
  {
    id: 'burnCutoff', title: 'Translunar burn cut off early', phases: ['transfer'], severity: 'major', crewed: 'any',
    text: 'The upper stage shut down 40 seconds early. The trajectory misses the Moon.',
    options: [
      {
        text: "Use the spacecraft's own engine to make up the difference", odds: 55, skill: 'repair',
        onSuccess: { result: 'success', text: 'Every drop of margin used. Back on course.' },
        onFailure: { result: 'abort', text: 'Not enough. They settle for a high Earth orbit and come home.' },
      },
      {
        text: 'Settle for a high Earth orbit', odds: 100,
        onSuccess: { result: 'abort', text: 'No Moon this time.' },
      },
      {
        text: 'Restart the hypergolic stage', odds: 85,
        requires: { fuel: 'hypergolic' },
        onSuccess: { result: 'success', text: 'Storable propellants light on command. Burn complete.' },
        onFailure: { result: 'abort', text: 'It will not relight. High Earth orbit and home.' },
      },
    ],
  },
  {
    id: 'oxygenTank', title: 'Oxygen tank ruptures', phases: ['transfer'], severity: 'major', crewed: true,
    text: '"We\'ve had a problem." A bang, a shudder, and oxygen venting into space. They are 200,000 miles out.',
    options: [
      {
        text: 'Abort on a free-return loop around the Moon', odds: 65, skill: 'nerve',
        onSuccess: { result: 'abort', text: 'Cold, dark, rationed. They make it home.' },
        onFailure: { result: 'disaster', text: 'The air runs out before Earth does.' },
      },
      {
        text: 'Push on for the objective', odds: 20,
        onSuccess: { result: 'success', text: 'Insane, and it works. They will never be allowed to do it again.' },
        onFailure: { result: 'disaster', text: 'They never come back.' },
      },
      {
        text: 'Build a CO2 adapter from manuals and tape', odds: 90, skill: 'repair',
        requires: { trait: 'engineer' },
        onSuccess: { result: 'abort', text: '{commander} builds it from cardboard and duct tape. All home safe.', public: 6 },
        onFailure: { result: 'disaster', text: 'The adapter leaks. The air runs out.' },
      },
      {
        text: '"Work the problem, people."', odds: 92,
        requires: { personnel: 'calloway' },
        onSuccess: { result: 'abort', text: "Calloway's room finds a way. Everyone home. A successful failure.", public: 8 },
        onFailure: { result: 'disaster', text: 'They tried everything.' },
      },
    ],
  },
  {
    id: 'navDrift', title: 'Navigation drift', phases: ['transfer'], severity: 'minor', crewed: 'any',
    text: 'The trajectory is drifting. A correction is needed.',
    options: [
      {
        text: 'Midcourse correction burn', odds: 85, skill: 'piloting',
        onSuccess: { result: 'success', text: 'Right on the numbers.' },
        onFailure: { result: 'abort', text: 'The burn overcorrects. The objective is out of reach.' },
      },
      {
        text: 'Wait and correct later', odds: 65,
        onSuccess: { result: 'success', text: 'The drift cancels itself out. Lucky.' },
        onFailure: { result: 'abort', text: 'Too late to fix.' },
      },
    ],
  },

  // ---------------- Landing ----------------
  {
    id: 'programAlarm', title: 'Computer alarms during descent', phases: ['landing'], severity: 'major', crewed: true,
    text: 'Program alarm 1202. Then again. The computer is overloaded, 3,000 feet above the surface.',
    options: [
      {
        text: 'Trust the computer and continue', odds: 65, skill: 'nerve',
        onSuccess: { result: 'success', text: 'The alarms stop. Contact light.' },
        onFailure: { result: 'abort', text: 'The computer freezes. They abort to orbit.' },
      },
      {
        text: 'Abort to orbit', odds: 100,
        onSuccess: { result: 'abort', text: 'So close. They fly home.' },
      },
      {
        text: 'Take manual control and fly past the boulders', odds: 85, skill: 'piloting',
        requires: { trait: 'testPilot' },
        onSuccess: { result: 'success', text: '{commander} flies it down with seconds of fuel to spare.' },
        onFailure: { result: 'disaster', text: 'The lander hits too hard.' },
      },
      {
        text: "Guidance team: \"We're GO on that alarm.\"", odds: 95,
        requires: { personnel: 'hale' },
        onSuccess: { result: 'success', text: "Hale's team knew that alarm cold. The Eagle has landed." },
        onFailure: { result: 'abort', text: 'Hale calls the abort herself. Everyone safe.' },
      },
    ],
  },
  {
    id: 'lowFuel', title: 'Low fuel, still hovering', phases: ['landing'], severity: 'major', crewed: true,
    text: 'The landing site is a boulder field. Sixty seconds of fuel left.',
    options: [
      {
        text: 'Keep looking for a flat spot', odds: 50, skill: 'piloting',
        onSuccess: { result: 'success', text: 'Thirty seconds. Twenty. Contact.' },
        onFailure: { result: 'disaster', text: 'Fuel runs out ten feet up.' },
      },
      {
        text: 'Abort: fire the ascent stage', odds: 85,
        onSuccess: { result: 'abort', text: 'They climb back to orbit and home.' },
        onFailure: { result: 'disaster', text: 'The ascent engine does not light.' },
      },
      {
        text: 'Set it down on the first clear patch', odds: 85, skill: 'piloting',
        requires: { trait: 'testPilot' },
        onSuccess: { result: 'success', text: '{commander} plants it like a carrier landing.' },
        onFailure: { result: 'abort', text: 'No clear patch. Abort to orbit.' },
      },
    ],
  },
  {
    id: 'altimeterFail', title: 'Probe radar altimeter fails', phases: ['landing'], severity: 'major', crewed: false,
    text: 'The lander has no idea how high it is.',
    options: [
      {
        text: 'Switch to a timer-based descent', odds: 55, skill: 'repair',
        onSuccess: { result: 'success', text: 'The math holds. Soft landing confirmed.' },
        onFailure: { result: 'lost', text: 'A new crater on the Moon.' },
      },
      {
        text: 'Let it fall and hope', odds: 30,
        onSuccess: { result: 'success', text: 'It bounces, and survives.' },
        onFailure: { result: 'lost', text: 'Signal lost on impact.' },
      },
      {
        text: "Hale's team flies it down with ground radar", odds: 85,
        requires: { personnel: 'hale' },
        onSuccess: { result: 'success', text: 'Pictures start coming back from the surface.' },
        onFailure: { result: 'lost', text: 'Too much delay in the signal. Lost.' },
      },
    ],
  },
  {
    id: 'slope', title: 'Landed on a slope', phases: ['landing'], severity: 'minor', crewed: 'any',
    text: 'The lander is tilted 12 degrees. Close to the limit.',
    options: [
      {
        text: 'Stay and finish the job', odds: 85, skill: 'nerve',
        onSuccess: { result: 'success', text: 'It holds. Job done.' },
        onFailure: { result: 'abort', text: 'It shifts. They leave immediately.' },
      },
      {
        text: 'Leave early', odds: 100,
        onSuccess: { result: 'success', text: 'A short visit, but it counts.', prestige: -4 },
      },
    ],
  },

  // ---------------- Reentry ----------------
  {
    id: 'heatShield', title: 'Heat shield warning', phases: ['reentry'], severity: 'major', crewed: true,
    text: 'A sensor says the heat shield may be loose. Reentry starts in 30 minutes.',
    options: [
      {
        text: 'Keep the retro-pack strapped on to hold the shield', odds: 72, skill: 'nerve',
        onSuccess: { result: 'success', text: 'Fireballs past the window. Then parachutes.' },
        onFailure: { result: 'disaster', text: 'The shield tears away.' },
      },
      {
        text: "Trust that it's a faulty sensor", odds: 60,
        onSuccess: { result: 'success', text: 'It was the sensor. Splashdown.' },
        onFailure: { result: 'disaster', text: 'It was not the sensor.' },
      },
      {
        text: 'Run the sensor diagnostics in orbit first', odds: 92, skill: 'repair',
        requires: { trait: 'engineer' },
        onSuccess: { result: 'success', text: '{commander} traces it to a bad switch. Routine splashdown.' },
        onFailure: { result: 'disaster', text: 'The diagnostics were wrong.' },
      },
    ],
  },
  {
    id: 'chuteStreaming', title: 'Main parachute streaming', phases: ['reentry'], severity: 'major', crewed: true,
    text: 'The main chute has not opened. The capsule is falling fast.',
    options: [
      {
        text: 'Cut it away and deploy the reserve', odds: 80,
        onSuccess: { result: 'success', text: 'The reserve blooms. Hard splashdown, crew fine.' },
        onFailure: { result: 'disaster', text: 'The reserve tangles with the main.' },
      },
      {
        text: 'Wait for it to open', odds: 45, skill: 'nerve',
        onSuccess: { result: 'success', text: 'It snaps open at 5,000 feet.' },
        onFailure: { result: 'disaster', text: 'It never opens.' },
      },
    ],
  },
  {
    id: 'offTarget', title: 'Splashdown off target', phases: ['reentry'], severity: 'minor', crewed: true,
    text: 'Splashdown 250 miles from the recovery ships. The capsule is taking on water.',
    options: [
      {
        text: 'Wait for the Navy', odds: 85, skill: 'nerve',
        onSuccess: { result: 'success', text: 'Picked up wet but fine.' },
        onFailure: { result: 'success', text: 'The capsule sinks; crew rescued from the water. Bad press.', public: -6 },
      },
      {
        text: 'Air Force helicopters are already overhead', odds: 100,
        requires: { favor: 'airForce' },
        onSuccess: { result: 'success', text: 'A textbook rescue, live on TV.', public: 4 },
      },
    ],
  },

  // ---------------- Any phase (fallbacks) ----------------
  {
    id: 'pressLeak', title: 'The press finds out', phases: 'any', severity: 'minor', crewed: 'any',
    text: 'A reporter has learned about a problem on this flight.',
    options: [
      {
        text: 'Tell the truth', odds: 100,
        onSuccess: { result: 'success', text: 'Honesty plays well with the public. Congress is less pleased.', public: 3, congress: -3 },
      },
      {
        text: 'Say nothing', odds: 70,
        onSuccess: { result: 'success', text: 'The story never runs.' },
        onFailure: { result: 'success', text: 'The cover-up becomes the story.', public: -8 },
      },
      {
        text: 'Put your astronaut in front of the cameras', odds: 95, skill: 'charm',
        requires: { trait: 'mediaDarling' },
        onSuccess: { result: 'success', text: '{commander} turns it into a joke. The nation laughs along.', public: 6 },
        onFailure: { result: 'success', text: 'It falls flat.', public: -2 },
      },
    ],
  },
  {
    id: 'computerReboot', title: 'Onboard computer restarts', phases: 'any', severity: 'minor', crewed: 'any',
    text: 'The guidance computer rebooted without warning.',
    options: [
      {
        text: 'Reload from the backup tape', odds: 85, skill: 'repair',
        onSuccess: { result: 'success', text: 'Back online in four minutes.' },
        onFailure: { result: 'abort', text: 'The reload fails. Mission ended early.' },
      },
      {
        text: 'Ask the Air Force tracking network for a fix', odds: 100,
        requires: { favor: 'airForce' },
        onSuccess: { result: 'success', text: 'Military radar provides the state vector. Back on track.' },
      },
    ],
  },
  {
    id: 'systemFault', title: 'Multiple system faults', phases: 'any', severity: 'major', crewed: 'any',
    text: 'Warning lights everywhere. Nobody is sure which ones are real.',
    options: [
      {
        text: 'Work through the checklist', odds: 60, skill: 'repair',
        onSuccess: { result: 'success', text: 'Half were false alarms. The rest are fixable.' },
        onFailure: { result: 'lost', text: 'The real fault is the one nobody checked. Vehicle lost; any crew escape.' },
      },
      {
        text: 'Abort now', odds: 100,
        onSuccess: { result: 'abort', text: 'Safe. No objective.' },
      },
      {
        text: '"Work the problem, people."', odds: 88,
        requires: { personnel: 'calloway' },
        onSuccess: { result: 'success', text: 'Calloway triages the board in ninety seconds.' },
        onFailure: { result: 'abort', text: 'Calloway calls the abort. Everyone safe.' },
      },
    ],
  },
];
