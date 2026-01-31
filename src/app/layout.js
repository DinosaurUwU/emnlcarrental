import { UserProvider } from "./lib/UserContext";
import BookingProvider from "./component/BookingProvider";
import "./globals.css";
import "./LandingPage.css";
import "./component/Header.css";
import "./admin/HeaderAdmin.css";
import "./admin/RentalActivitySection.css";
import "./admin/AnalyticsSection.css";
import "./users/Profile.css";
import "./Carousel.css";
import "./OurFleet.css";
import "./HowItWorks.css";
import "./SpecialOffers.css";
import "./WhyChooseUs.css";
import "./CustomerTestimonials.css";
import "./CompanyMap.css";
import "./component/Footer.css";
import "./fleet-details/FleetDetails.css";

export const metadata = {
  title: "EMNL Car Rental",
  description: "Car rental services",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <UserProvider>
          <BookingProvider>{children}</BookingProvider>
        </UserProvider>
      </body>
    </html>
  );
}
