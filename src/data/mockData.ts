export const transactions = [
  { id: 1, merchant: "Spotify", category: "Subscriptions", amount: -9.99, date: "Today", icon: "Music" },
  { id: 2, merchant: "REWE", category: "Groceries", amount: -34.52, date: "Today", icon: "ShoppingCart" },
  { id: 3, merchant: "Amazon", category: "Shopping", amount: -67.89, date: "Yesterday", icon: "Package" },
  { id: 4, merchant: "Salary - TechCorp", category: "Income", amount: 3200.00, date: "Yesterday", icon: "Building2" },
  { id: 5, merchant: "Netflix", category: "Subscriptions", amount: -12.99, date: "Feb 18", icon: "Tv" },
  { id: 6, merchant: "Uber", category: "Transport", amount: -14.30, date: "Feb 18", icon: "Car" },
  { id: 7, merchant: "Lidl", category: "Groceries", amount: -22.15, date: "Feb 17", icon: "ShoppingCart" },
  { id: 8, merchant: "H&M", category: "Shopping", amount: -49.99, date: "Feb 17", icon: "Shirt" },
  { id: 9, merchant: "Starbucks", category: "Food & Drink", amount: -5.40, date: "Feb 16", icon: "Coffee" },
  { id: 10, merchant: "DB Bahn", category: "Transport", amount: -29.90, date: "Feb 16", icon: "Train" },
  { id: 11, merchant: "Apple", category: "Subscriptions", amount: -2.99, date: "Feb 15", icon: "Smartphone" },
  { id: 12, merchant: "MediaMarkt", category: "Electronics", amount: -129.00, date: "Feb 14", icon: "Monitor" },
];

export const popularStocks = [
  { name: "NVIDIA", ticker: "NVDA", price: "161,04 €", change: 1.45, color: "bg-green-500", domain: "nvidia.com" },
  { name: "Amazon.com", ticker: "AMZN", price: "178,28 €", change: 2.8, color: "bg-orange-500", domain: "amazon.com" },
  { name: "Microsoft", ticker: "MSFT", price: "337,01 €", change: -0.15, color: "bg-blue-500", domain: "microsoft.com" },
  { name: "Alphabet", ticker: "GOOGL", price: "267,28 €", change: 3.6, color: "bg-white", domain: "google.com" },
  { name: "Apple", ticker: "AAPL", price: "224,50 €", change: 1.11, color: "bg-gray-400", domain: "apple.com" },
  { name: "Meta Platforms", ticker: "META", price: "556,30 €", change: 1.69, color: "bg-blue-600", domain: "meta.com" },
  { name: "Tesla", ticker: "TSLA", price: "349,39 €", change: 0.03, color: "bg-red-500", domain: "tesla.com" },
  { name: "Netflix", ticker: "NFLX", price: "66,75 €", change: 2.16, color: "bg-red-700", domain: "netflix.com" },
];

export const popularETFs = [
  { name: "Core MSCI World", ticker: "EUNL", price: "113,76 €", change: 0.75, color: "bg-yellow-500", brand: "iShares", domain: "ishares.com" },
  { name: "S&P 500", ticker: "VUAA", price: "112,51 €", change: 0.6, color: "bg-red-600", brand: "Vanguard", domain: "vanguard.com" },
  { name: "S&P 500 Information Technology Sector", ticker: "QDVE", price: "34,26 €", change: 0.84, color: "bg-yellow-500", brand: "iShares", domain: "ishares.com" },
  { name: "S&P 500", ticker: "VUSA", price: "110,95 €", change: 0.5, color: "bg-red-600", brand: "Vanguard", domain: "vanguard.com" },
  { name: "FTSE All-World", ticker: "VWCE", price: "149,88 €", change: 0.9, color: "bg-red-600", brand: "Vanguard", domain: "vanguard.com" },
];

export const cryptoMovers = [
  { name: "SLF", change: -61.14, price: "0,0003 €", color: "bg-purple-500" },
  { name: "MXC", change: -57.43, price: "0,000002 €", color: "bg-blue-700" },
  { name: "OAX", change: 44.07, price: "0,0038 €", color: "bg-yellow-600" },
  { name: "SXP", change: 31.05, price: "0,0219 €", color: "bg-orange-600" },
];

export const commodities = [
  { name: "Industrial Metals", ticker: "INDU", price: "15,60 €", change: -0.29, brand: "WisdomTree" },
  { name: "Copper", ticker: "COPB", price: "43,20 €", change: -0.61, brand: "WisdomTree" },
  { name: "IE Physical Gold EUR Hedged ETC Securities", ticker: "XGDE", price: "62,22 €", change: -0.18, brand: "" },
  { name: "Physical Silver ETC", ticker: "SSLN", price: "67,81 €", change: -0.24, brand: "iShares" },
  { name: "Agriculture", ticker: "AGAP", price: "4,98 €", change: -0.73, brand: "WisdomTree" },
  { name: "Sugar", ticker: "SUGA", price: "7,89 €", change: -0.92, brand: "WisdomTree" },
  { name: "Energy", ticker: "AIGE", price: "3,03 €", change: -0.99, brand: "WisdomTree" },
  { name: "Physical Gold ETC", ticker: "SGLN", price: "83,70 €", change: -0.12, brand: "iShares" },
];

export const addMoreItems = [
  { title: "Freelancer Account", desc: "Open a free business account and earn cashback." },
  { title: "Instant Savings", desc: "Earn 0.5% AER (0.5% NIR) on your Savings" },
  { title: "Joint Account", desc: "Set up in minutes, with money management tools made for two." },
  { title: "Crypto", desc: "Get started with crypto with 1 €." },
  { title: "Extra funds", desc: "Borrow for unexpected moments and make your money go further." },
];

export const expertFunds = [
  { name: "Mindful", returnRate: "2.1% yearly estimated return" },
  { name: "Balanced", returnRate: "6.1% yearly estimated return" },
  { name: "Ambitious", returnRate: "8.2% yearly estimated return" },
];

export const portfolioCoins = [
  { name: "Ethereum", ticker: "ETH", price: "€1,678.89", change: 23.55, changeAmount: "€91.09", color: "bg-indigo-500", domain: "ethereum.org" },
  { name: "Bitcoin", ticker: "BTC", price: "€57,828.12", change: -2.99, changeAmount: "€8.34", color: "bg-orange-500", domain: "bitcoin.org" },
  { name: "SHIBA INU", ticker: "SHIB", price: "€0.0000054", change: 5.12, changeAmount: "€1.83", color: "bg-yellow-500", domain: "shibatoken.com" },
  { name: "NVIDIA", ticker: "NVDA", price: "€161,04", change: 1.45, changeAmount: "€2.30", color: "bg-green-500", domain: "nvidia.com" },
  { name: "Microsoft", ticker: "MSFT", price: "€337,01", change: -0.15, changeAmount: "€0.51", color: "bg-blue-500", domain: "microsoft.com" },
  { name: "Apple", ticker: "AAPL", price: "€224,50", change: 1.11, changeAmount: "€2.46", color: "bg-gray-400", domain: "apple.com" },
  { name: "Amazon", ticker: "AMZN", price: "€178,28", change: 2.80, changeAmount: "€4.87", color: "bg-orange-400", domain: "amazon.com" },
  { name: "Meta Platforms", ticker: "META", price: "€556,30", change: 1.69, changeAmount: "€9.23", color: "bg-blue-600", domain: "meta.com" },
  { name: "Tesla", ticker: "TSLA", price: "€349,39", change: 0.03, changeAmount: "€0.10", color: "bg-red-500", domain: "tesla.com" },
  { name: "Netflix", ticker: "NFLX", price: "€66,75", change: 2.16, changeAmount: "€1.41", color: "bg-red-700", domain: "netflix.com" },
  { name: "SAP SE", ticker: "SAP", price: "€173,80", change: 0.85, changeAmount: "€1.47", color: "bg-blue-800", domain: "sap.com" },
  { name: "ASML Holding", ticker: "ASML", price: "€1.255,60", change: -1.20, changeAmount: "€15.29", color: "bg-sky-600", domain: "asml.com" },
];
