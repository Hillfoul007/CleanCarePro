/**
 * Modern Google Places AutocompleteSuggestion service utility
 * Replaces the deprecated AutocompleteService with the new AutocompleteSuggestion API
 */

export interface AutocompletePrediction {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

export interface AutocompleteRequest {
  input: string;
  includedRegionCodes?: string[];
  types?: string[];
  sessionToken?: any;
}

class AutocompleteSuggestionService {
  private AutocompleteSuggestion: any = null;
  private AutocompleteSessionToken: any = null;
  private isInitialized = false;

  /**
   * Initialize the AutocompleteSuggestion service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      if (!window.google?.maps) {
        throw new Error("Google Maps API not loaded");
      }

      const { AutocompleteSuggestion, AutocompleteSessionToken } =
        await window.google.maps.importLibrary("places");

      this.AutocompleteSuggestion = AutocompleteSuggestion;
      this.AutocompleteSessionToken = AutocompleteSessionToken;
      this.isInitialized = true;

      console.log("✅ AutocompleteSuggestion service initialized");
    } catch (error) {
      console.error(
        "❌ Failed to initialize AutocompleteSuggestion service:",
        error,
      );
      throw error;
    }
  }

  /**
   * Create a new session token for tracking autocomplete sessions
   */
  createSessionToken(): any {
    if (!this.AutocompleteSessionToken) {
      throw new Error("AutocompleteSuggestion service not initialized");
    }
    return new this.AutocompleteSessionToken();
  }

  /**
   * Fetch autocomplete suggestions using the new API
   */
  async fetchSuggestions(
    request: AutocompleteRequest,
  ): Promise<AutocompletePrediction[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    if (!this.AutocompleteSuggestion) {
      throw new Error("AutocompleteSuggestion service not available");
    }

    try {
      const sessionToken = request.sessionToken || this.createSessionToken();

      const apiRequest = {
        input: request.input,
        sessionToken: sessionToken,
        includedRegionCodes: request.includedRegionCodes || ["in"],
      };

      const response =
        await this.AutocompleteSuggestion.fetchAutocompleteSuggestions(
          apiRequest,
        );

      if (!response.suggestions) {
        return [];
      }

      return response.suggestions.map((suggestion: any) => {
        const placePrediction = suggestion.placePrediction;
        return {
          description: placePrediction.text,
          place_id: placePrediction.placeId,
          structured_formatting: {
            main_text:
              placePrediction.structuredFormat?.mainText ||
              placePrediction.text,
            secondary_text:
              placePrediction.structuredFormat?.secondaryText || "",
          },
        };
      });
    } catch (error) {
      console.error("Error fetching autocomplete suggestions:", error);
      throw error;
    }
  }

  /**
   * Search for places in India specifically
   */
  async searchInIndia(
    input: string,
    sessionToken?: any,
  ): Promise<AutocompletePrediction[]> {
    return this.fetchSuggestions({
      input,
      includedRegionCodes: ["in"],
      sessionToken,
    });
  }

  /**
   * Search for places globally with specific region preferences
   */
  async searchGlobal(
    input: string,
    regionCodes: string[] = ["in", "us", "ca", "gb", "au"],
    sessionToken?: any,
  ): Promise<AutocompletePrediction[]> {
    return this.fetchSuggestions({
      input,
      includedRegionCodes: regionCodes,
      sessionToken,
    });
  }

  /**
   * Get place details using the PlacesService (this part hasn't changed)
   */
  async getPlaceDetails(placeId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!window.google?.maps?.places) {
        reject(new Error("Google Maps Places API not loaded"));
        return;
      }

      const service = new window.google.maps.places.PlacesService(
        document.createElement("div"),
      );

      service.getDetails(
        {
          placeId: placeId,
          fields: [
            "place_id",
            "name",
            "formatted_address",
            "geometry",
            "address_components",
            "types",
          ],
        },
        (place, status) => {
          if (
            status === window.google.maps.places.PlacesServiceStatus.OK &&
            place
          ) {
            resolve(place);
          } else {
            reject(new Error(`PlacesService error: ${status}`));
          }
        },
      );
    });
  }

  /**
   * Check if the service is ready to use
   */
  isReady(): boolean {
    return (
      this.isInitialized &&
      this.AutocompleteSuggestion &&
      this.AutocompleteSessionToken
    );
  }

  /**
   * Get initialization status
   */
  getStatus(): { initialized: boolean; error?: string } {
    return {
      initialized: this.isInitialized,
      error: this.isInitialized ? undefined : "Service not initialized",
    };
  }
}

// Export singleton instance
export const autocompleteSuggestionService =
  new AutocompleteSuggestionService();

// Export convenience functions
export const searchPlacesInIndia = (input: string, sessionToken?: any) =>
  autocompleteSuggestionService.searchInIndia(input, sessionToken);

export const searchPlacesGlobal = (
  input: string,
  regionCodes?: string[],
  sessionToken?: any,
) =>
  autocompleteSuggestionService.searchGlobal(input, regionCodes, sessionToken);

export const getPlaceDetails = (placeId: string) =>
  autocompleteSuggestionService.getPlaceDetails(placeId);

export const createSessionToken = () =>
  autocompleteSuggestionService.createSessionToken();
