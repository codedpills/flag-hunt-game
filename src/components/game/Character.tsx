import React from 'react';

interface CharacterProps {
  avatar: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  onClick?: () => void;
}

const Character: React.FC<CharacterProps> = ({
  avatar,
  size = 'md',
  selected = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
  };
  
  // Map avatar string to fruit colors
  const fruitColors: Record<string, string> = {
    apple: '#ff0000',
    orange: '#ff9900',
    banana: '#ffcc00',
    grape: '#9900cc',
    blueberry: '#0066ff',
    watermelon: '#ff3366',
    kiwi: '#99cc00',
    pineapple: '#ffcc33',
  };
  
  const color = fruitColors[avatar] || '#ff9900';
  
  // Fruit shapes and details
  const renderFruitHead = () => {
    const headSize = size === 'sm' ? 30 : size === 'md' ? 40 : 50;
    
    switch (avatar) {
      case 'apple':
        return (
          <div className="relative">
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize}px`,
                height: `${headSize}px`,
              }}
            />
            {/* Apple stem */}
            <div 
              className="absolute"
              style={{ 
                backgroundColor: '#8B4513',
                width: '4px',
                height: '8px',
                top: '-6px',
                left: `${headSize/2 - 2}px`,
              }}
            />
            {/* Apple leaf */}
            <div 
              className="absolute"
              style={{ 
                backgroundColor: '#2E8B57',
                width: '8px',
                height: '6px',
                borderRadius: '50% 50% 0 50%',
                transform: 'rotate(45deg)',
                top: '-6px',
                left: `${headSize/2 + 2}px`,
              }}
            />
          </div>
        );
      
      case 'orange':
        return (
          <div>
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize}px`,
                height: `${headSize}px`,
                boxShadow: 'inset 0 -4px 6px rgba(0,0,0,0.1)',
              }}
            />
            {/* Orange texture dots */}
            <div 
              className="absolute"
              style={{ 
                width: '4px',
                height: '4px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.3)',
                top: `${headSize/3}px`,
                left: `${headSize/3}px`,
              }}
            />
            <div 
              className="absolute"
              style={{ 
                width: '3px',
                height: '3px',
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.3)',
                top: `${headSize/2}px`,
                left: `${headSize/1.5}px`,
              }}
            />
          </div>
        );
      
      case 'banana':
        return (
          <div 
            className="rounded-full"
            style={{ 
              backgroundColor: color,
              width: `${headSize}px`,
              height: `${headSize}px`,
              borderRadius: '60% 60% 50% 50%',
              transform: 'rotate(-20deg)',
            }}
          />
        );
      
      case 'grape':
        return (
          <div className="flex flex-wrap justify-center" style={{ width: `${headSize}px` }}>
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize/2}px`,
                height: `${headSize/2}px`,
                margin: '1px',
              }}
            />
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize/2}px`,
                height: `${headSize/2}px`,
                margin: '1px',
              }}
            />
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize/2}px`,
                height: `${headSize/2}px`,
                margin: '1px',
              }}
            />
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize/2}px`,
                height: `${headSize/2}px`,
                margin: '1px',
              }}
            />
          </div>
        );
      
      case 'watermelon':
        return (
          <div className="relative">
            <div 
              style={{ 
                backgroundColor: color,
                width: `${headSize}px`,
                height: `${headSize/1.5}px`,
                borderRadius: '50% 50% 50% 50% / 60% 60% 40% 40%',
              }}
            />
            {/* Watermelon stripes */}
            <div 
              style={{ 
                position: 'absolute',
                backgroundColor: 'rgba(0,0,0,0.1)',
                width: `${headSize}px`,
                height: '3px',
                top: `${headSize/3}px`,
                left: '0',
              }}
            />
            <div 
              style={{ 
                position: 'absolute',
                backgroundColor: 'rgba(0,0,0,0.1)',
                width: `${headSize}px`,
                height: '3px',
                top: `${headSize/2}px`,
                left: '0',
              }}
            />
          </div>
        );
      
      case 'blueberry':
        return (
          <div className="relative">
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize}px`,
                height: `${headSize}px`,
              }}
            />
            {/* Blueberry top */}
            <div 
              className="absolute"
              style={{ 
                backgroundColor: '#663399',
                width: `${headSize/3}px`,
                height: '4px',
                borderRadius: '2px',
                top: '2px',
                left: `${headSize/2 - headSize/6}px`,
              }}
            />
          </div>
        );
      
      case 'kiwi':
        return (
          <div className="relative">
            <div 
              className="rounded-full"
              style={{ 
                backgroundColor: '#8B4513',
                width: `${headSize}px`,
                height: `${headSize}px`,
              }}
            />
            {/* Kiwi inside */}
            <div 
              className="absolute rounded-full"
              style={{ 
                backgroundColor: color,
                width: `${headSize*0.7}px`,
                height: `${headSize*0.7}px`,
                top: `${headSize*0.15}px`,
                left: `${headSize*0.15}px`,
              }}
            />
            {/* Kiwi seeds */}
            <div 
              className="absolute rounded-full"
              style={{ 
                backgroundColor: 'black',
                width: '3px',
                height: '3px',
                top: `${headSize*0.3}px`,
                left: `${headSize*0.4}px`,
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                backgroundColor: 'black',
                width: '3px',
                height: '3px',
                top: `${headSize*0.5}px`,
                left: `${headSize*0.6}px`,
              }}
            />
            <div 
              className="absolute rounded-full"
              style={{ 
                backgroundColor: 'black',
                width: '3px',
                height: '3px',
                top: `${headSize*0.6}px`,
                left: `${headSize*0.3}px`,
              }}
            />
          </div>
        );
      
      case 'pineapple':
        return (
          <div className="relative">
            <div 
              style={{ 
                backgroundColor: color,
                width: `${headSize}px`,
                height: `${headSize*1.2}px`,
                borderRadius: '40% 40% 50% 50%',
              }}
            />
            {/* Pineapple pattern */}
            <div 
              className="absolute"
              style={{ 
                width: `${headSize}px`,
                height: `${headSize*1.2}px`,
                backgroundImage: 'radial-gradient(circle, transparent 50%, rgba(0,0,0,0.1) 50%)',
                backgroundSize: '10px 10px',
                borderRadius: '40% 40% 50% 50%',
                top: '0',
                left: '0',
              }}
            />
            {/* Pineapple leaves */}
            <div 
              className="absolute"
              style={{ 
                backgroundColor: '#2E8B57',
                width: '8px',
                height: '12px',
                borderRadius: '0 50% 0 50%',
                top: '-10px',
                left: `${headSize/2 - 4}px`,
              }}
            />
            <div 
              className="absolute"
              style={{ 
                backgroundColor: '#2E8B57',
                width: '8px',
                height: '12px',
                borderRadius: '50% 0 50% 0',
                top: '-10px',
                left: `${headSize/2 - 4}px`,
              }}
            />
          </div>
        );
      
      default:
        return (
          <div 
            className="rounded-full"
            style={{ 
              backgroundColor: color,
              width: `${headSize}px`,
              height: `${headSize}px`,
            }}
          />
        );
    }
  };
  
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        relative flex flex-col items-center justify-center
        ${onClick ? 'cursor-pointer' : ''}
        ${selected ? 'ring-4 ring-blue-500 rounded-full' : ''}
      `}
      onClick={onClick}
    >
      {/* Character head (fruit) */}
      {renderFruitHead()}
      
      {/* Character body (stick figure) */}
      <div className="flex flex-col items-center">
        {/* Body */}
        <div 
          className="bg-black"
          style={{ 
            width: '2px',
            height: size === 'sm' ? '20px' : size === 'md' ? '30px' : '40px',
          }}
        />
        
        {/* Arms */}
        <div 
          className="bg-black absolute"
          style={{ 
            width: size === 'sm' ? '20px' : size === 'md' ? '30px' : '40px',
            height: '2px',
            top: size === 'sm' ? '40%' : size === 'md' ? '45%' : '45%',
          }}
        />
        
        {/* Legs */}
        <div className="flex">
          <div 
            className="bg-black transform -rotate-45"
            style={{ 
              width: '2px',
              height: size === 'sm' ? '15px' : size === 'md' ? '20px' : '25px',
            }}
          />
          <div 
            className="bg-black transform rotate-45"
            style={{ 
              width: '2px',
              height: size === 'sm' ? '15px' : size === 'md' ? '20px' : '25px',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Character;