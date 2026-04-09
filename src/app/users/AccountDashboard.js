"use client";
import React, { useState } from "react";
import Header from "../component/Header";
import Footer from "../component/Footer";
import { useBooking } from "../component/BookingProvider";
import "./AccountDashboard.css";
import Profile from "./Profile";

// const AccountDashboard = ({ openBooking }) => {
const AccountDashboard = ({ openBooking: openBookingProp }) => {
  const [user, setUser] = useState(null);
  const { openBooking: openBookingFromContext } = useBooking();
  const openBooking = openBookingProp || openBookingFromContext;

  return (
    <div className="account-dashboard">
      <Header openBooking={openBooking} />
      <div className="account-container">
        {/* Add components here later */}
        <Profile user={user} openBooking={openBooking} />
      </div>
      <Footer />
    </div>
  );
};

export default AccountDashboard;
