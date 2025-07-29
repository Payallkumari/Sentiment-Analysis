import { useState, useEffect } from "react";
import {normalize,capitalize,} from "../utils/sentimentUtils";
import {BarChart,Bar,XAxis,YAxis,Tooltip,ResponsiveContainer,PieChart,Pie,Cell,Legend,} from "recharts";
import { supabase } from "../supabaseClient";

const COLORS = ["#28a745", "#34c759", "#75b0ddff", "#6c757d"];

export default function FilterCharts({ data, filterType, selectedApp }) {
  const [isDrilledDown, setIsDrilledDown] = useState(false);
  const [drillDownData, setDrillDownData] = useState([]);
  const [, setSelectedItem] = useState(null);
  const chartMargin = { top: 20, right: 30, left: 20, bottom: 80 };

  useEffect(() => {
    setIsDrilledDown(false);
    setDrillDownData([]);
    setSelectedItem(null);
  }, [filterType, data]);

  if (!filterType || !data || data.length === 0) {
    return <div className="p-4 text-gray-700">No data available to display.</div>;
  }

  const processedData = filterType === "bank"
    ? Object.entries(data).map(([app, stats]) => ({
        app,
        positive: stats.types?.positive || 0,
        neutral: stats.types?.neutral || 0,
        negative: stats.types?.negative || 0,
      }))
    : data;

  const handleDrillDown = async (entry, filterType, barKey = null) => {
    console.log("Drilldown entry:", entry, "filterType:", filterType, "barKey:", barKey, "selectedApp:", selectedApp);

    let query = supabase.from("summaries").select("*");

    if (filterType === "bank") {
      query = query.filter("app", "eq", entry.app)
                   .filter("sentiment", "eq", barKey);
    } else if (filterType === "review") {
      query = query.filter("sentiment", "eq", entry.type);
    } else if (filterType === "bankCategory") {
      query = query.filter("app", "eq", entry.app);
    } else if (filterType === "categoriesPerBank") {
      query = query.filter("app", "eq", entry.app);
    } else if (filterType === "sentimentCategory") {
      if (selectedApp) query = query.filter("app", "eq", selectedApp);
      query = query.filter("sentiment", "eq", barKey);
    }

    const { data: result, error } = await query;

    if (error) {
      console.error("Drilldown fetch error:", error.message);
      setDrillDownData([]);
      setIsDrilledDown(true);
      return;
    }

    let filtered = result;

    // if (filterType === "category" || filterType === "bankCategory") {
    //   const targetCategory = filterType === "category" ? entry.category : entry.topCategory;
    //   filtered = result.filter(d => {
    //     const rawCats = (d.mapped_categories || "")
    //       .split(",")
    //       .map(c => capitalize(normalize(c.trim())));
    //     return rawCats.some(rc => groupCategory(rc) === targetCategory);
    //   }).map(d => ({ ...d, matchedKeyword: targetCategory }));
    // }

    if (filterType === "topAspects") {
      filtered = result.filter(d => {
        const aspects = (d.aspects || "")
          .split(",")
          .map(a => capitalize(normalize(a.trim())));
        return aspects.includes(entry.item);
      }).map(d => ({ ...d, matchedKeyword: entry.item }));
    }

    if (filterType === "topOpinions" || filterType === "sentimentCategory") {
      filtered = result.filter(d => {
        const opinions = (d.opinions || "")
          .split(",")
          .map(o => capitalize(normalize(o.trim())));
        return opinions.includes(entry.item);
      }).map(d => ({ ...d, matchedKeyword: entry.item }));
    }

    console.log("Filtered drilldown rows:", filtered);
    setDrillDownData(filtered);
    setSelectedItem({ ...entry, barKey });
    setIsDrilledDown(true);
  };

  const handleBack = () => {
    setIsDrilledDown(false);
    setDrillDownData([]);
    setSelectedItem(null);
  };

  const renderDrillDownTable = () => {
    if (drillDownData.length === 0) {
      return (
        <div className="text-gray-700 p-4">
          No data available for this selection.<br />
          Check console log for filter details.
        </div>
      );
    }

    const columns = ["app", "sentiment", "summary"];
    const hasKeyword = drillDownData[0]?.matchedKeyword !== undefined;

    return (
      <div className="p-4">
        <button
          onClick={handleBack}
          className="mb-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500"
        >
          Back to Chart
        </button>
        <div className="overflow-x-auto">
          <table className="table-auto w-full text-left text-sm text-gray-700">
            <thead>
              <tr>
                {columns.map(c => (
                  <th key={c} className="p-2 bg-gray-50 border-b">{capitalize(c)}</th>
                ))}
                {hasKeyword && <th className="p-2 bg-gray-50 border-b">Matched Keyword</th>}
              </tr>
            </thead>
            <tbody>
              {drillDownData.map((row, idx) => (
                <tr key={idx} className="border-b">
                  {columns.map(c => <td key={c} className="p-2">{row[c] || '-'}</td>)}
                  {hasKeyword && <td className="p-2">{row.matchedKeyword}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (filterType) {
      case "bank":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={processedData} margin={chartMargin}>
              <XAxis dataKey="app" angle={-25} textAnchor="end" interval={0} />
              <YAxis /><Tooltip /><Legend />
              <Bar dataKey="positive" stackId="a" fill={COLORS[0]} onClick={d => handleDrillDown(d, filterType, "positive")} />
              <Bar dataKey="neutral" stackId="a" fill={COLORS[2]} onClick={d => handleDrillDown(d, filterType, "neutral")} />
              <Bar dataKey="negative" stackId="a" fill={COLORS[3]} onClick={d => handleDrillDown(d, filterType, "negative")} />
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
                onClick={d => handleDrillDown(d, filterType)}
              >
                {processedData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip /><Legend 
             
               layout="horizontal"
  align="center"
  verticalAlign="bottom"
  iconType="circle"
  formatter={(value, entry) => entry.payload.sentiment}
              />
            </PieChart>
          </ResponsiveContainer>
        );
      case "category":
      case "bankCategory":
      case "topAspects":
      case "topOpinions":
      case "categoriesPerBank":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={processedData} margin={chartMargin}>
              <XAxis dataKey={
                filterType === "category" ? "category" :
                filterType === "bankCategory" ? "app" : "item"
              } angle={-25} textAnchor="end" interval={0} />
              <YAxis /><Tooltip />
              <Bar
                dataKey={
                  filterType === "category" ? "ratio" :
                  filterType === "categoriesPerBank" ? "categoryCount" : "count"
                }
                fill={COLORS[0]}
                onClick={d => handleDrillDown(d, filterType)}
              />
            </BarChart>
          </ResponsiveContainer>
        );
      case "sentimentCategory":
        return (
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={processedData} margin={chartMargin}>
              <XAxis dataKey="category" angle={-25} textAnchor="end" interval={0} />
              <YAxis /><Tooltip /><Legend />
              <Bar dataKey="positive" stackId="a" fill={COLORS[0]} onClick={d => handleDrillDown(d, filterType, "positive")} />
              <Bar dataKey="neutral" stackId="a" fill={COLORS[2]} onClick={d => handleDrillDown(d, filterType, "neutral")} />
              <Bar dataKey="negative" stackId="a" fill={COLORS[3]} onClick={d => handleDrillDown(d, filterType, "negative")} />
            </BarChart>
          </ResponsiveContainer>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl w-1/2  border border-gray-200">
      <h3 className="text-md font-bold mb-2 text-gray-800">📊 Chart View</h3>
      {isDrilledDown ? renderDrillDownTable() : renderChart()}
    </div>
  );
}
