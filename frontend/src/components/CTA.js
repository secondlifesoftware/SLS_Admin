import React from 'react';
import './CTA.css';

const CTA = () => {
  return (
    <section className="cta">
      <div className="container">
        <div className="cta-content">
          <div className="cta-left">
            <h2 className="cta-headline">Big ideas start with small conversations.</h2>
            <button className="btn-primary">Book a Free Call</button>
          </div>

          <div className="cta-right">
            <div className="code-snippet">
              <div className="code-line comment">
                // Not sure where to start? That's normal.
              </div>
              <div className="code-line comment">
                // Most great projects begin with a half-formed idea and a deadline.
              </div>
              <div className="code-line"></div>
              <div className="code-line">
                <span className="keyword">const</span> <span className="variable">idea</span> = {'{'}
              </div>
              <div className="code-line indent">
                <span className="property">clarity</span>: <span className="string">"medium"</span>,
              </div>
              <div className="code-line indent">
                <span className="property">urgency</span>: <span className="string">"high"</span>,
              </div>
              <div className="code-line indent">
                <span className="property">excitement</span>: <span className="string">"veryHigh"</span>,
              </div>
              <div className="code-line">{'};'}</div>
              <div className="code-line"></div>
              <div className="code-line">
                <span className="keyword">const</span> <span className="variable">partner</span> = <span className="string">"Second Life Software"</span>;
              </div>
              <div className="code-line"></div>
              <div className="code-line">
                <span className="keyword">if</span> (<span className="variable">idea</span> && <span className="variable">partner</span>) {'{'}
              </div>
              <div className="code-line indent">
                <span className="keyword">const</span> <span className="variable">result</span> = <span className="function">buildProduct</span>(<span className="variable">idea</span>, <span className="variable">partner</span>);
              </div>
              <div className="code-line indent">
                <span className="function">console</span>.<span className="function">log</span>(<span className="string">"🚀 Launching with:"</span>, <span className="variable">result</span>.<span className="property">team</span>, <span className="string">"🎉"</span>);
              </div>
              <div className="code-line">{'}'} <span className="keyword">else</span> {'{'}</div>
              <div className="code-line indent">
                <span className="keyword">throw</span> <span className="keyword">new</span> <span className="class">Error</span>(<span className="string">"All great things start with a conversation."</span>);
              </div>
              <div className="code-line">{'}'}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTA;

