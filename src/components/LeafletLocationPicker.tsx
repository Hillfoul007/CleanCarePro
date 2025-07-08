import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MapPin, Search, Navigation, Home, AlertCircle } from "lucide-react";
import { useLocation } from "@/hooks/useLocation";
import {
  leafletLocationService,
  type Coordinates,
} from "@/services/leafletLocationService";
import LeafletMap from "./LeafletMap";

interface LeafletLocationPickerProps {
  onLocationSelect: (
    coordinates: Coordinates,
    address: string,
    houseDetails?: {
      houseNumber: string;
      building: string;
      cleanedAddress: string;
    },
  ) => void;
  onClose?: () => void;
  defaultCoordinates?: Coordinates;
  markersClickable?: boolean;
  title?: string;
  className?: string;
}

const LeafletLocationPicker: React.FC<LeafletLocationPickerProps> = ({
  onLocationSelect,
  onClose,
  defaultCoordinates,
  markersClickable = true,
  title = "Select Delivery Location",
  className = "",
}) => {
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<Coordinates | null>(defaultCoordinates || null);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] =
    useState<boolean>(false);
  const [isGeocodingAddress, setIsGeocodingAddress] = useState<boolean>(false);
  const [mapCenter, setMapCenter] = useState<Coordinates>(
    defaultCoordinates || { lat: 28.6139, lng: 77.209 }, // Default to Delhi
  );

  const {
    location: currentLocation,
    getCurrentLocation,
    isLoading: isDetectingLocation,
    error: locationError,
  } = useLocation({
    autoDetect: false,
    autoGeocoding: true,
  });

  // Auto-detect location on component mount if no default coordinates
  useEffect(() => {
    if (!defaultCoordinates) {
      handleDetectCurrentLocation();
    }
  }, [defaultCoordinates]);

  // Update selected coordinates when current location changes
  useEffect(() => {
    if (currentLocation?.coordinates && !selectedCoordinates) {
      const coordinates = {
        lat: currentLocation.coordinates.lat,
        lng: currentLocation.coordinates.lng,
      };
      setSelectedCoordinates(coordinates);
      setMapCenter(coordinates);

      if (currentLocation.address) {
        setSelectedAddress(currentLocation.address);
      }
    }
  }, [currentLocation, selectedCoordinates]);

  const handleDetectCurrentLocation = async () => {
    try {
      const location = await getCurrentLocation();
      if (location?.coordinates) {
        const coordinates = {
          lat: location.coordinates.lat,
          lng: location.coordinates.lng,
        };
        setSelectedCoordinates(coordinates);
        setMapCenter(coordinates);

        if (location.address) {
          setSelectedAddress(location.address);
        }
      }
    } catch (error) {
      console.error("Failed to detect current location:", error);
    }
  };

  const handleMapLocationSelect = async (coordinates: Coordinates) => {
    setSelectedCoordinates(coordinates);
    setIsGeocodingAddress(true);

    try {
      const address = await leafletLocationService.reverseGeocode(coordinates);
      setSelectedAddress(address);
    } catch (error) {
      console.error("Reverse geocoding failed:", error);
      setSelectedAddress(
        `${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`,
      );
    } finally {
      setIsGeocodingAddress(false);
    }
  };

  const handleSearchChange = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const results = await leafletLocationService.getPlaceAutocomplete(
        query,
        selectedCoordinates || mapCenter,
      );
      setSuggestions(results);
    } catch (error) {
      console.error("Autocomplete search failed:", error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: any) => {
    setSearchQuery(suggestion.description);
    setSuggestions([]);

    if (suggestion.coordinates) {
      setSelectedCoordinates(suggestion.coordinates);
      setMapCenter(suggestion.coordinates);
      setSelectedAddress(suggestion.description);
    } else {
      // Geocode the address
      try {
        const result = await leafletLocationService.geocodeAddress(
          suggestion.description,
        );
        setSelectedCoordinates(result.coordinates);
        setMapCenter(result.coordinates);
        setSelectedAddress(result.formatted_address);
      } catch (error) {
        console.error("Geocoding failed:", error);
      }
    }
  };

  const handleConfirmLocation = () => {
    if (selectedCoordinates && selectedAddress) {
      // Extract house details if possible
      const houseDetails =
        leafletLocationService.extractHouseNumber(selectedAddress);

      onLocationSelect(selectedCoordinates, selectedAddress, houseDetails);
    }
  };

  // Prepare markers for the map
  const markers = selectedCoordinates
    ? [
        {
          position: selectedCoordinates,
          title: "Selected Location",
          content: `<div class="font-medium">Selected Location</div><div class="text-sm text-gray-600">${selectedAddress || "Loading address..."}</div>`,
        },
      ]
    : [];

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            {title}
          </h2>
          {onClose && (
            <Button variant="outline" onClick={onClose} size="sm">
              Cancel
            </Button>
          )}
        </div>

        {/* Search Input */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search for a location..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-10"
            />
            {isLoadingSuggestions && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
          </div>

          {/* Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionSelect(suggestion)}
                  className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0 flex items-start gap-2"
                >
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">
                      {suggestion.structured_formatting.main_text}
                    </p>
                    <p className="text-xs text-gray-500">
                      {suggestion.structured_formatting.secondary_text}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="mb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleDetectCurrentLocation}
            disabled={isDetectingLocation}
            className="flex items-center gap-2"
          >
            <Navigation className="w-4 h-4" />
            {isDetectingLocation ? "Detecting..." : "Use Current Location"}
          </Button>
        </div>

        {/* Location Error */}
        {locationError && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{locationError}</AlertDescription>
          </Alert>
        )}

        {/* Map */}
        <div className="mb-4">
          <LeafletMap
            center={mapCenter}
            zoom={15}
            markers={markers}
            onLocationSelect={
              markersClickable ? handleMapLocationSelect : undefined
            }
            height="400px"
            className="rounded-lg border"
          />
        </div>

        {/* Selected Location Info */}
        {selectedCoordinates && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Home className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-blue-900">Selected Location</h3>
                <p className="text-sm text-blue-700 mt-1">
                  {isGeocodingAddress ? "Loading address..." : selectedAddress}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Coordinates: {selectedCoordinates.lat.toFixed(6)},{" "}
                  {selectedCoordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button
            onClick={handleConfirmLocation}
            disabled={
              !selectedCoordinates || !selectedAddress || isGeocodingAddress
            }
            className="bg-blue-600 hover:bg-blue-700"
          >
            Confirm Location
          </Button>
        </div>

        {/* Service Info */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>🗺️ Using OpenStreetMap - Free and accurate mapping service</p>
        </div>
      </div>
    </Card>
  );
};

export default LeafletLocationPicker;
