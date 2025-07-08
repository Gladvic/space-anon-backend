import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question3.css';

function Question2() {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOption) {
      navigate('/question3');
    }
  };

  return (
    <div className="question3-bg">
      <div className="question3-box">
        <h1 className="question3-title">Mental Health Questionnaire</h1>
        <form className="question3-form" onSubmit={handleSubmit}>
          <h2 className="question3-question">
            2. When you’re struggling, how likely are you to reach out for support?
          </h2>
          <p className="question3-instructions">Pick one from the options</p>
          <div className="question3-options">
            <label className="question3-option">
              <input
                type="radio"
                name="q2"
                value="A"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Very unlikely, I keep it to myself 😶‍🌫️</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q2"
                value="B"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Sometimes, if it gets really bad 😕</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q2"
                value="C"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Usually, I have someone I trust 🫂</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q2"
                value="D"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Always, I believe in sharing my feelings 💬</span>
            </label>
          </div>
          <button type="submit" className="question3-btn" disabled={!selectedOption}>
            Next
          </button>
        </form>
      </div>
    </div>
  );
}

export default Question2;