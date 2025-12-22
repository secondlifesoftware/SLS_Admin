import React from 'react';
import './Technologies.css';

const Technologies = () => {
  const technologies = {
    frontend: ['React', 'TypeScript', 'Angular', 'Tailwind'],
    backend: ['Python', 'Node.js', 'PHP', 'C#'],
    mobile: ['Flutter (iOS + Android)'],
    ai: ['OpenAI', 'REST', 'QuickBooks', 'RingCentral']
  };

  return (
    <section className="technologies">
      <div className="container">
        <div className="technologies-content">
          <div className="technologies-left">
            <div className="technologies-card">
              <h2 className="technologies-title">
                Technologies Our Team Has Expertise In
              </h2>
              
              <div className="tech-categories">
                <div className="tech-category">
                  <strong>Frontend:</strong> {technologies.frontend.join(', ')}
                </div>
                <div className="tech-category">
                  <strong>Backend:</strong> {technologies.backend.join(', ')}
                </div>
                <div className="tech-category">
                  <strong>Mobile:</strong> {technologies.mobile.join(', ')}
                </div>
                <div className="tech-category">
                  <strong>AI & APIs:</strong> {technologies.ai.join(', ')}
                </div>
                <div className="tech-more">& more</div>
              </div>
            </div>
          </div>

          <div className="technologies-right">
            <div className="tech-logos">
              <div className="tech-logo react-logo" title="React">
                <div className="logo-text">⚛️</div>
              </div>
              <div className="tech-logo tailwind-logo" title="Tailwind CSS">
                <div className="logo-text">TW</div>
              </div>
              <div className="tech-logo openai-logo" title="OpenAI">
                <div className="logo-text">AI</div>
              </div>
              <div className="tech-logo flutter-logo" title="Flutter">
                <div className="logo-text">F</div>
              </div>
              <div className="tech-logo python-logo" title="Python">
                <div className="logo-text">PY</div>
              </div>
              <div className="tech-logo csharp-logo" title="C#">
                <div className="logo-text">C#</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Technologies;

