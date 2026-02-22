/**
 * useLivePrices — fetches real-time EUR prices from CoinGecko (no API key required).
 *
 * Usage:
 *   const { prices, loading } = useLivePrices(["bitcoin", "ethereum", "shiba-inu"]);
 *   prices["bitcoin"] → { eur: 84230.5, eur_24h_change: -1.2 }
 */

import { useState, useEffect, useRef } from "react";

const COINGECKO_BASE = "https://api.coingecko.com/api/v3";
const CACHE_TTL_MS   = 60_000; // refresh every 60 seconds

interface PriceEntry {
  eur: number;
  eur_24h_change: number;
}

interface PriceMap {
  [coinId: string]: PriceEntry;
}

const cache: { data: PriceMap; fetchedAt: number } | null = null;
let cacheRef = cache;

export function useLivePrices(coinIds: string[]) {
  const [prices, setPrices] = useState<PriceMap>({});
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState(false);
  const ids = coinIds.join(",");
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!ids) return;

    const fetchPrices = async () => {
      // Serve from cache if still fresh
      if (cacheRef && Date.now() - cacheRef.fetchedAt < CACHE_TTL_MS) {
        setPrices(cacheRef.data);
        setLoading(false);
        return;
      }

      try {
        const url =
          `${COINGECKO_BASE}/simple/price` +
          `?ids=${ids}&vs_currencies=eur&include_24hr_change=true`;
        const res  = await fetch(url);
        if (!res.ok) throw new Error(`CoinGecko ${res.status}`);
        const json = await res.json();

        // Normalise shape
        const data: PriceMap = {};
        for (const id of coinIds) {
          if (json[id]) {
            data[id] = {
              eur:            json[id].eur           ?? 0,
              eur_24h_change: json[id].eur_24h_change ?? 0,
            };
          }
        }

        cacheRef = { data, fetchedAt: Date.now() };
        if (mountedRef.current) {
          setPrices(data);
          setError(false);
        }
      } catch (e) {
        console.warn("[useLivePrices] fetch failed — using stale/empty data", e);
        if (mountedRef.current) setError(true);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    fetchPrices();
    const interval = setInterval(fetchPrices, CACHE_TTL_MS);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return { prices, loading, error };
}
