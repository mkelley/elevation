import React from "react";

export default function Console({ messages }) {
  return (
    <div id="elevation-console" className="box elevation-ui">
      {messages.map((message, index) =>
        <p
          key={`message-${index}`}
          className={`elevation-message-${message.severity}`}
        >
          <span className="elevation-message-annotation">
            {message.date.toISOString().substring(11, 19)}
            {` - ${message.severity} - `}
          </span>
          {message.text}
        </p>
      )}
    </div>
  );
}