import React, { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Search,
  MapPin,
  Navigation,
  Home,
  Building2,
  MapIcon,
  Phone,
  User,
} from "lucide-react";
import { locationService, Coordinates } from "@/services/locationService";
import { leafletLocationService } from "@/services/leafletLocationService";
import LeafletLocationPicker from "@/components/LeafletLocationPicker";

// Add CSS for bounce animation
const bounceAnimation = `
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% {
      transform: translateY(0);
    }
    40% {
      transform: translateY(-10px);
    }
    60% {
      transform: translateY(-5px);
    }
  }
`;

// Add style element to document head
if (
  typeof document !== "undefined" &&
  !document.querySelector("#bounce-animation-styles")
) {
  const style = document.createElement("style");
  style.id = "bounce-animation-styles";
  style.textContent = bounceAnimation;
  document.head.appendChild(style);
}

interface AddressData {
  flatNo: string;
  street: string;
  landmark: string;
  village: string;
  city: string;
  pincode: string;
  fullAddress: string;
  coordinates?: Coordinates;
  label?: string;
  type: "home" | "office" | "other";
  phone?: string;
  name?: string;
}

interface ZomatoAddAddressPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: AddressData) => void;
  currentUser?: any;
  editingAddress?: AddressData | null;
}

const ZomatoAddAddressPage: React.FC<ZomatoAddAddressPageProps> = ({
  isOpen,
  onClose,
  onSave,
  currentUser,
  editingAddress,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [locationAttempt, setLocationAttempt] = useState(0);
  const [selectedLocation, setSelectedLocation] = useState<{
    address: string;
    coordinates: Coordinates;
  } | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState("");
  const [flatNo, setFlatNo] = useState("");
  const [floor, setFloor] = useState("");
  const [building, setBuilding] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [area, setArea] = useState("");
  const [pincode, setPincode] = useState("");

  // Auto-update full address when individual fields change
  useEffect(() => {
    const buildFullAddress = () => {
      const parts = [
        flatNo && `${flatNo}`,
        building && `${building}`,
        street && `${street}`,
        landmark && `${landmark}`,
        area && `${area}`, // This now contains the merged area/city information
        pincode && `${pincode}`,
      ].filter(Boolean);

      if (parts.length > 0) {
        const fullAddress = parts.join(", ");
        setSearchQuery(fullAddress);
        setSelectedLocation({
          address: fullAddress,
          coordinates: selectedLocation?.coordinates || { lat: 0, lng: 0 },
        });
      }
    };

    buildFullAddress();
  }, [flatNo, building, street, landmark, area, pincode]); // Removed city from dependencies
  const [addressType, setAddressType] = useState<"home" | "office" | "other">(
    "home",
  );
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Initialize location picker when opened
  useEffect(() => {
    if (isOpen) {
      setShowLocationPicker(true);
    }
  }, [isOpen]);

  // Handle clicking outside suggestions to close them
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        searchInputRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showSuggestions]);

  const handleLocationSelect = (
    coordinates: any,
    address: string,
    houseDetails?: any,
  ) => {
    setSelectedLocation({ address, coordinates });
    setSearchQuery(address);
    autoFillAddressFields(address);
    setShowLocationPicker(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Only populate if editing an existing address
      if (editingAddress) {
        setSearchQuery(editingAddress.fullAddress);
        setSelectedLocation({
          address: editingAddress.fullAddress,
          coordinates: editingAddress.coordinates || { lat: 0, lng: 0 },
        });
        setAdditionalDetails(editingAddress.flatNo || "");
        setAddressType(editingAddress.type);
        setReceiverName(editingAddress.name || "");
        setReceiverPhone(editingAddress.phone || "");

        // Location will be handled by LeafletLocationPicker when opened
      } else {
        // Clear all fields for new address and autofill from account
        setSearchQuery("");
        setSelectedLocation(null);
        setAdditionalDetails("");
        setAddressType("home");

        // Autofill receiver details from current user account
        if (currentUser) {
          setReceiverName(currentUser.name || currentUser.full_name || "");
          setReceiverPhone(currentUser.phone || "");
        } else {
          setReceiverName("");
          setReceiverPhone("");
        }
      }
    }
  }, [isOpen, editingAddress, currentUser]);

  const handleCurrentLocation = async () => {
    setIsDetectingLocation(true);

    try {
      console.log("📍 Detecting current location...");

      // Use Leaflet location service for current position
      const coordinates = await leafletLocationService.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      });

      // Get address using Leaflet service
      const address = await leafletLocationService.reverseGeocode(coordinates);
      console.log("🏠 Geocoded address:", address);

      setSelectedLocation({ address, coordinates });
      setSearchQuery(address);
      autoFillAddressFields(address);
    } catch (error) {
      console.error("❌ Location detection failed:", error);

      // Fallback to Delhi, India
      const fallbackAddress = "New Delhi, India";
      const fallbackCoordinates = { lat: 28.6139, lng: 77.209 };

      setSelectedLocation({
        address: fallbackAddress,
        coordinates: fallbackCoordinates,
      });
      setSearchQuery(fallbackAddress);
      autoFillAddressFields(fallbackAddress);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Enhanced auto-fill using detailed address components
  const autoFillAddressFieldsFromComponents = (components: any) => {
    console.log("🔧 Auto-filling from detailed components:", components);

    if (!components.address_components) {
      autoFillAddressFields(components.formatted_address || "");
      return;
    }

    const addressComponents = components.address_components;
    let extractedData = {
      street_number: "",
      route: "",
      neighborhood: "",
      sublocality: "",
      locality: "",
      area: "",
      postal_code: "",
    };

    // Extract components
    addressComponents.forEach((component: any) => {
      const types = component.types;
      const longName = component.long_name;

      if (types.includes("street_number")) {
        extractedData.street_number = longName;
      } else if (types.includes("route")) {
        extractedData.route = longName;
      } else if (
        types.includes("neighborhood") ||
        types.includes("sublocality_level_2")
      ) {
        extractedData.neighborhood = longName;
      } else if (
        types.includes("sublocality_level_1") ||
        types.includes("sublocality")
      ) {
        extractedData.sublocality = longName;
      } else if (types.includes("locality")) {
        extractedData.locality = longName;
      } else if (types.includes("administrative_area_level_3")) {
        extractedData.area = longName;
      } else if (types.includes("postal_code")) {
        extractedData.postal_code = longName;
      }
    });

    // Auto-fill form fields with extracted data
    if (extractedData.street_number && !flatNo) {
      setFlatNo(extractedData.street_number);
    }

    if (extractedData.route && !street) {
      setStreet(extractedData.route);
    }

    // Combine area information from multiple sources
    const areaComponents = [
      extractedData.neighborhood,
      extractedData.sublocality,
      extractedData.area,
      extractedData.locality,
    ].filter(Boolean);

    if (areaComponents.length > 0 && !area) {
      setArea(areaComponents.join(", "));
    }

    if (extractedData.postal_code && !pincode) {
      setPincode(extractedData.postal_code);
    }

    console.log("✅ Form auto-filled with detailed components");
  };

  // Check if address has street-level details
  const hasStreetLevelDetails = (address: string, components: any) => {
    if (!address && !components) return false;

    // Check for street number and road name indicators
    const hasStreetNumber = components?.address_components?.some((comp: any) =>
      comp.types.includes("street_number"),
    );

    const hasRoute = components?.address_components?.some((comp: any) =>
      comp.types.includes("route"),
    );

    // Check address string for street-level patterns
    const streetPatterns = [
      /\b\d+[A-Z]?\s+(Street|St|Road|Rd|Lane|Ln|Avenue|Ave|Marg|Block)\b/i,
      /\b(House|Plot|Door|Flat)\s+(No\.?\s*)?\d+/i,
      /^\s*\d+[A-Z]?[\s,-]/,
      /\b\d+[A-Z]?\s+[A-Z][A-Za-z\s]+(Road|Street|Marg|Lane|Block|Gali)/i,
    ];

    const hasStreetPattern = streetPatterns.some((pattern) =>
      pattern.test(address),
    );

    console.log("🔍 Street details check:", {
      hasStreetNumber,
      hasRoute,
      hasStreetPattern,
      address: address?.substring(0, 50),
    });

    return hasStreetNumber || hasRoute || hasStreetPattern;
  };

  // Enhanced street-level detail discovery
  const getStreetLevelDetails = async (coordinates: Coordinates) => {
    try {
      // Try multiple nearby points for better street detection
      const searchRadiusInDegrees = 0.0001; // ~10 meters
      const nearbyPoints = [
        coordinates, // Original point
        { lat: coordinates.lat + searchRadiusInDegrees, lng: coordinates.lng }, // North
        { lat: coordinates.lat - searchRadiusInDegrees, lng: coordinates.lng }, // South
        { lat: coordinates.lat, lng: coordinates.lng + searchRadiusInDegrees }, // East
        { lat: coordinates.lat, lng: coordinates.lng - searchRadiusInDegrees }, // West
      ];

      for (const point of nearbyPoints) {
        try {
          const components =
            await locationService.getDetailedAddressComponents(point);
          if (components?.address_components) {
            const hasStreet = components.address_components.some(
              (comp: any) =>
                comp.types.includes("street_number") ||
                comp.types.includes("route"),
            );

            if (hasStreet) {
              const enhancedAddress =
                await locationService.reverseGeocode(point);
              console.log(
                "✅ Found street details at nearby point:",
                enhancedAddress,
              );
              return { address: enhancedAddress, components };
            }
          }
        } catch (error) {
          console.warn("Nearby point search failed:", error);
          continue;
        }
      }

      // If no nearby points worked, try new Places API for nearby streets
      if ((window as any).google?.maps?.places) {
        try {
          // Use modern Place API for nearby search
          const { Place } = await (window as any).google.maps.importLibrary(
            "places",
          );

          // Create a search request using the new Places API
          const request = {
            textQuery: `street near ${coordinates.lat},${coordinates.lng}`,
            fields: ["displayName", "formattedAddress", "location"],
            locationBias: {
              center: { lat: coordinates.lat, lng: coordinates.lng },
              radius: 100, // 100 meter radius
            },
            maxResultCount: 1,
          };

          // Use the new Places API text search
          const { places } = await (
            window as any
          ).google.maps.places.Place.searchByText(request);

          if (places && places.length > 0) {
            const nearbyPlace = places[0];
            console.log(
              "✅ Found nearby place via new Places API:",
              nearbyPlace.displayName || nearbyPlace.formattedAddress,
            );
            return {
              address: nearbyPlace.displayName || nearbyPlace.formattedAddress,
              components: null,
            };
          }

          return null;
        } catch (error) {
          console.warn("New Places API search failed, using fallback:", error);

          // Fallback to legacy PlacesService if new API fails
          try {
            const service = new (
              window as any
            ).google.maps.places.PlacesService(document.createElement("div"));
            const request = {
              location: new (window as any).google.maps.LatLng(
                coordinates.lat,
                coordinates.lng,
              ),
              radius: 50, // 50 meter radius
              type: "street_address",
            };

            return new Promise((resolve) => {
              service.nearbySearch(request, (results: any, status: any) => {
                if (
                  status ===
                    (window as any).google.maps.places.PlacesServiceStatus.OK &&
                  results &&
                  results.length > 0
                ) {
                  const nearbyStreet = results[0];
                  console.log(
                    "✅ Found nearby street via legacy Places API:",
                    nearbyStreet.vicinity,
                  );
                  resolve({
                    address: nearbyStreet.vicinity || nearbyStreet.name,
                    components: null,
                  });
                } else {
                  resolve(null);
                }
              });
            });
          } catch (fallbackError) {
            console.warn("Legacy Places API also failed:", fallbackError);
            return null;
          }
        }
      }
    } catch (error) {
      console.error("Street-level detail discovery failed:", error);
    }

    return null;
  };

  // Browser geolocation fallback (replaces ipapi.co to fix CORS issues)
  const getBrowserLocation = async () => {
    try {
      return new Promise<{ coordinates: Coordinates; address: string } | null>(
        (resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error("Geolocation is not supported by this browser"));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                const coordinates = {
                  lat: position.coords.latitude,
                  lng: position.coords.longitude,
                };

                // Use Google Maps Geocoding to get address
                if (mapInstance) {
                  const geocoder = new google.maps.Geocoder();
                  geocoder.geocode(
                    { location: coordinates },
                    (results, status) => {
                      if (status === "OK" && results && results[0]) {
                        const address = results[0].formatted_address;
                        console.log("🌐 Browser location found:", {
                          coordinates,
                          address,
                        });
                        resolve({ coordinates, address });
                      } else {
                        console.warn("Geocoding failed:", status);
                        resolve({ coordinates, address: "Current Location" });
                      }
                    },
                  );
                } else {
                  resolve({ coordinates, address: "Current Location" });
                }
              } catch (error) {
                console.error("Error processing geolocation:", error);
                reject(error);
              }
            },
            (error) => {
              console.warn("Geolocation failed:", error);
              reject(error);
            },
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 300000, // 5 minutes
            },
          );
        },
      );
    } catch (error) {
      console.warn("Browser location service failed:", error);
      return null;
    }
  };

  // Enhanced auto-fill address fields from detailed address string
  const autoFillAddressFields = (fullAddress: string) => {
    console.log("🏠 Auto-filling address from:", fullAddress);

    const parts = fullAddress.split(",").map((part) => part.trim());
    console.log("📍 Address parts:", parts);

    // Extract pincode first
    const pincodeMatch = fullAddress.match(/\b\d{6}\b/);
    if (pincodeMatch) {
      setPincode(pincodeMatch[0]);
      console.log("📮 Pincode extracted:", pincodeMatch[0]);
    }

    // Extract house/flat number
    let extractedFlatNo = "";
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];

      // Skip if it's a pincode (exactly 6 digits)
      if (part.match(/^\d{6}$/)) {
        continue;
      }

      // Look for parts that start with numbers or contain typical house number patterns
      if (
        (part.match(/^\d+/) && !part.match(/^\d{5,}$/)) || // Starts with number like "123" but not 5+ digits
        part.match(/^[A-Z]-?\d+/) || // Like "A-123" or "A123"
        part.match(/^\d+[A-Z]?\/\d+/) || // Like "123/45" or "123A/45"
        part.match(/^(House|Plot|Building|Block)\s*(No\.?)?\s*\d+/i) || // House No 123, Plot 45, etc.
        part.match(/^\d+[-\s][A-Z]+/) || // Like "123-A" or "123 Main"
        part.match(/^[A-Z]\d+/) // Like "A123", "B45"
      ) {
        extractedFlatNo = part;
        console.log("🏠 House number extracted:", extractedFlatNo);
        break;
      }
    }

    // Only fill flatNo if it's currently empty (preserve user input)
    if (!flatNo && extractedFlatNo) {
      setFlatNo(extractedFlatNo);
    }

    // Clear previous values for other fields
    setStreet("");
    setArea("");

    // More comprehensive filtering - preserve meaningful address components
    const cleanParts = parts.filter((part) => {
      if (!part || part.length < 2) return false;
      if (part === extractedFlatNo) return false; // Exclude extracted house number
      if (part.match(/^\d{6}$/)) return false; // Pure pincode
      if (part.toLowerCase() === "india") return false;
      if (
        part.toLowerCase().includes("pradesh") ||
        part.toLowerCase().includes("state") ||
        part.toLowerCase().includes("bharath") ||
        part.toLowerCase().includes("bharat")
      )
        return false;
      return true;
    });

    console.log("🧹 Clean parts:", cleanParts);

    if (cleanParts.length === 0) {
      // If no parts, use the full address as area
      setArea(fullAddress.replace(/,?\s*\d{6}.*$/, "").trim());
      return;
    }

    // Improved strategy: Be more conservative to preserve details
    if (cleanParts.length === 1) {
      // Only one part - use it as the area
      setArea(cleanParts[0]);
      console.log("🏘��� Single part used for area:", cleanParts[0]);
    } else if (cleanParts.length === 2) {
      // Two parts - first as street, second as area
      setStreet(cleanParts[0]);
      setArea(cleanParts[1]);
      console.log("🛣️ Street:", cleanParts[0]);
      console.log("🏘️ Area:", cleanParts[1]);
    } else if (cleanParts.length >= 3) {
      // Multiple parts - first as street, rest as area
      setStreet(cleanParts[0]);

      // Use next 2-3 parts for area to keep locality details
      const areaParts = cleanParts.slice(1, Math.min(4, cleanParts.length));
      setArea(areaParts.join(", "));

      console.log("🛣️ Street name:", cleanParts[0]);
      console.log("🏘️ Extended area:", areaParts.join(", "));
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);

    if (query.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Try multiple search methods for better suggestions
    try {
      let suggestions = [];

      // Method 1: Leaflet Location Service (primary)
      try {
        const leafletSuggestions =
          await leafletLocationService.getPlaceAutocomplete(query);
        suggestions = leafletSuggestions.map((suggestion: any) => ({
          description: suggestion.description,
          main_text: suggestion.structured_formatting.main_text,
          secondary_text: suggestion.structured_formatting.secondary_text,
          place_id: suggestion.osm_id || `leaflet_${Math.random()}`,
          coordinates: suggestion.coordinates,
          source: "leaflet_osm",
        }));
      } catch (leafletError) {
        console.warn(
          "Leaflet service failed, trying alternatives:",
          leafletError,
        );
      }

      // Method 2: Nominatim API fallback with enhanced search
      if (suggestions.length === 0) {
        try {
          const nominatimResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}, India&limit=10&addressdetails=1&countrycodes=in&extratags=1`,
            {
              headers: {
                "User-Agent": "CleanCare-App/1.0",
              },
            },
          );

          const nominatimData = await nominatimResponse.json();

          if (nominatimData && nominatimData.length > 0) {
            suggestions = nominatimData.map((item: any, index: number) => ({
              description: item.display_name,
              main_text: item.name || item.display_name.split(",")[0],
              secondary_text: item.display_name
                .split(",")
                .slice(1)
                .join(",")
                .trim(),
              place_id: `nominatim_${item.osm_id || index}`,
              coordinates: {
                lat: parseFloat(item.lat),
                lng: parseFloat(item.lon),
              },
              source: "nominatim",
            }));
          }
        } catch (nominatimError) {
          console.warn("Nominatim API failed:", nominatimError);
        }
      }

      // Method 3: Enhanced local suggestions with better city coverage
      if (suggestions.length === 0) {
        const indianCities = [
          { name: "New Delhi", state: "Delhi" },
          { name: "Gurgaon", state: "Haryana" },
          { name: "Noida", state: "Uttar Pradesh" },
          { name: "Mumbai", state: "Maharashtra" },
          { name: "Bangalore", state: "Karnataka" },
          { name: "Chennai", state: "Tamil Nadu" },
          { name: "Hyderabad", state: "Telangana" },
          { name: "Pune", state: "Maharashtra" },
          { name: "Kolkata", state: "West Bengal" },
          { name: "Ahmedabad", state: "Gujarat" },
          { name: "Jaipur", state: "Rajasthan" },
          { name: "Chandigarh", state: "Punjab" },
        ];

        suggestions = indianCities
          .filter(
            (city) =>
              city.name.toLowerCase().includes(query.toLowerCase()) ||
              query.toLowerCase().includes(city.name.toLowerCase()),
          )
          .map((city) => ({
            description: `${query}, ${city.name}, ${city.state}, India`,
            main_text: query,
            secondary_text: `${city.name}, ${city.state}, India`,
            place_id: `local_${query}_${city.name.toLowerCase()}`,
            source: "local",
          }));
      }

      setSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error("All search methods failed:", error);
      // Ultimate fallback
      setSuggestions([
        {
          description: `${query}, India`,
          main_text: query,
          secondary_text: "India",
          place_id: `fallback_${query}`,
          source: "fallback",
        },
      ]);
      setShowSuggestions(true);
    }
  };

  const handleSuggestionSelect = async (suggestion: any) => {
    setSearchQuery(suggestion.description);
    setShowSuggestions(false);

    if (!suggestion.place_id || suggestion.place_id.startsWith("mock_")) {
      // Handle mock suggestions or when places service is not available
      let coordinates = { lat: 28.6139, lng: 77.209 }; // Default Delhi coordinates

      // Provide better coordinates based on city
      if (suggestion.description.includes("Mumbai")) {
        coordinates = { lat: 19.076, lng: 72.8777 };
      } else if (suggestion.description.includes("Bangalore")) {
        coordinates = { lat: 12.9716, lng: 77.5946 };
      } else if (suggestion.description.includes("Gurgaon")) {
        coordinates = { lat: 28.4595, lng: 77.0266 };
      } else if (suggestion.description.includes("Noida")) {
        coordinates = { lat: 28.5355, lng: 77.391 };
      } else if (suggestion.description.includes("Chennai")) {
        coordinates = { lat: 13.0827, lng: 80.2707 };
      } else if (suggestion.description.includes("Hyderabad")) {
        coordinates = { lat: 17.385, lng: 78.4867 };
      } else if (suggestion.description.includes("Pune")) {
        coordinates = { lat: 18.5204, lng: 73.8567 };
      }

      setSelectedLocation({
        address: suggestion.description,
        coordinates,
      });
      updateMapLocation(coordinates);
      autoFillAddressFields(suggestion.description);

      return;
    }

    try {
      // Use the new autocompleteSuggestionService which already implements the new Place API
      const { getPlaceDetails } = await import(
        "@/utils/autocompleteSuggestionService"
      );

      const place = await getPlaceDetails(suggestion.place_id);

      if (place?.geometry?.location) {
        const coordinates = {
          lat:
            typeof place.geometry.location.lat === "function"
              ? place.geometry.location.lat()
              : place.geometry.location.lat,
          lng:
            typeof place.geometry.location.lng === "function"
              ? place.geometry.location.lng()
              : place.geometry.location.lng,
        };

        setSelectedLocation({
          address: place.formatted_address || suggestion.description,
          coordinates,
        });

        updateMapLocation(coordinates);
        autoFillAddressFields(
          place.formatted_address || suggestion.description,
        );
      } else {
        console.error("Failed to get place details");
        // Fallback to geocoding
        locationService
          .geocodeAddress(suggestion.description)
          .then((geocodeResult) => {
            setSelectedLocation({
              address: geocodeResult.formatted_address,
              coordinates: geocodeResult.coordinates,
            });
            updateMapLocation(geocodeResult.coordinates);
            autoFillAddressFields(geocodeResult.formatted_address);
          })
          .catch((geocodeError) => {
            console.error("Geocoding fallback failed:", geocodeError);
          });
      }
    } catch (error) {
      console.error("Place details request failed:", error);
    }
  };

  const handleSave = () => {
    if (!selectedLocation) return;

    // Build complete address from split fields
    const fullAddressParts = [
      flatNo && (floor || building)
        ? `${flatNo}, ${floor || ""} ${building || ""}`.trim()
        : flatNo,
      street,
      landmark,
      area, // This now contains the merged area/city information
      pincode,
    ].filter(Boolean);

    const completeAddress = fullAddressParts.join(", ");

    const addressData: AddressData = {
      flatNo: flatNo,
      street: street,
      landmark: landmark,
      village: area, // Use the merged area field as village
      city: area, // Use the merged area field as city for backward compatibility
      pincode: pincode,
      fullAddress: completeAddress || selectedLocation.address,
      coordinates: selectedLocation.coordinates,
      type: addressType,
      label:
        addressType === "home"
          ? "Home"
          : addressType === "office"
            ? "Work"
            : "Other",
      phone: receiverPhone,
      name: receiverName,
    };

    onSave(addressData);
  };

  const isFormValid = () => {
    return (
      selectedLocation &&
      area.trim() && // Now checking the merged area field instead of city
      pincode.trim() &&
      pincode.length === 6 &&
      receiverName.trim() &&
      receiverPhone.trim() &&
      receiverPhone.length >= 10
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-medium text-gray-900">Add Address</h1>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Search Bar */}
        <div className="p-4 border-b border-gray-200 bg-white sticky top-0 z-10">
          <div className="relative">
            <div className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg bg-gray-50">
              <Search className="h-5 w-5 text-green-600 flex-shrink-0" />
              <Input
                ref={searchInputRef}
                placeholder="Search for area, street name..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                onFocus={() => {
                  if (suggestions.length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                className="border-0 bg-transparent p-0 focus:ring-0 text-base placeholder:text-gray-500"
                autoComplete="address-line1"
                autoCapitalize="words"
                spellCheck={false}
              />
            </div>

            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div
                ref={suggestionsRef}
                className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
              >
                {suggestions.map((suggestion, index) => (
                  <div
                    key={index}
                    onClick={() => handleSuggestionSelect(suggestion)}
                    className="px-4 py-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.main_text}
                    </div>
                    <div className="text-xs text-gray-600">
                      {suggestion.secondary_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Location Picker Button */}
        <div className="mb-4">
          <Button
            onClick={() => setShowLocationPicker(true)}
            variant="outline"
            className="w-full flex items-center gap-2 py-6"
          >
            <MapPin className="h-5 w-5" />
            <span>
              {selectedLocation
                ? "Change Location on Map"
                : "Select Location on Map"}
            </span>
          </Button>
        </div>

        {/* Selected Location Display */}
        {selectedLocation && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">
                  Selected Location
                </h4>
                <p className="text-sm text-green-700 mt-1">
                  {selectedLocation.address}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  📍 {selectedLocation.coordinates.lat.toFixed(6)},{" "}
                  {selectedLocation.coordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Form Section - Now fully scrollable */}
        <div className="bg-white p-4 space-y-6">
          {/* Delivery Details with Edit Option */}
          {selectedLocation && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-medium text-gray-900">
                  Delivery details
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery(selectedLocation.address);
                    setShowSuggestions(false);
                    if (searchInputRef.current) {
                      searchInputRef.current.focus();
                    }
                  }}
                  className="text-green-600 hover:text-green-700 text-sm px-2 py-1"
                >
                  Edit
                </Button>
              </div>
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="bg-green-600 rounded-full p-1 mt-1 flex-shrink-0">
                  <MapPin className="h-3 w-3 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 break-words">
                    {selectedLocation.address.split(",")[0]}
                  </p>
                  <p className="text-xs text-gray-600 break-words">
                    {selectedLocation.address
                      .split(",")
                      .slice(1)
                      .join(",")
                      .trim()}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* House/Flat Details Section */}
          <div className="bg-blue-50 p-4 rounded-lg space-y-4">
            <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
              <Home className="h-5 w-5 text-blue-600" />
              House/Flat Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="flatNo"
                  className="text-sm font-medium text-gray-700"
                >
                  House/Flat Number
                </Label>
                <Input
                  id="flatNo"
                  placeholder="e.g., 123, A-45"
                  value={flatNo}
                  onChange={(e) => setFlatNo(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label
                  htmlFor="floor"
                  className="text-sm font-medium text-gray-700"
                >
                  Floor (Optional)
                </Label>
                <Input
                  id="floor"
                  placeholder="e.g., 2nd Floor"
                  value={floor}
                  onChange={(e) => setFloor(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div>
              <Label
                htmlFor="building"
                className="text-sm font-medium text-gray-700"
              >
                Building/Society (Optional)
              </Label>
              <Input
                id="building"
                placeholder="e.g., Sunrise Apartments"
                value={building}
                onChange={(e) => setBuilding(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          {/* Location Details Section */}
          <div className="bg-green-50 p-4 rounded-lg space-y-4">
            <h3 className="text-base font-medium text-gray-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-green-600" />
              Location Details
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="street"
                  className="text-sm font-medium text-gray-700"
                >
                  Street/Road
                </Label>
                <Input
                  id="street"
                  placeholder="Street name"
                  value={street}
                  onChange={(e) => setStreet(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label
                  htmlFor="landmark"
                  className="text-sm font-medium text-gray-700"
                >
                  Landmark (Optional)
                </Label>
                <Input
                  id="landmark"
                  placeholder="e.g., Near Metro"
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label
                  htmlFor="area"
                  className="text-sm font-medium text-gray-700"
                >
                  Area/Village/City *
                </Label>
                <Input
                  id="area"
                  placeholder="Complete location (area, village, city)"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Complete location including area, village, and city
                </p>
              </div>
              <div>
                <Label
                  htmlFor="pincode"
                  className="text-sm font-medium text-gray-700"
                >
                  Pincode *
                </Label>
                <Input
                  id="pincode"
                  placeholder="6-digit code"
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  maxLength={6}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Receiver Details */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">
              Receiver details for this address
            </h3>

            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <Input
                  placeholder="Receiver name"
                  value={receiverName}
                  onChange={(e) => setReceiverName(e.target.value)}
                  className="border-0 p-0 focus:ring-0"
                />
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <Phone className="h-5 w-5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-900">
                  {receiverName || "Receiver"},{" "}
                </span>
                <Input
                  placeholder="Phone number"
                  value={receiverPhone}
                  onChange={(e) => setReceiverPhone(e.target.value)}
                  className="border-0 p-0 focus:ring-0"
                  type="tel"
                />
              </div>
            </div>
          </div>

          {/* Save Address As */}
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">
              Save address as
            </h3>
            <div className="flex gap-3">
              <Button
                variant={addressType === "home" ? "default" : "outline"}
                onClick={() => setAddressType("home")}
                className={`flex-1 ${
                  addressType === "home"
                    ? "bg-green-600 text-white border-green-600"
                    : "text-gray-700 border-gray-300"
                }`}
              >
                <Home className="h-4 w-4 mr-2" />
                Home
              </Button>
              <Button
                variant={addressType === "office" ? "default" : "outline"}
                onClick={() => setAddressType("office")}
                className={`flex-1 ${
                  addressType === "office"
                    ? "bg-green-600 text-white border-green-600"
                    : "text-gray-700 border-gray-300"
                }`}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Work
              </Button>
              <Button
                variant={addressType === "other" ? "default" : "outline"}
                onClick={() => setAddressType("other")}
                className={`flex-1 ${
                  addressType === "other"
                    ? "bg-green-600 text-white border-green-600"
                    : "text-gray-700 border-gray-300"
                }`}
              >
                <MapPin className="h-4 w-4 mr-2" />
                Other
              </Button>
            </div>
          </div>

          {/* Bottom spacing for save button */}
          <div className="h-20"></div>
        </div>
      </div>

      {/* Save Button - Fixed at bottom */}
      <div className="p-4 border-t border-gray-200 bg-white sticky bottom-0">
        <Button
          onClick={handleSave}
          disabled={!isFormValid()}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save address
        </Button>
      </div>

      {/* Leaflet Location Picker Modal */}
      {showLocationPicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <LeafletLocationPicker
              onLocationSelect={handleLocationSelect}
              onClose={() => setShowLocationPicker(false)}
              defaultCoordinates={selectedLocation?.coordinates}
              title="Select Delivery Location"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ZomatoAddAddressPage;
