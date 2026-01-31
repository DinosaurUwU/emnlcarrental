"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";


import "./AdminDashboard.css";
import HeaderAdmin from "./HeaderAdmin";
import Footer from "../component/Footer";


import RentalActivitySection from "./RentalActivitySection";
import AnalyticsSection from "./AnalyticsSection";
import FinancialReports from "./FinancialReports";
import Messages from "./Messages";
import AdminSettings from "./AdminSettings";

// const AnalyticsSection = lazy(() => import("./AnalyticsSection"));

// const FinancialReports = lazy(() => import("./FinancialReports"));
// const Messages = lazy(() => import("./Messages"));
// const AdminSettings = lazy(() => import("./AdminSettings"));


import { useUser } from "../lib/UserContext";

const AdminDashboard = () => {
  const router = useRouter();

  const { fetchAdminUid } = useUser();

  const [activeSection, setActiveSection] = useState("rental-activity");
  const [collapsed, setCollapsed] = useState(false);

  const [activeSubSections, setActiveSubSections] = useState({
    "rental-activity": "overview",
    analytics: "overview",
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

    {/* 
    
        <div style={{ display: activeSection === "rental-activity" ? "block" : "none", }}>
          <RentalActivitySection subSection={activeSubSections["rental-activity"]}/>
        </div> 

         <div style={{ display: activeSection === "analytics" ? "block" : "none" }}>
          <AnalyticsSection subSection={activeSubSections["analytics"]} />
         </div>

        <div style={{ display: activeSection === "financial-reports" ? "block" : "none", }}>
          <FinancialReports />
        </div>

        <div style={{ display: activeSection === "messages" ? "block" : "none" }}>
          <Messages />
        </div>  
        
        */}




        {activeSection === "rental-activity" && (
          <RentalActivitySection subSection={activeSubSections["rental-activity"]} />
        )}

        {activeSection === "analytics" && (
          <AnalyticsSection subSection={activeSubSections["analytics"]} />
        )}

        {activeSection === "financial-reports" && (
          <FinancialReports subSection={activeSubSections["financial-reports"]} />
        )}

        {activeSection === "messages" && (
          <Messages subSection={activeSubSections["messages"]} />
        )}

        {activeSection === "settings" && (
          <AdminSettings subSection={activeSubSections["settings"]} />
        )}






        {/* <div style={{ display: activeSection === "analytics" ? "block" : "none" }}>
          <AnalyticsSection subSection={activeSubSections["analytics"]} />
        </div>


        <div style={{ display: activeSection === "financial-reports" ? "block" : "none", }}>
          <FinancialReports />
        </div>


        <div style={{ display: activeSection === "messages" ? "block" : "none" }}>
          <Messages />
        </div> 


        <div style={{ display: activeSection === "settings" ? "block" : "none" }}>
          <AdminSettings subSection={activeSubSections["settings"]} />
        </div>  */}


        {/* <Footer /> */}
      </div>
    </div>
  );
};

export default AdminDashboard;
































// "use client";
// import React, { useState, useEffect } from "react";
// import { useRouter } from "next/navigation";
// import "./AdminDashboard.css";
// import HeaderAdmin from "./HeaderAdmin";
// import Footer from "../Footer";
// import RentalActivitySection from "./RentalActivitySection";
// import AnalyticsSection from "./AnalyticsSection";
// import FinancialReports from "./FinancialReports";
// import Messages from "./Messages";
// import AdminSettings from "./AdminSettings";

// import { useUser } from "../contexts/UserContext";

// const AdminDashboard = () => {
//   const router = useRouter();

//   const { fetchAdminUid } = useUser();

//   const [activeSection, setActiveSection] = useState("rental-activity");
//   const [collapsed, setCollapsed] = useState(false);

//   const [activeSubSections, setActiveSubSections] = useState({
//     "rental-activity": "overview",
//     analytics: "overview",
//     settings: "overview",
//   });

//   const handleSubSectionClick = (section, sub) => {
//     setActiveSection(section);
//     setActiveSubSections((prev) => ({ ...prev, [section]: sub }));
//   };

//   const handleNavClick = (section) => {
//     setActiveSection(section);
//     setActiveSubSections((prev) => ({ ...prev, [section]: "overview" }));
//   };

//   useEffect(() => {
//     fetchAdminUid();
//   }, []);

//   return (
//     <div className="admin-dashboard">
//       <HeaderAdmin
//         onNavClick={handleNavClick}
//         onCollapseChange={setCollapsed}
//         onSubSectionClick={handleSubSectionClick}
//         activeSubSections={activeSubSections}
//         activeSection={activeSection}
//       />

//       <div className={`main-content ${collapsed ? "collapsed" : ""}`}>
//         <div
//           style={{
//             display: activeSection === "rental-activity" ? "block" : "none",
//           }}
//         >
//           <RentalActivitySection
//             subSection={activeSubSections["rental-activity"]}
//           />
//         </div>
//         <div
//           style={{ display: activeSection === "analytics" ? "block" : "none" }}
//         >
//           <AnalyticsSection subSection={activeSubSections["analytics"]} />
//         </div>
//         <div
//           style={{
//             display: activeSection === "financial-reports" ? "block" : "none",
//           }}
//         >
//           <FinancialReports />
//         </div>
//         <div
//           style={{ display: activeSection === "messages" ? "block" : "none" }}
//         >
//           <Messages />
//         </div>
//         <div
//           style={{ display: activeSection === "settings" ? "block" : "none" }}
//         >
//           <AdminSettings subSection={activeSubSections["settings"]} />
//         </div>

//         <Footer />
//       </div>
//     </div>
//   );
// };

// export default AdminDashboard;
