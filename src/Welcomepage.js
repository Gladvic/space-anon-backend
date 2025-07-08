import React from 'react';
import { Link } from 'react-router-dom';
import './WelcomePage.css'; // Import the CSS file for WelcomePage

function WelcomePage() {
  return (
    <div className="welcome-page midnight-bg">
      <div className="welcome-box">
        <h1 className="welcome-title">Welcome To Space Anon!</h1>
        <p className="welcome-subtitle">A quiet place in a loud world.</p>
        <div className="welcome-divider" />
        <div className="welcome-text">
          <p>Here, you don’t need a name, a face, or a performance. Just you, your thoughts, your feelings, your truth.</p>
          <p>Say what you’ve never said. Read what others are afraid to speak.</p>
          <p>No pressure. No judgment. Just space.</p>
          <p>
            Before we let you in, answer a few private questions, just between us. It helps us give you the space you need.
          </p>
        </div>
        <Link to="/question1">
          <button className="welcome-btn">Continue</button>
        </Link>
      </div>
    </div>
  );
}

export default WelcomePage;