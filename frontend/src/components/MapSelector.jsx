import { useState, useEffect, useRef } from 'react';
import { X, MapPin, Search } from 'lucide-react';
import { Button } from './Button';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Component to handle map clicks
function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng);
    },
  });
  return null;
}

// Component to update map center when coordinates change
function MapUpdater({ center, zoom }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

const MapSelector = ({ onSelect, onClose }) => {
  // Center of Bangladesh (approximate center point)
  const [coordinates, setCoordinates] = useState({ lat: 23.6850, lng: 90.3563 }); // Center of Bangladesh
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [mapZoom, setMapZoom] = useState(7); // Zoom level to show all of Bangladesh

  useEffect(() => {
    // Get user's current location if available, but keep wider view
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const newCoords = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setCoordinates(newCoords);
          setMapZoom(13); // Zoom in when user location is found
          reverseGeocode(newCoords.lat, newCoords.lng);
        },
        () => {
          // Use center of Bangladesh if geolocation fails
          console.log('Using center of Bangladesh');
          reverseGeocode(coordinates.lat, coordinates.lng);
        }
      );
    } else {
      reverseGeocode(coordinates.lat, coordinates.lng);
    }
    setMapReady(true);

    // Close search results when clicking outside
    const handleClickOutside = (e) => {
      if (showSearchResults && !e.target.closest('.search-container')) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showSearchResults]);

  const reverseGeocode = async (lat, lng) => {
    try {
      setLoading(true);
      // Using Nominatim (OpenStreetMap) for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'Krishak-App'
          }
        }
      );
      const data = await response.json();
      
      if (data.display_name) {
        // Use the full display name from Nominatim (includes place name)
        setAddress(data.display_name);
      } else if (data.address) {
        const addr = data.address;
        // Build address with place name first
        const addressParts = [
          addr.city || addr.town || addr.municipality || addr.district,
          addr.state || addr.region,
          addr.country
        ].filter(Boolean);
        
        // If we have a road/house number, add it at the beginning
        if (addr.road || addr.house_number) {
          addressParts.unshift(addr.road || addr.house_number);
        }
        
        const addressString = addressParts.join(', ');
        setAddress(addressString || `${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      } else {
        setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      setAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (query) => {
    if (!query || query.trim().length < 3) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      setSearching(true);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`,
        {
          headers: {
            'User-Agent': 'Krishak-App'
          }
        }
      );
      const data = await response.json();
      
      if (data && data.length > 0) {
        setSearchResults(data);
        setShowSearchResults(true);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Location search error:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    } finally {
      setSearching(false);
    }
  };

  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Debounce search
    clearTimeout(window.searchTimeout);
    window.searchTimeout = setTimeout(() => {
      searchLocation(value);
    }, 500);
  };

  const handleSelectSearchResult = (result) => {
    const newCoords = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon)
    };
    setCoordinates(newCoords);
    setMapZoom(14); // Zoom in when location is selected
    setSearchQuery(result.display_name);
    setShowSearchResults(false);
    setSearchResults([]);
    
    // Set address immediately from search result
    if (result.display_name) {
      setAddress(result.display_name);
    }
    
    // Also reverse geocode to get more detailed address
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleMapClick = (latlng) => {
    const newCoords = {
      lat: latlng.lat,
      lng: latlng.lng
    };
    setCoordinates(newCoords);
    setMapZoom(14); // Zoom in when user clicks on map
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleCoordinateChange = (type, value) => {
    const newCoords = {
      ...coordinates,
      [type]: parseFloat(value) || 0
    };
    setCoordinates(newCoords);
    setMapZoom(14); // Zoom in when coordinates are manually entered
    reverseGeocode(newCoords.lat, newCoords.lng);
  };

  const handleConfirm = () => {
    onSelect(coordinates, address || `${coordinates.lat}, ${coordinates.lng}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center z-10">
          <h2 className="text-xl font-semibold flex items-center">
            <MapPin className="w-5 h-5 mr-2 text-primary-600" />
            Select Delivery Location on Map
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Search Location */}
          <div className="relative search-container">
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchInput}
                  onFocus={() => {
                    if (searchResults.length > 0) {
                      setShowSearchResults(true);
                    }
                  }}
                  placeholder="Search for a location (e.g., Dhaka, Gulshan, Mirpur)"
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
                {searching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Search Results Dropdown */}
            {showSearchResults && searchResults.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {searchResults.map((result, index) => {
                  // Extract main place name (first part before comma)
                  const mainName = result.display_name.split(',')[0];
                  // Get city/district name for better identification
                  const cityName = result.address?.city || result.address?.town || result.address?.municipality || result.address?.district || '';
                  
                  return (
                    <button
                      key={index}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full text-left px-4 py-3 hover:bg-primary-50 border-b border-gray-100 last:border-b-0 transition-colors"
                    >
                      <div className="flex items-start">
                        <MapPin className="w-4 h-4 text-primary-600 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {mainName}
                            {cityName && cityName !== mainName && (
                              <span className="text-gray-500 ml-1">({cityName})</span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {result.display_name}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Interactive Map */}
          {mapReady && (
            <div className="w-full h-96 rounded-lg overflow-hidden border-2 border-gray-300 relative">
              <MapContainer
                center={[coordinates.lat, coordinates.lng]}
                zoom={mapZoom}
                minZoom={6}
                maxZoom={18}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={true}
                key={`${coordinates.lat}-${coordinates.lng}-${mapZoom}`}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={[coordinates.lat, coordinates.lng]} />
                <MapClickHandler onMapClick={handleMapClick} />
                <MapUpdater center={[coordinates.lat, coordinates.lng]} zoom={mapZoom} />
              </MapContainer>
            </div>
          )}

          {/* Instructions */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>How to use:</strong> Search for a location above, then <strong>click on the map</strong> to pin your exact delivery location. You can also enter coordinates manually below.
            </p>
          </div>

          {/* Coordinate Input */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Latitude
              </label>
              <input
                type="number"
                step="any"
                value={coordinates.lat}
                onChange={(e) => handleCoordinateChange('lat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="23.8103"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Longitude
              </label>
              <input
                type="number"
                step="any"
                value={coordinates.lng}
                onChange={(e) => handleCoordinateChange('lng', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                placeholder="90.4125"
              />
            </div>
          </div>

          {/* Address Display */}
          {loading ? (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Loading address...</p>
            </div>
          ) : address ? (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm font-medium text-green-900 mb-1">Selected Location:</p>
              <p className="text-sm text-green-700">{address}</p>
            </div>
          ) : (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
              </p>
            </div>
          )}
        </div>

        <div className="sticky bottom-0 bg-white border-t p-4 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Confirm Location
          </Button>
        </div>
      </div>
    </div>
  );
};

export default MapSelector;
