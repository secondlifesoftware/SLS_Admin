import React, { useState } from 'react';
import './Services.css';
import BookCallModal from './BookCallModal';

const Services = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const services = [
    {
      title: "Custom Web Application Development",
      description: "Enterprise-grade web applications built with modern frameworks like React, Vue, and Angular. We create scalable, secure, and high-performance solutions tailored to your business needs. From SaaS platforms to internal tools, we deliver applications that drive results.",
      highlights: ["React/Vue/Angular", "Microservices Architecture", "Cloud-Native", "99.9% Uptime"]
    },
    {
      title: "Mobile App Development",
      description: "Native iOS and Android applications, as well as cross-platform solutions using React Native and Flutter. We build intuitive mobile experiences that users love, with seamless integration to your backend systems and third-party services.",
      highlights: ["iOS & Android", "React Native", "Flutter", "App Store Optimization"]
    },
    {
      title: "API Development & Integration",
      description: "RESTful and GraphQL APIs designed for scalability and performance. We build robust APIs that power your applications and integrate seamlessly with third-party services like Stripe, Twilio, SendGrid, and enterprise systems.",
      highlights: ["REST & GraphQL", "API Security", "Third-Party Integration", "Documentation"]
    },
    {
      title: "Cloud Infrastructure & DevOps",
      description: "Complete cloud solutions on AWS, Azure, and Google Cloud. We design, implement, and manage cloud infrastructure with CI/CD pipelines, automated deployments, monitoring, and disaster recovery to ensure your applications run smoothly 24/7.",
      highlights: ["AWS/Azure/GCP", "CI/CD Pipelines", "Kubernetes", "Infrastructure as Code"]
    },
    {
      title: "E-Commerce Solutions",
      description: "Full-featured e-commerce platforms with payment processing, inventory management, and analytics. We build custom solutions or implement platforms like Shopify, WooCommerce, and Magento with custom integrations and optimizations.",
      highlights: ["Payment Integration", "Inventory Management", "Multi-Channel Sales", "Analytics"]
    },
    {
      title: "AI & Machine Learning Integration",
      description: "Integrate cutting-edge AI and ML capabilities into your applications. From natural language processing and computer vision to predictive analytics and recommendation systems, we help you leverage AI to gain competitive advantages.",
      highlights: ["OpenAI Integration", "Custom ML Models", "Predictive Analytics", "Natural Language Processing"]
    },
    {
      title: "Database Design & Optimization",
      description: "Efficient database architecture using PostgreSQL, MySQL, MongoDB, and more. We design schemas, optimize queries, implement caching strategies, and ensure data integrity and security for applications of any scale.",
      highlights: ["SQL & NoSQL", "Query Optimization", "Data Migration", "Backup & Recovery"]
    },
    {
      title: "Legacy System Modernization",
      description: "Transform outdated systems into modern, maintainable applications. We carefully migrate legacy codebases to modern technologies while preserving business logic and ensuring zero data loss, with minimal disruption to operations.",
      highlights: ["Code Migration", "Technology Upgrade", "Data Preservation", "Zero Downtime"]
    },
    {
      title: "MVP Development",
      description: "Rapid development of Minimum Viable Products to validate your ideas quickly. We help startups and enterprises bring products to market fast, with focused features and scalable architecture ready for future growth.",
      highlights: ["Rapid Development", "Market Validation", "Scalable Foundation", "Iterative Approach"]
    },
    {
      title: "Ongoing Maintenance & Support",
      description: "Comprehensive maintenance, monitoring, and support services to keep your applications running smoothly. We provide bug fixes, security updates, performance optimizations, and feature enhancements with guaranteed response times.",
      highlights: ["24/7 Monitoring", "Security Updates", "Performance Optimization", "Priority Support"]
    }
  ];

  return (
    <section id="services" className="services">
      <div className="services-container">
        <div className="services-header">
          <h2 className="services-title">What we build</h2>
          <p className="services-subtitle">
            We deliver enterprise-grade software solutions that drive business growth. From MVPs to complex systems, we've got you covered.
          </p>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div key={index} className="service-card">
              <div className="service-number">{String(index + 1).padStart(2, '0')}</div>
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-highlights">
                {service.highlights.map((highlight, idx) => (
                  <span key={idx} className="service-highlight-tag">{highlight}</span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="services-cta">
          <p className="services-cta-text">Ready to start your project?</p>
          <button className="services-cta-button" onClick={() => setIsModalOpen(true)}>
            Book a call
          </button>
        </div>
      </div>
      
      <BookCallModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
};

export default Services;
