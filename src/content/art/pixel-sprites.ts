// Pixel sprites as text. Each string is one row; each letter is one pixel.
// Letters are colors from the CRT palette (see src/ui/art.ts):
//   .  empty      d  dark green   m  mid green   b  bright green   w  near-white
//   a  amber      r  red
// Face sprites also use: S skin, H hair, k eyes, o mouth, u suit (the UI picks shades per astronaut).
// Edit freely: keep every row in a sprite the same width.

export const boosterSprites = {
  small: [
    '....mbbm....', '....mbbm....', '....mddm....', '....mbbm....',
    '....mbbm....', '...dmbbmd...', '..dd.mm.dd..', '..d..dd..d..',
  ],
  medium: [
    '...mbbbbm...', '...mbddbm...', '...mbbbbm...', '...mbbbbm...', '...mbbbbm...',
    '...mbddbm...', '...mbbbbm...', '...mbbbbm...', '..dmbbbbmd..', '.dd.mmmm.dd.', '.d...dd...d.',
  ],
  large: [
    '..mbbbbbbm..', '..mbddddbm..', '..mbbbbbbm..', '..mbbbbbbm..', '..mbbbbbbm..',
    '..mbbbbbbm..', '..mbddddbm..', '..mbbbbbbm..', '..mbbbbbbm..', '..mbbbbbbm..',
    '..mbbbbbbm..', '.dmbbbbbbmd.', 'dd.mmmmmm.dd', 'd..d.dd.d..d',
  ],
  huge: [
    '.mbbbbbbbbm.', '.mbddddddbm.', '.mbbbbbbbbm.', '.mbbbbbbbbm.', '.mbbbbbbbbm.',
    '.mbbbbbbbbm.', '.mbddddddbm.', '.mbbbbbbbbm.', '.mbbbbbbbbm.', '.mbbbbbbbbm.',
    '.mbbbbbbbbm.', '.mbddddddbm.', '.mbbbbbbbbm.', '.mbbbbbbbbm.', 'dmbbbbbbbbmd',
    'd.mmmmmmmm.d', 'd..d.dd.d..d',
  ],
};

/** Upper stages. Hydrogen stages get an amber stripe. */
export const upperSprites = {
  standard: ['...mwwwwm...', '...mddddm...', '...mwwwwm...'],
  hydrogen: ['...mwwwwm...', '...mawwam...', '...mwwwwm...', '...mddddm...'],
};

export const payloadSprites = {
  satellite: ['.....bb.....', '.d..bwwb..d.', '..dbwwwwbd..', '....bbbb....'],
  lunarProbe: ['....bbbb....', '...bwwwwb...', '..d.bbbb.d..', '.d........d.'],
  capsule: ['.....bb.....', '....bwwb....', '...bwddwb...', '...bwwwwb...'],
  lunarCapsule: ['.....bb.....', '....bwwb....', '...bwddwb...', '..bwwwwwwb..', '..mmmmmmmm..'],
  lunarLander: [
    '.....bb.....', '....bwwb....', '...bwddwb...', '..bwwwwwwb..',
    '..mmmmmmmm..', '..d.aaaa.d..', '.d..aaaa..d.',
  ],
};

export const flameSprite = ['...aabbaa...', '....abba....', '.....aa.....'];

/** Astronaut portrait in a helmet. Hair rows are swapped in per astronaut. */
export const faceSprite = [
  '...bbbbbb...',
  '..bwwwwwwb..',
  '.bwHHHHHHwb.',
  '.bwSSSSSSwb.',
  '.bwSkSSkSwb.',
  '.bwSSSSSSwb.',
  '.bwSSooSSwb.',
  '.bwwSSSSwwb.',
  '..bwwwwwwb..',
  '.uuubbbbuuu.',
  'uuuuuuuuuuuu',
  'uuuuuuuuuuuu',
];

/** Hair styles: the row that replaces row 2 of the face. */
export const hairStyles = ['HHHHHH', '.HHHH.', 'HH..HH', 'SSSSSS'];

/** The Soviet rival's emblem rocket. */
export const rivalSprite = ['...r...', '..rrr..', '..rwr..', '..rrr..', '..rrr..', '.rrrrr.', 'r.r.r.r'];
