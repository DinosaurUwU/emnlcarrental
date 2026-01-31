'use client';
import React, { useState } from "react";
// import { useNavigate } from "react-router-dom";
import { useRouter } from 'next/navigation';
import Header from "../component/Header";
import Footer from "../component/Footer";
import "./AccountDashboard.css";
import Profile from "./Profile";

const AccountDashboard = ({ openBooking }) => {
  const router = useRouter();
  // const navigate = useNavigate();
  const [user, setUser] = useState(null);

  // Removed useEffect that forces login
  
  return (
    <div className="account-dashboard">
      <Header openBooking={openBooking}/>
      <div className="account-container">
        {/* Add components here later */}
        <Profile user={user} openBooking={openBooking} />
      </div>
      <Footer />
    </div>
  );
};

export default AccountDashboard;
