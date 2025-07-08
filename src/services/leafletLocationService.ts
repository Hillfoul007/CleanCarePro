// Enhanced location service using OpenStreetMap and free services
// Replacement for Google Maps to avoid charges

export interface Coordinates {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface LocationData {
  id: string;
  address: string;
  coordinates: Coordinates;
  name?: string;
  isFavorite?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaceAutocomplete {
  place_id?: string;
  osm_id?: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
  coordinates?: Coordinates;
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formatted_address: string;
  place_id?: string;
}

class LeafletLocationService {
  private readonly NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";
  private readonly USER_AGENT = "CleanCarePro-LocationService/1.0";

  /**
   * Get user's current position using browser geolocation with enhanced accuracy
   */
  async getCurrentPosition(options?: PositionOptions): Promise<Coordinates> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported"));
        return;
      }

      const defaultOptions = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        ...options,
      };

      console.log("📍 Requesting geolocation with options:", defaultOptions);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
          };

          console.log("✅ Geolocation success:", {
            ...coords,
            timestamp: new Date(position.timestamp).toISOString(),
          });

          resolve(coords);
        },
        (error) => {
          let errorMessage = "Unknown geolocation error";
          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Location access denied by user";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Location information unavailable";
              break;
            case error.TIMEOUT:
              errorMessage = "Location request timed out";
              break;
          }

          console.error("❌ Geolocation error:", errorMessage, error);
          reject(new Error(errorMessage));
        },
        defaultOptions,
      );
    });
  }

  /**
   * Reverse geocode coordinates to human-readable address using Nominatim
   */
  async reverseGeocode(coordinates: Coordinates): Promise<string> {
    console.log("🔍 Starting reverse geocoding for:", coordinates);

    try {
      // Primary: Nominatim with maximum detail
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=18&addressdetails=1&extratags=1&namedetails=1&accept-language=en&countrycodes=in`,
        {
          headers: {
            "User-Agent": this.USER_AGENT,
            Accept: "application/json",
          },
          mode: "cors",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.address) {
        console.log("✅ Nominatim result:", data);
        const enhancedAddress = this.formatNominatimAddress(data.address);
        return enhancedAddress || data.display_name;
      }
    } catch (error) {
      console.warn("Primary reverse geocoding failed:", error);
    }

    // Fallback 1: Try alternative zoom level
    try {
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/reverse?format=json&lat=${coordinates.lat}&lon=${coordinates.lng}&zoom=16&addressdetails=1`,
        {
          headers: {
            "User-Agent": this.USER_AGENT,
            Accept: "application/json",
          },
          mode: "cors",
        },
      );

      if (response.ok) {
        const data = await response.json();
        if (data?.display_name) {
          console.log("✅ Fallback geocoding result:", data.display_name);
          return data.display_name;
        }
      }
    } catch (error) {
      console.warn("Fallback reverse geocoding failed:", error);
    }

    // Fallback 2: Format coordinates as address
    return this.formatCoordinatesAsAddress(coordinates);
  }

  /**
   * Format Nominatim address into readable format for Indian addresses
   */
  private formatNominatimAddress(address: any): string {
    const parts = [];

    // House number
    if (address.house_number) {
      parts.push(address.house_number);
    }

    // Building/premise
    if (address.building) {
      parts.push(address.building);
    }

    // Road/street
    if (address.road) {
      parts.push(address.road);
    }

    // Neighborhood/suburb
    if (address.neighbourhood) {
      parts.push(address.neighbourhood);
    } else if (address.suburb) {
      parts.push(address.suburb);
    }

    // City/town/village
    if (address.city) {
      parts.push(address.city);
    } else if (address.town) {
      parts.push(address.town);
    } else if (address.village) {
      parts.push(address.village);
    }

    // State district
    if (address.state_district && address.state_district !== address.city) {
      parts.push(address.state_district);
    }

    // State
    if (address.state) {
      parts.push(address.state);
    }

    // Postal code
    if (address.postcode) {
      parts.push(address.postcode);
    }

    // Country
    if (address.country && address.country !== "India") {
      parts.push(address.country);
    }

    const formattedAddress = parts.filter(Boolean).join(", ");
    console.log("📝 Formatted address:", formattedAddress);

    return formattedAddress;
  }

  /**
   * Geocode address to coordinates using Nominatim
   */
  async geocodeAddress(address: string): Promise<GeocodeResult> {
    try {
      const response = await fetch(
        `${this.NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(address)}&limit=1&addressdetails=1&countrycodes=in`,
        {
          headers: {
            "User-Agent": this.USER_AGENT,
            Accept: "application/json",
          },
          mode: "cors",
        },
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          coordinates: {
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
          },
          formatted_address: result.display_name,
          place_id: result.osm_id?.toString(),
        };
      }

      throw new Error("No results found");
    } catch (error) {
      throw new Error(
        `Geocoding error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Get place autocomplete suggestions using Nominatim
   */
  async getPlaceAutocomplete(
    input: string,
    location?: Coordinates,
    radius?: number,
  ): Promise<PlaceAutocomplete[]> {
    if (input.length < 3) return [];

    try {
      let url = `${this.NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(input)}&limit=5&addressdetails=1&countrycodes=in`;

      // Add location bias if provided
      if (location) {
        url += `&viewbox=${location.lng - 0.1},${location.lat + 0.1},${location.lng + 0.1},${location.lat - 0.1}&bounded=1`;
      }

      const response = await fetch(url, {
        headers: {
          "User-Agent": this.USER_AGENT,
          Accept: "application/json",
        },
        mode: "cors",
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      return data.map((item: any) => {
        const parts = item.display_name.split(", ");
        const mainText = parts[0] || item.display_name;
        const secondaryText = parts.slice(1).join(", ");

        return {
          osm_id: item.osm_id?.toString(),
          description: item.display_name,
          structured_formatting: {
            main_text: mainText,
            secondary_text: secondaryText,
          },
          coordinates: {
            lat: parseFloat(item.lat),
            lng: parseFloat(item.lon),
          },
        };
      });
    } catch (error) {
      console.warn("Autocomplete failed:", error);
      return [];
    }
  }

  /**
   * Search for nearby places using Overpass API (OpenStreetMap)
   */
  async getNearbyPlaces(
    coordinates: Coordinates,
    radius: number = 500,
    type?: string,
  ): Promise<any[]> {
    try {
      // Convert type to OSM amenity if needed
      const osmType = this.convertTypeToOSM(type);

      const query = `
        [out:json][timeout:25];
        (
          node["amenity"="${osmType}"](around:${radius},${coordinates.lat},${coordinates.lng});
          way["amenity"="${osmType}"](around:${radius},${coordinates.lat},${coordinates.lng});
          relation["amenity"="${osmType}"](around:${radius},${coordinates.lat},${coordinates.lng});
        );
        out center meta;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.elements || [];
    } catch (error) {
      console.warn("Nearby places search failed:", error);
      return [];
    }
  }

  /**
   * Convert place type to OSM amenity
   */
  private convertTypeToOSM(type?: string): string {
    const typeMap: { [key: string]: string } = {
      restaurant: "restaurant",
      hospital: "hospital",
      school: "school",
      bank: "bank",
      pharmacy: "pharmacy",
      gas_station: "fuel",
      shopping_mall: "mall",
      store: "shop",
      atm: "atm",
    };

    return typeMap[type || ""] || "restaurant";
  }

  /**
   * Extract house number from address string
   */
  extractHouseNumber(address: string): {
    houseNumber: string;
    building: string;
    cleanedAddress: string;
  } {
    let houseNumber = "";
    let building = "";
    let cleanedAddress = address;

    const parts = address.split(",").map((part) => part.trim());
    const firstPart = parts[0] || "";

    // Simple house number pattern
    const simpleNumberMatch = firstPart.match(/^\s*(\d+)\s*$/);
    if (simpleNumberMatch && !simpleNumberMatch[1].match(/^\d{6}$/)) {
      houseNumber = simpleNumberMatch[1];
      cleanedAddress = parts.slice(1).join(", ").trim();
      return { houseNumber, building, cleanedAddress };
    }

    // House number with suffix
    const numberSuffixMatch = firstPart.match(/^\s*(\d+[A-Z]+)\s*$/i);
    if (numberSuffixMatch) {
      houseNumber = numberSuffixMatch[1].toUpperCase();
      cleanedAddress = parts.slice(1).join(", ").trim();
      return { houseNumber, building, cleanedAddress };
    }

    // Extract any number from first part
    const anyNumberMatch = firstPart.match(/(\d+)/);
    if (anyNumberMatch) {
      houseNumber = anyNumberMatch[1];
      const buildingPart = firstPart.replace(anyNumberMatch[0], "").trim();
      if (buildingPart.length > 2) {
        building = buildingPart.replace(/[,-]/g, "").trim();
      }
      cleanedAddress = parts.slice(1).join(", ").trim();
    }

    return { houseNumber, building, cleanedAddress };
  }

  /**
   * Format coordinates as readable address
   */
  private formatCoordinatesAsAddress(coordinates: Coordinates): string {
    const { lat, lng } = coordinates;

    // India bounding box check
    if (lat >= 6.0 && lat <= 37.6 && lng >= 68.7 && lng <= 97.25) {
      let region = "India";

      // Major cities detection
      if (lat >= 28.4 && lat <= 28.8 && lng >= 76.8 && lng <= 77.3) {
        region = "Gurgaon, Haryana, India";
      } else if (lat >= 28.5 && lat <= 28.7 && lng >= 77.1 && lng <= 77.3) {
        region = "New Delhi, India";
      } else if (lat >= 19.0 && lat <= 19.3 && lng >= 72.7 && lng <= 73.0) {
        region = "Mumbai, Maharashtra, India";
      } else if (lat >= 12.8 && lat <= 13.1 && lng >= 77.4 && lng <= 77.8) {
        region = "Bangalore, Karnataka, India";
      } else if (lat >= 17.3 && lat <= 17.5 && lng >= 78.3 && lng <= 78.6) {
        region = "Hyderabad, Telangana, India";
      }

      return `${lat.toFixed(4)}, ${lng.toFixed(4)}, ${region}`;
    }

    return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
  }

  /**
   * Calculate distance between two coordinates in kilometers
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.lat - coord1.lat);
    const dLon = this.deg2rad(coord2.lng - coord1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.lat)) *
        Math.cos(this.deg2rad(coord2.lat)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  /**
   * Local storage methods for saved locations
   */
  async saveLocationToDatabase(
    locationData: LocationData,
  ): Promise<LocationData> {
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    existingLocations.push(locationData);
    localStorage.setItem("saved_locations", JSON.stringify(existingLocations));
    return locationData;
  }

  async getSavedLocations(): Promise<LocationData[]> {
    return JSON.parse(localStorage.getItem("saved_locations") || "[]");
  }

  async updateLocationInDatabase(
    locationId: string,
    updates: Partial<LocationData>,
  ): Promise<LocationData> {
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    const updatedLocations = existingLocations.map((loc: LocationData) =>
      loc.id === locationId
        ? { ...loc, ...updates, updatedAt: new Date() }
        : loc,
    );
    localStorage.setItem("saved_locations", JSON.stringify(updatedLocations));
    return updatedLocations.find((loc: LocationData) => loc.id === locationId);
  }

  async deleteLocationFromDatabase(locationId: string): Promise<void> {
    const existingLocations = JSON.parse(
      localStorage.getItem("saved_locations") || "[]",
    );
    const filteredLocations = existingLocations.filter(
      (loc: LocationData) => loc.id !== locationId,
    );
    localStorage.setItem("saved_locations", JSON.stringify(filteredLocations));
  }
}

export const leafletLocationService = new LeafletLocationService();
