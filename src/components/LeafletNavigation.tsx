import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Navigation,
  MapPin,
  Route,
  Car,
  Clock,
  ExternalLink,
  AlertCircle,
} from "lucide-react";
import {
  leafletLocationService,
  type Coordinates,
} from "@/services/leafletLocationService";
import LeafletMap from "./LeafletMap";

interface LeafletNavigationProps {
  destination: {
    coordinates: Coordinates;
    address: string;
    name?: string;
  };
  origin?: Coordinates;
  onClose?: () => void;
  className?: string;
}

const LeafletNavigation: React.FC<LeafletNavigationProps> = ({
  destination,
  origin,
  onClose,
  className = "",
}) => {
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(
    origin || null,
  );
  const [isDetectingLocation, setIsDetectingLocation] =
    useState<boolean>(false);
  const [routeInfo, setRouteInfo] = useState<{
    distance: number;
    estimatedTime: number;
  } | null>(null);
  const [error, setError] = useState<string>("");

  // Auto-detect current location if not provided
  useEffect(() => {
    if (!origin) {
      detectCurrentLocation();
    }
  }, [origin]);

  // Calculate route when both locations are available
  useEffect(() => {
    if (currentLocation && destination.coordinates) {
      calculateRoute();
    }
  }, [currentLocation, destination.coordinates]);

  const detectCurrentLocation = async () => {
    setIsDetectingLocation(true);
    setError("");

    try {
      const coordinates = await leafletLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      });
      setCurrentLocation(coordinates);
    } catch (error) {
      console.error("Location detection failed:", error);
      setError(
        "Unable to detect your current location. Please enable location services.",
      );
    } finally {
      setIsDetectingLocation(false);
    }
  };

  const calculateRoute = () => {
    if (!currentLocation) return;

    try {
      // Calculate straight-line distance
      const distance = leafletLocationService.calculateDistance(
        currentLocation,
        destination.coordinates,
      );

      // Estimate travel time (assuming average city speed of 30 km/h)
      const estimatedTime = (distance / 30) * 60; // in minutes

      setRouteInfo({
        distance: parseFloat(distance.toFixed(2)),
        estimatedTime: Math.ceil(estimatedTime),
      });
    } catch (error) {
      console.error("Route calculation failed:", error);
      setError("Unable to calculate route information.");
    }
  };

  const openInExternalMaps = (service: "google" | "apple" | "osm") => {
    const { lat, lng } = destination.coordinates;
    let url = "";

    switch (service) {
      case "google":
        if (currentLocation) {
          url = `https://www.google.com/maps/dir/${currentLocation.lat},${currentLocation.lng}/${lat},${lng}`;
        } else {
          url = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
        }
        break;
      case "apple":
        url = `http://maps.apple.com/?daddr=${lat},${lng}`;
        if (currentLocation) {
          url += `&saddr=${currentLocation.lat},${currentLocation.lng}`;
        }
        break;
      case "osm":
        url = `https://www.openstreetmap.org/directions?from=${currentLocation?.lat || ""},${currentLocation?.lng || ""}&to=${lat},${lng}`;
        break;
    }

    if (url) {
      window.open(url, "_blank");
    }
  };

  const formatTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  // Prepare markers for the map
  const markers = [];

  if (currentLocation) {
    markers.push({
      position: currentLocation,
      title: "Your Location",
      content: `<div class="font-medium text-green-600">📍 Your Location</div>`,
    });
  }

  markers.push({
    position: destination.coordinates,
    title: destination.name || "Destination",
    content: `<div class="font-medium text-red-600">🎯 ${destination.name || "Destination"}</div><div class="text-sm text-gray-600">${destination.address}</div>`,
  });

  // Calculate map center (midpoint between origin and destination)
  const mapCenter = currentLocation
    ? {
        lat: (currentLocation.lat + destination.coordinates.lat) / 2,
        lng: (currentLocation.lng + destination.coordinates.lng) / 2,
      }
    : destination.coordinates;

  return (
    <Card className={`w-full max-w-4xl mx-auto ${className}`}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Route className="w-5 h-5" />
            Navigation to {destination.name || "Destination"}
          </h2>
          {onClose && (
            <Button variant="outline" onClick={onClose} size="sm">
              Close
            </Button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Route Information */}
        {routeInfo && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Route className="w-4 h-4 text-blue-600" />
                <span className="font-medium">{routeInfo.distance} km</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="font-medium">
                  ~{formatTime(routeInfo.estimatedTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Car className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">Estimated driving time</span>
              </div>
            </div>
          </div>
        )}

        {/* Destination Information */}
        <div className="mb-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="w-5 h-5 text-red-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-gray-900">
                {destination.name || "Destination"}
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {destination.address}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {destination.coordinates.lat.toFixed(6)},{" "}
                {destination.coordinates.lng.toFixed(6)}
              </p>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="mb-6">
          <LeafletMap
            center={mapCenter}
            zoom={currentLocation ? 12 : 15}
            markers={markers}
            height="400px"
            className="rounded-lg border"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Location Detection */}
          {!currentLocation && (
            <Button
              onClick={detectCurrentLocation}
              disabled={isDetectingLocation}
              variant="outline"
              className="w-full"
            >
              <Navigation className="w-4 h-4 mr-2" />
              {isDetectingLocation
                ? "Detecting Location..."
                : "Detect My Location"}
            </Button>
          )}

          {/* External Navigation Options */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Button
              onClick={() => openInExternalMaps("google")}
              className="flex items-center gap-2"
              variant="default"
            >
              <ExternalLink className="w-4 h-4" />
              Google Maps
            </Button>

            <Button
              onClick={() => openInExternalMaps("apple")}
              className="flex items-center gap-2"
              variant="outline"
            >
              <ExternalLink className="w-4 h-4" />
              Apple Maps
            </Button>

            <Button
              onClick={() => openInExternalMaps("osm")}
              className="flex items-center gap-2"
              variant="outline"
            >
              <ExternalLink className="w-4 h-4" />
              OpenStreetMap
            </Button>
          </div>
        </div>

        {/* Info Note */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>
            🗺️ Route calculations use straight-line distance. For turn-by-turn
            navigation, use external map apps.
          </p>
        </div>
      </div>
    </Card>
  );
};

export default LeafletNavigation;
