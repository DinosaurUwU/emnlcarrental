"use client";
import React, { useState, useEffect, useRef, useMemo } from "react";
import { useUser } from "../lib/UserContext";
import Header from "../component/Header";
import Footer from "../component/Footer";
import CompanyMap from "../CompanyMap";
import "./Contact.css";
import "react-phone-input-2/lib/style.css";
import { MdCheckCircle } from "react-icons/md";



const countries = [
  { code: "af", name: "Afghanistan", dialCode: "+93" },
  { code: "al", name: "Albania", dialCode: "+355" },
  { code: "dz", name: "Algeria", dialCode: "+213" },
  { code: "as", name: "American Samoa", dialCode: "+1" },
  { code: "ad", name: "Andorra", dialCode: "+376" },
  { code: "ao", name: "Angola", dialCode: "+244" },
  { code: "ai", name: "Anguilla", dialCode: "+1" },
  { code: "ag", name: "Antigua and Barbuda", dialCode: "+1" },
  { code: "ar", name: "Argentina", dialCode: "+54" },
  { code: "am", name: "Armenia", dialCode: "+374" },
  { code: "aw", name: "Aruba", dialCode: "+297" },
  { code: "au", name: "Australia", dialCode: "+61" },
  { code: "at", name: "Austria", dialCode: "+43" },
  { code: "az", name: "Azerbaijan", dialCode: "+994" },
  { code: "bh", name: "Bahrain", dialCode: "+973" },
  { code: "bd", name: "Bangladesh", dialCode: "+880" },
  { code: "by", name: "Belarus", dialCode: "+375" },
  { code: "be", name: "Belgium", dialCode: "+32" },
  { code: "bz", name: "Belize", dialCode: "+501" },
  { code: "bj", name: "Benin", dialCode: "+229" },
  { code: "bm", name: "Bermuda", dialCode: "+1" },
  { code: "bt", name: "Bhutan", dialCode: "+975" },
  { code: "bo", name: "Bolivia", dialCode: "+591" },
  { code: "ba", name: "Bosnia and Herzegovina", dialCode: "+387" },
  { code: "bw", name: "Botswana", dialCode: "+267" },
  { code: "br", name: "Brazil", dialCode: "+55" },
  { code: "bn", name: "Brunei", dialCode: "+673" },
  { code: "bg", name: "Bulgaria", dialCode: "+359" },
  { code: "bf", name: "Burkina Faso", dialCode: "+226" },
  { code: "bi", name: "Burundi", dialCode: "+257" },
  { code: "kh", name: "Cambodia", dialCode: "+855" },
  { code: "cm", name: "Cameroon", dialCode: "+237" },
  { code: "ca", name: "Canada", dialCode: "+1" },
  { code: "cv", name: "Cape Verde", dialCode: "+238" },
  { code: "cf", name: "Central African Republic", dialCode: "+236" },
  { code: "td", name: "Chad", dialCode: "+235" },
  { code: "cl", name: "Chile", dialCode: "+56" },
  { code: "cn", name: "China", dialCode: "+86" },
  { code: "co", name: "Colombia", dialCode: "+57" },
  { code: "km", name: "Comoros", dialCode: "+269" },
  { code: "cg", name: "Congo", dialCode: "+242" },
  { code: "cd", name: "Congo (DRC)", dialCode: "+243" },
  { code: "cr", name: "Costa Rica", dialCode: "+506" },
  { code: "hr", name: "Croatia", dialCode: "+385" },
  { code: "cu", name: "Cuba", dialCode: "+53" },
  { code: "cy", name: "Cyprus", dialCode: "+357" },
  { code: "cz", name: "Czech Republic", dialCode: "+420" },
  { code: "dk", name: "Denmark", dialCode: "+45" },
  { code: "dj", name: "Djibouti", dialCode: "+253" },
  { code: "dm", name: "Dominica", dialCode: "+1" },
  { code: "do", name: "Dominican Republic", dialCode: "+1" },
  { code: "ec", name: "Ecuador", dialCode: "+593" },
  { code: "eg", name: "Egypt", dialCode: "+20" },
  { code: "sv", name: "El Salvador", dialCode: "+503" },
  { code: "gq", name: "Equatorial Guinea", dialCode: "+240" },
  { code: "er", name: "Eritrea", dialCode: "+291" },
  { code: "ee", name: "Estonia", dialCode: "+372" },
  { code: "et", name: "Ethiopia", dialCode: "+251" },
  { code: "fj", name: "Fiji", dialCode: "+679" },
  { code: "fi", name: "Finland", dialCode: "+358" },
  { code: "fr", name: "France", dialCode: "+33" },
  { code: "ga", name: "Gabon", dialCode: "+241" },
  { code: "gm", name: "Gambia", dialCode: "+220" },
  { code: "ge", name: "Georgia", dialCode: "+995" },
  { code: "de", name: "Germany", dialCode: "+49" },
  { code: "gh", name: "Ghana", dialCode: "+233" },
  { code: "gr", name: "Greece", dialCode: "+30" },
  { code: "gd", name: "Grenada", dialCode: "+1" },
  { code: "gu", name: "Guam", dialCode: "+1" },
  { code: "gt", name: "Guatemala", dialCode: "+502" },
  { code: "gn", name: "Guinea", dialCode: "+224" },
  { code: "gw", name: "Guinea-Bissau", dialCode: "+245" },
  { code: "gy", name: "Guyana", dialCode: "+592" },
  { code: "ht", name: "Haiti", dialCode: "+509" },
  { code: "hn", name: "Honduras", dialCode: "+504" },
  { code: "hk", name: "Hong Kong", dialCode: "+852" },
  { code: "hu", name: "Hungary", dialCode: "+36" },
  { code: "is", name: "Iceland", dialCode: "+354" },
  { code: "in", name: "India", dialCode: "+91" },
  { code: "id", name: "Indonesia", dialCode: "+62" },
  { code: "ir", name: "Iran", dialCode: "+98" },
  { code: "iq", name: "Iraq", dialCode: "+964" },
  { code: "ie", name: "Ireland", dialCode: "+353" },
  { code: "il", name: "Israel", dialCode: "+972" },
  { code: "it", name: "Italy", dialCode: "+39" },
  { code: "jm", name: "Jamaica", dialCode: "+1" },
  { code: "jp", name: "Japan", dialCode: "+81" },
  { code: "jo", name: "Jordan", dialCode: "+962" },
  { code: "kz", name: "Kazakhstan", dialCode: "+7" },
  { code: "ke", name: "Kenya", dialCode: "+254" },
  { code: "ki", name: "Kiribati", dialCode: "+686" },
  { code: "kp", name: "North Korea", dialCode: "+850" },
  { code: "kr", name: "South Korea", dialCode: "+82" },
  { code: "kw", name: "Kuwait", dialCode: "+965" },
  { code: "kg", name: "Kyrgyzstan", dialCode: "+996" },
  { code: "la", name: "Laos", dialCode: "+856" },
  { code: "lv", name: "Latvia", dialCode: "+371" },
  { code: "lb", name: "Lebanon", dialCode: "+961" },
  { code: "ls", name: "Lesotho", dialCode: "+266" },
  { code: "lr", name: "Liberia", dialCode: "+231" },
  { code: "ly", name: "Libya", dialCode: "+218" },
  { code: "li", name: "Liechtenstein", dialCode: "+423" },
  { code: "lt", name: "Lithuania", dialCode: "+370" },
  { code: "lu", name: "Luxembourg", dialCode: "+352" },
  { code: "mo", name: "Macau", dialCode: "+853" },
  { code: "mk", name: "North Macedonia", dialCode: "+389" },
  { code: "mg", name: "Madagascar", dialCode: "+261" },
  { code: "mw", name: "Malawi", dialCode: "+265" },
  { code: "my", name: "Malaysia", dialCode: "+60" },
  { code: "mv", name: "Maldives", dialCode: "+960" },
  { code: "ml", name: "Mali", dialCode: "+223" },
  { code: "mt", name: "Malta", dialCode: "+356" },
  { code: "mh", name: "Marshall Islands", dialCode: "+692" },
  { code: "mr", name: "Mauritania", dialCode: "+222" },
  { code: "mu", name: "Mauritius", dialCode: "+230" },
  { code: "mx", name: "Mexico", dialCode: "+52" },
  { code: "fm", name: "Micronesia", dialCode: "+691" },
  { code: "md", name: "Moldova", dialCode: "+373" },
  { code: "mc", name: "Monaco", dialCode: "+377" },
  { code: "mn", name: "Mongolia", dialCode: "+976" },
  { code: "me", name: "Montenegro", dialCode: "+382" },
  { code: "ma", name: "Morocco", dialCode: "+212" },
  { code: "mz", name: "Mozambique", dialCode: "+258" },
  { code: "mm", name: "Myanmar (Burma)", dialCode: "+95" },
  { code: "na", name: "Namibia", dialCode: "+264" },
  { code: "nr", name: "Nauru", dialCode: "+674" },
  { code: "np", name: "Nepal", dialCode: "+977" },
  { code: "nl", name: "Netherlands", dialCode: "+31" },
  { code: "nz", name: "New Zealand", dialCode: "+64" },
  { code: "ni", name: "Nicaragua", dialCode: "+505" },
  { code: "ne", name: "Niger", dialCode: "+227" },
  { code: "ng", name: "Nigeria", dialCode: "+234" },
  { code: "no", name: "Norway", dialCode: "+47" },
  { code: "om", name: "Oman", dialCode: "+968" },
  { code: "pk", name: "Pakistan", dialCode: "+92" },
  { code: "pw", name: "Palau", dialCode: "+680" },
  { code: "pa", name: "Panama", dialCode: "+507" },
  { code: "pg", name: "Papua New Guinea", dialCode: "+675" },
  { code: "py", name: "Paraguay", dialCode: "+595" },
  { code: "pe", name: "Peru", dialCode: "+51" },
  { code: "ph", name: "Philippines", dialCode: "+63" },
  { code: "pl", name: "Poland", dialCode: "+48" },
  { code: "pt", name: "Portugal", dialCode: "+351" },
  { code: "qa", name: "Qatar", dialCode: "+974" },
  { code: "ro", name: "Romania", dialCode: "+40" },
  { code: "ru", name: "Russia", dialCode: "+7" },
  { code: "rw", name: "Rwanda", dialCode: "+250" },
  { code: "sa", name: "Saudi Arabia", dialCode: "+966" },
  { code: "sb", name: "Solomon Islands", dialCode: "+677" },
  { code: "sc", name: "Seychelles", dialCode: "+248" },
  { code: "sd", name: "Sudan", dialCode: "+249" },
  { code: "se", name: "Sweden", dialCode: "+46" },
  { code: "sg", name: "Singapore", dialCode: "+65" },
  { code: "sh", name: "Saint Helena", dialCode: "+290" },
  { code: "si", name: "Slovenia", dialCode: "+386" },
  { code: "sk", name: "Slovakia", dialCode: "+421" },
  { code: "sl", name: "Sierra Leone", dialCode: "+232" },
  { code: "sm", name: "San Marino", dialCode: "+378" },
  { code: "sn", name: "Senegal", dialCode: "+221" },
  { code: "so", name: "Somalia", dialCode: "+252" },
  { code: "sr", name: "Suriname", dialCode: "+597" },
  { code: "ss", name: "South Sudan", dialCode: "+211" },
  { code: "st", name: "São Tomé and Príncipe", dialCode: "+239" },
  { code: "sv", name: "El Salvador", dialCode: "+503" },
  { code: "sy", name: "Syria", dialCode: "+963" },
  { code: "sz", name: "Eswatini", dialCode: "+268" },
  { code: "tc", name: "Turks and Caicos Islands", dialCode: "+1-649" },
  { code: "td", name: "Chad", dialCode: "+235" },
  { code: "tg", name: "Togo", dialCode: "+228" },
  { code: "th", name: "Thailand", dialCode: "+66" },
  { code: "tj", name: "Tajikistan", dialCode: "+992" },
  { code: "tk", name: "Tokelau", dialCode: "+690" },
  { code: "tl", name: "Timor-Leste", dialCode: "+670" },
  { code: "tm", name: "Turkmenistan", dialCode: "+993" },
  { code: "tn", name: "Tunisia", dialCode: "+216" },
  { code: "to", name: "Tonga", dialCode: "+676" },
  { code: "tr", name: "Turkey", dialCode: "+90" },
  { code: "tt", name: "Trinidad and Tobago", dialCode: "+1-868" },
  { code: "tv", name: "Tuvalu", dialCode: "+688" },
  { code: "tz", name: "Tanzania", dialCode: "+255" },
  { code: "ua", name: "Ukraine", dialCode: "+380" },
  { code: "ug", name: "Uganda", dialCode: "+256" },
  { code: "us", name: "United States", dialCode: "+1" },
  { code: "uy", name: "Uruguay", dialCode: "+598" },
  { code: "uz", name: "Uzbekistan", dialCode: "+998" },
  { code: "va", name: "Vatican City", dialCode: "+379" },
  { code: "vc", name: "Saint Vincent and the Grenadines", dialCode: "+1-784" },
  { code: "ve", name: "Venezuela", dialCode: "+58" },
  { code: "vg", name: "British Virgin Islands", dialCode: "+1-284" },
  { code: "vi", name: "U.S. Virgin Islands", dialCode: "+1-340" },
  { code: "vn", name: "Vietnam", dialCode: "+84" },
  { code: "vu", name: "Vanuatu", dialCode: "+678" },
  { code: "wf", name: "Wallis and Futuna", dialCode: "+681" },
  { code: "ws", name: "Samoa", dialCode: "+685" },
  { code: "ye", name: "Yemen", dialCode: "+967" },
  { code: "yt", name: "Mayotte", dialCode: "+262" },
  { code: "za", name: "South Africa", dialCode: "+27" },
  { code: "zm", name: "Zambia", dialCode: "+260" },
  { code: "zw", name: "Zimbabwe", dialCode: "+263" },
  //... and many more
];

// Set PH as default
const defaultCountry = countries.find((c) => c.code === "ph") || countries[0];

function Contact({ openBooking }) {
  const { user, setUser, sendMessage, fetchAdminUid, fetchImageFromFirestore, imageCache,
  imageUpdateTrigger } =
    useUser();

    const [showContactSuccess, setShowContactSuccess] = useState(false);
const [contactSuccessMessage, setContactSuccessMessage] = useState("");

  const fullName = user?.name || user?.displayName || "";
  const nameParts = fullName.trim().split(" ");

  const defaultFirstName = nameParts[0] || "";
  const defaultLastName =
    nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [countrySearch, setCountrySearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [middleName, setMiddleName] = useState(user?.middleName || "");
  const [lastName, setLastName] = useState(defaultLastName);
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [adminUid, setAdminUid] = useState(null);
  const [adminName, setAdminName] = useState(null);
  const [adminEmail, setAdminEmail] = useState(null);
  const [adminContact, setAdminContact] = useState(null);

  const imageRef = useRef(null);

  // const [contactImageSrc, setContactImageSrc] = useState(
  //   "/assets/images/contact.png",
  // );

const contactFallback = "/assets/images/contact.png";

const contactCachedSrc = useMemo(
  () => imageCache["ContactPage_0"]?.base64 || contactFallback,
  [imageCache],
);

const [contactImageSrc, setContactImageSrc] = useState(contactCachedSrc);

// instant from cache
useEffect(() => {
  setContactImageSrc(contactCachedSrc);
}, [contactCachedSrc]);

// background revalidate (fresh from Firestore)
useEffect(() => {
  let cancelled = false;

  const fetchContactImage = async () => {
    const result = await fetchImageFromFirestore("ContactPage_0", false);
    if (!cancelled && result?.base64) {
      setContactImageSrc(result.base64);
    }
  };

  fetchContactImage();
  return () => {
    cancelled = true;
  };
}, [fetchImageFromFirestore, imageUpdateTrigger]);


  // useEffect(() => {
  //   const fetchContactImage = async () => {
  //     const result = await fetchImageFromFirestore("ContactPage_0");
  //     if (result) {
  //       setContactImageSrc(result.base64);
  //     }
  //   };
  //   fetchContactImage();
  // }, [fetchImageFromFirestore]);

  useEffect(() => {
    const handleScroll = () => {
      if (imageRef.current) {
        const offset = window.scrollY * 0.5;
        imageRef.current.style.transform = `translateY(${offset}px)`;
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  //AUTOFILL
  useEffect(() => {
    if (user) {
      // Autofill first name
      setFirstName(user.firstName || user.originalName?.split(" ")[0] || "");
      setMiddleName(user.middleName || "");

      // Autofill last name
      setLastName(
        user.surname || user.originalName?.split(" ").slice(1).join(" ") || "",
      );
      setMiddleName(user.middleName || "");

      // Autofill email
      setEmail(user.email || user.originalEmail || "");

      // Autofill phone
      setPhone(user.phone || user.originalPhone || "");
    }
  }, [user]);

  //LOAD DATA
  useEffect(() => {
    const loadAdminData = async () => {
      const admin = await fetchAdminUid();
      if (admin) {
        setAdminUid(admin.uid);
        setAdminName(admin.name);
        setAdminEmail(admin.email);
        setAdminContact(admin.contact);
      }
    };

    loadAdminData();
  }, []);

  //SUBMIT
  const handleSubmit = (e) => {
    e.preventDefault();

    if (!adminUid) {
      console.error("Admin UID not available");
      return;
    }

    const contactInfo = {
      name: `${firstName} ${middleName} ${lastName}`
        .trim()
        .replace(/\s+/g, " "),
      email,
      phone: `${selectedCountry.dialCode}${phone.replace(/^0/, "")}`,
      message,
      senderUid: user?.uid,
      recipientUid: adminUid,
      isAdminSender: false,
      recipientName: adminName,
      recipientEmail: adminEmail,
      recipientPhone: adminContact,
    };

    sendMessage(contactInfo);
    setMessage("");
    setContactSuccessMessage("Message sent successfully!");
setShowContactSuccess(true);
  };



  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(countrySearch.toLowerCase()),
  );

  const closeContactSuccess = () => {
  setShowContactSuccess(false);
  setContactSuccessMessage("");
};

  return (
    <div className="contactPage-container">
      <Header openBooking={openBooking} />

      <div className="image-section">
        <div className="contact-hero">
          <h1 className="contact-hero-title">CONTACT US</h1>
          <p className="contact-hero-description">
            Send us a message or call for bookings or inquiries. Our EMNL team
            is ready to assist you with your Leyte trip.
          </p>
        </div>
        <img
          ref={imageRef}
          src={contactImageSrc}
          alt="Contact Us Background"
          className="contact-image"
          loading="eager"
          decoding="async"
          fetchPriority="high"
        />
      </div>

      <div className="content-section">
        <div className="form-section">
          <h2 className="title">Fill Up Form</h2>
          <form className="contact-form" onSubmit={handleSubmit}>
            <label htmlFor="surname">Surname:</label>
            <input
              type="text"
              id="surname"
              placeholder="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
            />

            <label htmlFor="first_name">First Name:</label>
            <input
              type="text"
              id="first_name"
              placeholder="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />

            <label htmlFor="middle_name">Middle Name:</label>
            <input
              type="text"
              id="middle_name"
              placeholder="Middle Name (N/A if none)"
              value={middleName}
              onChange={(e) => setMiddleName(e.target.value)}
            />

            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <label htmlFor="phone">Phone Number:</label>
            <div className="phone-number-container">
              <div className="flag-dropdown">
                <img
                  src={`https://flagcdn.com/w40/${selectedCountry.code}.png`}
                  alt={`${selectedCountry.name} Flag`}
                  className="flag-icon"
                />

                <div className="custom-country-select" ref={dropdownRef}>
                  <input
                    type="text"
                    placeholder="Search country"
                    value={countrySearch}
                    onFocus={() => setShowDropdown(true)}
                    onChange={(e) => setCountrySearch(e.target.value)}
                    className="country-search-input"
                  />

                  {showDropdown && (
                    <ul className="country-dropdown">
                      {filteredCountries.map((country) => (
                        <li
                          key={country.code}
                          onClick={() => {
                            setSelectedCountry(country);
                            setCountrySearch(
                              `${country.name} ${country.dialCode}`,
                            );
                            setShowDropdown(false);
                          }}
                        >
                          {country.name} ({country.dialCode})
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <input
                type="tel"
                placeholder="Your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            <label htmlFor="message">Message:</label>
            <textarea
              id="message"
              placeholder="Enter Message..."
              rows="4"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            ></textarea>

            <button type="submit">Send Message</button>
          </form>
        </div>
      </div>

            {/* ================= Contact Success Overlay ================= */}
      {showContactSuccess && (
        <div className="success-overlay" onClick={closeContactSuccess}>
          <div className="success-container" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
      <MdCheckCircle size={32} />
    </div>
            <h3>Success!</h3>
            <p>{contactSuccessMessage}</p>
            <button className="success-btn" onClick={closeContactSuccess}>
              OK
            </button>
          </div>
        </div>
      )}


      <CompanyMap />
      <Footer />

    </div>
  );
}

export default Contact;
