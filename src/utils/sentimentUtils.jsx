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
