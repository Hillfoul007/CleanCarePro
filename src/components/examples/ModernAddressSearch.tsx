import React, { useState, useCallback, useRef, useEffect } from "react";
import { debounce } from "lodash";
import {
  autocompleteSuggestionService,
  searchPlacesInIndia,
  AutocompletePrediction,
} from "@/utils/autocompleteSuggestionService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Search, Loader2 } from "lucide-react";

/**
 * Example component demonstrating the new AutocompleteSuggestion API usage
 * This replaces the deprecated AutocompleteService implementation
 */
export const ModernAddressSearch: React.FC = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<any>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionTokenRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Initialize session token
  useEffect(() => {
    const initializeService = async () => {
      try {
        await autocompleteSuggestionService.initialize();
        sessionTokenRef.current =
          autocompleteSuggestionService.createSessionToken();
      } catch (err) {
        console.error("Failed to initialize autocomplete service:", err);
        setError("Failed to initialize address search");
      }
    };

    initializeService();
  }, []);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        // Use the utility service for searching in India
        const results = await searchPlacesInIndia(
          searchQuery,
          sessionTokenRef.current,
        );
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (err) {
        console.error("Search error:", err);
        setError("Failed to search addresses");
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setIsLoading(false);
      }
    }, 300),
    [],
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    debouncedSearch(value);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = async (suggestion: AutocompletePrediction) => {
    setQuery(suggestion.description);
    setShowSuggestions(false);
    setIsLoading(true);

    try {
      // Get detailed place information
      const placeDetails = await autocompleteSuggestionService.getPlaceDetails(
        suggestion.place_id,
      );
      setSelectedPlace(placeDetails);

      // Create new session token for next search
      sessionTokenRef.current =
        autocompleteSuggestionService.createSessionToken();
    } catch (err) {
      console.error("Failed to get place details:", err);
      setError("Failed to get place details");
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search
  const handleClear = () => {
    setQuery("");
    setSuggestions([]);
    setSelectedPlace(null);
    setShowSuggestions(false);
    setError(null);
    sessionTokenRef.current =
      autocompleteSuggestionService.createSessionToken();
    inputRef.current?.focus();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Modern Address Search
        </h3>
        <p className="text-sm text-gray-600">
          Using Google Maps AutocompleteSuggestion API
        </p>
      </div>

      {/* Search Input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search for an address in India..."
            value={query}
            onChange={handleInputChange}
            className="pl-10 pr-12"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
          )}
        </div>

        {/* Clear Button */}
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          >
            ×
          </Button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-3">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Suggestions List */}
      {showSuggestions && suggestions.length > 0 && (
        <Card className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto">
          <CardContent className="p-0">
            {suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 transition-colors"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {suggestion.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Selected Place Details */}
      {selectedPlace && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-semibold mb-2">Selected Place</h4>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Name:</strong> {selectedPlace.name}
              </p>
              <p>
                <strong>Address:</strong> {selectedPlace.formatted_address}
              </p>
              {selectedPlace.geometry?.location && (
                <p>
                  <strong>Coordinates:</strong>{" "}
                  {selectedPlace.geometry.location.lat()},{" "}
                  {selectedPlace.geometry.location.lng()}
                </p>
              )}
              <p>
                <strong>Place ID:</strong> {selectedPlace.place_id}
              </p>
              {selectedPlace.types && (
                <p>
                  <strong>Types:</strong> {selectedPlace.types.join(", ")}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Status */}
      <div className="text-xs text-gray-500 text-center">
        Service Status:{" "}
        {autocompleteSuggestionService.isReady() ? (
          <span className="text-green-600">✓ Ready</span>
        ) : (
          <span className="text-orange-600">⚠ Initializing</span>
        )}
      </div>
    </div>
  );
};

export default ModernAddressSearch;
