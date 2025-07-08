import React, { useState, useEffect, useRef } from "react";
import { MapPin, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { leafletLocationService } from "@/services/leafletLocationService";
import LeafletMap from "./LeafletMap";

interface LocationDetectorProps {
  onLocationChange: (
    location: string,
    coordinates?: { lat: number; lng: number; accuracy?: number },
  ) => void;
  className?: string;
  showInTopBar?: boolean;
  defaultValue?: string;
  showMap?: boolean;
  onAddressSelect?: (
    address: string,
    coordinates: { lat: number; lng: number } | null,
  ) => void;
}

const LocationDetector: React.FC<LocationDetectorProps> = ({
  onLocationChange,
  onAddressSelect,
  className = "",
  showInTopBar = false,
}) => {
  const [currentLocation, setCurrentLocation] = useState<string>("");
  const [isDetecting, setIsDetecting] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect location on component mount
  useEffect(() => {
    detectCurrentLocation();
  }, []);

  const detectCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setError("Geolocation not supported.");
      return;
    }

    setIsDetecting(true);
    setError("");

    try {
      // Get current position using our service
      const coordinates = await leafletLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 60000,
      });

      // Reverse geocode to get address
      const address = await leafletLocationService.reverseGeocode(coordinates);

      setCurrentLocation(address);
      setSearchValue(address);
      onLocationChange(address, coordinates);

      // Call onAddressSelect if provided
      if (onAddressSelect) {
        onAddressSelect(address, {
          lat: coordinates.lat,
          lng: coordinates.lng,
        });
      }

      setIsDetecting(false);
    } catch (error) {
      setIsDetecting(false);
      const errorMessage =
        error instanceof Error ? error.message : "Location detection failed";
      setError(errorMessage);
      setCurrentLocation(errorMessage);
      onLocationChange(errorMessage);
    }
  };

  const handleSearchChange = async (value: string) => {
    setSearchValue(value);

    if (value.length > 2) {
      try {
        const suggestions =
          await leafletLocationService.getPlaceAutocomplete(value);
        setSuggestions(suggestions);
      } catch (error) {
        console.error("Error fetching autocomplete suggestions:", error);
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const selectSuggestion = (suggestion: any) => {
    setSearchValue(suggestion.description);
    setCurrentLocation(suggestion.description);
    setSuggestions([]);
    setIsOpen(false);

    // If suggestion has coordinates, use them
    if (suggestion.coordinates) {
      onLocationChange(suggestion.description, suggestion.coordinates);

      if (onAddressSelect) {
        onAddressSelect(suggestion.description, suggestion.coordinates);
      }
    } else {
      // Fallback to geocoding if no coordinates
      leafletLocationService
        .geocodeAddress(suggestion.description)
        .then((result) => {
          onLocationChange(suggestion.description, result.coordinates);

          if (onAddressSelect) {
            onAddressSelect(suggestion.description, result.coordinates);
          }
        })
        .catch((error) => {
          console.error("Error geocoding suggestion:", error);
          onLocationChange(suggestion.description);
        });
    }
  };

  const renderLocationBox = (
    <>
      <div className="flex items-center space-x-2">
        <Search className="w-4 h-4 text-gray-400" />
        <Input
          ref={searchInputRef}
          placeholder="Search for a location..."
          value={searchValue}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="flex-1"
        />
      </div>

      <Button
        onClick={detectCurrentLocation}
        disabled={isDetecting}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
      >
        <MapPin className="w-4 h-4 mr-2" />
        {isDetecting ? "Detecting..." : "Use Current Location"}
      </Button>

      {suggestions.length > 0 && (
        <div className="space-y-2 max-h-48 overflow-y-auto border rounded-lg">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => selectSuggestion(s)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
            >
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium">
                    {s.structured_formatting.main_text}
                  </p>
                  <p className="text-xs text-gray-500">
                    {s.structured_formatting.secondary_text}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {currentLocation && !isDetecting && (
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Selected:</strong> {currentLocation}
          </p>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
    </>
  );

  if (showInTopBar) {
    return (
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <div
            className={`flex items-center space-x-2 cursor-pointer ${className}`}
          >
            <MapPin className="w-4 h-4 text-white" />
            <span className="text-white text-sm truncate max-w-32 md:max-w-48">
              {isDetecting
                ? "Detecting..."
                : currentLocation || "Select location"}
            </span>
          </div>
        </PopoverTrigger>
        <PopoverContent className="w-80 p-4">
          {renderLocationBox}
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl p-6 shadow-lg border border-blue-100 ${className}`}
    >
      <h3 className="text-lg font-semibold text-gray-900 mb-3">
        📍 Select Location
      </h3>
      <div className="space-y-4">{renderLocationBox}</div>
    </div>
  );
};

export default LocationDetector;
