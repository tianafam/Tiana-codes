import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Navigate from "@/pages/Navigate";
import Clinics from "@/pages/Clinics";
import Prep from "@/pages/Prep";
import Clinician from "@/pages/Clinician";
import Actions from "@/pages/Actions";
import Journey from "@/pages/Journey";

// One <Route> per page in src/pages; BrowserRouter already wraps this in main.tsx.
export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/navigate" element={<Navigate />} />
      <Route path="/clinics" element={<Clinics />} />
      <Route path="/prep" element={<Prep />} />
      <Route path="/clinician" element={<Clinician />} />
      <Route path="/actions" element={<Actions />} />
      <Route path="/journey" element={<Journey />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
