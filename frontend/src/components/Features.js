import React from 'react';
import './Features.css';

const Features = () => {
  const features = [
    {
      title: 'Custom Software Development',
      description: 'Build exactly what you need. From web applications to mobile apps, we create solutions tailored to your business requirements.'
    },
    {
      title: 'Modern Tech Stack',
      description: 'We use the latest technologies and best practices to ensure your software is fast, scalable, and maintainable.'
    },
    {
      title: 'Agile Development',
      description: 'Work with us in an iterative, collaborative process. See progress early and often, with regular updates and feedback loops.'
    },
    {
      title: 'Full-Stack Expertise',
      description: 'From frontend to backend, databases to APIs, we handle every layer of your application with expertise.'
    },
    {
      title: 'API Integration',
      description: 'Connect your software with existing tools and services. We integrate with popular platforms and build custom APIs.'
    },
    {
      title: 'Ongoing Support',
      description: 'We\'re here for the long haul. Get maintenance, updates, and new features as your business grows.'
    }
  ];

  return (
    <section className="features">
      <div className="features-container">
        <div className="features-header">
          <h2 className="features-title">Docs that work for everyone</h2>
          <p className="features-subtitle">
            We provide the tools, expertise, and support to bring your ideas to life.
          </p>
        </div>

        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card">
              <h3 className="feature-title">{feature.title}</h3>
              <p className="feature-description">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
