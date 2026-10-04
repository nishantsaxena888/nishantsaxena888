"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type GoogleSuggestion = {
  description: string;
  placeId: string;
};

export type UseGoogleAutocompleteReturn = {
  isLoaded: boolean;
  loadError: string | null;
  getSuggestions: (input: string) => Promise<GoogleSuggestion[]>;
  getPlaceDetails: (placeId: string) => Promise<any | null>;
};

export const useGoogleAutocomplete = (apiKey: string): UseGoogleAutocompleteReturn => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const autocompleteService = useRef<any>(null);
  const geocoder = useRef<any>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    // 🔥 MOCK MODE FOR PLAYGROUND
    if (!apiKey || apiKey === "mock") {
      setIsLoaded(true);
      return;
    }

    if ((window as any).google?.maps?.places) {
      setIsLoaded(true);
      return;
    }

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    const handleLoad = () => setIsLoaded(true);
    const handleError = () => setLoadError("Failed to load Google Maps API");

    script.addEventListener("load", handleLoad);
    script.addEventListener("error", handleError);

    return () => {
      script.removeEventListener("load", handleLoad);
      script.removeEventListener("error", handleError);
    };
  }, [apiKey]);

  useEffect(() => {
    // Only initialize real Google instances if we're not in mock mode
    if (isLoaded && (window as any).google && apiKey && apiKey !== "mock") {
      autocompleteService.current = new (window as any).google.maps.places.AutocompleteService();
      geocoder.current = new (window as any).google.maps.Geocoder();
    }
  }, [isLoaded, apiKey]);

  const getSuggestions = useCallback(
    async (input: string): Promise<GoogleSuggestion[]> => {
      // 🔥 MOCK MODE
      if (!apiKey || apiKey === "mock") {
        if (!input) return [];
        // Simulate network delay
        await new Promise(r => setTimeout(r, 300));
        return [
          { description: `123 ${input} Street, New York, NY`, placeId: `mock_id_1` },
          { description: `456 ${input} Avenue, San Francisco, CA`, placeId: `mock_id_2` },
          { description: `789 ${input} Boulevard, Austin, TX`, placeId: `mock_id_3` }
        ];
      }

      if (!autocompleteService.current || !input) return [];

      return new Promise((resolve) => {
        autocompleteService.current?.getPlacePredictions(
          { input, types: ["address"] },
          (predictions: any, status: any) => {
            if (status !== "OK" || !predictions) {
              resolve([]);
              return;
            }
            resolve(
              predictions.map((p: any) => ({
                description: p.description,
                placeId: p.place_id,
              }))
            );
          }
        );
      });
    },
    [apiKey]
  );

  const getPlaceDetails = useCallback(
    async (placeId: string): Promise<any | null> => {
      // 🔥 MOCK MODE
      if (!apiKey || apiKey === "mock") {
        await new Promise(r => setTimeout(r, 300));
        
        let city = "New York";
        let state = "NY";
        let zip = "10001";
        
        if (placeId === "mock_id_2") { city = "San Francisco"; state = "CA"; zip = "94105"; }
        if (placeId === "mock_id_3") { city = "Austin"; state = "TX"; zip = "73301"; }

        return {
          address_components: [
            { long_name: "Mock", short_name: "Mock", types: ["street_number"] },
            { long_name: "Street", short_name: "St", types: ["route"] },
            { long_name: city, short_name: city, types: ["locality"] },
            { long_name: state, short_name: state, types: ["administrative_area_level_1"] },
            { long_name: zip, short_name: zip, types: ["postal_code"] },
            { long_name: "United States", short_name: "US", types: ["country"] },
          ]
        };
      }

      if (!geocoder.current) return null;

      return new Promise((resolve) => {
        geocoder.current?.geocode({ placeId }, (results: any, status: any) => {
          if (status !== "OK" || !results || results.length === 0) {
            resolve(null);
            return;
          }
          resolve(results[0]);
        });
      });
    },
    [apiKey]
  );

  return { isLoaded, loadError, getSuggestions, getPlaceDetails };
};
