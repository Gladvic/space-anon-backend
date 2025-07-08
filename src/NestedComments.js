import React, { useState } from "react";
import { FaTrash, FaChevronDown, FaChevronUp } from "react-icons/fa";

// comments: array of comment objects, each with id, content, userid, replies (array)
// onDelete: function(commentId)
// onReply: function(parentId)
// depth: current nesting level (for styling/indent)
const NestedComments = ({ comments, onDelete, onReply, depth = 0 }) => {
  const [openReplies, setOpenReplies] = useState({}); // commentId -> bool

  if (!comments || comments.length === 0) return null;

  return (
    <div>
      {comments.map((comment) => (
        <div
          key={comment.id ?? comment._id}
          style={{
            marginLeft: depth > 0 ? 24 : 0,
            borderLeft: depth > 0 ? "2px solid #23264A" : "none",
            paddingLeft: depth > 0 ? 12 : 0,
            marginBottom: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontWeight: 500, color: "#E63946" }}>{comment.userid}</span>
            <span style={{ marginLeft: 8, color: "#fff" }}>{comment.content}</span>
            <button
              onClick={() => onDelete(comment.id ?? comment._id)}
              style={{
                background: "none",
                border: "none",
                color: "#F48C8C",
                marginLeft: 12,
                cursor: "pointer",
                fontSize: "1.1em"
              }}
              aria-label="Delete comment"
            >
              <FaTrash />
            </button>
            <button
              onClick={() => setOpenReplies((prev) => ({ ...prev, [comment.id ?? comment._id]: !prev[comment.id ?? comment._id] }))}
              style={{
                background: "none",
                border: "none",
                color: "#A362EA",
                marginLeft: 8,
                cursor: "pointer",
                fontSize: "1em"
              }}
              aria-label={openReplies[comment.id ?? comment._id] ? "Hide replies" : "Show replies"}
            >
              {openReplies[comment.id ?? comment._id] ? <FaChevronUp /> : <FaChevronDown />} Replies
            </button>
            <button
              onClick={() => onReply(comment.id ?? comment._id)}
              style={{
                background: "none",
                border: "none",
                color: "#A362EA",
                marginLeft: 8,
                cursor: "pointer",
                fontSize: "1em"
              }}
              aria-label="Reply"
            >
              Reply
            </button>
          </div>
          {openReplies[comment.id ?? comment._id] && comment.replies && comment.replies.length > 0 && (
            <NestedComments
              comments={comment.replies}
              onDelete={onDelete}
              onReply={onReply}
              depth={depth + 1}
            />
          )}
        </div>
      ))}
    </div>
  );
};

export default NestedComments;
