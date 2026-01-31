// src/NotFound.js
import React from "react";
import { useRouter } from "next/navigation";
import "./NotFound.css";

const NotFound = () => {
  const router = useRouter();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="road-sign">
          <div className="sign-board">
            <h1 className="error-code">404</h1>
            <h2 className="error-message">DEAD END</h2>
            <p className="error-description">
              Oops! This road doesn't lead anywhere in our car rental system.
            </p>
            <p className="error-subtext">
              The page you're looking for might have taken a detour or doesn't
              exist.
            </p>
          </div>
          <div className="sign-pole"></div>
        </div>

        <div className="tumbleweed-container">
          <img
            src={require("./assets/images/tumbleweed.gif")}
            alt="Tumbleweed rolling"
            className="tumbleweed-gif"
          />
          <img
            src={require("./assets/images/tumbleweed.gif")}
            alt="Tumbleweed rolling"
            className="tumbleweed-gif second"
          />
        </div>

        <div className="navigation-options">
          <button className="home-button" onClick={() => router.push("/")}>
            ↖ Back to Home
          </button>
          <button
            className="fleet-button"
            onClick={() => router.push("/fleet-details")}
          >
            Browse Our Fleet ↗
          </button>
        </div>

        <div className="helpful-links">
          <p>Or try these popular destinations:</p>
          <div className="link-buttons">
            <button onClick={() => router.push("/about")}>About Us</button>
            <button onClick={() => router.push("/contact")}>Contact</button>
            <button onClick={() => router.push("/account")}>Account</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
