import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Citrus as Fruit } from 'lucide-react';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Character from '../components/game/Character';
import { useGameStore } from '../store/gameStore';

const avatarOptions = [
  'apple', 'orange', 'banana', 'grape', 
  'blueberry', 'watermelon', 'kiwi', 'pineapple'
];

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [nickname, setNickname] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(avatarOptions[0]);
  const [nicknameError, setNicknameError] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);
  
  const { joinSession } = useGameStore();
  
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNickname(e.target.value);
    if (e.target.value.trim() !== '') {
      setNicknameError('');
    }
  };
  
  const randomizeAvatar = () => {
    const randomIndex = Math.floor(Math.random() * avatarOptions.length);
    setSelectedAvatar(avatarOptions[randomIndex]);
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    soundEffect.volume = 0.3;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
  };
  
  const handleNextAvatar = () => {
    const currentIndex = avatarOptions.indexOf(selectedAvatar);
    const nextIndex = (currentIndex + 1) % avatarOptions.length;
    setSelectedAvatar(avatarOptions[nextIndex]);
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    soundEffect.volume = 0.2;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
  };
  
  const handlePrevAvatar = () => {
    const currentIndex = avatarOptions.indexOf(selectedAvatar);
    const prevIndex = (currentIndex - 1 + avatarOptions.length) % avatarOptions.length;
    setSelectedAvatar(avatarOptions[prevIndex]);
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
    soundEffect.volume = 0.2;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
  };
  
  const handleJoinGame = () => {
    if (nickname.trim() === '') {
      setNicknameError('Please enter a nickname');
      return;
    }
    
    // Play sound effect
    const soundEffect = new Audio('https://assets.mixkit.co/active_storage/sfx/1435/1435-preview.mp3');
    soundEffect.volume = 0.5;
    soundEffect.play().catch(e => console.log("Audio play error:", e));
    
    // In a real implementation, this would create or join a session
    // For now, we'll just navigate to the lobby
    joinSession('new-session', nickname, selectedAvatar);
    navigate('/lobby');
  };
  
  const slides = [
    {
      title: 'Welcome to Flag Hunt!',
      description: 'Navigate the maze, capture flags, and compete with other players in this fast-paced multiplayer game.',
      image: 'https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Multiple Game Modes',
      description: 'Choose from Normal Game, Red Flag, or Last Ones Out modes for different gameplay experiences.',
      image: 'https://images.unsplash.com/photo-1511882150382-421056c89033?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Invite Friends',
      description: 'Generate a shareable link to invite friends to join your game session.',
      image: 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80',
    },
  ];
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };
  
  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex flex-col">
      <header className="bg-white bg-opacity-10 backdrop-blur-sm p-4">
        <div className="container mx-auto flex items-center">
          <Fruit className="text-white mr-2" size={32} />
          <h1 className="text-2xl font-bold text-white">Flag Hunt</h1>
        </div>
      </header>
      
      <main className="flex-grow container mx-auto flex flex-col md:flex-row p-4 gap-8">
        {/* Left Panel - User Login */}
        <div className="w-full md:w-1/2 bg-white rounded-xl shadow-xl p-6 flex flex-col">
          <h2 className="text-2xl font-bold mb-6 text-center">Join the Game</h2>
          
          <Input
            id="nickname"
            label="Your Nickname"
            placeholder="Enter a nickname"
            value={nickname}
            onChange={handleNicknameChange}
            error={nicknameError}
            required
          />
          
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Your Character
            </label>
            
            <div className="flex flex-col items-center">
              <div className="relative">
                <button 
                  onClick={handlePrevAvatar}
                  className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-8 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
                  aria-label="Previous avatar"
                >
                  &#10094;
                </button>
                
                <div className="p-4 flex justify-center items-center">
                  <Character
                    avatar={selectedAvatar}
                    size="lg"
                    selected={true}
                  />
                </div>
                
                <button 
                  onClick={handleNextAvatar}
                  className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-8 bg-gray-200 hover:bg-gray-300 rounded-full p-2 transition-colors"
                  aria-label="Next avatar"
                >
                  &#10095;
                </button>
              </div>
              
              <div className="text-center mt-2">
                <p className="text-sm text-gray-500 mb-2">Current fruit: <span className="font-medium capitalize">{selectedAvatar}</span></p>
                <Button 
                  variant="outline" 
                  onClick={randomizeAvatar}
                  size="sm"
                >
                  Randomize
                </Button>
              </div>
            </div>
          </div>
          
          <div className="mt-auto">
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleJoinGame}
              fullWidth
            >
              Join Game
            </Button>
          </div>
        </div>
        
        {/* Right Panel - Game Info Slideshow */}
        <div className="w-full md:w-1/2 bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="relative h-full">
            <div className="h-full">
              <img 
                src={slides[currentSlide].image} 
                alt={slides[currentSlide].title}
                className="w-full h-64 object-cover"
              />
              <div className="p-6">
                <h3 className="text-xl font-bold mb-2">{slides[currentSlide].title}</h3>
                <p className="text-gray-600">{slides[currentSlide].description}</p>
              </div>
            </div>
            
            <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
              {slides.map((_, index) => (
                <button
                  key={index}
                  className={`w-3 h-3 rounded-full ${
                    index === currentSlide ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
            
            <button
              className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-2"
              onClick={prevSlide}
            >
              &#10094;
            </button>
            <button
              className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-black bg-opacity-30 text-white rounded-full p-2"
              onClick={nextSlide}
            >
              &#10095;
            </button>
          </div>
        </div>
      </main>
      
      <footer className="bg-white bg-opacity-10 backdrop-blur-sm p-4 text-center text-white">
        <p>&copy; 2025 Flag Hunt Game. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Home;