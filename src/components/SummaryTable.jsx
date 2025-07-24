import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useLocation } from "react-router-dom";
import Chart from "chart.js/auto";
import FilterCharts from "./FilterCharts";
import {normalize,
  capitalize,
  computeOverallSentiment,
  groupCategory,
} from "../utils/sentimentUtils";

import {
  CategoryRatioTable,
  TopComplaintTable,
  TopListTable,
  CategoriesPerBankTable,
  SentimentByCategoryTable,
  BankReviewTable,
  SentimentSummaryTable,
} from "./TableViews";

const SummaryTable = ({ data = [] }) => {
  const [filterType, setFilterType] = useState("");
  const chartRef = useRef(null);
  const bankChartRef = useRef(null);
  const chartInstance = useRef(null);
  const bankChartInstance = useRef(null);

  const location = useLocation();
  const isSummaryPage = location.pathname === "/"; 

  const generateBankColors = (banks) => {
    const colors = [
      "rgba(129, 125, 219, 0.7)",
      "rgba(76, 199, 158, 0.7)",
      "rgba(244, 63, 94, 0.7)",
      "rgba(6, 182, 212, 0.7)",
      "rgba(245, 158, 11, 0.7)",
    ];
    const borderColors = colors.map((color) => color.replace("0.7", "1"));
    return banks.map((bank, index) => ({
      name: bank,
      color: colors[index % colors.length],
      borderColor: borderColors[index % colors.length],
    }));
  };

  const bankNames = [...new Set(data.map((item) => item.app))];
  const bankLegend = generateBankColors(bankNames);

  const sentimentStats = () => {
    const stats = { positive: 0, neutral: 0, negative: 0 };
    data.forEach((d) => {
      const sentiment = computeOverallSentiment(d);
      if (sentiment === "positive") stats.positive++;
      else if (sentiment === "neutral") stats.neutral++;
      else if (sentiment === "negative") stats.negative++;
    });
    const total = data.length;
    return {
      total,
      positive: {
        count: stats.positive,
        percentage: Math.round((stats.positive / total) * 100) || 0,
      },
      neutral: {
        count: stats.neutral,
        percentage: Math.round((stats.neutral / total) * 100) || 0,
      },
      negative: {
        count: stats.negative,
        percentage: Math.round((stats.negative / total) * 100) || 0,
      },
    };
  };

  const categoryRatios = () => {
    const categoryCount = {};
    let total = 0;
    data.forEach((d) => {
      let categories = [];
      try {
        categories = JSON.parse(d.mapped_categories.replace(/'/g, '"'));
      } catch {}
      categories.forEach((cat) => {
        const group = groupCategory(cat);
        categoryCount[group] = (categoryCount[group] || 0) + 1;
        total++;
      });
    });
    return Object.entries(categoryCount).map(([category, count]) => ({
      category,
      ratio: parseFloat(((count / total) * 100).toFixed(2)),
    }));
  };

  const getTopCategory = () => {
    const sorted = categoryRatios().sort((a, b) => b.ratio - a.ratio);
    return sorted[0]?.category || "N/A";
  };

  const avgRating = () => {
    const validScores = data
      .map((d) => parseFloat(d.score))
      .filter((s) => !isNaN(s));
    const total = validScores.reduce((acc, val) => acc + val, 0);
    return validScores.length ? (total / validScores.length).toFixed(2) : "N/A";
  };

  // const getTimePeriod = () => {
  //   const dates = data
  //     .map((d) => new Date(d.review_date))
  //     .filter((d) => !isNaN(d));
  //   if (dates.length === 0) return "N/A";
  //   const minDate = new Date(Math.min(...dates));
  //   const maxDate = new Date(Math.max(...dates));
  //   return `${format(minDate, "dd MMM yyyy")} - ${format(
  //     maxDate,
  //     "dd MMM yyyy"
  //   )}`;
  // };

  const bankReviewStats = () => {
    const stats = {};
    data.forEach((d) => {
      const app = d.app;
      if (!stats[app]) stats[app] = { total: 0 };
      stats[app].total += 1;
    });
    const total = data.length;
    return {
      total,
      banks: Object.entries(stats).map(([app, data]) => ({
        app,
        percentage: Math.round((data.total / total) * 100) || 0,
      })),
    };
  };

  const chartDataMap = {
    bank: () => {
      const stats = {};
      data.forEach((d) => {
        const app = d.app;
        const sentiment = computeOverallSentiment(d);
        if (!stats[app]) stats[app] = { total: 0, types: {} };
        stats[app].total += 1;
        stats[app].types[sentiment] = (stats[app].types[sentiment] || 0) + 1;
      });
      return stats;
    },
    review: sentimentStats,
    category: categoryRatios,
    bankCategory: () => {
      const stats = {};
      data.forEach((d) => {
        const app = d.app;
        let categories = [];
        try {
          categories = JSON.parse(d.mapped_categories.replace(/'/g, '"'));
        } catch {}
        if (!stats[app]) stats[app] = {};
        categories.forEach((cat) => {
          const group = groupCategory(cat);
          stats[app][group] = (stats[app][group] || 0) + 1;
        });
      });
      return Object.entries(stats).map(([app, categories]) => {
        const sorted = Object.entries(categories).sort((a, b) => b[1] - a[1]);
        const [topCategory, count] = sorted[0] || ["N/A", 0];
        return { app, topCategory, count };
      });
    },
    topAspects: () => {
      const count = {};
      data.forEach((d) => {
        const values = d.aspects?.split(",") || [];
        values.forEach((val) => {
          const cleaned = capitalize(normalize(val));
          if (cleaned && cleaned.toLowerCase() !== "null") {
            count[cleaned] = (count[cleaned] || 0) + 1;
          }
        });
      });
      return Object.entries(count)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([item, count]) => ({ item, count }));
    },
    topOpinions: () => {
      const count = {};
      data.forEach((d) => {
        const values = d.opinions?.split(",") || [];
        values.forEach((val) => {
          const cleaned = capitalize(normalize(val));
          if (cleaned && cleaned.toLowerCase() !== "null") {
            count[cleaned] = (count[cleaned] || 0) + 1;
          }
        });
      });
      return Object.entries(count)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([item, count]) => ({ item, count }));
    },
    categoriesPerBank: () => {
      const stats = {};
      data.forEach((d) => {
        const app = d.app;
        let categories = [];
        try {
          categories = JSON.parse(d.mapped_categories.replace(/'/g, '"'));
        } catch {}
        if (!stats[app]) stats[app] = {};
        categories.forEach((cat) => {
          const group = groupCategory(cat);
          stats[app][group] = (stats[app][group] || 0) + 1;
        });
      });
      return Object.entries(stats).map(([app, groups]) => ({
        app,
        categories: Object.entries(groups)
          .sort((a, b) => b[1] - a[1])
          .map(([cat, count]) => `${cat} (${count})`),
      }));
    },
    sentimentCategory: () => {
      const stats = {};
      data.forEach((d) => {
        let categories = [];
        try {
          categories = JSON.parse(d.mapped_categories.replace(/'/g, '"'));
        } catch {}
        categories.forEach((cat) => {
          const group = groupCategory(cat);
          if (!stats[group])
            stats[group] = { positive: 0, neutral: 0, negative: 0 };
          const sentiment = computeOverallSentiment(d);
          if (["positive", "neutral", "negative"].includes(sentiment)) {
            stats[group][sentiment]++;
          }
        });
      });
      return Object.entries(stats).map(([category, values]) => ({
        category,
        ...values,
      }));
    },
  };

  const chartData = filterType ? chartDataMap[filterType]?.() : null;
  const sentimentData = sentimentStats();
  const bankReviewData = bankReviewStats();
  const avgRatingValue = avgRating();
  const topCategory = getTopCategory();

  useEffect(() => {
    if (isSummaryPage && chartRef.current && sentimentData.total > 0) {
      if (chartInstance.current) chartInstance.current.destroy();
      const ctx = chartRef.current.getContext("2d");
      chartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: ["Positive", "Neutral", "Negative"],
          datasets: [
            {
              data: [
                sentimentData.positive.percentage,
                sentimentData.neutral.percentage,
                sentimentData.negative.percentage,
              ],
              backgroundColor: [
                "rgba(34, 197, 94, 0.7)",
                "rgba(234, 179, 8, 0.7)",
                "rgba(239, 68, 68, 0.7)",
              ],
              borderColor: [
                "rgba(34, 197, 94, 1)",
                "rgba(234, 179, 8, 1)",
                "rgba(239, 68, 68, 1)",
              ],
              borderWidth: 2,
              cutout: "70%",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (tooltipItem) =>
                  `${tooltipItem.label}: ${tooltipItem.raw}%`,
              },
            },
          },
        },
      });
    }

    if (isSummaryPage && bankChartRef.current && bankReviewData.total > 0) {
      if (bankChartInstance.current) bankChartInstance.current.destroy();
      const ctx = bankChartRef.current.getContext("2d");
      bankChartInstance.current = new Chart(ctx, {
        type: "doughnut",
        data: {
          labels: bankReviewData.banks.map((bank) => bank.app),
          datasets: [
            {
              data: bankReviewData.banks.map((bank) => bank.percentage),
              backgroundColor: bankLegend.map((bank) => bank.color),
              borderColor: bankLegend.map((bank) => bank.borderColor),
              borderWidth: 2,
              cutout: "70%",
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (tooltipItem) =>
                  `${tooltipItem.label}: ${tooltipItem.raw}%`,
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
      if (bankChartInstance.current) bankChartInstance.current.destroy();
    };
  }, [isSummaryPage, sentimentData, bankReviewData, bankLegend]);

  return (
    <div className="p-4 space-y-4">
      {isSummaryPage && (
        <>
          {/* Section 1 */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800">
              Sentiment Analysis Dashboard
            </h2>
          </section>

         
      <section className="flex flex-col md:flex-row items-center justify-between gap-6 mb-6">
        <div className="p-6 bg-white border border-gray-200  shadow-sm w-full md:w-1/2 flex flex-col md:flex-row md:items-center justify-between">
          <div className="mb-4 md:mb-0 md:mr-6 text-center md:text-left">
            <h5 className="text-sm text-gray-500 font-medium">
              Total Feedback
            </h5>
            <p className="text-2xl font-bold text-gray-800">
              {sentimentData.total}
            </p>
          </div>
          <div className="flex gap-7 justify-center">
            {[
              {
                label: "Positive",
                value: `${sentimentData.positive.percentage}%`,
                color: "bg-green-100 text-green-700",
              },
              {
                label: "Neutral",
                value: `${sentimentData.neutral.percentage}%`,
                color: "bg-yellow-100 text-yellow-700",
              },
              {
                label: "Negative",
                value: `${sentimentData.negative.percentage}%`,
                color: "bg-red-100 text-red-700",
              },
            ].map((stat, idx) => (
              <div
                key={idx}
                className={`px-5 py-2 min-w-[120px]  border border-gray-200 text-center shadow-sm ${stat.color}`}
              >
                <p className="text-xs font-semibold">{stat.label}</p>
                <p className="text-lg font-bold mt-1">{stat.value}</p>
              </div>
            ))}
          </div>
        </div>
  <div className="p-5 bg-white border border-gray-200 shadow-sm md:w-1/2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg shadow text-center">
            <p className="text-xs font-medium text-green-700">Avg Rating</p>
            <p className="text-xl font-bold text-green-900 mt-1">
              {avgRatingValue}
            </p>
          </div>

          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg shadow text-center">
            <p className="text-xs font-medium text-yellow-700">Top Complaint</p>
            <p className="text-sm font-semibold text-yellow-900 mt-1 break-words">
              {topCategory}
            </p>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg shadow text-center">
            <p className="text-xs font-medium text-blue-700">Total Apps</p>
            <p className="text-xl font-bold text-blue-900 mt-1">
              {new Set(data.map((item) => item.app)).size}
            </p>
          </div>
        </div>


      </section>


    <section className="flex w-full gap-5">
  <div className="w-1/2 ">
    <div className="flex flex-wrap h-full bg-white border border-gray-200 shadow-sm rounded-lg">
      <div className="w-full md:w-1/2 p-4">
        <h3 className="text-md font-semibold mb-1 text-gray-600">
          Sentiment Distribution
        </h3>
        <div className="flex items-center mb-3">
          <span className="inline-block w-3 h-3 bg-green-500 mr-2"></span>
          <span className="text-sm text-gray-600">Positive</span>
          <span className="inline-block w-3 h-3 bg-yellow-500 mx-2"></span>
          <span className="text-sm text-gray-600">Neutral</span>
          <span className="inline-block w-3 h-3 bg-red-500 mr-2"></span>
          <span className="text-sm text-gray-600">Negative</span>
        </div>
        <div className="relative w-full h-40 flex justify-center items-center">
          <canvas ref={chartRef} className="h-full w-auto"></canvas>
          <div className="absolute text-center">
            <p className="text-xs text-gray-600">Total Feedback</p>
          </div>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-4">
        <h3 className="text-md font-semibold mb-5 text-gray-600">
          Reviews Per Bank
        </h3>
        <div className="flex flex-wrap items-center mb-3 gap-x-4 gap-y-2">
        </div>
        <div className="relative w-full h-40 flex justify-center items-center">
          <canvas ref={bankChartRef} className="h-full w-auto"></canvas>
          <div className="absolute text-center">
            <p className="text-xs text-gray-600">Total Reviews</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <div className="w-1/2 ">
    <div className="h-full bg-white border border-gray-200 shadow-sm rounded-lg flex items-center justify-center text-gray-400">
  
    </div>
  </div>
</section>

        </>
      )}

      {/* Always rendered filter section */}
      <section>
        <div className="flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-white text-gray-800 p-2 rounded border border-gray-300 focus:border-green-500 focus:ring focus:ring-green-200"
          >
            <option value="">-- Select Filter Type --</option>
            <option value="bank">App vs Review Count & Type</option>
            <option value="review">Review Type vs Count</option>
            <option value="category">Complaint Category Ratios</option>
            <option value="bankCategory">Top Complaint Category per App</option>
            <option value="topAspects">All Aspects</option>
            <option value="topOpinions">All Opinions</option>
            <option value="categoriesPerBank">
              Categories Mentioned per App
            </option>
            <option value="sentimentCategory">
              Sentiment Distribution by Category
            </option>
          </select>
        </div>
      </section>

      {/* Conditional chart + table display */}
      {filterType && (
        <section>
          <div className="flex flex-col md:flex-row gap-6">
            <div
              className={
                filterType === "categoriesPerBank" ? "w-full" : "w-full md:w-1/2"
              }
            >
              {filterType === "category" && (
                <CategoryRatioTable data={chartData} />
              )}
              {filterType === "bankCategory" && (
                <TopComplaintTable data={chartData} />
              )}
              {filterType === "topAspects" && (
                <TopListTable data={chartData} />
              )}
              {filterType === "topOpinions" && (
                <TopListTable data={chartData} />
              )}
              {filterType === "categoriesPerBank" && (
                <CategoriesPerBankTable data={chartData} />
              )}
              {filterType === "sentimentCategory" && (
                <SentimentByCategoryTable data={chartData} />
              )}
              {filterType === "bank" && <BankReviewTable data={chartData} />}
              {filterType === "review" && (
                <SentimentSummaryTable data={chartData} />
              )}
            </div>

            {filterType !== "categoriesPerBank" && (
              <FilterCharts
                data={chartData}
                filterType={filterType}
                rawData={data}
              />
            )}
          </div>
        </section>
      )}
    </div>
  );
};

export default SummaryTable;
