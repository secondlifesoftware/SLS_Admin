import React from 'react';
import Hero from './Hero';
import Features from './Features';
import Services from './Services';
import Testimonials from './Testimonials';
import CTA from './CTA';
import Footer from './Footer';

function Home() {
  return (
    <div className="App">
      <Hero />
      <Features />
      <Services />
      <Testimonials />
      <CTA />
      <Footer />
    </div>
  );
}

export default Home;




