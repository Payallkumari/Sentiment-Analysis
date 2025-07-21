import { useState } from "react";
import FilterCharts from "./FilterCharts";

export const normalize = (val) => val.replace(/[[\]'"]/g, "").toLowerCase().trim();
export const capitalize = (val) => val.replace(/\b\w/g, (char) => char.toUpperCase());

export const computeOverallSentiment = (row) => {
  let sentiments = [];
  try {
    sentiments = JSON.parse(row.sentiments.replace(/'/g, '"'));
  } catch {
    sentiments = [];
  }
  const sentimentSet = new Set(sentiments.map((s) => s.toLowerCase()));
  if (sentimentSet.size === 1) return sentiments[0].toLowerCase();
  if (sentimentSet.has("negative")) return "negative";
  if (sentimentSet.has("positive")) return "positive";
  return "neutral";
};

export const groupCategory = (cat) => {
  const lower = normalize(cat);
  if (
    lower.startsWith("app#") ||
    ["app#general", "app#performance", "app#usability", "app#features", "app#tablet", "app#design", "app#cost", "app#quality", "app#pricing"].some((prefix) => lower.startsWith(prefix))
  ) return "App Experience";
  if (
    lower.startsWith("support#") ||
    lower.includes("customer_support") ||
    lower.includes("card_settings_support")
  ) return "Customer Support";
  if (lower.startsWith("branch")) return "Branch Service";
  if (lower.startsWith("atm")) return "ATM Service";
  if (lower.startsWith("biometric")) return "Biometric Issues";
  if (lower.startsWith("system#")) return "System Performance";
  if (lower.startsWith("screen#")) return "UI/Screen Issues";
  if (
    lower.startsWith("ui_ux#") ||
    lower.includes("ui_font") ||
    lower.includes("system_ui") ||
    lower.includes("ui_color")
  ) return "Design/UX";
  if (
    lower.startsWith("fees") ||
    lower.startsWith("charges") ||
    lower.startsWith("tax")
  ) return "Charges & Fees";
  if (
    lower.startsWith("location") ||
    lower.startsWith("lighting")
  ) return "Location Issues";
  if (
    lower.startsWith("email") ||
    lower.startsWith("sms") ||
    lower.startsWith("digital_currency")
  ) return "Digital Services";
  if (
    lower.startsWith("transaction") ||
    lower.startsWith("payment") ||
    lower.startsWith("balance") ||
    lower.startsWith("login_security") ||
    lower.startsWith("password") ||
    lower.startsWith("account_recovery")
  ) return "Account & Transactions";
  return "Others";
};

const SummaryTable = ({ data }) => {
  const [filterType, setFilterType] = useState("");

  const bankReviewStats = () => {
    const stats = {};
    data.forEach((d) => {
      const app = d.app;
      const sentiment = computeOverallSentiment(d);
      if (!stats[app]) stats[app] = { total: 0, types: {} };
      stats[app].total += 1;
      stats[app].types[sentiment] = (stats[app].types[sentiment] || 0) + 1;
    });
    return stats;
  };

  const sentimentStats = () => {
    const stats = {};
    data.forEach((d) => {
      const sentiment = computeOverallSentiment(d);
      stats[sentiment] = (stats[sentiment] || 0) + 1;
    });
    return Object.entries(stats).map(([type, count]) => ({ type, count }));
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

  const bankTopComplaints = () => {
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
  };

  const getTopItems = (columnName, limit = 15) => {
    const count = {};
    data.forEach((d) => {
      const values = d[columnName]?.split(",") || [];
      values.forEach((val) => {
        const cleaned = capitalize(normalize(val));
        if (cleaned && cleaned.toLowerCase() !== "null") {
          count[cleaned] = (count[cleaned] || 0) + 1;
        }
      });
    });
    return Object.entries(count)
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([item, count]) => ({ item, count }));
  };

  const getNetSentimentByCategory = () => {
    const stats = {};
    data.forEach((d) => {
      const sentiment = computeOverallSentiment(d);
      let categories = [];
      try {
        categories = JSON.parse(d.mapped_categories.replace(/'/g, '"'));
      } catch {}
      categories.forEach((cat) => {
        const group = groupCategory(cat);
        if (!stats[group]) stats[group] = { positive: 0, negative: 0 };
        if (sentiment === "positive") stats[group].positive++;
        else if (sentiment === "negative") stats[group].negative++;
      });
    });

    return Object.entries(stats).map(([category, { positive, negative }]) => ({
      category,
      netScore: positive - negative,
    }));
  };

  const getCategoriesPerBank = () => {
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
  };

  const sentimentByCategory = () => {
    const stats = {};
    data.forEach((d) => {
      let categories = [];
      try {
        categories = JSON.parse(d.mapped_categories.replace(/'/g, '"'));
      } catch {}
      categories.forEach((cat) => {
        const group = groupCategory(cat);
        if (!stats[group]) {
          stats[group] = { positive: 0, neutral: 0, negative: 0 };
        }
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
  };

  const getChartData = () => {
    switch (filterType) {
      case "bank":
        return bankReviewStats();
      case "review":
        return sentimentStats();
      case "category":
        return categoryRatios();
      case "bankCategory":
        return bankTopComplaints();
      case "topAspects":
        return getTopItems("aspects");
      case "topOpinions":
        return getTopItems("opinions");
      case "netScore":
        return getNetSentimentByCategory();
      case "categoriesPerBank":
        return getCategoriesPerBank();
      case "sentimentCategory":
        return sentimentByCategory();
      default:
        return null;
    }
  };

  const chartData = getChartData();

  return (
    <div className="p-4 bg-white rounded-xl mt-8 border border-gray-200">
      <h2 className="text-lg font-semibold mb-4 text-gray-800">Filtered Summary View</h2>

      <div className="flex gap-4 mb-4">
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
          <option value="categoriesPerBank">Categories Mentioned per App</option>
          <option value="sentimentCategory">Sentiment Distribution by Category</option>
        </select>
      </div>

      {filterType && (
        <div className="flex flex-col md:flex-row gap-6">
          <div className={filterType === "categoriesPerBank" ? "w-full" : "w-full md:w-1/2"}>
            {filterType === "category" && <CategoryRatioTable data={chartData} />}
            {filterType === "bankCategory" && <TopComplaintTable data={chartData} />}
            {filterType === "topAspects" && <TopListTable data={chartData} />}
            {filterType === "topOpinions" && <TopListTable data={chartData} />}
            {filterType === "categoriesPerBank" && <CategoriesPerBankTable data={chartData} />}
            {filterType === "sentimentCategory" && <SentimentByCategoryTable data={chartData} />}
            {filterType === "bank" && <BankReviewTable data={chartData} />}
            {filterType === "review" && <SentimentSummaryTable data={chartData} />}
          </div>
          {filterType !== "categoriesPerBank" && (
            <FilterCharts data={chartData} filterType={filterType} rawData={data} />
          )}
        </div>
      )}
    </div>
  );
};

const CategoryRatioTable = ({ data }) => (
  <GenericTable data={data} columns={["Category", "Ratio (%)"]} keys={["category", "ratio"]} />
);

const TopComplaintTable = ({ data }) => (
  <GenericTable data={data} columns={["App", "Top Complaint Category", "Count"]} keys={["app", "topCategory", "count"]} />
);

const TopListTable = ({ title, data }) => (
  <GenericTable data={data} title={title} columns={["Item", "Count"]} keys={["item", "count"]} />
);

const CategoriesPerBankTable = ({ data }) => {
  const allApps = data.map((entry) => entry.app);
  const categorySet = new Set();
  data.forEach((entry) => {
    entry.categories.forEach((catCount) => {
      const cat = catCount.split(" (")[0];
      categorySet.add(cat);
    });
  });
  const allCategories = Array.from(categorySet).sort();

  const matrix = allCategories.map((category) => {
    const row = { category };
    allApps.forEach((app) => {
      const appData = data.find((d) => d.app === app);
      let count = 0;
      if (appData) {
        const match = appData.categories.find((c) => c.startsWith(category));
        if (match) {
          count = parseInt(match.match(/\((\d+)\)/)?.[1] || "0");
        }
      }
      row[app] = count;
    });
    return row;
  });

  return (
    <div>
      <h3 className="text-md font-bold mb-2 text-gray-800">Complaint Categories vs Apps</h3>
      <div className="overflow-x-auto">
        <table className="table-auto text-sm text-gray-700 border border-gray-200">
          <thead>
            <tr>
              <th className="p-2 border-b border-gray-200 bg-gray-50">Category</th>
              {allApps.map((app) => (
                <th key={app} className="p-2 border-b border-gray-200 bg-gray-50 text-center whitespace-nowrap">{app}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matrix.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-200">
                <td className="p-2">{row.category}</td>
                {allApps.map((app) => (
                  <td key={app} className="p-2 text-center">{row[app]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const SentimentByCategoryTable = ({ data }) => (
  <GenericTable data={data} columns={["Category", "Positive", "Neutral", "Negative"]} keys={["category", "positive", "neutral", "negative"]} />
);

const BankReviewTable = ({ data }) => (
  <GenericTable data={Object.entries(data).map(([app, stats]) => ({
    app,
    positive: stats.types.positive || 0,
    neutral: stats.types.neutral || 0,
    negative: stats.types.negative || 0,
    total: stats.total,
  }))} columns={["App", "Positive", "Neutral", "Negative", "Total"]} keys={["app", "positive", "neutral", "negative", "total"]} />
);

const SentimentSummaryTable = ({ data }) => (
  <GenericTable data={data} columns={["Review Type", "Count"]} keys={["type", "count"]} />
);

const GenericTable = ({ data, title, columns, keys }) => (
  <div>
    {title && <h3 className="text-md font-bold mb-2 text-gray-800">{title}</h3>}
    <table className="table-auto w-full text-left text-sm text-gray-700">
      <thead>
        <tr>
          {columns.map((col, idx) => (
            <th key={idx} className="p-2 bg-gray-50 border-b border-gray-200">{col}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {data.map((row, index) => (
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

export default SummaryTable;