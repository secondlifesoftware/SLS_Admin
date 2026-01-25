import React from 'react';
import Hero from './Hero';
import CompanyHandbook from './CompanyHandbook';
import Features from './Features';
import Services from './Services';
import Blog from './Blog';
import Testimonials from './Testimonials';
import Social from './Social';
import CTA from './CTA';
import Footer from './Footer';

function Home() {
  return (
    <div className="App">
      <Hero />
      <CompanyHandbook />
      <Features />
      <Services />
      <Blog />
      <Testimonials />
      <Social />
      <CTA />
      <Footer />
    </div>
  );
}

export default Home;




