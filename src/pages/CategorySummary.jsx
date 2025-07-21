import React, { useEffect, useState, useMemo } from "react";
import { supabase } from "../supabaseClient";

const normalize = (str) => str?.trim().toLowerCase();

const CategorySummary = () => {
  const [data, setData] = useState([]);
  const [selectedBank, setSelectedBank] = useState("all");

  // Fetch data from Supabase
  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("summaries")
        .select("*");

      if (error) {
        console.error("Error fetching summaries:", error.message);
      } else {
        setData(data);
      }
    };

    fetchData();
  }, []);

  // Extract unique bank/app names from the "app" column
  const banks = useMemo(() => {
    const unique = new Set(
      data.map((d) => d.app?.trim()).filter(Boolean)
    );
    return Array.from(unique).sort();
  }, [data]);

  // Filter data based on selected bank
  const filteredData = useMemo(() => {
    if (selectedBank === "all") return data;
    return data.filter(
      (d) => normalize(d.app) === normalize(selectedBank)
    );
  }, [data, selectedBank]);

  return (
    <div className="p-6 bg-white text-gray-800 min-h-screen">
      {/* Bank Selector */}
      <div className="mb-6">
        <label className="text-gray-800 mr-4">Select Bank:</label>
        <select
          value={selectedBank}
          onChange={(e) => setSelectedBank(e.target.value)}
          className="bg-white text-gray-800 p-2 rounded border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
        >
          <option value="all">All</option>
          {banks.map((bank) => (
            <option key={bank} value={bank}>
              {bank}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      {filteredData.length === 0 ? (
        <p className="text-gray-800">No data found for selected bank.</p>
      ) : (
        <div className="overflow-x-auto bg-white rounded-xl p-4 border border-gray-200">
          <table className="table-auto w-full text-sm text-left text-gray-700">
            <thead>
              <tr>
                {Object.keys(filteredData[0]).map((header) => (
                  <th
                    key={header}
                    className="p-2 border-b border-gray-200 bg-gray-50 capitalize"
                  >
                    {header.replace(/_/g, " ")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredData.map((row, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  {Object.values(row).map((val, i) => (
                    <td key={i} className="p-2">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CategorySummary;