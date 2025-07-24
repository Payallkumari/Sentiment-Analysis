import React from "react";

export const GenericTable = ({ data, title, columns, keys }) => (
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

export const CategoryRatioTable = ({ data }) => (
  <GenericTable data={data} columns={["Category", "Ratio (%)"]} keys={["category", "ratio"]} />
);

export const TopComplaintTable = ({ data }) => (
  <GenericTable data={data} columns={["App", "Top Complaint Category", "Count"]} keys={["app", "topCategory", "count"]} />
);

export const TopListTable = ({ data }) => (
  <GenericTable data={data} columns={["Item", "Count"]} keys={["item", "count"]} />
);

export const CategoriesPerBankTable = ({ data }) => {
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

export const SentimentByCategoryTable = ({ data }) => (
  <GenericTable data={data} columns={["Category", "Positive", "Neutral", "Negative"]} keys={["category", "positive", "neutral", "negative"]} />
);

export const BankReviewTable = ({ data }) => (
  <GenericTable
    data={Object.entries(data).map(([app, stats]) => ({
      app,
      positive: stats.types.positive || 0,
      neutral: stats.types.neutral || 0,
      negative: stats.types.negative || 0,
      total: stats.total,
    }))}
    columns={["App", "Positive", "Neutral", "Negative", "Total"]}
    keys={["app", "positive", "neutral", "negative", "total"]}
  />
);

export const SentimentSummaryTable = ({ data }) => (
  <GenericTable data={data} columns={["Review Type", "Count"]} keys={["type", "count"]} />
);
