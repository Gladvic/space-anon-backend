import React from 'react';
import { useNavigate } from 'react-router-dom';
import './CommunityCode.css';

function CommunityCode() {
  const navigate = useNavigate();

  const handleContinue = () => {
    localStorage.setItem('readCommunityCode', true); // Mark code as read
    navigate('/feed'); // Redirect to feed
  };

  return (
    <div className="community-bg">
      <div className="community-box">
        <h1 className="community-title">Space Anon Community Code of Conduct</h1>
        <div className="community-divider" />
        <div className="community-content">
          <p className="welcome-message">Welcome to Space Anon. A place to be real, kind, and anonymous. 🌌</p>
          <ul className="community-list">
            <li><strong>Stay Anonymous, Stay Safe:</strong> Never share personal info, yours or others'. Keep it secret, keep it safe.</li>
            <li><strong>No Hate, No Harm:</strong> Hate speech, bullying, threats, or harassment are not allowed. This is a safe space.</li>
            <li><strong>Respect Every Story:</strong> Everyone’s pain is valid. No mocking or invalidation. Empathy only.</li>
            <li><strong>This Is Not Therapy:</strong> We support, but we don’t replace professional help. If someone’s in danger, guide them to real support.</li>
            <li><strong>You Don’t Owe a Response:</strong> Share when you want; listen when you need. Respect silence and space.</li>
            <li><strong>No Promotion or Spam:</strong> No ads, links, or self-promotion. Keep focus on connection, not distraction.</li>
            <li><strong>Protect the Vibe:</strong> Report violations. We’re building a space to breathe — don’t break the trust.</li>
          </ul>
          <p className="community-quote"><em>“You came here for peace. Let’s protect it, together.”</em></p>
        </div>
        <button className="community-btn" onClick={handleContinue}>Continue</button>
      </div>
    </div>
  );
}

export default CommunityCode;
