// Global color seeding utility for admins
export const GLOBAL_COLORS = [
  // Basic Colors
  { colorName: 'Black', hexCode: '#000000', rgbCode: 'rgb(0, 0, 0)' },
  { colorName: 'White', hexCode: '#FFFFFF', rgbCode: 'rgb(255, 255, 255)' },
  { colorName: 'Gray', hexCode: '#808080', rgbCode: 'rgb(128, 128, 128)' },
  { colorName: 'Silver', hexCode: '#C0C0C0', rgbCode: 'rgb(192, 192, 192)' },
  
  // Primary Colors
  { colorName: 'Red', hexCode: '#FF0000', rgbCode: 'rgb(255, 0, 0)' },
  { colorName: 'Green', hexCode: '#008000', rgbCode: 'rgb(0, 128, 0)' },
  { colorName: 'Blue', hexCode: '#0000FF', rgbCode: 'rgb(0, 0, 255)' },
  
  // Extended Colors
  { colorName: 'Navy Blue', hexCode: '#000080', rgbCode: 'rgb(0, 0, 128)' },
  { colorName: 'Royal Blue', hexCode: '#4169E1', rgbCode: 'rgb(65, 105, 225)' },
  { colorName: 'Sky Blue', hexCode: '#87CEEB', rgbCode: 'rgb(135, 206, 235)' },
  { colorName: 'Forest Green', hexCode: '#228B22', rgbCode: 'rgb(34, 139, 34)' },
  { colorName: 'Lime Green', hexCode: '#32CD32', rgbCode: 'rgb(50, 205, 50)' },
  { colorName: 'Dark Red', hexCode: '#8B0000', rgbCode: 'rgb(139, 0, 0)' },
  { colorName: 'Crimson', hexCode: '#DC143C', rgbCode: 'rgb(220, 20, 60)' },
  
  // Neutral Colors
  { colorName: 'Beige', hexCode: '#F5F5DC', rgbCode: 'rgb(245, 245, 220)' },
  { colorName: 'Ivory', hexCode: '#FFFFF0', rgbCode: 'rgb(255, 255, 240)' },
  { colorName: 'Cream', hexCode: '#FFF8DC', rgbCode: 'rgb(255, 248, 220)' },
  { colorName: 'Tan', hexCode: '#D2B48C', rgbCode: 'rgb(210, 180, 140)' },
  { colorName: 'Brown', hexCode: '#A52A2A', rgbCode: 'rgb(165, 42, 42)' },
  { colorName: 'Dark Brown', hexCode: '#654321', rgbCode: 'rgb(101, 67, 33)' },
  
  // Purple/Violet Colors
  { colorName: 'Purple', hexCode: '#800080', rgbCode: 'rgb(128, 0, 128)' },
  { colorName: 'Violet', hexCode: '#8A2BE2', rgbCode: 'rgb(138, 43, 226)' },
  { colorName: 'Lavender', hexCode: '#E6E6FA', rgbCode: 'rgb(230, 230, 250)' },
  
  // Orange/Yellow Colors
  { colorName: 'Orange', hexCode: '#FFA500', rgbCode: 'rgb(255, 165, 0)' },
  { colorName: 'Dark Orange', hexCode: '#FF8C00', rgbCode: 'rgb(255, 140, 0)' },
  { colorName: 'Yellow', hexCode: '#FFFF00', rgbCode: 'rgb(255, 255, 0)' },
  { colorName: 'Gold', hexCode: '#FFD700', rgbCode: 'rgb(255, 215, 0)' },
  
  // Pink Colors
  { colorName: 'Pink', hexCode: '#FFC0CB', rgbCode: 'rgb(255, 192, 203)' },
  { colorName: 'Hot Pink', hexCode: '#FF69B4', rgbCode: 'rgb(255, 105, 180)' },
  { colorName: 'Rose', hexCode: '#FF007F', rgbCode: 'rgb(255, 0, 127)' },
  
  // Teal/Cyan Colors
  { colorName: 'Teal', hexCode: '#008080', rgbCode: 'rgb(0, 128, 128)' },
  { colorName: 'Cyan', hexCode: '#00FFFF', rgbCode: 'rgb(0, 255, 255)' },
  { colorName: 'Turquoise', hexCode: '#40E0D0', rgbCode: 'rgb(64, 224, 208)' },
  
  // Dark Colors
  { colorName: 'Dark Gray', hexCode: '#A9A9A9', rgbCode: 'rgb(169, 169, 169)' },
  { colorName: 'Charcoal', hexCode: '#36454F', rgbCode: 'rgb(54, 69, 79)' },
  { colorName: 'Midnight Blue', hexCode: '#191970', rgbCode: 'rgb(25, 25, 112)' },
];

// Function to seed global colors (admin only)
export async function seedGlobalColors() {
  const colors = [];
  
  for (const colorData of GLOBAL_COLORS) {
    try {
      const response = await fetch('/api/colors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...colorData,
          isActive: true
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        colors.push(data.color);
        console.log(`Created global color: ${colorData.colorName}`);
      } else {
        const error = await response.json();
        console.error(`Failed to create color ${colorData.colorName}:`, error);
      }
    } catch (error) {
      console.error(`Error creating color ${colorData.colorName}:`, error);
    }
  }
  
  return colors;
}











