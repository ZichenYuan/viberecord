// Creative Character Mode Skins inspired by cartoon characters with distinctive patterns

export const characterSkins = {
  default: {
    id: 'character-default',
    name: 'Default',
    description: 'Simple gray stick figure',
    colors: {
      body: '#4A5568',           // Gray body
      headFrame: '#2D3748',      // Darker gray frame
      headBackground: '#4A5568', // Matching body
      leftArm: '#4A5568',        // Same as body
      rightArm: '#4A5568',       // Same as body
      legs: '#4A5568'            // Same as body
    }
  },

  mickey: {
    id: 'character-mickey',
    name: 'Mickey',
    description: 'Red shorts with yellow buttons and black mouse ears',
    colors: {
      body: '#FFD700',           // Yellow shirt
      headFrame: '#000000',      // Black frame (mouse ears color)
      headBackground: '#FFEB99', // Light yellow head
      leftArm: '#FFD700',        // Yellow arms
      rightArm: '#FFD700',
      legs: '#DC143C'            // Red shorts
    },
    patterns: {
      body: 'polka-dots',        // Yellow shirt with small dots
      legs: 'solid-with-buttons' // Red shorts with yellow buttons
    },
    extras: {
      head: [
        { type: 'circle', x: -20, y: -15, radius: 18, color: '#000000' }, // Left ear
        { type: 'circle', x: 20, y: -15, radius: 18, color: '#000000' }   // Right ear
      ],
      body: [
        { type: 'dot', x: 43, y: 55, radius: 1, color: '#FFA500' },
        { type: 'dot', x: 47, y: 62, radius: 1, color: '#FFA500' },
        { type: 'dot', x: 55, y: 58, radius: 1, color: '#FFA500' }
      ],
      legs: [
        { type: 'circle', x: 44, y: 95, radius: 2, color: '#FFD700' }, // Left button
        { type: 'circle', x: 54, y: 95, radius: 2, color: '#FFD700' }  // Right button
      ]
    }
  },

  bumblebee: {
    id: 'character-bumblebee',
    name: 'Bee',
    description: 'Black and yellow stripes like a cartoon bee',
    colors: {
      body: '#FFD700',           // Yellow base
      headFrame: '#000000',      // Black frame
      headBackground: '#FFD700', // Yellow head
      leftArm: '#FFD700',        // Yellow arms
      rightArm: '#FFD700',
      legs: '#000000'            // Black legs
    },
    patterns: {
      body: 'bee-stripes',       // Alternating black and yellow
      arms: 'bee-stripes'        // Striped arms too
    },
    extras: {
      body: [
        { type: 'stripe', x: 40, y: 52, width: 20, height: 4, color: '#000000' },
        { type: 'stripe', x: 40, y: 62, width: 20, height: 4, color: '#000000' },
        { type: 'stripe', x: 40, y: 72, width: 20, height: 4, color: '#000000' },
        { type: 'stripe', x: 40, y: 82, width: 20, height: 4, color: '#000000' }
      ],
      wings: [
        { type: 'bee-wing', x: 25, y: 45, width: 18, height: 12, color: 'rgba(255,255,255,0.8)' }, // Left big wing
        { type: 'bee-wing', x: 57, y: 45, width: 18, height: 12, color: 'rgba(255,255,255,0.8)' }, // Right big wing
        { type: 'bee-wing', x: 30, y: 52, width: 12, height: 8, color: 'rgba(255,255,255,0.7)' },  // Left small wing
        { type: 'bee-wing', x: 58, y: 52, width: 12, height: 8, color: 'rgba(255,255,255,0.7)' }   // Right small wing
      ]
    }
  },

  bear: {
    id: 'character-bear',
    name: 'Bear',
    description: 'Brown bear with round ears and paw prints',
    colors: {
      body: '#8B4513',           // Brown body
      headFrame: '#654321',      // Dark brown frame
      headBackground: '#D2B48C', // Tan head
      leftArm: '#8B4513',        // Brown arms
      rightArm: '#8B4513',
      legs: '#654321'            // Dark brown legs
    },
    extras: {
      head: [
        { type: 'circle', x: -20, y: -15, radius: 18, color: '#654321' }, // Left ear
        { type: 'circle', x: 20, y: -15, radius: 18, color: '#654321' }   // Right ear
      ],
      body: [
        { type: 'dot', x: 45, y: 55, radius: 2, color: '#654321' }, // Paw print dot
        { type: 'dot', x: 53, y: 65, radius: 2, color: '#654321' },
        { type: 'dot', x: 47, y: 75, radius: 2, color: '#654321' }
      ]
    }
  },

  cat: {
    id: 'character-cat',
    name: 'Cat',
    description: 'Gray cat with pointed ears and curved tail',
    colors: {
      body: '#F5F5F5',           // Light gray body
      headFrame: '#E5E5E5',      // Slightly darker gray frame
      headBackground: '#FFFFFF', // White head
      leftArm: '#F5F5F5',        // Light gray arms
      rightArm: '#F5F5F5',
      legs: '#E5E5E5'            // Gray legs
    },
    extras: {
      head: [
        { type: 'circle', x: -20, y: -15, radius: 18, color: '#E5E5E5' }, // Left ear
        { type: 'circle', x: 20, y: -15, radius: 18, color: '#E5E5E5' }   // Right ear
      ],
      body: [
        { type: 'dot', x: 48, y: 58, radius: 1, color: '#E5E5E5' }, // Fur spots
        { type: 'dot', x: 52, y: 68, radius: 1, color: '#E5E5E5' },
        { type: 'dot', x: 45, y: 78, radius: 1, color: '#E5E5E5' }
      ],
      tail: [
        { type: 'cat-tail', x: 58, y: 75, width: 3, height: 20, color: '#E5E5E5' } // Curved cat tail
      ]
    }
  }

};

// Helper function to apply skin to character parts
export const applyCharacterSkin = (skinId) => {
  return characterSkins[skinId] || characterSkins.default;
};

// Special effects rendering for character mode
export const renderCharacterEffect = (effect, x, y, width, height) => {
  switch (effect.type) {
    case 'dot':
    case 'circle':
      return `<circle cx="${effect.x}" cy="${effect.y}" r="${effect.radius}" fill="${effect.color}"/>`;

    case 'stripe':
    case 'rect':
      return `<rect x="${effect.x}" y="${effect.y}" width="${effect.width}" height="${effect.height}" fill="${effect.color}"/>`;

    case 'bee-wing':
      return `
        <ellipse cx="${effect.x + effect.width/2}" cy="${effect.y + effect.height/2}"
                 rx="${effect.width/2}" ry="${effect.height/2}"
                 fill="${effect.color}" stroke="rgba(0,0,0,0.2)" stroke-width="0.5"/>
        <ellipse cx="${effect.x + effect.width/2}" cy="${effect.y + effect.height/2 - 1}"
                 rx="${effect.width/3}" ry="${effect.height/3}"
                 fill="rgba(255,255,255,0.9)" opacity="0.8"/>
      `;

    case 'cat-tail':
      return `
        <path d="M${effect.x} ${effect.y} Q${effect.x + 5} ${effect.y - 10} ${effect.x + 10} ${effect.y - 5} Q${effect.x + 15} ${effect.y + 5} ${effect.x + 8} ${effect.y + 15}"
              stroke="${effect.color}" stroke-width="${effect.width}" fill="none" stroke-linecap="round"/>
      `;

    default:
      return '';
  }
};