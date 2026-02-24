// Square Man Mode Skins

export const squareSkins = {
  default: {
    id: 'square-default',
    name: 'Default',
    description: 'Basic brown lumberjack',
    colors: {
      torso: '#8B4513',
      torsoStroke: '#654321',
      arms: '#D2691E',
      legs: '#2F4F4F',
      legDetail: '#1C1C1C'
    }
  },

  knight: {
    id: 'square-knight',
    name: 'Knight',
    description: 'Armored medieval warrior',
    colors: {
      torso: '#C0C0C0',
      torsoStroke: '#808080',
      arms: '#A9A9A9',
      legs: '#696969',
      legDetail: '#2F4F4F'
    }
  },

  robot: {
    id: 'square-robot',
    name: 'Robot',
    description: 'Futuristic android',
    colors: {
      torso: '#4169E1',
      torsoStroke: '#191970',
      arms: '#1E90FF',
      legs: '#000080',
      legDetail: '#00FF88'
    }
  },

  lumberjack: {
    id: 'square-lumberjack',
    name: 'Lumberjack',
    description: 'Classic plaid shirt',
    colors: {
      torso: '#DC143C',
      torsoStroke: '#8B0000',
      arms: '#B22222',
      legs: '#2F4F4F',
      legDetail: '#000000'
    }
  },

  ninja: {
    id: 'square-ninja',
    name: 'Ninja',
    description: 'Stealthy black outfit',
    colors: {
      torso: '#2F2F2F',
      torsoStroke: '#000000',
      arms: '#404040',
      legs: '#1C1C1C',
      legDetail: '#808080'
    }
  },

  pirate: {
    id: 'square-pirate',
    name: 'Pirate',
    description: 'Seafaring buccaneer',
    colors: {
      torso: '#8B0000',
      torsoStroke: '#654321',
      arms: '#CD853F',
      legs: '#000080',
      legDetail: '#FFD700'
    }
  }
};

// Helper function to apply skin to square parts
export const applySkin = (skinId) => {
  return squareSkins[skinId] || squareSkins.default;
};