import React from 'react';
import Hero from './Hero';
import Services from './Services';
import About from './About';
import Technologies from './Technologies';
import CTA from './CTA';
import Footer from './Footer';

function Home() {
  return (
    <div className="App">
      <Hero />
      <Services />
      <About />
      <Technologies />
      <CTA />
      <Footer />
    </div>
  );
}

export default Home;

