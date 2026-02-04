"use client";
// src/user/InfoPage.js
import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { useUser } from "../lib/UserContext";
import Header from "./Header";
import Footer from "./Footer";

import "./InfoPage.css";

const InfoPage = ({ openBooking }) => {
  const pathname = usePathname();

  const [openFAQ, setOpenFAQ] = useState(null);
  const [offsetY, setOffsetY] = useState(0);

  const pageRef = useRef(null);
  const inputRef = useRef(null);

  // Search states
  const [searchTerm, setSearchTerm] = useState("");
  const [searchIndex, setSearchIndex] = useState([]); // [{id, title, text}]
  const [showResults, setShowResults] = useState(false);

  const {
    user,
    savePrivacyPolicy,
    saveTermsConditions,
    fetchPrivacyPolicy,
    fetchTermsConditions,
  } = useUser();

  const [privacyLastUpdated, setPrivacyLastUpdated] = useState(null);
  const [termsLastUpdated, setTermsLastUpdated] = useState(null);

  const [showHistoryOverlay, setShowHistoryOverlay] = useState(false);

  const [isEditingPrivacy, setIsEditingPrivacy] = useState(false);

  const [privacyContent, setPrivacyContent] = useState([
    {
      title: "1. INFORMATION WE COLLECT",
      body: "We are committed to protecting your privacy and being transparent about the information we collect. We collect various categories of personal data to provide our car rental services effectively and securely.",
      items: [
        {
          type: "bullet",
          text: "Personal identification information including full name, contact phone number, email address, and residential address",
        },
        {
          type: "bullet",
          text: "Government-issued identification documents such as driver's license, passport, or national ID for age verification and legal compliance",
        },
        {
          type: "bullet",
          text: "Vehicle rental preferences, booking history, and usage patterns to improve our service",
        },
        {
          type: "bullet",
          text: "Emergency contact information for safety and security purposes",
        },
        {
          type: "bullet",
          text: "Technical data including IP address, browser type, device information, and website usage analytics",
        },
        {
          type: "bullet",
          text: "Location data when you use our services, including GPS coordinates for vehicle tracking and return verification",
        },
      ],
    },
    {
      title: "2. PURPOSE OF DATA COLLECTION",
      body: "We collect and process your personal information for specific, legitimate purposes related to providing our car rental services. All data processing is necessary for the performance of our rental agreement with you.",
      items: [
        {
          type: "bullet",
          text: "To verify your identity and ensure you meet our eligibility requirements for vehicle rental",
        },
        {
          type: "bullet",
          text: "To process and manage your vehicle rental bookings and reservations",
        },
        {
          type: "bullet",
          text: "To communicate important information about your booking, including confirmations, updates, and reminders",
        },
        {
          type: "bullet",
          text: "To maintain vehicle security through GPS tracking and ensure proper return of rental vehicles",
        },
        {
          type: "bullet",
          text: "To comply with legal obligations, including traffic laws, insurance requirements, and government regulations",
        },
        {
          type: "bullet",
          text: "To improve our services through analysis of usage patterns and customer feedback",
        },
        {
          type: "bullet",
          text: "To handle customer service inquiries, complaints, and support requests",
        },
        {
          type: "bullet",
          text: "To send important safety alerts and service notifications",
        },
      ],
    },
    {
      title: "3. DATA SHARING AND DISCLOSURE",
      body: "We do not sell, trade, or rent your personal information to third parties. We only share your data when necessary for legitimate business purposes or as required by law.",
      items: [
        {
          type: "bullet",
          text: "With insurance companies for claims processing and coverage verification",
        },
        {
          type: "bullet",
          text: "With law enforcement agencies when required by law or to protect public safety",
        },
        {
          type: "bullet",
          text: "With vehicle maintenance and repair service providers for quality assurance",
        },
        {
          type: "bullet",
          text: "With payment processors for secure transaction handling (all payments made on-site)",
        },
        {
          type: "bullet",
          text: "With our affiliated service centers for vehicle pickup, delivery, and support",
        },
        {
          type: "bullet",
          text: "With credit reporting agencies for rental eligibility assessment",
        },
      ],
    },
    {
      title: "4. DATA SECURITY",
      body: "We implement comprehensive security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.",
      items: [
        {
          type: "bullet",
          text: "All personal data is encrypted during transmission and storage using industry-standard SSL/TLS protocols",
        },
        {
          type: "bullet",
          text: "Access to customer data is restricted to authorized personnel only on a need-to-know basis",
        },
        {
          type: "bullet",
          text: "Regular security audits and vulnerability assessments are conducted",
        },
        {
          type: "bullet",
          text: "Physical security measures protect our facilities and vehicle storage areas",
        },
        {
          type: "bullet",
          text: "Employee training programs on data protection and privacy best practices",
        },
        {
          type: "bullet",
          text: "Secure disposal procedures for physical and digital records",
        },
        {
          type: "bullet",
          text: "Multi-factor authentication for administrative access to customer data",
        },
      ],
    },
    {
      title: "5. USER RIGHTS",
      body: "You have several rights regarding your personal information under applicable data protection laws. We are committed to respecting and facilitating these rights.",
      items: [
        {
          type: "bullet",
          text: "Right to access: Request a copy of the personal information we hold about you",
        },
        {
          type: "bullet",
          text: "Right to rectification: Request correction of inaccurate or incomplete personal information",
        },
        {
          type: "bullet",
          text: "Right to erasure: Request deletion of your personal information in certain circumstances",
        },
        {
          type: "bullet",
          text: "Right to data portability: Request transfer of your data to another service provider",
        },
        {
          type: "bullet",
          text: "Right to object: Object to processing of your personal information for certain purposes",
        },
        {
          type: "bullet",
          text: "Right to restrict processing: Request limitation of how we process your personal information",
        },
      ],
    },
    {
      title: "6. COOKIES AND TRACKING TECHNOLOGIES",
      body: "We use cookies and similar technologies to enhance your experience on our website and mobile applications.",
      items: [
        {
          type: "bullet",
          text: "Essential cookies for website functionality and security",
        },
        {
          type: "bullet",
          text: "Analytics cookies to understand how you use our services and improve performance",
        },
        {
          type: "bullet",
          text: "Preference cookies to remember your settings and preferences",
        },
        {
          type: "bullet",
          text: "Marketing cookies to show relevant advertisements and promotions",
        },
        {
          type: "bullet",
          text: "You can control cookie preferences through your browser settings",
        },
        {
          type: "bullet",
          text: "Disabling cookies may affect website functionality and user experience",
        },
      ],
    },
    {
      title: "7. THIRD-PARTY SERVICES",
      body: "Our website and services may integrate with third-party services and platforms.",
      items: [
        {
          type: "bullet",
          text: "Google Maps for location services and route planning",
        },
        {
          type: "bullet",
          text: "Firebase services for authentication, data storage, and analytics",
        },
        {
          type: "bullet",
          text: "Payment processing partners for secure transaction handling",
        },
        {
          type: "bullet",
          text: "Email service providers for communications and notifications",
        },
        {
          type: "bullet",
          text: "Customer support platforms for service assistance",
        },
        {
          type: "bullet",
          text: "Third-party insurance providers for coverage options",
        },
      ],
    },
    {
      title: "8. CHILDREN'S PRIVACY",
      body: "We are committed to protecting children's privacy and comply with all applicable laws regarding children's online privacy protection.",
      items: [
        {
          type: "bullet",
          text: "Our services are not intended for children under 18 years of age",
        },
        {
          type: "bullet",
          text: "We do not knowingly collect personal information from children under 18",
        },
        {
          type: "bullet",
          text: "All renters must be at least 21 years old with valid driver's license",
        },
        {
          type: "bullet",
          text: "If we discover we have collected information from a child, we will delete it immediately",
        },
        {
          type: "bullet",
          text: "Parents or guardians may contact us to review or delete their child's information",
        },
      ],
    },
    {
      title: "9. DATA RETENTION",
      body: "We retain your personal information only as long as necessary for the purposes outlined in this Privacy Policy.",
      items: [
        {
          type: "bullet",
          text: "Active rental data retained for the duration of the rental period plus 7 years for legal compliance",
        },
        {
          type: "bullet",
          text: "Booking history and transaction records retained for 7 years for tax and legal purposes",
        },
        {
          type: "bullet",
          text: "Account information retained while your account is active and for 3 years after account closure",
        },
        {
          type: "bullet",
          text: "Marketing preferences retained until you unsubscribe or request deletion",
        },
        {
          type: "bullet",
          text: "Data subject to legal holds retained until the hold is released",
        },
        {
          type: "bullet",
          text: "Anonymized analytics data retained indefinitely for service improvement",
        },
      ],
    },
    {
      title: "10. CHANGES TO PRIVACY POLICY",
      body: "We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements.",
      items: [
        {
          type: "bullet",
          text: "Material changes will be communicated through email or website notifications",
        },
        {
          type: "bullet",
          text: "Continued use of our services constitutes acceptance of updated Privacy Policy",
        },
        {
          type: "bullet",
          text: "Previous versions of the Privacy Policy will be archived for reference",
        },
        {
          type: "bullet",
          text: "We encourage you to review this Privacy Policy regularly",
        },
      ],
    },
    {
      title: "11. CONTACT INFORMATION",
      body: "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
      items: [
        {
          type: "bullet",
          text: "Email: rentalinquiries.emnl@gmail.com",
        },
        {
          type: "bullet",
          text: "Phone: +63 975 477 8178",
        },
        {
          type: "bullet",
          text: "Address: Brgy. Dona Feliza Z. Mejia, Corner Berlin St. and, Madrid, Ormoc City, 6541 Leyte",
        },
      ],
    },
  ]);

  const [draftContent, setDraftContent] = useState(null);

  const [showClearHistoryConfirm, setShowClearHistoryConfirm] = useState(false);
  const [showDeleteVersionConfirm, setShowDeleteVersionConfirm] =
    useState(false);
  const [deleteVersionIdx, setDeleteVersionIdx] = useState(null);

  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // --- History stacks ---
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // --- Draft stacks for undo/redo during editing ---
  const [draftUndoStack, setDraftUndoStack] = useState([]);
  const [draftRedoStack, setDraftRedoStack] = useState([]);

  // Terms and Conditions states
  const [isEditingTerms, setIsEditingTerms] = useState(false);
  const [termsContent, setTermsContent] = useState([
    {
      title: "1. GENERAL INFORMATION",
      body: 'These Terms & Conditions ("Terms") govern the use of the car rental and booking services ("Services") provided by EMNL Car Rental Services - Ormoc City ("Company," "we," "us," or "our"). By accessing our website, creating an account, or renting a vehicle from us, you agree to comply with and be bound by these Terms. Please read them carefully before proceeding with any booking.',
      items: [],
    },
    {
      title: "2. ELIGIBILITY REQUIREMENTS",
      body: "To rent vehicles from EMNL Car Rental Services, all customers must meet our minimum eligibility requirements. These requirements ensure safety, legal compliance, and responsible vehicle usage.",
      items: [
        {
          type: "bullet",
          text: "Be at least 21 years old (or the minimum legal driving age as required by Philippine law)",
        },
        {
          type: "bullet",
          text: "Possess a valid, government-issued driver's license for the entire rental period",
        },
        {
          type: "bullet",
          text: "Provide a valid government-issued ID (passport, national ID, or equivalent) for identity verification",
        },
        {
          type: "bullet",
          text: "Have a valid contact number and email address for communication and emergency purposes",
        },
        {
          type: "bullet",
          text: "Be physically fit to operate a motor vehicle safely",
        },
        {
          type: "bullet",
          text: "Not be under the influence of alcohol, drugs, or any substance that impairs driving ability",
        },
        {
          type: "bullet",
          text: "Have no criminal record that would prevent safe vehicle operation",
        },
        {
          type: "bullet",
          text: "Agree to background check procedures as required by law",
        },
      ],
    },
    {
      title: "3. RESERVATIONS & BOOKINGS",
      body: "Our booking system allows you to reserve vehicles in advance. Understanding our booking process ensures a smooth rental experience.",
      items: [
        {
          type: "bullet",
          text: "Bookings can be made through our website, mobile app, or by contacting our office directly",
        },
        {
          type: "bullet",
          text: "A booking is confirmed only after receiving a confirmation email, message or call from EMNL Car Rental Services",
        },
        {
          type: "bullet",
          text: "All bookings require advance reservation with minimum 24-hour notice for same-day pickups",
        },
        {
          type: "bullet",
          text: "Vehicle availability is not guaranteed until booking confirmation is received",
        },
        {
          type: "bullet",
          text: "Changes to booking details must be made at least 12 hours before scheduled pickup time",
        },
        {
          type: "bullet",
          text: "We reserve the right to cancel or modify bookings due to vehicle unavailability or maintenance",
        },
        {
          type: "bullet",
          text: "Group bookings and special requests are subject to availability and additional terms",
        },
      ],
    },
    {
      title: "4. PAYMENT AND DEPOSITS",
      body: "All payments for vehicle rentals are processed on-site at our office location. We accept various payment methods to ensure convenience for our customers.",
      items: [
        {
          type: "bullet",
          text: "Full payment or deposit is required at the time of vehicle pickup",
        },
        {
          type: "bullet",
          text: "Accepted payment methods include cash, bank transfers, GCash, GoTyme and other approved digital wallets",
        },
        {
          type: "bullet",
          text: "Security deposits are required for all rentals and are refundable upon vehicle return in good condition",
        },
        {
          type: "bullet",
          text: "Deposit amounts vary based on vehicle type, rental duration, and customer history",
        },
        {
          type: "bullet",
          text: "Additional charges may apply for fuel, parking violations, or vehicle damage",
        },
        {
          type: "bullet",
          text: "Late return fees are charged at hourly rates until vehicle is returned",
        },
        {
          type: "bullet",
          text: "All payments are final and non-refundable except as specified in our cancellation policy",
        },
      ],
    },
    {
      title: "5. VEHICLE USAGE AND RESPONSIBILITIES",
      body: "As a vehicle renter, you are responsible for the proper care and operation of the rental vehicle throughout the rental period.",
      items: [
        {
          type: "bullet",
          text: "The renter must use the vehicle responsibly and comply with all Philippine traffic laws and regulations",
        },
        {
          type: "bullet",
          text: "Smoking, consumption of alcohol, and carrying hazardous materials inside the vehicle are strictly prohibited",
        },
        {
          type: "bullet",
          text: "Only the authorized driver(s) listed in the rental agreement may operate the vehicle",
        },
        {
          type: "bullet",
          text: "The vehicle must not be used for illegal activities, racing, or off-road driving",
        },
        {
          type: "bullet",
          text: "Maximum passenger capacity must not be exceeded as specified in the vehicle documentation",
        },
        {
          type: "bullet",
          text: "The vehicle must be returned with the same fuel level as at pickup (fuel charges will apply)",
        },
        {
          type: "bullet",
          text: "Regular maintenance checks and tire pressure monitoring are the renter's responsibility",
        },
        {
          type: "bullet",
          text: "Any vehicle malfunctions must be reported immediately to our service team",
        },
      ],
    },
    {
      title: "6. INSURANCE AND LIABILITY",
      body: "Vehicle insurance and liability coverage are important aspects of your rental agreement. Understanding your coverage options protects both you and our company.",
      items: [
        {
          type: "bullet",
          text: "Basic insurance coverage is included with all rentals but has limitations and deductibles",
        },
        {
          type: "bullet",
          text: "Additional insurance coverage options are available for purchase at time of rental",
        },
        {
          type: "bullet",
          text: "The renter is responsible for any damage, loss, or theft of the vehicle during the rental period",
        },
        {
          type: "bullet",
          text: "Personal accident insurance covers the driver and passengers in case of accident",
        },
        {
          type: "bullet",
          text: "Third-party liability coverage protects against claims from other parties",
        },
        {
          type: "bullet",
          text: "Insurance does not cover intentional damage, driving under influence, or illegal activities",
        },
        {
          type: "bullet",
          text: "Claims must be reported immediately and proper documentation provided",
        },
        {
          type: "bullet",
          text: "Insurance coverage is subject to policy terms and conditions of our insurance provider",
        },
      ],
    },
    {
      title: "7. CANCELLATIONS & REFUNDS",
      body: "Our cancellation policy is designed to be fair to both customers and our business operations. Please review these terms carefully before booking.",
      items: [
        {
          type: "bullet",
          text: "Cancellations made at least 48 hours before scheduled pickup time are eligible for full refund",
        },
        {
          type: "bullet",
          text: "Cancellations made between 24-48 hours before pickup are subject to 50% cancellation fee",
        },
        {
          type: "bullet",
          text: "Cancellations made less than 24 hours before pickup are subject to 100% cancellation fee",
        },
        {
          type: "bullet",
          text: "No-shows are treated as last-minute cancellations and are non-refundable",
        },
        {
          type: "bullet",
          text: "Refunds are processed within 5-7 business days to the original payment method",
        },
        {
          type: "bullet",
          text: "Security deposits are refundable within 48 hours of vehicle return inspection",
        },
        {
          type: "bullet",
          text: "Force majeure events (natural disasters, government restrictions) may qualify for special consideration",
        },
        {
          type: "bullet",
          text: "Refunds do not include convenience fees or third-party service charges",
        },
      ],
    },
    {
      title: "8. VEHICLE RETURN AND INSPECTION",
      body: "Proper vehicle return procedures ensure accurate billing and maintain our fleet quality standards.",
      items: [
        {
          type: "bullet",
          text: "Vehicles must be returned to the designated pickup location during business hours",
        },
        {
          type: "bullet",
          text: "A comprehensive vehicle inspection will be conducted before and after each rental",
        },
        {
          type: "bullet",
          text: "Any damages, scratches, or mechanical issues must be documented and reported",
        },
        {
          type: "bullet",
          text: "Cleanliness condition of the vehicle will be assessed upon return",
        },
        {
          type: "bullet",
          text: "Fuel level must match the pickup level or additional charges will apply",
        },
        {
          type: "bullet",
          text: "Personal belongings must be removed from the vehicle before return",
        },
        {
          type: "bullet",
          text: "Return inspection typically takes 15-30 minutes and must be completed before departure",
        },
        {
          type: "bullet",
          text: "Digital photos and videos may be taken as part of the inspection process",
        },
      ],
    },
    {
      title: "9. PROHIBITED USES AND ACTIVITIES",
      body: "Certain uses of our rental vehicles are strictly prohibited to ensure safety and legal compliance.",
      items: [
        {
          type: "bullet",
          text: "Transportation of illegal substances, weapons, or hazardous materials",
        },
        {
          type: "bullet",
          text: "Use for any illegal activities or purposes",
        },
        {
          type: "bullet",
          text: "Racing, speed contests, or reckless driving",
        },
        {
          type: "bullet",
          text: "Off-road driving or use on unpaved surfaces without permission",
        },
        {
          type: "bullet",
          text: "Transportation of more passengers than the vehicle's rated capacity",
        },
        {
          type: "bullet",
          text: "Use by persons under the influence of alcohol or drugs",
        },
        {
          type: "bullet",
          text: "Subletting or transferring the rental agreement to another party",
        },
        {
          type: "bullet",
          text: "Use for commercial purposes without prior written authorization",
        },
      ],
    },
    {
      title: "10. MAINTENANCE AND BREAKDOWN ASSISTANCE",
      body: "We provide maintenance support and breakdown assistance to ensure your rental experience is trouble-free.",
      items: [
        {
          type: "bullet",
          text: "All vehicles undergo regular maintenance and safety inspections before rental",
        },
        {
          type: "bullet",
          text: "24/7 breakdown assistance is available for mechanical issues during rental period",
        },
        {
          type: "bullet",
          text: "Emergency roadside assistance includes towing, battery jump-start, and tire changes",
        },
        {
          type: "bullet",
          text: "Fuel delivery service available for extended rentals (additional charges apply)",
        },
        {
          type: "bullet",
          text: "Replacement vehicles provided in case of major mechanical failure",
        },
        {
          type: "bullet",
          text: "Maintenance-related delays may result in rental extensions at no additional cost",
        },
        {
          type: "bullet",
          text: "Customers must report any vehicle issues immediately upon discovery",
        },
        {
          type: "bullet",
          text: "Preventive maintenance reminders provided for long-term rentals",
        },
      ],
    },
    {
      title: "11. DATA PROTECTION AND PRIVACY",
      body: "Your privacy and data protection are important to us. We handle your personal information in accordance with our Privacy Policy and applicable data protection laws.",
      items: [
        {
          type: "bullet",
          text: "Personal information is collected and processed in accordance with our Privacy Policy",
        },
        {
          type: "bullet",
          text: "Data is used solely for providing rental services and improving customer experience",
        },
        {
          type: "bullet",
          text: "We implement security measures to protect your personal information",
        },
        {
          type: "bullet",
          text: "You have rights to access, correct, or delete your personal information",
        },
        {
          type: "bullet",
          text: "Marketing communications require explicit consent and can be unsubscribed at any time",
        },
        {
          type: "bullet",
          text: "Data sharing is limited to service providers necessary for rental operations",
        },
      ],
    },
    {
      title: "12. LIMITATION OF LIABILITY",
      body: "While we strive to provide excellent service, there are certain limitations to our liability as outlined in these terms.",
      items: [
        {
          type: "bullet",
          text: "Our liability is limited to the value of the rental vehicle and associated damages",
        },
        {
          type: "bullet",
          text: "We are not liable for indirect or consequential damages",
        },
        {
          type: "bullet",
          text: "We are not responsible for loss of personal belongings left in the vehicle",
        },
        {
          type: "bullet",
          text: "Liability for theft or vandalism is subject to police report and insurance coverage",
        },
        {
          type: "bullet",
          text: "Maximum liability is capped at the vehicle's market value",
        },
        {
          type: "bullet",
          text: "We are not liable for delays caused by traffic, weather, or other external factors",
        },
        {
          type: "bullet",
          text: "Customers assume responsibility for parking tickets, and traffic violations",
        },
      ],
    },
    {
      title: "13. GOVERNING LAW AND DISPUTE RESOLUTION",
      body: "These Terms are governed by Philippine law and any disputes will be resolved through appropriate legal channels.",
      items: [
        {
          type: "bullet",
          text: "These Terms are governed by the laws of the Republic of the Philippines",
        },
        {
          type: "bullet",
          text: "Any disputes will be resolved in the courts of Ormoc City, Leyte, Philippines",
        },
        {
          type: "bullet",
          text: "Mediation or arbitration may be considered for dispute resolution before court proceedings",
        },
        {
          type: "bullet",
          text: "Customers agree to submit to the jurisdiction of Philippine courts",
        },
        {
          type: "bullet",
          text: "International customers agree to Philippine law regardless of their location",
        },
      ],
    },
    {
      title: "14. AMENDMENTS AND MODIFICATIONS",
      body: "We reserve the right to modify these Terms as needed to reflect changes in our services or legal requirements.",
      items: [
        {
          type: "bullet",
          text: "Terms may be updated periodically to reflect changes in laws or business practices",
        },
        {
          type: "bullet",
          text: "Material changes will be communicated through email or website notifications",
        },
        {
          type: "bullet",
          text: "Continued use of our services constitutes acceptance of updated Terms",
        },
        {
          type: "bullet",
          text: "Previous versions of the Terms will be archived for reference",
        },
        {
          type: "bullet",
          text: "Customers are encouraged to review the Terms regularly",
        },
        {
          type: "bullet",
          text: "Specific amendments may apply to existing bookings with customer notification",
        },
      ],
    },
    {
      title: "15. CONTACT INFORMATION AND SUPPORT",
      body: "For any questions, concerns, or support needs related to these Terms & Conditions, please contact us through our available channels.",
      items: [
        {
          type: "bullet",
          text: "Customer Service Email: rentalinquiries.emnl@gmail.com",
        },
        {
          type: "bullet",
          text: "Emergency Hotline: +63 975 477 8178 (24/7 for rental period emergencies)",
        },
        {
          type: "bullet",
          text: "Business Office: Brgy. Dona Feliza Z. Mejia, Corner Berlin St. and, Madrid, Ormoc City, 6541 Leyte",
        },
        {
          type: "bullet",
          text: "Business Hours: Monday to Sunday, 8:00 AM to 6:00 PM PHT (UTC+8)",
        },
        {
          type: "bullet",
          text: "Website: https://emnlcarrental.com",
        },
        {
          type: "bullet",
          text: "Response Time: We aim to respond to all inquiries within 24 hours",
        },
        {
          type: "bullet",
          text: "Complaints and Feedback: Dedicated channel for service improvement suggestions",
        },
      ],
    },
  ]);

  const [draftTermsContent, setDraftTermsContent] = useState(null);
  const [termsUndoStack, setTermsUndoStack] = useState([]);
  const [termsRedoStack, setTermsRedoStack] = useState([]);
  const [draftTermsUndoStack, setDraftTermsUndoStack] = useState([]);
  const [draftTermsRedoStack, setDraftTermsRedoStack] = useState([]);
  const [showTermsHistoryOverlay, setShowTermsHistoryOverlay] = useState(false);
  const [showTermsClearHistoryConfirm, setShowTermsClearHistoryConfirm] =
    useState(false);
  const [showTermsDeleteVersionConfirm, setShowTermsDeleteVersionConfirm] =
    useState(false);
  const [deleteTermsVersionIdx, setDeleteTermsVersionIdx] = useState(null);
  const [showTermsSaveConfirm, setShowTermsSaveConfirm] = useState(false);
  const [showTermsCancelConfirm, setShowTermsCancelConfirm] = useState(false);

  // At the top of InfoPage.js, after imports
const LAUNCH_DATE = new Date("2026-02-15"); // Change to your actual launch date

  // Add useEffect to fetch data on mount
  useEffect(() => {
    const loadPolicies = async () => {
      const privacyData = await fetchPrivacyPolicy();
      console.log("Privacy data:", privacyData);
      
      if (privacyData) {
        if (privacyData.content) {
          setPrivacyContent(privacyData.content);
        }
        if (privacyData.lastUpdated) {
          setPrivacyLastUpdated(privacyData.lastUpdated);
        }
      }

      const termsData = await fetchTermsConditions();
      console.log("Terms data:", termsData);
      
      if (termsData) {
        if (termsData.content) {
          setTermsContent(termsData.content);
        }
        if (termsData.lastUpdated) {
          setTermsLastUpdated(termsData.lastUpdated);
        }
      }
    };

    loadPolicies();
  }, [fetchPrivacyPolicy, fetchTermsConditions]);


  const pushToHistory = (prevState) => {
    const historyEntry = {
      content: prevState,
      timestamp: new Date().toISOString(),
    };

    setUndoStack((stack) => {
      const newStack = [...stack, historyEntry];
      return newStack.length > 10
        ? newStack.slice(newStack.length - 10)
        : newStack;
    });

    setRedoStack([]);
  };

  const pushToTermsHistory = (prevState) => {
    const historyEntry = {
      content: prevState,
      timestamp: new Date().toISOString(),
    };

    setTermsUndoStack((stack) => {
      const newStack = [...stack, historyEntry];
      return newStack.length > 10
        ? newStack.slice(newStack.length - 10)
        : newStack;
    });

    setTermsRedoStack([]);
  };

  const pushToDraftHistory = (prevState) => {
    setDraftUndoStack((stack) => {
      const newStack = [...stack, prevState];
      // keep only last 10 versions
      return newStack.length > 10
        ? newStack.slice(newStack.length - 10)
        : newStack;
    });
    setDraftRedoStack([]);
  };

  const pushToDraftTermsHistory = (prevState) => {
    setDraftTermsUndoStack((stack) => {
      const newStack = [...stack, prevState];
      return newStack.length > 10
        ? newStack.slice(newStack.length - 10)
        : newStack;
    });
    setDraftTermsRedoStack([]);
  };

  const normalizeContent = (content) =>
    content.map((section) => ({
      title: section.title?.trim() || "",
      body: section.body?.trim() || "",
      items: section.items
        ? section.items
            .map((item) => ({
              type: item.type,
              text: item.text.trim(),
            }))
            .filter((item) => item.text !== "")
        : [],
    }));

  const handleUndo = () => {
    if (isEditingPrivacy) {
      // Undo on draft
      if (draftUndoStack.length === 0) return;
      const prev = draftUndoStack[draftUndoStack.length - 1];
      setDraftRedoStack((stack) => [
        JSON.parse(JSON.stringify(draftContent)),
        ...stack,
      ]);
      setDraftContent(prev);
      setDraftUndoStack((stack) => stack.slice(0, -1));
    } else {
      // Undo on main content
      if (undoStack.length === 0) return;
      const prev = undoStack[undoStack.length - 1];
      setRedoStack((stack) => [
        JSON.parse(JSON.stringify(privacyContent)),
        ...stack,
      ]);
      setPrivacyContent(prev);
      setUndoStack((stack) => stack.slice(0, -1));
    }
  };

  const handleTermsUndo = () => {
    if (isEditingTerms) {
      if (draftTermsUndoStack.length === 0) return;
      const prev = draftTermsUndoStack[draftTermsUndoStack.length - 1];
      setDraftTermsRedoStack((stack) => [
        JSON.parse(JSON.stringify(draftTermsContent)),
        ...stack,
      ]);
      setDraftTermsContent(prev);
      setDraftTermsUndoStack((stack) => stack.slice(0, -1));
    } else {
      if (termsUndoStack.length === 0) return;
      const prev = termsUndoStack[termsUndoStack.length - 1];
      setTermsRedoStack((stack) => [
        JSON.parse(JSON.stringify(termsContent)),
        ...stack,
      ]);
      setTermsContent(prev);
      setTermsUndoStack((stack) => stack.slice(0, -1));
    }
  };

  const handleRedo = () => {
    if (isEditingPrivacy) {
      // Redo on draft
      if (draftRedoStack.length === 0) return;
      const next = draftRedoStack[0];
      setDraftUndoStack((stack) => [
        ...stack,
        JSON.parse(JSON.stringify(draftContent)),
      ]);
      setDraftContent(next);
      setDraftRedoStack((stack) => stack.slice(1));
    } else {
      // Redo on main content
      if (redoStack.length === 0) return;
      const next = redoStack[0];
      setUndoStack((stack) => [
        ...stack,
        JSON.parse(JSON.stringify(privacyContent)),
      ]);
      setPrivacyContent(next);
      setRedoStack((stack) => stack.slice(1));
    }
  };

  const handleTermsRedo = () => {
    if (isEditingTerms) {
      if (draftTermsRedoStack.length === 0) return;
      const next = draftTermsRedoStack[0];
      setDraftTermsUndoStack((stack) => [
        ...stack,
        JSON.parse(JSON.stringify(draftTermsContent)),
      ]);
      setDraftTermsContent(next);
      setDraftTermsRedoStack((stack) => stack.slice(1));
    } else {
      if (termsRedoStack.length === 0) return;
      const next = termsRedoStack[0];
      setTermsUndoStack((stack) => [
        ...stack,
        JSON.parse(JSON.stringify(termsContent)),
      ]);
      setTermsContent(next);
      setTermsRedoStack((stack) => stack.slice(1));
    }
  };

  // --- Draft handlers (edit without committing) ---
  const handleDraftTitleChange = (sectionIdx, value) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    const updated = [...draftContent];
    updated[sectionIdx].title = value;
    setDraftContent(updated);
  };

  const handleDraftBodyChange = (sectionIdx, value) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    const updated = [...draftContent];
    updated[sectionIdx].body = value;
    setDraftContent(updated);
  };

  const handleDraftBulletChange = (sectionIdx, bulletIdx, value) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    const updated = [...draftContent];
    updated[sectionIdx].bullets[bulletIdx] = value;
    setDraftContent(updated);
  };

  const handleDraftDeleteSection = (sectionIdx) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    setDraftContent((prev) => prev.filter((_, idx) => idx !== sectionIdx));
  };

  const handleDraftAddRule = () => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    setDraftContent([
      ...draftContent,
      {
        title: `New Rule ${draftContent.length + 1}`,
        body: "",
        items: [], // Items, not bullets/extraLines
      },
    ]);
  };

  const handleDraftAddItem = (sectionIdx, type) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    const updated = [...draftContent];
    updated[sectionIdx].items.push({ type, text: "" });
    setDraftContent(updated);
  };

  const handleDraftItemChange = (sectionIdx, itemIdx, value) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    const updated = [...draftContent];
    updated[sectionIdx].items[itemIdx].text = value;
    setDraftContent(updated);
  };

  const handleDraftDeleteItem = (sectionIdx, itemIdx) => {
    pushToDraftHistory(JSON.parse(JSON.stringify(draftContent)));
    const updated = [...draftContent];
    updated[sectionIdx].items.splice(itemIdx, 1);
    setDraftContent(updated);
  };

  // Terms draft handlers
  const handleDraftTermsTitleChange = (sectionIdx, value) => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    const updated = [...draftTermsContent];
    updated[sectionIdx].title = value;
    setDraftTermsContent(updated);
  };

  const handleDraftTermsBodyChange = (sectionIdx, value) => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    const updated = [...draftTermsContent];
    updated[sectionIdx].body = value;
    setDraftTermsContent(updated);
  };

  const handleDraftTermsDeleteSection = (sectionIdx) => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    setDraftTermsContent((prev) => prev.filter((_, idx) => idx !== sectionIdx));
  };

  const handleDraftTermsAddRule = () => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    setDraftTermsContent([
      ...draftTermsContent,
      {
        title: `New Rule ${draftTermsContent.length + 1}`,
        body: "",
        items: [],
      },
    ]);
  };

  const handleDraftTermsAddItem = (sectionIdx, type) => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    const updated = [...draftTermsContent];
    updated[sectionIdx].items.push({ type, text: "" });
    setDraftTermsContent(updated);
  };

  const handleDraftTermsItemChange = (sectionIdx, itemIdx, value) => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    const updated = [...draftTermsContent];
    updated[sectionIdx].items[itemIdx].text = value;
    setDraftTermsContent(updated);
  };

  const handleDraftTermsDeleteItem = (sectionIdx, itemIdx) => {
    pushToDraftTermsHistory(JSON.parse(JSON.stringify(draftTermsContent)));
    const updated = [...draftTermsContent];
    updated[sectionIdx].items.splice(itemIdx, 1);
    setDraftTermsContent(updated);
  };

  // PARALLAX EFFECT
  useEffect(() => {
    const handleScroll = () => setOffsetY(window.scrollY * 0.5);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const faqs = [
    {
      question: "How can I book a car?",
      answer:
        "You can book online through our website or contact us directly via phone or email. We recommend booking at least 24 hours in advance to ensure vehicle availability.",
    },
    {
      question: "What documents do I need?",
      answer:
        "A valid driver’s license and a government-issued ID are required for all rentals. Additional documents may be required for international drivers.",
    },
    {
      question: "Do you require a security deposit?",
      answer:
        "Yes, a refundable security deposit is required at the time of booking. The amount depends on the type of vehicle rented.",
    },
    {
      question: "Can I extend my rental period?",
      answer:
        "Yes, you can extend your rental period by contacting us before your current booking ends. Additional fees may apply.",
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      const timer = setTimeout(() => {
        if (window.location.hash) {
          const targetId = window.location.hash.replace("#", "");
          const element = document.getElementById(targetId);
          if (element) {
            const offset = 120; // space from the top in px
            const elementPosition =
              element.getBoundingClientRect().top + window.scrollY;
            window.scrollTo({
              top: elementPosition - offset,
              behavior: "smooth",
            });
          }
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }, 0);

      return () => clearTimeout(timer);
    };

    // Run on mount
    handleScroll();

    // Listen for hash changes
    const handleHashChange = () => handleScroll();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  const highlightInSection = (id, query) => {
    const el = document.getElementById(id);
    if (!el) return;

    // Remove old highlights first
    el.querySelectorAll(".clicked-highlight").forEach((mark) => {
      const textNode = document.createTextNode(mark.textContent);
      mark.replaceWith(textNode);
    });

    // Global & case-insensitive regex
    const regex = new RegExp(`(${query})`, "gi");

    const walker = document.createTreeWalker(
      el,
      NodeFilter.SHOW_TEXT,
      null,
      false,
    );
    let found = false;

    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (regex.test(node.nodeValue)) {
        const frag = document.createDocumentFragment();
        node.nodeValue.split(regex).forEach((part) => {
          if (part.toLowerCase() === query.toLowerCase()) {
            const span = document.createElement("mark");
            span.className = "clicked-highlight";
            span.textContent = part;
            frag.appendChild(span);
            found = true;
          } else {
            frag.appendChild(document.createTextNode(part));
          }
        });
        node.parentNode.replaceChild(frag, node);
      }
    }

    if (found) {
      setTimeout(() => {
        el.querySelectorAll(".clicked-highlight").forEach((mark) => {
          const textNode = document.createTextNode(mark.textContent);
          mark.replaceWith(textNode);
        });
      }, 5000);
    }
  };

  const handleResultClick = (id, query) => {
    scrollToIdWithOffset(id);
    highlightInSection(id, query);
    setShowResults(false);
  };

  useEffect(() => {
    if (!pageRef.current) return;

    const sections = Array.from(
      pageRef.current.querySelectorAll("section[id]"),
    );
    const idx = sections.map((section) => {
      const title =
        section.querySelector(".section-title")?.textContent?.trim() ||
        section.id.replace(/-/g, " ");
      const text = section.innerText.replace(/\s+/g, " ").trim();
      return { id: section.id, title, text };
    });

    setSearchIndex(idx);
  }, []);

  const results =
    searchTerm.trim().length > 0
      ? searchIndex
          .map((item) => {
            const lc = item.text.toLowerCase();
            const q = searchTerm.toLowerCase();
            const pos = lc.indexOf(q);
            if (pos === -1) return null;
            const start = Math.max(0, pos - 60);
            const end = Math.min(item.text.length, pos + q.length + 60);
            const before = item.text.slice(start, pos);
            const match = item.text.slice(pos, pos + q.length);
            const after = item.text.slice(pos + q.length, end);
            return {
              id: item.id,
              title: item.title,
              snippet: `${before}<mark class="search-highlight">${match}</mark>${after}`,
            };
          })
          .filter(Boolean)
      : [];

  const scrollToIdWithOffset = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    const offset = 120;
    const y = el.getBoundingClientRect().top + window.scrollY - offset;
    window.scrollTo({ top: y, behavior: "smooth" });
    if (window.history && window.history.pushState) {
      const url = `${window.location.pathname}#${id}`;
      window.history.pushState(null, "", url);
    }
  };

  return (
    <div className="info-page" ref={pageRef}>
      <Header openBooking={openBooking} />

      <div className="info-title">
        <img
          src="/assets/dark-logo.png"
          alt="Logo"
          className="login-logo"
          style={{ transform: `translateY(${offsetY}px)` }}
        />
      </div>

      {/* Help Center */}
      <section id="help-center" className="help-center">
        {/* Hero / Intro */}
        <div className="help-hero">
          <h2 className="section-title">Help Center</h2>
          <p className="help-intro">
            Welcome to the EMNL Car Rental Services Help Center. Browse popular
            topics, find quick answers, or reach out to our team for
            personalized support.
          </p>

          {/* Optional search bar */}
          <div className="help-search-container">
            <div className="help-search">
              <input
                ref={inputRef}
                type="text"
                placeholder="Search this page..."
                aria-label="Search Help Center"
                value={searchTerm}
                onFocus={() => {
                  if (searchTerm.trim() !== "") setShowResults(true);
                }}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowResults(true);
                }}
              />
              <button type="button">Search</button>

              {/* Results overlay */}
              {searchTerm.trim() !== "" &&
                showResults &&
                (results.length > 0 ? (
                  <div className="help-results-overlay">
                    {results.map((r) => (
                      <button
                        key={r.id}
                        className="result-item"
                        onClick={() => handleResultClick(r.id, searchTerm)}
                      >
                        <div className="result-title">{r.title}</div>
                        <div
                          className="result-snippet"
                          dangerouslySetInnerHTML={{ __html: r.snippet }}
                        />
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="help-results-overlay no-results">
                    No results found for "{searchTerm}".
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="help-categories">
          <a href="#faqs" className="help-card">
            <div className="icon">📄</div>
            <h3>FAQs</h3>
            <p>Quick answers to common rental questions.</p>
          </a>

          <a href="#bookings" className="help-card">
            <div className="icon">🚗</div>
            <h3>Bookings</h3>
            <p>How to reserve, modify, or cancel your car rental.</p>
          </a>

          <a href="#account" className="help-card">
            <div className="icon">👤</div>
            <h3>Account Support</h3>
            <p>Help with signing in, profiles, and settings.</p>
          </a>

          <a href="#privacy-policy" className="help-card">
            <div className="icon">📜</div>
            <h3>Rental Policies</h3>
            <p>Learn about our rules, requirements, and coverage.</p>
          </a>

          <a href="/fleet-details" className="help-card">
            <div className="icon">🚙</div>
            <h3>Vehicle Info</h3>
            <p>Details on our fleet, specifications, and availability.</p>
          </a>
        </div>

        {/* Contact Section */}
        <div className="help-contact-wrapper">
          <div className="help-contact">
            <h3 className="section-title">Need more help?</h3>
            <p className="contact-info">
              📧 Email:{" "}
              <a href="mailto:info@emnlcarrental.com">info@emnlcarrental.com</a>
              <br />
              📞 Phone: <a href="tel:+639123456789">+63 912 345 6789</a>
              <br />
              💬 Live Chat: <a href="#chat">Start a conversation</a>
            </p>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs">
        <h2 className="section-title">FAQs</h2>
        <div className="faq-list">
          {faqs.map((faq, index) => (
            <div key={index} className="faq-item">
              <button
                className={`faq-question ${openFAQ === index ? "active" : ""}`}
                onClick={() => setOpenFAQ(openFAQ === index ? null : index)}
              >
                <span>{faq.question}</span>
                <span
                  className={`faq-icon ${openFAQ === index ? "rotate" : ""}`}
                >
                  ▼
                </span>
              </button>
              <div className={`faq-answer ${openFAQ === index ? "show" : ""}`}>
                <p className="infopage-p">{faq.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Bookings */}
      <section id="bookings">
        <h2 className="section-title">Bookings</h2>
        <div className="faq-list">
          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "booking-process" ? null : "booking-process",
                )
              }
            >
              <span>How do I make a booking?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "booking-process" ? "show" : ""}`}
            >
              <p className="infopage-p">
                You can book a vehicle through our website by clicking the "Book
                Now" button in the header, selecting your preferred vehicle from
                our Fleet section, choosing your dates, and completing the
                booking form with your details.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "booking-requirements"
                    ? null
                    : "booking-requirements",
                )
              }
            >
              <span>What are the booking requirements?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "booking-requirements" ? "show" : ""}`}
            >
              <p className="infopage-p">
                To book a vehicle, you must be at least 21 years old, have a
                valid driver's license, and provide a government-issued ID.
                International drivers may need additional documentation. Guest
                users can book without an account.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "modify-booking" ? null : "modify-booking",
                )
              }
            >
              <span>Can I modify or cancel my booking?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "modify-booking" ? "show" : ""}`}
            >
              <p className="infopage-p">
                You can modify your booking up to 24 hours before pickup through
                your account dashboard (My Bookings section). Cancellations made
                48+ hours in advance receive full refunds. Late cancellations
                may incur fees.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "payment-booking" ? null : "payment-booking",
                )
              }
            >
              <span>When do I need to pay for my booking?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "payment-booking" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Payment is required at the time of vehicle pickup at our office.
                We accept cash, bank transfers, GCash, and other approved
                digital payment methods. A security deposit may also be
                required.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "booking-confirmation"
                    ? null
                    : "booking-confirmation",
                )
              }
            >
              <span>How do I know my booking is confirmed?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "booking-confirmation" ? "show" : ""}`}
            >
              <p className="infopage-p">
                You'll receive a booking confirmation email with your
                reservation details. You can also check your booking status
                through your account dashboard under "My Bookings" or by logging
                into your profile.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(openFAQ === "early-pickup" ? null : "early-pickup")
              }
            >
              <span>Can I pick up my vehicle early?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "early-pickup" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Early pickups are subject to vehicle availability. Please
                contact us at least 24 hours in advance to arrange an early
                pickup time. You can reach us through the Contact section or by
                phone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Account Support */}
      <section id="account">
        <h2 className="section-title">Account Support</h2>
        <div className="faq-list">
          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "create-account" ? null : "create-account",
                )
              }
            >
              <span>How do I create an account?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "create-account" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Click the profile/account icon in the header and select "Sign
                Up". Fill out the registration form with your personal details,
                email, and password. You'll need to verify your email address to
                complete registration.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(openFAQ === "login-issues" ? null : "login-issues")
              }
            >
              <span>I'm having trouble logging in</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "login-issues" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Click the profile/account icon in the header to access the login
                form. Make sure you're using the correct email and password. If
                you've forgotten your password, use the "Forgot Password" link.
                Clear your browser cache and try again. Contact support if
                issues persist.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "reset-password" ? null : "reset-password",
                )
              }
            >
              <span>How do I reset my password?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "reset-password" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Click the profile/account icon in the header, then select
                "Forgot Password" on the login form. Enter your email address,
                and follow the instructions sent to your email. The reset link
                is valid for 24 hours.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(openFAQ === "google-link" ? null : "google-link")
              }
            >
              <span>How do I link my Google account?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "google-link" ? "show" : ""}`}
            >
              <p className="infopage-p">
                After logging in, go to your Account Dashboard or Profile
                settings. Look for the "Link Account" or "Connect Google" option
                to link your email/password account with your Google account for
                easier login.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "update-profile" ? null : "update-profile",
                )
              }
            >
              <span>How do I update my profile information?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "update-profile" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Click the profile/account icon in the header to access your
                Account Dashboard. You can update your personal information,
                contact details, and preferences in the Profile section. Some
                changes may require verification.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "account-security" ? null : "account-security",
                )
              }
            >
              <span>How is my account information protected?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "account-security" ? "show" : ""}`}
            >
              <p className="infopage-p">
                We use industry-standard encryption and security measures to
                protect your account. Enable two-factor authentication in your
                Profile settings for additional security. Never share your login
                credentials with others.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "delete-account" ? null : "delete-account",
                )
              }
            >
              <span>How do I delete my account?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "delete-account" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Go to your Account Dashboard or Profile settings and select
                "Delete Account". You'll need to confirm this action. Note that
                some data may be retained for legal compliance purposes.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "booking-history" ? null : "booking-history",
                )
              }
            >
              <span>How do I view my booking history?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "booking-history" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Click the profile/account icon in the header to access your
                Account Dashboard. Navigate to "My Bookings" or "Rental History"
                section to view past and current bookings, download receipts,
                and track your rental activity.
              </p>
            </div>
          </div>

          <div className="faq-item">
            <button
              className="faq-question"
              onClick={() =>
                setOpenFAQ(
                  openFAQ === "notification-settings"
                    ? null
                    : "notification-settings",
                )
              }
            >
              <span>How do I manage notification preferences?</span>
              <span className="faq-icon">▼</span>
            </button>
            <div
              className={`faq-answer ${openFAQ === "notification-settings" ? "show" : ""}`}
            >
              <p className="infopage-p">
                Go to your Account Dashboard or Profile settings. Select
                "Notifications" to choose which emails and alerts you want to
                receive, including booking confirmations, reminders, and
                promotional offers.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy Policy */}
      <section id="privacy-policy">
        <h2 className="section-title">
          Privacy Policy{" "}
          {user?.role === "admin" && (
            <>
              {!isEditingPrivacy ? (
                <button
                  className="infopage-edit-btn"
                  onClick={() => {
                    setDraftContent(JSON.parse(JSON.stringify(privacyContent)));
                    setDraftUndoStack([
                      JSON.parse(JSON.stringify(privacyContent)),
                    ]);
                    setDraftRedoStack([]);
                    setIsEditingPrivacy(true);
                  }}
                >
                  <img
                    src="/assets/edit.svg"
                    alt="Edit"
                    width={24}
                    height={24}
                  />
                </button>
              ) : (
                <div className="infopage-edit-controls">
                  <button
                    className="infopage-undo-btn"
                    onClick={handleUndo}
                    disabled={
                      (isEditingPrivacy ? draftUndoStack : undoStack).length ===
                      0
                    }
                  >
                    <img
                      src="/assets/undo.svg"
                      alt="Undo"
                      width={24}
                      height={24}
                    />
                  </button>

                  <button
                    className="infopage-save-btn"
                    onClick={() => {
                      const cleanedDraft = normalizeContent(draftContent);
                      const cleanedPrivacy = normalizeContent(privacyContent);

                      const hasChanges =
                        JSON.stringify(cleanedPrivacy) !==
                        JSON.stringify(cleanedDraft);

                      if (hasChanges) {
                        setShowSaveConfirm(true);
                      } else {
                        setDraftContent(null);
                        setIsEditingPrivacy(false);
                        setDraftUndoStack([]);
                        setDraftRedoStack([]);
                      }
                    }}
                  >
                    Save
                  </button>

                  <button
                    className="infopage-history-btn"
                    onClick={() => setShowHistoryOverlay(true)}
                  >
                    History
                  </button>

                  <button
                    className="infopage-cancel-btn"
                    onClick={() => {
                      const hasChanges =
                        JSON.stringify(privacyContent) !==
                        JSON.stringify(draftContent);

                      if (hasChanges) {
                        setShowCancelConfirm(true);
                      } else {
                        setDraftContent(null);
                        setIsEditingPrivacy(false);
                        setDraftUndoStack([]);
                        setDraftRedoStack([]);
                      }
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="infopage-redo-btn"
                    onClick={handleRedo}
                    disabled={
                      (isEditingPrivacy ? draftRedoStack : redoStack).length ===
                      0
                    }
                  >
                    <img
                      src="/assets/redo.svg"
                      alt="Redo"
                      width={24}
                      height={24}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </h2>

        <p>
          <strong>Last Updated:</strong>{" "}
          {privacyLastUpdated
            ? privacyLastUpdated.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : LAUNCH_DATE.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
        </p>

        {/* Scrollable only in edit mode */}
        {isEditingPrivacy ? (
          <div className="privacy-scroll-container">
            {draftContent.map((section, sectionIdx) => (
              <div key={sectionIdx} className="privacy-section">
                {/* Section Header */}
                <div className="privacy-section-header">
                  <input
                    className="infopage-header-input"
                    type="text"
                    placeholder="Enter section title..."
                    value={section.title}
                    onChange={(e) =>
                      handleDraftTitleChange(sectionIdx, e.target.value)
                    }
                  />
                  <button
                    className="infopage-delete-btn"
                    onClick={() => handleDraftDeleteSection(sectionIdx)}
                  >
                    <img
                      src="/assets/delete.svg"
                      alt="Delete"
                      width={16}
                      height={16}
                    />
                  </button>
                </div>

                {/* Section Body */}
                <textarea
                  className="infopage-textarea auto-resize"
                  placeholder="Enter introductory text..."
                  value={section.body}
                  onChange={(e) => {
                    handleDraftBodyChange(sectionIdx, e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />

                {/* Items (bullets + extra lines) */}
                {section.items?.map((item, itemIdx) =>
                  item.type === "bullet" ? (
                    <li key={itemIdx} className="bullet-item">
                      <textarea
                        className="infopage-bullet-input auto-resize"
                        placeholder="Enter bullet point..."
                        value={item.text}
                        onChange={(e) =>
                          handleDraftItemChange(
                            sectionIdx,
                            itemIdx,
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="infopage-delete-btn"
                        onClick={() =>
                          handleDraftDeleteItem(sectionIdx, itemIdx)
                        }
                      >
                        <img
                          src="/assets/delete.svg"
                          alt="Delete"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                  ) : (
                    <p key={itemIdx} className="extra-lines-item">
                      <textarea
                        className="infopage-line-input auto-resize"
                        placeholder="Enter extra line..."
                        value={item.text}
                        onChange={(e) =>
                          handleDraftItemChange(
                            sectionIdx,
                            itemIdx,
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="infopage-delete-btn"
                        onClick={() =>
                          handleDraftDeleteItem(sectionIdx, itemIdx)
                        }
                      >
                        <img
                          src="/assets/delete.svg"
                          alt="Delete"
                          width={16}
                          height={16}
                        />
                      </button>
                    </p>
                  ),
                )}

                {/* Add Buttons */}
                <div className="infopage-controls">
                  <button
                    className="infopage-add-bullet-btn"
                    onClick={() => handleDraftAddItem(sectionIdx, "bullet")}
                  >
                    ✚ Add Bullet
                  </button>
                  <button
                    className="infopage-add-line-btn"
                    onClick={() => handleDraftAddItem(sectionIdx, "line")}
                  >
                    ✚ Add Line
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          privacyContent.map((section, sectionIdx) => (
            <div key={sectionIdx} className="privacy-section">
              <h3>{section.title}</h3>
              <p className="infopage-p">{section.body}</p>
              {section.items?.map((item, itemIdx) =>
                item.type === "bullet" ? (
                  <li key={itemIdx} className="bullet-item">
                    {item.text}
                  </li>
                ) : (
                  <p key={itemIdx} className="extra-lines-item">
                    {item.text}
                  </p>
                ),
              )}
            </div>
          ))
        )}

        {isEditingPrivacy && (
          <button
            className="infopage-add-rule-btn"
            onClick={handleDraftAddRule}
          >
            ✚ Add Rule
          </button>
        )}
      </section>

      {/* Terms & Conditions */}
      <section id="terms">
        <h2 className="section-title">
          Terms & Conditions{" "}
          {user?.role === "admin" && (
            <>
              {!isEditingTerms ? (
                <button
                  className="infopage-edit-btn"
                  onClick={() => {
                    setDraftTermsContent(
                      JSON.parse(JSON.stringify(termsContent)),
                    );
                    setDraftTermsUndoStack([
                      JSON.parse(JSON.stringify(termsContent)),
                    ]);
                    setDraftTermsRedoStack([]);
                    setIsEditingTerms(true);
                  }}
                >
                  <img
                    src="/assets/edit.svg"
                    alt="Edit"
                    width={24}
                    height={24}
                  />
                </button>
              ) : (
                <div className="infopage-edit-controls">
                  <button
                    className="infopage-undo-btn"
                    onClick={handleTermsUndo}
                    disabled={
                      (isEditingTerms ? draftTermsUndoStack : termsUndoStack)
                        .length === 0
                    }
                  >
                    <img
                      src="/assets/undo.svg"
                      alt="Undo"
                      width={24}
                      height={24}
                    />
                  </button>

                  <button
                    className="infopage-save-btn"
                    onClick={() => {
                      const cleanedDraft = normalizeContent(draftTermsContent);
                      const cleanedTerms = normalizeContent(termsContent);

                      const hasChanges =
                        JSON.stringify(cleanedTerms) !==
                        JSON.stringify(cleanedDraft);

                      if (hasChanges) {
                        setShowTermsSaveConfirm(true);
                      } else {
                        setDraftTermsContent(null);
                        setIsEditingTerms(false);
                        setDraftTermsUndoStack([]);
                        setDraftTermsRedoStack([]);
                      }
                    }}
                  >
                    Save
                  </button>

                  <button
                    className="infopage-history-btn"
                    onClick={() => setShowTermsHistoryOverlay(true)}
                  >
                    History
                  </button>

                  <button
                    className="infopage-cancel-btn"
                    onClick={() => {
                      const hasChanges =
                        JSON.stringify(termsContent) !==
                        JSON.stringify(draftTermsContent);

                      if (hasChanges) {
                        setShowTermsCancelConfirm(true);
                      } else {
                        setDraftTermsContent(null);
                        setIsEditingTerms(false);
                        setDraftTermsUndoStack([]);
                        setDraftTermsRedoStack([]);
                      }
                    }}
                  >
                    Cancel
                  </button>

                  <button
                    className="infopage-redo-btn"
                    onClick={handleTermsRedo}
                    disabled={
                      (isEditingTerms ? draftTermsRedoStack : termsRedoStack)
                        .length === 0
                    }
                  >
                    <img
                      src="/assets/redo.svg"
                      alt="Redo"
                      width={24}
                      height={24}
                    />
                  </button>
                </div>
              )}
            </>
          )}
        </h2>

        <p>
          <strong>Last Updated:</strong>{" "}
          {termsLastUpdated
            ? termsLastUpdated.toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })
            : LAUNCH_DATE.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })}
        </p>

        {isEditingTerms ? (
          <div className="privacy-scroll-container">
            {draftTermsContent.map((section, sectionIdx) => (
              <div key={sectionIdx} className="privacy-section">
                <div className="privacy-section-header">
                  <input
                    className="infopage-header-input"
                    type="text"
                    placeholder="Enter section title..."
                    value={section.title}
                    onChange={(e) =>
                      handleDraftTermsTitleChange(sectionIdx, e.target.value)
                    }
                  />
                  <button
                    className="infopage-delete-btn"
                    onClick={() => handleDraftTermsDeleteSection(sectionIdx)}
                  >
                    <img
                      src="/assets/delete.svg"
                      alt="Delete"
                      width={16}
                      height={16}
                    />
                  </button>
                </div>

                <textarea
                  className="infopage-textarea auto-resize"
                  placeholder="Enter introductory text..."
                  value={section.body}
                  onChange={(e) => {
                    handleDraftTermsBodyChange(sectionIdx, e.target.value);
                    e.target.style.height = "auto";
                    e.target.style.height = e.target.scrollHeight + "px";
                  }}
                />

                {section.items?.map((item, itemIdx) =>
                  item.type === "bullet" ? (
                    <li key={itemIdx} className="bullet-item">
                      <textarea
                        className="infopage-bullet-input auto-resize"
                        placeholder="Enter bullet point..."
                        value={item.text}
                        onChange={(e) =>
                          handleDraftTermsItemChange(
                            sectionIdx,
                            itemIdx,
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="infopage-delete-btn"
                        onClick={() =>
                          handleDraftTermsDeleteItem(sectionIdx, itemIdx)
                        }
                      >
                        <img
                          src="/assets/delete.svg"
                          alt="Delete"
                          width={16}
                          height={16}
                        />
                      </button>
                    </li>
                  ) : (
                    <p key={itemIdx} className="extra-lines-item">
                      <textarea
                        className="infopage-line-input auto-resize"
                        placeholder="Enter extra line..."
                        value={item.text}
                        onChange={(e) =>
                          handleDraftTermsItemChange(
                            sectionIdx,
                            itemIdx,
                            e.target.value,
                          )
                        }
                      />
                      <button
                        className="infopage-delete-btn"
                        onClick={() =>
                          handleDraftTermsDeleteItem(sectionIdx, itemIdx)
                        }
                      >
                        <img
                          src="/assets/delete.svg"
                          alt="Delete"
                          width={16}
                          height={16}
                        />
                      </button>
                    </p>
                  ),
                )}

                <div className="infopage-controls">
                  <button
                    className="infopage-add-bullet-btn"
                    onClick={() =>
                      handleDraftTermsAddItem(sectionIdx, "bullet")
                    }
                  >
                    ✚ Add Bullet
                  </button>
                  <button
                    className="infopage-add-line-btn"
                    onClick={() => handleDraftTermsAddItem(sectionIdx, "line")}
                  >
                    ✚ Add Line
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          termsContent.map((section, sectionIdx) => (
            <div key={sectionIdx} className="privacy-section">
              <h3>{section.title}</h3>
              <p className="infopage-p">{section.body}</p>
              {section.items?.map((item, itemIdx) =>
                item.type === "bullet" ? (
                  <li key={itemIdx} className="bullet-item">
                    {item.text}
                  </li>
                ) : (
                  <p key={itemIdx} className="extra-lines-item">
                    {item.text}
                  </p>
                ),
              )}
            </div>
          ))
        )}

        {isEditingTerms && (
          <button
            className="infopage-add-rule-btn"
            onClick={handleDraftTermsAddRule}
          >
            ✚ Add Rule
          </button>
        )}
      </section>

      <Footer />

      {showHistoryOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowHistoryOverlay(false)}
            >
              <img
                src="/assets/close_0.png"
                alt="Close"
                className="close-icon close-icon-0"
              />
              <img
                src="/assets/close_1.png"
                alt="Close"
                className="close-icon close-icon-1"
              />
            </button>

            <div className="history-header-actions">
              <button
                className="clear-history-btn"
                onClick={() => setShowClearHistoryConfirm(true)}
              >
                Clear All
              </button>
            </div>

            <h3 className="confirm-header">Edit History</h3>
            <p className="confirm-text">
              Review all previous changes below. Latest edits are shown first.
            </p>

            <div className="admin-confirm-details history-scroll">
              {undoStack.length === 0 ? (
                <p className="no-history">No changes recorded yet.</p>
              ) : (
                [...undoStack].reverse().map((snapshot, idx) => {
                  const versionNumber = undoStack.length - idx;
                  return (
                    <button
                      key={idx}
                      className="history-card"
                      onClick={() => {
                        const actualIdx = undoStack.length - 1 - idx;
                        const newUndo = undoStack.slice(0, actualIdx + 1);

                        setPrivacyContent(snapshot.content);

                        setUndoStack(newUndo);
                        setRedoStack([]);
                        setShowHistoryOverlay(false);
                      }}
                    >
                      <div className="history-card-header">
                        <button
                          className="delete-history-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteVersionIdx(idx);
                            setShowDeleteVersionConfirm(true);
                          }}
                        >
                          <img
                            src="/assets/delete.svg"
                            alt="Delete"
                            width={18}
                            height={18}
                          />
                        </button>
                        <h4>
                          {new Date(snapshot.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              year: "2-digit",
                            },
                          )}{" "}
                          |{" "}
                          {new Date(snapshot.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </h4>
                      </div>

                      {snapshot.content.map((section, sIdx) => (
                        <div key={sIdx} className="history-section">
                          <strong>{section.title}</strong>
                          {section.body && <p>{section.body}</p>}
                          {section.items?.length > 0 && (
                            <div className="history-items">
                              {section.items.map((item, iIdx) =>
                                item.type === "bullet" ? (
                                  <li key={iIdx} className="history-bullet">
                                    {item.text}
                                  </li>
                                ) : (
                                  <p key={iIdx} className="history-line">
                                    {item.text}
                                  </p>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showTermsHistoryOverlay && (
        <div className="admin-booking-confirm-overlay">
          <div className="admin-booking-confirm-container">
            <button
              className="close-btn"
              type="button"
              onClick={() => setShowTermsHistoryOverlay(false)}
            >
              <img
                src="/assets/close_0.png"
                alt="Close"
                className="close-icon close-icon-0"
              />
              <img
                src="/assets/close_1.png"
                alt="Close"
                className="close-icon close-icon-1"
              />
            </button>

            <div className="history-header-actions">
              <button
                className="clear-history-btn"
                onClick={() => setShowTermsClearHistoryConfirm(true)}
              >
                Clear All
              </button>
            </div>

            <h3 className="confirm-header">Terms Edit History</h3>
            <p className="confirm-text">
              Review all previous changes below. Latest edits are shown first.
            </p>

            <div className="admin-confirm-details history-scroll">
              {termsUndoStack.length === 0 ? (
                <p className="no-history">No changes recorded yet.</p>
              ) : (
                [...termsUndoStack].reverse().map((snapshot, idx) => {
                  const versionNumber = termsUndoStack.length - idx;
                  return (
                    <button
                      key={idx}
                      className="history-card"
                      onClick={() => {
                        const actualIdx = termsUndoStack.length - 1 - idx;
                        const newUndo = termsUndoStack.slice(0, actualIdx + 1);

                        setTermsContent(snapshot.content);

                        setTermsUndoStack(newUndo);
                        setTermsRedoStack([]);
                        setShowTermsHistoryOverlay(false);
                      }}
                    >
                      <div className="history-card-header">
                        <button
                          className="delete-history-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTermsVersionIdx(idx);
                            setShowTermsDeleteVersionConfirm(true);
                          }}
                        >
                          <img
                            src="/assets/delete.svg"
                            alt="Delete"
                            width={18}
                            height={18}
                          />
                        </button>
                        <h4>
                          {new Date(snapshot.timestamp).toLocaleDateString(
                            "en-US",
                            {
                              month: "2-digit",
                              day: "2-digit",
                              year: "2-digit",
                            },
                          )}{" "}
                          |{" "}
                          {new Date(snapshot.timestamp).toLocaleTimeString(
                            "en-US",
                            {
                              hour: "numeric",
                              minute: "2-digit",
                              hour12: true,
                            },
                          )}
                        </h4>
                      </div>

                      {snapshot.content.map((section, sIdx) => (
                        <div key={sIdx} className="history-section">
                          <strong>{section.title}</strong>
                          {section.body && <p>{section.body}</p>}
                          {section.items?.length > 0 && (
                            <div className="history-items">
                              {section.items.map((item, iIdx) =>
                                item.type === "bullet" ? (
                                  <li key={iIdx} className="history-bullet">
                                    {item.text}
                                  </li>
                                ) : (
                                  <p key={iIdx} className="history-line">
                                    {item.text}
                                  </p>
                                ),
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {showClearHistoryConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to clear all history?</h3>
            <p>
              This action cannot be undone. All history versions will be
              permanently removed.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setUndoStack([]);
                  setRedoStack([]);
                  setShowClearHistoryConfirm(false);
                }}
              >
                Yes, Clear All
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowClearHistoryConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsClearHistoryConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to clear all terms history?</h3>
            <p>
              This action cannot be undone. All history versions will be
              permanently removed.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setTermsUndoStack([]);
                  setTermsRedoStack([]);
                  setShowTermsClearHistoryConfirm(false);
                }}
              >
                Yes, Clear All
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowTermsClearHistoryConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteVersionConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to delete this version?</h3>
            <p>
              This action cannot be undone. That version will be permanently
              removed.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setUndoStack((stack) => {
                    const newStack = [...stack];
                    const actualIdx = stack.length - 1 - deleteVersionIdx;
                    newStack.splice(actualIdx, 1);
                    return newStack;
                  });

                  setShowDeleteVersionConfirm(false);
                  setDeleteVersionIdx(null);
                }}
              >
                Yes, Delete
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowDeleteVersionConfirm(false);
                  setDeleteVersionIdx(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsDeleteVersionConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to delete this terms version?</h3>
            <p>
              This action cannot be undone. That version will be permanently
              removed.
            </p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setTermsUndoStack((stack) => {
                    const newStack = [...stack];
                    const actualIdx = stack.length - 1 - deleteTermsVersionIdx;
                    newStack.splice(actualIdx, 1);
                    return newStack;
                  });

                  setShowTermsDeleteVersionConfirm(false);
                  setDeleteTermsVersionIdx(null);
                }}
              >
                Yes, Delete
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => {
                  setShowTermsDeleteVersionConfirm(false);
                  setDeleteTermsVersionIdx(null);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showSaveConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to save changes?</h3>
            <p>This will overwrite the current Privacy Policy content.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  const cleanedDraft = normalizeContent(draftContent);
                  const result = await savePrivacyPolicy(cleanedDraft);
                  if (result.success) {
                    pushToHistory(JSON.parse(JSON.stringify(privacyContent)));
                    setPrivacyContent(cleanedDraft);
                    setDraftContent(null);
                    setIsEditingPrivacy(false);
                    setDraftUndoStack([]);
                    setDraftRedoStack([]);
                    setShowSaveConfirm(false);
                  } else {
                    alert("Failed to save Privacy Policy. Please try again.");
                  }
                }}
              >
                Yes, Save Changes
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowSaveConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsSaveConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Are you sure you want to save terms changes?</h3>
            <p>This will overwrite the current Terms & Conditions content.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={async () => {
                  const cleanedDraft = normalizeContent(draftTermsContent);
                  const result = await saveTermsConditions(cleanedDraft);
                  if (result.success) {
                    pushToTermsHistory(
                      JSON.parse(JSON.stringify(termsContent)),
                    );
                    setTermsContent(cleanedDraft);
                    setDraftTermsContent(null);
                    setIsEditingTerms(false);
                    setDraftTermsUndoStack([]);
                    setDraftTermsRedoStack([]);
                    setShowTermsSaveConfirm(false);
                  } else {
                    alert(
                      "Failed to save Terms & Conditions. Please try again.",
                    );
                  }
                }}
              >
                Yes, Save Changes
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowTermsSaveConfirm(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showCancelConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Discard your edits?</h3>
            <p>Any unsaved changes will be lost.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setDraftContent(null);
                  setIsEditingPrivacy(false);
                  setDraftUndoStack([]);
                  setDraftRedoStack([]);
                  setShowCancelConfirm(false);
                }}
              >
                Yes, Discard
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowCancelConfirm(false)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}

      {showTermsCancelConfirm && (
        <div className="overlay-delete">
          <div className="confirm-modal">
            <h3>Discard your terms edits?</h3>
            <p>Any unsaved changes will be lost.</p>
            <div className="confirm-buttons">
              <button
                className="confirm-btn delete"
                onClick={() => {
                  setDraftTermsContent(null);
                  setIsEditingTerms(false);
                  setDraftTermsUndoStack([]);
                  setDraftTermsRedoStack([]);
                  setShowTermsCancelConfirm(false);
                }}
              >
                Yes, Discard
              </button>

              <button
                className="confirm-btn cancel"
                onClick={() => setShowTermsCancelConfirm(false)}
              >
                Keep Editing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoPage;
