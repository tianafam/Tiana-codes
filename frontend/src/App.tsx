import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Navigate from "@/pages/Navigate";
import Clinics from "@/pages/Clinics";
import Prep from "@/pages/Prep";
import Clinician from "@/pages/Clinician";
import ClinicianWelcome from "@/pages/ClinicianWelcome";
import ClinicianDashboard from "@/pages/ClinicianDashboard";
import Actions from "@/pages/Actions";
import Journey from "@/pages/Journey";
import BriefPrint from "@/pages/BriefPrint";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/navigate" element={<Navigate />} />
      <Route path="/clinics" element={<Clinics />} />
      <Route path="/prep" element={<Prep />} />
      <Route path="/clinician" element={<ClinicianWelcome />} />
      <Route path="/clinician/dashboard" element={<ClinicianDashboard />} />
      <Route path="/clinician/consult/:persona" element={<Clinician />} />
      <Route path="/actions" element={<Actions />} />
      <Route path="/journey" element={<Journey />} />
      <Route path="/brief/print" element={<BriefPrint />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
