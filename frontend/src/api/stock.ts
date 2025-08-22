import { fetcher } from ".";

async function fetchExchangeRate(date: string | undefined) {
  const timestamp = date? Math.floor(new Date(date).getTime() / 1000): Date.now() / 1000;
  return fetcher.get<{
    statusCode: number;
    message: string;
    data: {
      s: string;
      t: number[];
      o: number[];
      h: number[];
      l: number[];
      c: number[];
      v: number[];
      vwap: number[];
      quote: null;
      session: [number[], number[]];
      nextTime: number | null;
    };
  }>(`https://ws.api.cnyes.com/ws/api/v1/charting/history?symbol=FX:USDTWD&resolution=D&from=${timestamp}&to=${timestamp}`);
}

async function fetchClosingPrice({
  symbol,
  date,
}: {
  symbol: string;
  date: string;
}){
  const timestamp = Date.parse(date);
  return fetcher.get<{
    quotes: {
      adjclose: number;
      close: number;
      date: string;
      high: number;
      low: number;
      open: number;
      volume: number;
    }[];
  }>(`/api/historical?symbol=${symbol.toUpperCase()}&start=${timestamp}&end=${timestamp + 86400000}`);
}

async function fetchStockInfo(symbol: string) {
  return fetcher.get<{
    statusCode: number;
    message: string;
    data: {
      0: string;
      6: number; // current price
      11: number;
      21: number;
      56: number; // current p/l percentage
      200007: number; // timestamp
      200009: string; // name
      200010: string; // symbol
      200013: number;
      200025: number;
      200061: string; // security type
      200232: string;
      800001: number;
      800002: number;
      800013: string;
      800041: number;
    }[]
  }>(`https://ws.api.cnyes.com/ws/api/v1/quote/quotes/USS:${symbol}:STOCK?column=E`);
}

export { fetchExchangeRate, fetchClosingPrice, fetchStockInfo };