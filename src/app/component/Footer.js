"use client";
// Footer.js
import React, { useState } from "react";
import "./Footer.css";
import Link from "next/link";

const Footer = () => {
  const [fbHovered, setFbHovered] = useState(false);
  const [igHovered, setIgHovered] = useState(false);
  const [tkHovered, setTkHovered] = useState(false);

  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section-about">
          <img
            src="/assets/white-logo.png"
            alt="Company Logo"
            className="footer-logo"
          />
          <p className="footer-content-p">
            Experience the thrill of the drive with EMNL. Enjoy top-notch
            service, unbeatable rates, and the freedom to explore.
          </p>
        </div>
        <div className="footer-section links">
          <h3 className="footer-section-h3">Information</h3>
          <ul className="footer-section-ul">
            <li>
              <Link href="/about">About Us</Link>
            </li>
            <li>
              <Link href="/info#help-center">Help Center</Link>
            </li>
            <li>
              <Link href="/info#faqs">FAQs</Link>
            </li>
            <li>
              <Link href="/info#privacy-policy">Privacy Policy</Link>
            </li>
            <li>
              <Link href="/info#terms">Terms & Conditions</Link>
            </li>
          </ul>
        </div>
        <div className="footer-section contacts">
          <h3 className="footer-section-h3">Contacts</h3>
          <div className="contact">
            <span className="footer-section-span">
              <i className="fas fa-phone"></i>{" "}
              <a href="tel:+639123456789" className="footer-link">
                +63 975 477 8178
              </a>
            </span>
            <span className="footer-section-span">
              <i className="fas fa-envelope"></i>{" "}
              <a
                href="mailto:rentalinquiries.emnl@gmail.com"
                className="footer-link"
              >
                rentalinquiries.emnl@gmail.com
              </a>
            </span>
            <span className="footer-section-span">
              <i className="fas fa-map-marker-alt"></i>{" "}
              <a
                href="https://www.google.com/maps/place/EMNL+CAR+RENTAL+-+ORMOC/@11.0238166,124.5954816,227a,35y,97.13h,45t/data=!3m1!1e3!4m9!1m2!2m1!1sPurok+7,+Brgy.+Dona+Feliza+Z.+Mejia,+Ormoc+City,+6541+Leyte,+Philippines!3m5!1s0x3307f13b2918057b:0xfedc2ea58ff6bc11!8m2!3d11.0230411!4d124.5974016!16s%2Fg%2F11kqrrmsfs?entry=ttu&g_ep=EgoyMDI1MDgxMy4wIKXMDSoASAFQAw%3D%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                Brgy. Dona Feliza Z. Mejia, Corner Berlin St. and, Madrid, Ormoc
                City, 6541 Leyte
              </a>
            </span>
          </div>
        </div>









        <div className="footer-section social">
          <h3 className="footer-section-h3">Follow Us</h3>
          <div className="social-icons">
            <a
              href="https://www.facebook.com/EMNLOrmoc"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              onMouseEnter={() => setFbHovered(true)}
              onMouseLeave={() => setFbHovered(false)}
            >
              {fbHovered ? (
                <img src="/assets/fb-filled.png" alt="Facebook" />
              ) : (
                <svg
  viewBox="0 0 48 48"
  width="36"
  height="36"
  className="social-svg"
>
  <path
    fill="currentColor"
    d="M24,5c-10.5,0 -19,8.5 -19,19c0,10.5 8.5,19 19,19c10.5,0 19,-8.5 19,-19C43,13.5 34.5,5 24,5z"
  />
  <path
    fill="#ffffff"
    d="M26.6,29h4.9l0.8,-5h-5.7v-2.7c0,-2.1 0.7,-3.9 2.6,-3.9h3.1v-4.4c-0.5,-0.1 -1.7,-0.2 -3.9,-0.2c-4.6,0 -7.3,2.4 -7.3,7.9v3.3h-4.7v5h4.7v13.7c0.9,0.1 1.9,0.2 2.8,0.2c0.9,0 1.7,-0.1 2.6,-0.2z"
  />
</svg>

              )}
            </a>

            <a
              href="https://www.instagram.com/emnl.rentals.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              onMouseEnter={() => setIgHovered(true)}
              onMouseLeave={() => setIgHovered(false)}
            >
              {igHovered ? (
                <img src="/assets/ig-filled.png" alt="Instagram" />
              ) : (
                <svg
  viewBox="0 0 48 48"
  width="36"
  height="36"
  className="social-svg"
>
  <defs>
    <radialGradient cx="19.38" cy="42.035" r="44.899" gradientUnits="userSpaceOnUse" id="ig-color-1">
      <stop offset="0" stopColor="currentColor"></stop>
      <stop offset="0.328" stopColor="currentColor"></stop>
      <stop offset="0.348" stopColor="currentColor"></stop>
      <stop offset="0.504" stopColor="currentColor"></stop>
      <stop offset="0.643" stopColor="currentColor"></stop>
      <stop offset="0.761" stopColor="currentColor"></stop>
      <stop offset="0.841" stopColor="currentColor"></stop>
    </radialGradient>
    <radialGradient cx="11.786" cy="5.5403" r="29.813" gradientUnits="userSpaceOnUse" id="ig-color-2">
      <stop offset="0" stopColor="currentColor"></stop>
      <stop offset="0.999" stopColor="currentColor"></stop>
    </radialGradient>
  </defs>
  <path
    fill="url(#ig-color-1)"
    d="M34.017,41.99l-20,0.019c-4.4,0.004 -8.003,-3.592 -8.008,-7.992l-0.019,-20c-0.004,-4.4 3.592,-8.003 7.992,-8.008l20,-0.019c4.4,-0.004 8.003,3.592 8.008,7.992l0.019,20c0.005,4.401 -3.592,8.004 -7.992,8.008z"
  />
  <path
    fill="url(#ig-color-2)"
    d="M34.017,41.99l-20,0.019c-4.4,0.004 -8.003,-3.592 -8.008,-7.992l-0.019,-20c-0.004,-4.4 3.592,-8.003 7.992,-8.008l20,-0.019c4.4,-0.004 8.003,3.592 8.008,7.992l0.019,20c0.005,4.401 -3.592,8.004 -7.992,8.008z"
  />
  <path
    fill="#ffffff"
    d="M24,31c-3.859,0 -7,-3.14 -7,-7c0,-3.86 3.141,-7 7,-7c3.859,0 7,3.14 7,7c0,3.86 -3.141,7 -7,7zM24,19c-2.757,0 -5,2.243 -5,5c0,2.757 2.243,5 5,5c2.757,0 5,-2.243 5,-5c0,-2.757 -2.243,-5 -5,-5z"
  />
  <circle cx="31.5" cy="16.5" r="1.5" fill="#ffffff" />
  <path
    fill="#ffffff"
    d="M30,37h-12c-3.859,0 -7,-3.14 -7,-7v-12c0,-3.86 3.141,-7 7,-7h12c3.859,0 7,3.14 7,7v12c0,3.86 -3.141,7 -7,7zM18,13c-2.757,0 -5,2.243 -5,5v12c0,2.757 2.243,5 5,5h12c2.757,0 5,-2.243 5,-5v-12c0,-2.757 -2.243,-5 -5,-5z"
  />
</svg>

              )}
            </a>

            <a
              href="https://www.tiktok.com/@emnl.rentals.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="social-icon"
              onMouseEnter={() => setTkHovered(true)}
              onMouseLeave={() => setTkHovered(false)}
            >
              {tkHovered ? (
                <img src="/assets/tk-filled.png" alt="Tiktok" />
              ) : (
               <svg viewBox="0 0 48 48" width="36" height="36" className="social-svg">
    <path
      fill={tkHovered ? "#000000" : "currentColor"}
      d="M10.904,6h26.191c2.709,0 4.905,2.196 4.905,4.904v26.191c0,2.709 -2.196,4.905 -4.904,4.905h-26.192c-2.708,0 -4.904,-2.196 -4.904,-4.904v-26.192c0,-2.708 2.196,-4.904 4.904,-4.904z"
    />
    <path
      fill="#ec407a"
      d="M29.208,20.607c1.576,1.126 3.507,1.788 5.592,1.788v-4.011c-0.395,0 -0.788,-0.041 -1.174,-0.123v3.157c-2.085,0 -4.015,-0.663 -5.592,-1.788v8.184c0,4.094 -3.321,7.413 -7.417,7.413c-1.528,0 -2.949,-0.462 -4.129,-1.254c1.347,1.376 3.225,2.23 5.303,2.23c4.096,0 7.417,-3.319 7.417,-7.413v-8.183zM30.657,16.561c-0.805,-0.879 -1.334,-2.016 -1.449,-3.273v-0.516h-1.113c0.28,1.597 1.236,2.962 2.562,3.789z"
    />
    <path
      fill="#ffffff"
      d="M28.034,19.63c1.576,1.126 3.507,1.788 5.592,1.788v-3.157c-1.164,-0.248 -2.194,-0.856 -2.969,-1.701c-1.326,-0.827 -2.281,-2.191 -2.561,-3.788h-2.923v16.018c-0.007,1.867 -1.523,3.379 -3.393,3.379c-1.102,0 -2.081,-0.525 -2.701,-1.338c-1.107,-0.558 -1.866,-1.705 -1.866,-3.029c0,-1.873 1.519,-3.391 3.393,-3.391c0.359,0 0.705,0.056 1.03,0.159v-3.19c-4.024,0.083 -7.26,3.369 -7.26,7.411c0,2.018 0.806,3.847 2.114,5.183c1.18,0.792 2.601,1.254 4.129,1.254c4.096,0 7.417,-3.319 7.417,-7.413l-0.002,-8.185z"
    />
    <path
      fill="#81d4fa"
      d="M33.626,18.262v-0.854c-1.05,0.002 -2.078,-0.292 -2.969,-0.848c0.788,0.863 1.826,1.458 2.969,1.702zM28.095,12.772c-0.027,-0.153 -0.047,-0.306 -0.061,-0.461v-0.516h-4.036v16.019c-0.006,1.867 -1.523,3.379 -3.393,3.379c-0.549,0 -1.067,-0.13 -1.526,-0.362c0.62,0.813 1.599,1.338 2.701,1.338c1.87,0 3.386,-1.512 3.393,-3.379v-16.018zM21.635,21.38v-0.909c-0.337,-0.046 -0.677,-0.069 -1.018,-0.069c-4.097,0 -7.417,3.319 -7.417,7.413c0,2.567 1.305,4.829 3.288,6.159c-1.308,-1.336 -2.114,-3.165 -2.114,-5.183c0,-4.042 3.237,-7.328 7.261,-7.411z"
    />
  </svg>
              )}
            </a>
          </div>
        </div>










        
      </div>
      <div className="footer-bottom">
        <p className="footer-content-p">
          &copy; {new Date().getFullYear()} EMNL. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
