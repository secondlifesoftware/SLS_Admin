import React, { useState } from 'react';
import './Hero.css';
import BookCallModal from './BookCallModal';

const Hero = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section className="hero">
      <div className="hero-container">
        <header className="hero-header">
          <div className="logo">
            <span className="logo-text">slite</span>
            <svg className="logo-arrow" width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <nav className="hero-nav">
            <a href="#product" className="nav-link">
              Product
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#solutions" className="nav-link">
              Solutions
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="#resources" className="nav-link">
              Resources
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#signin" className="nav-link">Sign in</a>
            <button className="btn-demo" onClick={() => setIsModalOpen(true)}>Book a demo</button>
            <button className="btn-start" onClick={() => setIsModalOpen(true)}>Start for free</button>
          </nav>
        </header>
        
        <div className="hero-content">
          <div className="hero-main">
            <div className="hero-badge">
              <span className="badge-text">NEW</span>
              <span className="badge-description">Your knowledge base + enterprise search, finally working together →</span>
            </div>
            <h1 className="hero-headline">
              Where knowledge goes to <span className="strikethrough">die</span> <span className="hero-accent">thrives</span>
            </h1>
            <p className="hero-subheadline">
              Skip the software learning curve: We deliver beautiful documentation, hassle-free adoption, and AI-powered solutions from day one.
            </p>
            
            <div className="hero-cta">
              <button 
                className="btn-demo"
                onClick={() => setIsModalOpen(true)}
              >
                Book a demo
              </button>
              <button 
                className="btn-start"
                onClick={() => setIsModalOpen(true)}
              >
                Start for free
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <BookCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default Hero;

