import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import { supabase } from "./supabaseClient"; // <-- import Supabase client
import SummaryTable from "./components/SummaryTable";
import Bank from "./pages/Bank";
import CategorySummary from "./pages/CategorySummary";
import Navbar from "./components/Navbar";

export default function App() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      const { data, error } = await supabase
        .from("reviews") // your table name
        .select("*"); // select all fields

      if (error) {
        console.error("Error fetching reviews:", error.message);
      } else {
        setData(data);
      }

      setLoading(false);
    };

    fetchReviews();
  }, []);

  return (
    <Router>
      <div className="bg-white min-h-screen text-gray-800">
        <Navbar />
        <div className="p-6">
          {loading ? (
            <div>Loading reviews...</div>
          ) : (
            <Routes>
              <Route path="/" element={<SummaryTable data={data} />} />
              <Route path="/bank" element={<Bank data={data} />} />
              <Route
                path="/category-summary"
                element={<CategorySummary data={data} />}
              />
            </Routes>
          )}
        </div>
      </div>
    </Router>
  );
}