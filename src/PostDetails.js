import React, { useState, useEffect } from "react";
import { FaTimes } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";
import "./PostDetails.css";

const PostDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { post } = location.state;
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://cdn.commento.io/js/commento.js";
    script.defer = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="post-details-container">
      <button className="close-btn" onClick={() => navigate(-1)}>
        <FaTimes />
      </button>
      <div className="post">
        <h3>{post.title}</h3>
        <p>
          {showMore || post.content.length <= 100
            ? post.content
            : `${post.content.slice(0, 100)}...`}
          {post.content.length > 100 && (
            <span className="show-more" onClick={() => setShowMore(!showMore)}>
              {showMore ? "Show Less" : "Read More"}
            </span>
          )}
        </p>
      </div>
      <div className="comments-section">
        <div id="commento"></div>
      </div>
    </div>
  );
};

export default PostDetails;