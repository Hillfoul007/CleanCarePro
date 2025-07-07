# Google Maps API Migration Guide

## Migration to New Places API

This project has been updated to use the new Google Maps Places API instead of the deprecated `PlacesService`. The migration addresses the following deprecation warning:

```
"As of March 1st, 2025, google.maps.places.PlacesService is not available to new customers. Please use google.maps.places.Place instead."
```

## Changes Made

### 1. Updated AutocompleteSuggestionService (`src/utils/autocompleteSuggestionService.ts`)

- **Before**: Used `google.maps.places.PlacesService` for place details
- **After**: Uses new `google.maps.places.Place` API with fallback to legacy API
- **Benefits**: Future-proof implementation with backward compatibility

### 2. Enhanced ModernGoogleMaps (`src/utils/modernGoogleMaps.ts`)

- Added proper Map ID configuration to prevent Advanced Markers warnings
- Added console warnings for missing Map ID configuration
- Improved error handling and logging

### 3. Updated Components

The following components were updated to use the new API:

- `ZomatoAddAddressPage.tsx` - Place details and nearby search
- `EnhancedAddressForm.tsx` - Address autocomplete
- `LocationDetector.tsx` - Location selection

## Environment Configuration

### Required Environment Variables

```bash
# Google Maps API Key (Required)
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here

# Google Maps Map ID (Recommended for Advanced Markers)
VITE_GOOGLE_MAPS_MAP_ID=your_map_id_here
```

### Setting up Map ID

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to "Google Maps Platform" > "Map management"
3. Create a new Map ID or use an existing one
4. Add the Map ID to your environment variables

**Note**: If no Map ID is provided, the system will use a default "DEMO_MAP_ID" which may have limitations in production.

## API Features Used

### New Places API Features

- `google.maps.places.Place` - Modern place details API
- `google.maps.places.AutocompleteSuggestion` - Enhanced autocomplete
- `google.maps.places.Place.searchByText` - Text-based place search

### Backward Compatibility

- Legacy `PlacesService` is still used as fallback when new API fails
- Existing code interfaces remain unchanged for seamless migration

## Error Handling

The migration includes comprehensive error handling:

1. **Primary**: Try new Places API
2. **Fallback**: Use legacy PlacesService if new API fails
3. **Final fallback**: Use geocoding service for basic location data

## Benefits of Migration

1. **Future-proof**: Uses the latest Google Maps API
2. **Better performance**: New API is optimized for modern web applications
3. **Enhanced features**: Access to newer place data and search capabilities
4. **Backward compatible**: Existing functionality preserved during transition

## Troubleshooting

### Common Issues

1. **"Map ID not found" errors**
   - Solution: Set `VITE_GOOGLE_MAPS_MAP_ID` environment variable

2. **Advanced Markers not working**
   - Solution: Ensure Map ID is configured and valid

3. **Place details failing**
   - Solution: Check API key permissions and quota limits

### Console Warnings

The system provides helpful console warnings for:

- Missing Map ID configuration
- API initialization failures
- Fallback usage notifications

## Testing

To verify the migration works correctly:

1. Test address autocomplete functionality
2. Verify place selection and details retrieval
3. Check map functionality with markers
4. Ensure error handling works when API fails

## Future Considerations

- Monitor Google's deprecation timeline for PlacesService
- Plan to remove legacy fallback code after transition period
- Consider upgrading to newer Maps API features as they become available
