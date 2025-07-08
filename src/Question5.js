import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question3.css';

function Question5() {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOption) {
      navigate('/community-code'); // Use the correct route: '/community-code'
    }
  };

  return (
    <div className="question3-bg">
      <div className="question3-box">
        <h1 className="question3-title">Mental Health Questionnaire</h1>
        <form className="question3-form" onSubmit={handleSubmit}>
          <h2 className="question3-question">
            5. What do you hope to find or share in this community?
          </h2>
          <p className="question3-instructions">Pick one from the options</p>
          <div className="question3-options">
            <label className="question3-option">
              <input
                type="radio"
                name="q5"
                value="A"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Understanding and connection 🤗</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q5"
                value="B"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>A safe space to vent or listen 🫂</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q5"
                value="C"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Advice or support from others 💡</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q5"
                value="D"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Just curious, exploring anonymously 👀</span>
            </label>
          </div>
          <button type="submit" className="question3-btn" disabled={!selectedOption}>
            Go to Community
          </button>
        </form>
      </div>
    </div>
  );
}

export default Question5;