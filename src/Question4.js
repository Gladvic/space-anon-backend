import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question3.css';

function Question4() {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOption) {
      navigate('/question5');
    }
  };

  return (
    <div className="question3-bg">
      <div className="question3-box">
        <h1 className="question3-title">Mental Health Questionnaire</h1>
        <form className="question3-form" onSubmit={handleSubmit}>
          <h2 className="question3-question">
            4. How comfortable are you sharing your struggles online (even anonymously)?
          </h2>
          <p className="question3-instructions">Pick one from the options</p>
          <div className="question3-options">
            <label className="question3-option">
              <input
                type="radio"
                name="q4"
                value="A"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Not comfortable at all 😬</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q4"
                value="B"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Maybe, if I really need to vent 😶‍🌫️</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q4"
                value="C"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Somewhat comfortable, depends on the platform 🤔</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q4"
                value="D"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Very comfortable, I like anonymous sharing 🕵️‍♂️</span>
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

export default Question4;