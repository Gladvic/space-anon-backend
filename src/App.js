import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import './styles.css';
import WelcomePage from './Welcomepage';
import CommunityCode from './community-code';
import Feed from './Feed';
import PostDetails from './PostDetails';
import Question1 from './Question1';
import Question2 from './Question2';
import Question3 from './Question3';
import Question4 from './Question4';
import Question5 from './Question5';

function App() {
  // Add state for Feed navigation and posts/bookmarks
  const [page, setPage] = useState("home");
  const [posts, setPosts] = useState([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState([]);

  return (
    <div>
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/community-code" element={<CommunityCode />} />
        <Route
          path="/feed"
          element={
            <Feed
              page={page}
              setPage={setPage}
              posts={posts}
              setPosts={setPosts}
              bookmarkedPosts={bookmarkedPosts}
              setBookmarkedPosts={setBookmarkedPosts}
            />
          }
        />
        <Route path="/post/:postId" element={<PostDetails />} />
        <Route path="/question1" element={<Question1 />} />
        <Route path="/question2" element={<Question2 />} />
        <Route path="/question3" element={<Question3 />} />
        <Route path="/question4" element={<Question4 />} />
        <Route path="/question5" element={<Question5 />} />
      </Routes>
    </div>
  );
}

export default App;