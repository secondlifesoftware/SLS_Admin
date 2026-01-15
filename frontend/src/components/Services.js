import React, { useState } from 'react';
import './Services.css';
import BookCallModal from './BookCallModal';

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services = [
    {
      title: "Web Applications",
      description: "Build modern, responsive web applications that work beautifully across all devices."
    },
    {
      title: "Mobile Apps",
      description: "Native and cross-platform mobile applications for iOS and Android."
    },
    {
      title: "API Development",
      description: "RESTful APIs and integrations to connect your software with other services."
    },
    {
      title: "Database Design",
      description: "Efficient database architecture and optimization for your data needs."
    }
  ];

  return (
    <section id="services" className="services">
      <div className="services-container">
        <div className="services-header">
          <h2 className="services-title">What we build</h2>
          <p className="services-subtitle">
            We create software solutions that help your business grow and succeed.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <BookCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default Services;
