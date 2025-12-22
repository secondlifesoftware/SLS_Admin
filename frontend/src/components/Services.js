import React, { useState, useEffect } from 'react';

const Services = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const serviceCards = [
    {
      imageUrl: "https://framerusercontent.com/images/sFpV39ra1Ofatq9NTlO3i0Q.png"
    },
    {
      imageUrl: "https://framerusercontent.com/images/LPQe0Gh6TCkN0t1QCfuY2wpOJg.png"
    },
    {
      imageUrl: "https://framerusercontent.com/images/g9TB9b0zMNmYvZDU9jKcRQg7zo.png"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % serviceCards.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [serviceCards.length]);

  const nextIndex = (currentIndex + 1) % serviceCards.length;
  const prevIndex = (currentIndex - 1 + serviceCards.length) % serviceCards.length;

  const leftCard = serviceCards[prevIndex];
  const centerCard = serviceCards[currentIndex];
  const rightCard = serviceCards[nextIndex];

  return (
    <section className="py-[60px] px-6" style={{ background: 'rgb(244, 244, 250)' }}>
      <div className="max-w-[1280px] w-full mx-auto flex flex-col items-center gap-10">
        <div className="relative w-full max-w-[900px] h-[450px] flex justify-center items-center mx-auto">
          {/* Left card (behind, visible on left) */}
          <div 
            className="absolute rounded-3xl shadow-lg overflow-hidden z-[1]"
            style={{
              width: '600px',
              height: '450px',
              left: 'calc(50% - 300px - 70px)',
              transform: 'scale(1.05)',
              transformOrigin: 'center center',
            }}
          >
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={leftCard.imageUrl}
                alt="Service card"
                decoding="async"
                width="1024"
                height="1024"
                className="block w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>
          
          {/* Right card (behind, visible on right) */}
          <div 
            className="absolute rounded-3xl shadow-lg overflow-hidden z-[2]"
            style={{
              width: '600px',
              height: '450px',
              left: 'calc(50% - 300px + 70px)',
              transform: 'scale(1.05)',
              transformOrigin: 'center center',
            }}
          >
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={rightCard.imageUrl}
                alt="Service card"
                decoding="async"
                width="1024"
                height="1024"
                className="block w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>
          
          {/* Center card (front) */}
          <div 
            className="absolute rounded-3xl shadow-lg overflow-hidden z-[3]"
            key={currentIndex}
            style={{
              width: '600px',
              height: '450px',
              left: 'calc(50% - 300px)',
              transform: 'none',
              transformOrigin: 'center center',
            }}
          >
            <div className="absolute inset-0 w-full h-full">
              <img 
                src={centerCard.imageUrl}
                alt="Service card"
                decoding="async"
                width="1024"
                height="1024"
                className="block w-full h-full object-cover rounded-3xl"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 justify-center items-center">
          {serviceCards.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full border-2 transition-all duration-300 p-0 ${
                index === currentIndex 
                  ? 'bg-indigo-500 border-indigo-500 w-8 rounded-md' 
                  : 'border-gray-400 bg-transparent hover:border-indigo-500'
              }`}
              onClick={() => setCurrentIndex(index)}
              aria-label={`Go to service ${index + 1}`}
            />
          ))}
        </div>
        
        <div className="flex justify-center">
          <button className="bg-gradient-to-br from-blue-600 to-blue-700 text-white px-10 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all duration-300 shadow-lg hover:-translate-y-0.5 hover:shadow-xl hover:from-blue-700 hover:to-blue-800">
            Book a Free Call
          </button>
        </div>
      </div>
    </section>
  );
};

export default Services;
