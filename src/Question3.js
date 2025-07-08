import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question3.css'; // Use a dedicated CSS file for this page

function Question3() {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOption) {
      navigate('/question4'); // Go to Question 4 after this question
    }
  };

  return (
    <div className="question3-bg">
      <div className="question3-box">
        <h1 className="question3-title">Mental Health Questionnaire</h1>
        <form className="question3-form" onSubmit={handleSubmit}>
          <h2 className="question3-question">
            3. Do you feel safe being vulnerable around people you know?
          </h2>
          <p className="question3-instructions">Pick one from the options</p>
          <div className="question3-options">
            <label className="question3-option">
              <input
                type="radio"
                name="q3"
                value="A"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Not at all, I prefer to keep my feelings to myself 🤐</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q3"
                value="B"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Only with one or two people I trust 🤝</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q3"
                value="C"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Sometimes, it depends on the situation 🤷‍♂️</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q3"
                value="D"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Yes, but I don't fully open up 😶</span>
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

export default Question3;