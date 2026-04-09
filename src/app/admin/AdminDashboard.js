"use client";
import React, { useState, useEffect } from "react";
import "./AdminDashboard.css";
import HeaderAdmin from "./HeaderAdmin";
import RentalActivitySection from "./RentalActivitySection";
import AnalyticsSection from "./AnalyticsSection";
import FinancialReports from "./FinancialReports";
import Messages from "./Messages";
import BlogPosts from "./BlogPosts";
import AdminSettings from "./AdminSettings";

import { useUser } from "../lib/UserContext";

const AdminDashboard = () => {
  const { fetchAdminUid } = useUser();
  const [activeSection, setActiveSection] = useState("rental-activity");
  const [collapsed, setCollapsed] = useState(false);
  const [activeSubSections, setActiveSubSections] = useState({
    "rental-activity": "overview",
    analytics: "overview",
    "blog-posts": "overview",
    settings: "overview",
  });

  const handleSubSectionClick = (section, sub) => {
    setActiveSection(section);
    setActiveSubSections((prev) => ({ ...prev, [section]: sub }));
  };

  const handleNavClick = (section) => {
    setActiveSection(section);
    setActiveSubSections((prev) => ({ ...prev, [section]: "overview" }));
  };

  useEffect(() => {
    fetchAdminUid();
  }, []);

  return (
    <div className="admin-dashboard">
      <HeaderAdmin
        onNavClick={handleNavClick}
        onCollapseChange={setCollapsed}
        onSubSectionClick={handleSubSectionClick}
        activeSubSections={activeSubSections}
        activeSection={activeSection}
      />

      <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
        {activeSection === "rental-activity" && (
          <RentalActivitySection
            subSection={activeSubSections["rental-activity"]}
          />
        )}

        {activeSection === "analytics" && (
          <AnalyticsSection subSection={activeSubSections["analytics"]} />
        )}

        {activeSection === "financial-reports" && (
          <FinancialReports
            subSection={activeSubSections["financial-reports"]}
          />
        )}

        {activeSection === "messages" && (
          <Messages subSection={activeSubSections["messages"]} />
        )}

        {activeSection === "blog-posts" && (
          <BlogPosts subSection={activeSubSections["blog-posts"]} />
        )}

        {activeSection === "settings" && (
          <AdminSettings subSection={activeSubSections["settings"]} />
        )}

        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default AdminDashboard;
