import React from 'react';
import './Hero.css';

const Hero = () => {
  return (
    <section className="hero">
      <div className="hero-container">
        <header className="hero-header">
          <h1 className="company-name">Second Life Software</h1>
        </header>
        
        <div className="hero-content">
          <div className="hero-main">
            <h1 className="hero-headline">
              🚀 Build Smarter, Launch Faster
            </h1>
            <p className="hero-subheadline">
              Custom software, app MVPs, and AI automation — done right.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;

