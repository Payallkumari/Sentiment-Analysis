import React, { useState, useMemo } from "react";
import SummaryTable, { groupCategory } from "../components/SummaryTable";

const Bank = ({ data }) => {
  const [selectedApp, setSelectedApp] = useState("Sunwai");

  const apps = useMemo(() => {
    const unique = new Set(data.map((d) => d.app));
    return Array.from(unique);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((d) => d.app === selectedApp);
  }, [data, selectedApp]);

  // Total Reviews
  const totalReviews = filteredData.length;

  // Average Score
  const avgScore = useMemo(() => {
    const validScores = filteredData.map((d) => parseFloat(d.score)).filter((s) => !isNaN(s));
    const total = validScores.reduce((acc, val) => acc + val, 0);
    return validScores.length ? (total / validScores.length).toFixed(2) : "N/A";
  }, [filteredData]);

  // Review Period
  const reviewPeriod = useMemo(() => {
    const dates = filteredData.map((d) => new Date(d.timestamp)).filter((d) => !isNaN(d));
    if (dates.length === 0) return "N/A";
    const min = new Date(Math.min(...dates));
    const max = new Date(Math.max(...dates));
    const format = (date) => date.toLocaleString("default", { month: "short", year: "numeric" });
    return `${format(min)} - ${format(max)}`;
  }, [filteredData]);

  // Top Complaint Category (cleaned and grouped)
  const topComplaintCategory = useMemo(() => {
    const categoryCount = {};

    filteredData.forEach((d) => {
      let raw = d.mapped_categories?.trim();
      try {
        const parsed = JSON.parse(raw.replace(/'/g, '"'));
        if (Array.isArray(parsed)) raw = parsed[0];
      } catch {}

      const label = groupCategory(raw);
      if (label) {
        categoryCount[label] = (categoryCount[label] || 0) + 1;
      }
    });

    const top = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0];
    return top ? top[0] : "N/A";
  }, [filteredData]);

  return (
    <div className="p-6 bg-white text-gray-800 min-h-screen">
      {/* App Selector */}
      <div className="mb-6">
        <label className="text-gray-800 mr-4">Select App:</label>
        <select
          value={selectedApp}
          onChange={(e) => setSelectedApp(e.target.value)}
          className="bg-white text-gray-800 p-2 rounded border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
        >
          {apps.map((app) => (
            <option key={app} value={app}>{app}</option>
          ))}
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center mb-8">
        <div className="bg-white p-4 rounded-xl text-center border border-gray-200">
          <div className="text-sm text-gray-500">Total Reviews</div>
          <div className="text-2xl font-bold text-gray-800">{totalReviews}</div>
        </div>

        <div className="bg-white p-4 rounded-xl text-center border border-gray-200">
          <div className="text-sm text-gray-500">Avg. Score</div>
          <div className="text-2xl font-bold text-gray-800">{avgScore}</div>
        </div>

        <div className="bg-white p-4 rounded-xl text-center border border-gray-200">
          <div className="text-sm text-gray-500">Review Period</div>
          <div className="text-lg font-medium text-gray-800">{reviewPeriod}</div>
        </div>

        <div className="bg-white p-4 rounded-xl text-center border border-gray-200">
          <div className="text-sm text-gray-500">Top Complaint Category</div>
          <div className="text-lg font-medium text-gray-800">{topComplaintCategory}</div>
        </div>
      </div>

      {/* Sentiment by Complaint Category */}
      <div className="bg-white p-4 rounded-xl border border-gray-200">
        <h2 className="text-xl font-semibold mb-2 text-gray-800">
          Sentiment by Complaint Category - {selectedApp}
        </h2>
        <SummaryTable data={filteredData} defaultFilter="sentimentCategory" />
      </div>
    </div>
  );
};

export default Bank;