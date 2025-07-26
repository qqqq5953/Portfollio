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

export { fetchExchangeRate, fetchClosingPrice };