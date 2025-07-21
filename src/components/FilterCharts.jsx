import { useEffect, useState } from "react";
import {
  groupCategory,
  computeOverallSentiment,
  normalize,
  capitalize,
} from "./SummaryTable";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Papa from "papaparse";

const COLORS = [
  "#28a745",
  "#34c759",
  "#e6f4ea",
  "#6c757d",
];

export default function FilterCharts({ data, filterType }) {
  const [isDrilledDown, setIsDrilledDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [csvData, setCsvData] = useState([]);

  const chartMargin = { top: 20, right: 30, left: 20, bottom: 80 };

  useEffect(() => {
    Papa.parse("/summarized_output.csv", {
      download: true,
      header: true,
      complete: function (results) {
        setCsvData(results.data);
      },
    });
  }, []);

  if (!filterType || !data || data.length === 0) return null;

  // Preprocess data based on filter type
  const processedData = (() => {
    switch (filterType) {
      case "bank":
        return Object.entries(data).map(([app, stats]) => ({
          app,
          positive: stats.types.positive || 0,
          neutral: stats.types.neutral || 0,
          negative: stats.types.negative || 0,
        }));
      case "review":
        return data;
      case "category":
      case "bankCategory":
      case "topAspects":
      case "topOpinions":
      case "categoriesPerBank":
      case "sentimentCategory":
        return data;
      default:
        return data;
    }
  })();

  const handleDrillDown = (entry, filterType) => {
    let filteredData = [];

    if (["topAspects", "topOpinions"].includes(filterType)) {
      const fieldToCheck = filterType === "topAspects" ? "aspects" : "opinions";
      filteredData = csvData.filter((row) => {
        const items = (row[fieldToCheck] || "")
          .split(",")
          .map((item) => capitalize(normalize(item.trim())));
        return items.includes(entry.item);
      });
    } else {
      switch (filterType) {
        case "bank":
          filteredData = csvData.filter((d) => d.app === entry.app);
          break;
        case "review":
          filteredData = csvData.filter(
            (d) => computeOverallSentiment(d) === entry.type
          );
          break;
        case "category":
          filteredData = csvData.filter((d) => {
            const categories = (d.mapped_categories || "")
              .split(",")
              .map((cat) => capitalize(normalize(cat.trim())));
            return categories.some((cat) =>
              groupCategory(cat) === entry.category
            );
          });
          break;
        case "bankCategory":
          filteredData = csvData.filter((d) => {
            if (d.app !== entry.app) return false;
            const categories = (d.mapped_categories || "")
              .split(",")
              .map((cat) => capitalize(normalize(cat.trim())));
            return categories.some((cat) =>
              groupCategory(cat) === entry.topCategory
            );
          });
          break;
        case "categoriesPerBank":
          filteredData = csvData.filter((d) => d.app === entry.app);
          break;
        case "sentimentCategory":
          filteredData = csvData.filter((d) => {
            let opinions = (d.opinions || "")
              .split(",")
              .map((item) => capitalize(normalize(item.trim())));
            return opinions.includes(entry.item) && d.app === "HBL";
          });
          break;
        default:
          filteredData = [];
      }
    }

    setDrillDownData(filteredData);
    setSelectedItem(entry);
    setIsDrilledDown(true);
  };

  const handleBack = () => {
    setIsDrilledDown(false);
    setDrillDownData([]);
    setSelectedItem(null);
  };

  const renderDrillDownTable = () => {
    const columns = Object.keys(csvData[0] || {}).map(capitalize);
    const keys = Object.keys(csvData[0] || {});

    return (
      <div>
        <button
          onClick={handleBack}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
        >
          Back to Chart
        </button>
        <table className="table-auto w-full text-left text-sm text-gray-700">
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={idx} className="p-2 bg-gray-50 border-b border-gray-200">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {drillDownData.map((row, index) => (
              <tr key={index} className="border-b border-gray-200">
                {keys.map((key, idx) => (
                  <td key={idx} className="p-2">{row[key]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChart = () => {
    switch (filterType) {
      case "bank":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={processedData}
              margin={chartMargin}
            >
              <XAxis dataKey="app" angle={-25} textAnchor="end" interval={0} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="positive" stackId="a" fill="#28a745" onClick={(d) => handleDrillDown(d, filterType)} />
              <Bar dataKey="neutral" stackId="a" fill="#e6f4ea" onClick={(d) => handleDrillDown(d, filterType)} />
              <Bar dataKey="negative" stackId="a" fill="#6c757d" onClick={(d) => handleDrillDown(d, filterType)} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "review":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={processedData}
                dataKey="count"
                nameKey="type"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
                onClick={(d) => handleDrillDown(d, filterType)}
              >
                {processedData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      case "category":
      case "bankCategory":
      case "topAspects":
      case "topOpinions":
      case "categoriesPerBank":
      case "sentimentCategory":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={processedData} margin={chartMargin}>
              <XAxis
                dataKey={
                  filterType === "category" || filterType === "sentimentCategory"
                    ? "category"
                    : filterType === "bankCategory"
                    ? "app"
                    : "item"
                }
                angle={-25}
                textAnchor="end"
                interval={0}
              />
              <YAxis />
              <Tooltip />
              {["sentimentCategory", "bank"].includes(filterType) ? (
                <>
                  <Legend />
                  <Bar dataKey="positive" stackId="a" fill="#28a745" onClick={(d) => handleDrillDown(d, filterType)} />
                  <Bar dataKey="neutral" stackId="a" fill="#e6f4ea" onClick={(d) => handleDrillDown(d, filterType)} />
                  <Bar dataKey="negative" stackId="a" fill="#6c757d" onClick={(d) => handleDrillDown(d, filterType)} />
                </>
              ) : (
                <Bar
                  dataKey={
                    filterType === "category"
                      ? "ratio"
                      : filterType === "categoriesPerBank"
                      ? "categoryCount"
                      : "count"
                  }
                  fill="#28a745"
                  onClick={(d) => handleDrillDown(d, filterType)}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl w-full md:w-1/2 mt-4 border border-gray-200">
      <h3 className="text-md font-bold mb-2 text-gray-800">📊 Chart View</h3>
      {isDrilledDown ? renderDrillDownTable() : renderChart()}
    </div>
  );
}