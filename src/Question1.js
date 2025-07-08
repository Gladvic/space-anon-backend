import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Question3.css'; // Use the themed CSS

function Question1() {
  const [selectedOption, setSelectedOption] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedOption) {
      navigate('/question2');
    }
  };

  return (
    <div className="question3-bg">
      <div className="question3-box">
        <h1 className="question3-title">Mental Health Questionnaire</h1>
        <form className="question3-form" onSubmit={handleSubmit}>
          <h2 className="question3-question">
            1. How often do you feel like no one really gets you?
          </h2>
          <p className="question3-instructions">Pick one from the options</p>
          <div className="question3-options">
            <label className="question3-option">
              <input
                type="radio"
                name="q1"
                value="A"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>All the time 😞</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q1"
                value="B"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Sometimes 😔</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q1"
                value="C"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>Rarely 🙃</span>
            </label>
            <label className="question3-option">
              <input
                type="radio"
                name="q1"
                value="D"
                onChange={(e) => setSelectedOption(e.target.value)}
                required
              />
              <span>I don't really think about it 🤫</span>
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

export default Question1;