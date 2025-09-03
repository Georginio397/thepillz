
import React from "react";
import ReactDOM from "react-dom";

function FAQModal({ onClose }) {
  return ReactDOM.createPortal(
    <>
      <div className="faq-backdrop" onClick={onClose} />
      <div className="faq-modal" role="dialog" aria-modal="true">
        <h2 className="faq-title">FAQ</h2>

        <h3 className="faq-q">Why should I sign up?</h3>
        <p className="faq-a">
          Signing up saves your scores and coins, puts you on the global leaderboard,
          lets you log in later with the same account, and makes rewarding easier with a wallet address.
          We don’t use wallet connect, this method is safer and keeps everything fair.
        </p>

        <h3 className="faq-q">How do I play the game?</h3>
        <p className="faq-a">
          Tap/click the screen or press Space to fly. Collect coins, dodge pipes, and aim for a high score.
        </p>

        <button className="logout-btn faq-close" onClick={onClose}>
          Close
        </button>
      </div>
    </>,
    document.body
  );
}

export default FAQModal;
