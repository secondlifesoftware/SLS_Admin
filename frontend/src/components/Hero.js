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
            <span className="logo-text">Second Life Software</span>
          </div>
          <nav className="hero-nav">
            <a href="#services" className="nav-link">
              Services
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </a>
            <a href="#portfolio" className="nav-link">Portfolio</a>
            <a href="#blog" className="nav-link">Blog</a>
            <a href="#about" className="nav-link">About</a>
            <a href="#social" className="nav-link">Social</a>
            <button className="btn-demo" onClick={() => setIsModalOpen(true)}>Book a call</button>
            <button className="btn-start" onClick={() => setIsModalOpen(true)}>Get started</button>
          </nav>
        </header>
        
        <div className="hero-content">
          <div className="hero-main">
            <div className="hero-badge">
              <span className="badge-text">NEW</span>
              <span className="badge-description">Your knowledge base + enterprise search, finally working together →</span>
            </div>
            <h1 className="hero-headline">
              Where projects
              <br />
              <span className="headline-wrapper">
                <span className="strikethrough-text">go to die</span>
                <svg className="curved-strike" viewBox="0 0 389 46" fill="none" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
                  <path d="M4 41C4 41 129 10 203 6C276 2 387 7 387 7" stroke="#176ae5" strokeWidth="7" strokeLinecap="round"/>
                </svg>
              </span>{' '}
              <span className="hero-accent">Thrive</span>
            </h1>
            <p className="hero-subheadline">
              Skip the software learning curve: We deliver beautiful applications, hassle-free development, and scalable solutions from day one.
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

