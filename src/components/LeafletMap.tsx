import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix for default markers in Leaflet with Vite
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import markerRetina from "leaflet/dist/images/marker-icon-2x.png";

// Configure default icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerRetina,
  shadowUrl: markerShadow,
});

export interface LeafletMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{
    position: { lat: number; lng: number };
    title?: string;
    content?: string;
  }>;
  onLocationSelect?: (coordinates: { lat: number; lng: number }) => void;
  height?: string;
  className?: string;
}

const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  zoom = 13,
  markers = [],
  onLocationSelect,
  height = "300px",
  className = "",
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize map
    mapInstanceRef.current = L.map(mapRef.current).setView(
      [center.lat, center.lng],
      zoom,
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(mapInstanceRef.current);

    // Add click handler for location selection
    if (onLocationSelect) {
      mapInstanceRef.current.on("click", (e: L.LeafletMouseEvent) => {
        onLocationSelect({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        });
      });
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update map center when props change
  useEffect(() => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([center.lat, center.lng], zoom);
    }
  }, [center.lat, center.lng, zoom]);

  // Update markers when props change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach((marker) => {
      mapInstanceRef.current?.removeLayer(marker);
    });
    markersRef.current = [];

    // Add new markers
    markers.forEach((markerData) => {
      if (!mapInstanceRef.current) return;

      const marker = L.marker([
        markerData.position.lat,
        markerData.position.lng,
      ]).addTo(mapInstanceRef.current);

      if (markerData.title) {
        marker.bindTooltip(markerData.title);
      }

      if (markerData.content) {
        marker.bindPopup(markerData.content);
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-lg overflow-hidden ${className}`}
      style={{ height }}
    />
  );
};

export default LeafletMap;
