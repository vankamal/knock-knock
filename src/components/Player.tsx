import React, { useState, useEffect } from 'react';
import { getAvatarStage } from '../data/avatars';

interface PlayerProps {
  position: {
    x: number;
    y: number;
  };
  playerData: {
    name: string;
    avatarId: number;
    avatarLevel: number;
  };
  isMoving: boolean;
  direction: 'up' | 'down' | 'left' | 'right';
}

const Player: React.FC<PlayerProps> = ({ 
  position, 
  playerData,
  isMoving, 
  direction
}) => {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [idleDirection, setIdleDirection] = useState<'up' | 'down' | 'left' | 'right'>('down');
  
  // Get sprite configuration from centralized data
  const spriteConfig = getAvatarStage(playerData.avatarId, playerData.avatarLevel);
  
  // Debug logging for avatar rendering
  console.log('Player component rendering with:', { 
    avatarId: playerData.avatarId, 
    avatarLevel: playerData.avatarLevel, 
    name: playerData.name, 
    spriteConfig 
  });
  
  // If no sprite config found, this indicates a data issue that should be addressed
  if (!spriteConfig) {
    console.error(`CRITICAL: No sprite configuration found for avatarId: ${playerData.avatarId}, level: ${playerData.avatarLevel}. Available avatars:`, playerData.avatarId);
    return null;
  }
  
  // Validate that directionMap exists
  if (!spriteConfig.directionMap) {
    console.error(`CRITICAL: No directionMap found for avatarId: ${playerData.avatarId}, level: ${playerData.avatarLevel}`);
    return null;
  }
  
  // Animation frame handling
  useEffect(() => {
    let animationFrame: number;
    let lastTimestamp = 0;
    const frameInterval = 100; // Milliseconds between frames
    
    const animate = (timestamp: number) => {
      if (!lastTimestamp) lastTimestamp = timestamp;
      
      const elapsed = timestamp - lastTimestamp;
      
      if (elapsed > frameInterval) {
        if (isMoving) {
          setCurrentFrame(prev => (prev + 1) % spriteConfig.frameCount);
          // Update idle direction only when moving
          setIdleDirection(direction);
        } else {
          setCurrentFrame(0); // Reset to idle frame when not moving
        }
        lastTimestamp = timestamp;
      }
      
      animationFrame = requestAnimationFrame(animate);
    };
    
    animationFrame = requestAnimationFrame(animate);
    
    return () => {
      cancelAnimationFrame(animationFrame);
    };
  }, [isMoving, direction, spriteConfig.frameCount]);

  // Get the row index based on direction using the avatar's specific direction mapping
  const getDirectionRow = () => {
    const directionToUse = isMoving ? direction : idleDirection;
    
    // Use the avatar's specific direction mapping
    const rowIndex = spriteConfig.directionMap[directionToUse];
    
    // Validate that the row index is valid
    if (rowIndex === undefined || rowIndex < 0 || rowIndex >= spriteConfig.rowCount) {
      console.error(`Invalid direction mapping for ${directionToUse}: ${rowIndex}. Using fallback row 0.`);
      return 0;
    }
    
    return rowIndex;
  };

  const scaledWidth = spriteConfig.frameWidth * spriteConfig.scale;
  const scaledHeight = spriteConfig.frameHeight * spriteConfig.scale;
  
  // Calculate background position
  const x = currentFrame * spriteConfig.frameWidth + spriteConfig.offsetX;
  const y = getDirectionRow() * spriteConfig.frameHeight + spriteConfig.offsetY;
  
  return (
    <div 
      className="absolute"
      style={{
        left: `${position.x - (scaledWidth / 2)}px`,
        top: `${position.y - (scaledHeight / 2)}px`,
        width: `${scaledWidth}px`,
        height: `${scaledHeight}px`,
        zIndex: Math.floor(position.y),
      }}
    >
      <div className="relative w-full h-full">
        {/* Character shadow */}
        <div 
          className="absolute left-1/2 -translate-x-1/2 rounded-full bg-black/30"
          style={{
            width: `${scaledWidth * 0.2}px`,
            height: `${5 * spriteConfig.scale}px`,
            bottom: '45px',
          }}
        />
        
        {/* Character sprite */}
        <div 
          className="character absolute inset-0"
          style={{
            backgroundImage: `url(${spriteConfig.spritePath})`,
            backgroundPosition: `-${x * spriteConfig.scale}px -${y * spriteConfig.scale}px`,
            backgroundSize: `${spriteConfig.frameWidth * spriteConfig.frameCount * spriteConfig.scale}px ${spriteConfig.frameHeight * spriteConfig.rowCount * spriteConfig.scale}px`,
          }}
        />
        
        {/* Player name */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-6 whitespace-nowrap px-2 py-0.5 bg-gray-800/75 text-white text-xs rounded-md font-pixel">
          {playerData.name}
        </div>
      </div>
    </div>
  );
};

export default Player;