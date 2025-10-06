export const portfolioData = {
  totalValue: 850000,
  currency: "THB",
  monthlyIncome: 6800,
  annualYield: 0.096,
  assetAllocation: {
    thaiStocks: {
      value: 255000,
      percentage: 30,
      monthlyIncome: 850,
      name: "Thai Stocks",
      color: "hsl(217 91% 60%)",
      icon: "TrendingUp",
      yield: 0.04,
      holdings: [
        { symbol: "PTT", name: "PTT Public Company", shares: 500, price: 38.5 },
        { symbol: "KBANK", name: "Kasikornbank", shares: 800, price: 142.5 },
        { symbol: "CPALL", name: "CP All", shares: 1200, price: 68.0 }
      ]
    },
    reits: {
      value: 212500,
      percentage: 25,
      monthlyIncome: 1417,
      name: "REITs",
      color: "hsl(142 76% 36%)",
      icon: "Building2",
      yield: 0.08,
      holdings: [
        { symbol: "CPNREIT", name: "CPN Retail Growth", units: 5000, price: 32.5 },
        { symbol: "WHAREM", name: "WHA Industrial REIT", units: 3000, price: 18.0 }
      ]
    },
    gold: {
      value: 127500,
      percentage: 15,
      monthlyIncome: 0,
      name: "Gold",
      color: "hsl(38 92% 50%)",
      icon: "Coins",
      yield: 0.0,
      holdings: [
        { type: "Physical Gold", weight: 42.5, unit: "oz", pricePerOz: 3000 }
      ]
    },
    bonds: {
      value: 127500,
      percentage: 15,
      monthlyIncome: 319,
      name: "Bonds",
      color: "hsl(220 18% 18%)",
      icon: "FileText",
      yield: 0.03,
      holdings: [
        { name: "Thai Government Bond 10Y", faceValue: 100000, coupon: 0.03, maturity: "2034" },
        { name: "Corporate Bond BBB+", faceValue: 27500, coupon: 0.045, maturity: "2029" }
      ]
    },
    forex: {
      value: 85000,
      percentage: 10,
      monthlyIncome: 142,
      name: "Forex",
      color: "hsl(280 65% 60%)",
      icon: "DollarSign",
      yield: 0.02,
      holdings: [
        { pair: "USD/THB", position: 2500, rate: 34.0, type: "Carry Trade" }
      ]
    },
    crypto: {
      value: 42500,
      percentage: 5,
      monthlyIncome: 283,
      name: "Crypto",
      color: "hsl(30 100% 50%)",
      icon: "Bitcoin",
      yield: 0.08,
      holdings: [
        { symbol: "BTC", name: "Bitcoin", amount: 0.012, price: 2900000, staking: false },
        { symbol: "ETH", name: "Ethereum", amount: 0.15, price: 95000, staking: true, stakingYield: 0.045 }
      ]
    }
  }
};
