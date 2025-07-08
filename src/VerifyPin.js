import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Import Link

function VerifyPin() {
  const navigate = useNavigate();
  const [pinCode, setPinCode] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const userId = localStorage.getItem('userId'); // Retrieve userId from localStorage
    try {
      const response = await fetch('http://localhost:5000/api/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, pinCode }),
      });
      if (response.ok) {
        console.log('Pin code verified successfully');
        navigate('/feed');
      } else {
        setMessage('Invalid pin code');
      }
    } catch (err) {
      console.error('Error:', err);
      setMessage('An error occurred. Please try again.');
    }
  };

  return (
    <div id="verify-pin-form" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <div>
        <h1>Verify Pin</h1>
        <form onSubmit={handleSubmit}>
          <label htmlFor="pinCode">
            <span>Enter Your 4-Digit Pin Code:</span>
            <input 
              id="pinCode" 
              name="pinCode" 
              type="text" 
              pattern="\d{4}" 
              required 
              placeholder="Enter your 4-digit pin code" 
              value={pinCode}
              onChange={(e) => setPinCode(e.target.value)}
            />
          </label>
          <button type="submit" className="btn">Submit</button>
        </form>
        {message && <p>{message}</p>}
        <div className="forgot-pin-link">
          <Link to="/recover-pin">Forgot Pin?</Link>
        </div>
      </div>
    </div>
  );
}

export default VerifyPin;