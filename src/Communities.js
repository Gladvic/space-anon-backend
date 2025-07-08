// filepath: /c:/Users/victoria/Desktop/space-anon/src/Communities.js
import React, { useState, useEffect } from 'react';
import './Communities.css';

function Communities() {
  const [communities, setCommunities] = useState([]);
  const [newCommunityName, setNewCommunityName] = useState('');
  const [newCommunityPurpose, setNewCommunityPurpose] = useState('');

  useEffect(() => {
    // Fetch communities from the backend
    fetchCommunities();
  }, []);

  const fetchCommunities = async () => {
    // Fetch communities from the backend
    const response = await fetch('http://localhost:5000/api/communities');
    const data = await response.json();
    setCommunities(data);
  };

  const handleCreateCommunity = async () => {
    // Logic to create a new community
    const response = await fetch('http://localhost:5000/api/communities', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: newCommunityName,
        purpose: newCommunityPurpose,
      }),
    });
    if (response.ok) {
      const newCommunity = await response.json();
      setCommunities([...communities, newCommunity]);
      setNewCommunityName('');
      setNewCommunityPurpose('');
    }
  };

  return (
    <div className="communities-container">
      <h1>Communities</h1>
      <div className="create-community-form">
        <h2>Create a New Community</h2>
        <input
          type="text"
          placeholder="Community Name"
          value={newCommunityName}
          onChange={(e) => setNewCommunityName(e.target.value)}
          required
        />
        <textarea
          placeholder="Community Purpose"
          value={newCommunityPurpose}
          onChange={(e) => setNewCommunityPurpose(e.target.value)}
          required
        />
        <button className="create-community-btn" onClick={handleCreateCommunity}>
          Create Community
        </button>
      </div>
      {communities.length === 0 ? (
        <p>No communities yet. Create one below.</p>
      ) : (
        communities.map((community) => (
          <div key={community.id} className="community">
            <h2>{community.name}</h2>
            <p>{community.purpose}</p>
            <button>Join</button>
          </div>
        ))
      )}
    </div>
  );
}

export default Communities;