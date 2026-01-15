import React, { useState } from 'react';
import './CTA.css';
import BookCallModal from './BookCallModal';

const CTA = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  return (
    <section className="cta">
      <div className="cta-container">
        <div className="cta-content">
          <h2 className="cta-headline">Ready to get started?</h2>
          <p className="cta-subheadline">
            Let's talk about your project and see how we can help.
          </p>
          <div className="cta-buttons">
            <button className="btn-demo" onClick={() => setIsModalOpen(true)}>Book a demo</button>
            <button className="btn-start" onClick={() => setIsModalOpen(true)}>Start for free</button>
          </div>
        </div>
      </div>
      
      <BookCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default CTA;

