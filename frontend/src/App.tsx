import SignIn from "@/pages/SignIn";
import { Routes, Route, Navigate as Redirect } from "react-router-dom";
import Home from "@/pages/Home";
import Navigate from "@/pages/Navigate";
import Clinics from "@/pages/Clinics";
import Prep from "@/pages/Prep";
import Clinician from "@/pages/Clinician";
import ClinicianWelcome from "@/pages/ClinicianWelcome";
import ClinicianDashboard from "@/pages/ClinicianDashboard";
import FollowThrough from "@/pages/FollowThrough";
import Journey from "@/pages/Journey";
import BriefPrint from "@/pages/BriefPrint";

// Two separate areas: /patient/* and /clinician/*. BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Redirect to="/patient" replace />} />
      <Route path="/patient" element={<Home />} />
      <Route path="/patient/sign-in" element={<SignIn />} />
      <Route path="/patient/navigate" element={<Navigate />} />
      <Route path="/patient/clinics" element={<Clinics />} />
      <Route path="/patient/prep" element={<Prep />} />
      <Route path="/patient/follow-through" element={<FollowThrough />} />
      <Route path="/patient/journey" element={<Journey />} />
      <Route path="/patient/brief/print" element={<BriefPrint />} />
      <Route path="/clinician" element={<ClinicianWelcome />} />
      <Route path="/clinician/dashboard" element={<ClinicianDashboard />} />
      <Route path="/clinician/consult/:persona" element={<Clinician />} />
      <Route path="*" element={<Redirect to="/patient" replace />} />
    </Routes>
  );
}
