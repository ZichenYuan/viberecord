// Bubble Mode Skins with Fun Accessories

export const bubbleSkins = {
  default: {
    id: 'bubble-default',
    name: 'Default',
    description: 'Simple circular bubble',
    borderColor: '#667eea',
    borderWidth: '3px',
    backgroundColor: 'transparent',
    accessories: []
  },


  crown: {
    id: 'bubble-crown',
    name: 'Royal Crown',
    description: 'Majestic golden crown',
    borderColor: '#FFD700',
    borderWidth: '3px',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    accessories: [
      { type: 'crown', x: 0, y: -70, width: 70, height: 45, image: 'crown-svgrepo-com.svg' }
    ]
  },

  graduationCap: {
    id: 'bubble-graduation',
    name: 'Graduation Cap',
    description: 'Academic achievement cap',
    borderColor: '#2C3E50',
    borderWidth: '3px',
    backgroundColor: 'rgba(44, 62, 80, 0.1)',
    accessories: [
      { type: 'hat', x: 0, y: -70, width: 80, height: 55, image: 'graduation-cap-svgrepo-com.svg' }
    ]
  },

  cowboyHat: {
    id: 'bubble-cowboy',
    name: 'Cowboy Hat',
    description: 'Western style hat',
    borderColor: '#8B4513',
    borderWidth: '3px',
    backgroundColor: 'rgba(139, 69, 19, 0.1)',
    accessories: [
      { type: 'hat', x: 0, y: -75, width: 100, height: 65, image: 'hat-cowboy-hobbies-7-svgrepo-com.svg' }
    ]
  },

  wizard: {
    id: 'bubble-wizard',
    name: 'Wizard',
    description: 'Magical wizard hat',
    borderColor: '#8B4A94',
    borderWidth: '3px',
    backgroundColor: 'rgba(139, 74, 148, 0.1)',
    accessories: [
      { type: 'hat', x: 0, y: -85, width: 85, height: 65, image: 'hat-svgrepo-com.svg' }
    ]
  }
};

// Helper function to apply bubble skin
export const applyBubbleSkin = (skinId) => {
  return bubbleSkins[skinId] || bubbleSkins.default;
};

// Accessory rendering function
export const renderBubbleAccessory = (accessory, bubbleSize) => {
  const scale = bubbleSize / 80; // Scale accessories based on bubble size

  switch (accessory.type) {
    case 'sunglasses':
      return `
        <ellipse cx="${accessory.x - 12}" cy="${accessory.y}" rx="10" ry="8" fill="${accessory.color}"/>
        <ellipse cx="${accessory.x + 12}" cy="${accessory.y}" rx="10" ry="8" fill="${accessory.color}"/>
        <rect x="${accessory.x - 2}" y="${accessory.y - 2}" width="4" height="4" fill="${accessory.color}"/>
        <ellipse cx="${accessory.x - 12}" cy="${accessory.y}" rx="8" ry="6" fill="rgba(0,0,0,0.8)"/>
        <ellipse cx="${accessory.x + 12}" cy="${accessory.y}" rx="8" ry="6" fill="rgba(0,0,0,0.8)"/>
      `;

    case 'crown':
    case 'hat':
      return `
        <image href="./${accessory.image}" x="${accessory.x - (accessory.width * scale)/2}" y="${accessory.y}" width="${accessory.width * scale}" height="${accessory.height * scale}"/>
      `;

    default:
      return '';
  }
};