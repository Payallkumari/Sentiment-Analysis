import React, { useState, useMemo } from "react";
import { groupCategory } from "../utils/sentimentUtils";
import SummaryTable from "../components/SummaryTable";

const Bank = ({ data }) => {
  const [selectedApp, setSelectedApp] = useState("Sunwai");

  const apps = useMemo(() => {
    const unique = new Set(data.map((d) => d.app));
    return Array.from(unique);
  }, [data]);

  const filteredData = useMemo(() => {
    return data.filter((d) => d.app === selectedApp);
  }, [data, selectedApp]);

  const totalReviews = filteredData.length;

  const avgScore = useMemo(() => {
    const validScores = filteredData
      .map((d) => parseFloat(d.score))
      .filter((s) => !isNaN(s));
    const total = validScores.reduce((acc, val) => acc + val, 0);
    return validScores.length ? (total / validScores.length).toFixed(2) : "N/A";
  }, [filteredData]);

  const reviewPeriod = useMemo(() => {
    const parseCustomDate = (str) => {
      if (!str) return null;
      const match = str.match(/(\d{2})\/(\d{2})\/(\d{4})/);
      if (!match) return null;
      const [, day, month, year] = match.map(Number);
      return new Date(year, month - 1, day);
    };

    const validDates = filteredData
      .map((d) => parseCustomDate(d.timestamp))
      .filter((d) => d instanceof Date && !isNaN(d))
      .sort((a, b) => a - b);

    if (validDates.length === 0) return "N/A";

    const format = (date) =>
      date.toLocaleString("default", { month: "short", year: "numeric" });

    const start = format(validDates[0]);
    const end = format(validDates[validDates.length - 1]);

    return start === end ? start : `${start} - ${end}`;
  }, [filteredData]);

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
    <div className="px-6 py-8 min-h-screen text-gray-800">
      {/* Cards Row */}
      <div className="flex flex-wrap items-start gap-4 mb-10">
        {/* App Selector Card */}
        <div className="bg-green-700 px-4 py-3 rounded-lg shadow-sm border border-green-800 flex flex-col items-center justify-center text-center min-w-[150px] max-w-[180px] h-20">
          <div className="text-xs text-green-100 font-medium mb-1">Select App</div>
          <select
            value={selectedApp}
            onChange={(e) => setSelectedApp(e.target.value)}
            className="bg-transparent text-white text-sm font-semibold focus:outline-none"
          >
            {apps.map((app) => (
              <option key={app} value={app} className="text-black">
                {app}
              </option>
            ))}
          </select>
        </div>

        {/* Summary Cards */}
        <SummaryCard title="Total Reviews" value={totalReviews} />
        <SummaryCard title="Avg. Score" value={avgScore} />
        {/* <SummaryCard title="Review Period" value={reviewPeriod} /> */}
        <SummaryCard title="Top Complaint Category" value={topComplaintCategory} />
      </div>

      {/* Summary Table */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          Sentiment by Complaint Category -{" "}
          <span className="text-green-600">{selectedApp}</span>
        </h2>
        <SummaryTable data={filteredData} defaultFilter="sentimentCategory" />
      </div>
    </div>
  );
};

// SummaryCard component
const SummaryCard = ({ title, value }) => (
  <div className="bg-green-700 px-4 py-3 rounded-lg shadow-sm border border-green-800 flex flex-col items-center justify-center text-center min-w-[150px] max-w-[180px] h-20 transition-all duration-300 hover:shadow-lg">
    <div className="text-xs text-green-100 font-medium line-clamp-1">{title}</div>
    <div className="mt-1 text-lg font-semibold text-white line-clamp-1">{value}</div>
  </div>
);

export default Bank;
