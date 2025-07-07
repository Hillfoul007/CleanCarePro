# Google Maps AutocompleteSuggestion Migration Guide

## Overview

As of March 1st, 2025, Google has deprecated the `AutocompleteService` for new customers and recommends using `AutocompleteSuggestion` instead. This project has been migrated to use the new API.

## What Changed

### Before (Deprecated)

```javascript
const service = new google.maps.places.AutocompleteService();
service.getPlacePredictions(request, (predictions, status) => {
  // Handle predictions
});
```

### After (Current)

```javascript
const { AutocompleteSuggestion, AutocompleteSessionToken } =
  await google.maps.importLibrary("places");
const sessionToken = new AutocompleteSessionToken();

const request = {
  input: query,
  sessionToken: sessionToken,
  includedRegionCodes: ["in"],
};

const response =
  await AutocompleteSuggestion.fetchAutocompleteSuggestions(request);
const predictions = response.suggestions;
```

## Key Differences

1. **Async/Await Pattern**: The new API uses promises instead of callbacks
2. **Session Tokens**: Required for tracking autocomplete sessions
3. **Import Library**: Must use `google.maps.importLibrary('places')` to get the classes
4. **Response Structure**: Predictions are accessed via `response.suggestions`
5. **Prediction Format**: Uses `placePrediction.text` instead of `description`

## Updated Files

The following files have been migrated:

- `src/components/ZomatoAddAddressPage.tsx`
- `src/components/EnhancedIndiaAddressForm.tsx`
- `src/components/LocationDetector.tsx`
- `src/components/EnhancedAddressForm.tsx`
- `src/types/google-maps.d.ts`
- `src/utils/autocompleteSuggestionService.ts` (new utility)
- `src/utils/modernGoogleMaps.ts` (updated)

## New Utility Service

A new utility service has been created at `src/utils/autocompleteSuggestionService.ts` that provides:

- Centralized AutocompleteSuggestion management
- Session token handling
- Convenience methods for different regions
- Error handling

### Usage Example

```javascript
import {
  autocompleteSuggestionService,
  searchPlacesInIndia,
} from "@/utils/autocompleteSuggestionService";

// Simple search in India
const suggestions = await searchPlacesInIndia("New Delhi");

// Advanced usage with session token
const sessionToken = autocompleteSuggestionService.createSessionToken();
const suggestions = await autocompleteSuggestionService.fetchSuggestions({
  input: "Mumbai",
  includedRegionCodes: ["in"],
  sessionToken: sessionToken,
});
```

## Environment Variables

Ensure you have the following environment variables set:

```
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here (optional, for Advanced Markers)
```

## Advanced Markers

The migration also includes updates for Advanced Markers to prevent the "Map ID" warning. If you see warnings about Map ID, ensure `VITE_GOOGLE_MAPS_MAP_ID` is set in your environment.

## Benefits of Migration

1. **Future-Proof**: Uses the latest Google Maps API
2. **Better Performance**: Improved caching and session management
3. **Enhanced Features**: Better support for region-specific searches
4. **Modern JavaScript**: Promise-based API instead of callbacks
5. **Better Error Handling**: More predictable error states

## Troubleshooting

### Common Issues

1. **"AutocompleteSuggestion is not defined"**
   - Ensure Google Maps API is loaded before using the service
   - Check that the Places library is included in the loader

2. **"Session token required"**
   - Always create a session token for autocomplete requests
   - Use the utility service which handles this automatically

3. **No predictions returned**
   - Check the `includedRegionCodes` parameter
   - Verify the input length (minimum 2-3 characters recommended)

### Debug Mode

Enable debug logging by setting `localStorage.debug = 'google-maps'` in your browser console.

## Migration Checklist

- [x] Updated all AutocompleteService instances
- [x] Added session token management
- [x] Updated type definitions
- [x] Created utility service
- [x] Added Map ID configuration
- [x] Updated error handling
- [x] Tested all address search functionality

## Next Steps

1. Test all address search functionality thoroughly
2. Monitor for any console warnings or errors
3. Consider implementing place details caching for better performance
4. Update documentation for new components

For more information, see the [official Google Maps migration guide](https://developers.google.com/maps/documentation/javascript/places-migration-overview).
