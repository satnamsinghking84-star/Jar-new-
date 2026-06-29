import React, { useState } from 'react';
import { Phone, MapPin, Map, Clock, Package, HelpCircle, Compass, Navigation, Check } from 'lucide-react';
import { Customer } from '../types';
import { getTimingOrder } from '../utils/helpers';

interface Coords {
  lat: number;
  lng: number;
}

interface DeliveryBoySectionProps {
  customers: Customer[];
  onOpenDeliver: (id: string) => void;
}

// Helper to extract coordinates from Google Maps link or raw coordinates string
function extractCoords(mapLink?: string): Coords | null {
  if (!mapLink) return null;
  const cleaned = mapLink.trim();

  // 1. Check for standard @latitude,longitude format in URL (e.g. /@22.2942,73.2034,17z)
  const atMatch = cleaned.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) {
    const lat = parseFloat(atMatch[1]);
    const lng = parseFloat(atMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 2. Check for query parameters like q=latitude,longitude or ll=latitude,longitude
  const paramMatch = cleaned.match(/[?&](q|ll|cbll|saddr|daddr|place)=(-?\d+\.\d+),(-?\d+\.\d+)/i);
  if (paramMatch) {
    const lat = parseFloat(paramMatch[2]);
    const lng = parseFloat(paramMatch[3]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  // 3. Check for raw decimal latitude, longitude in text (e.g. "22.2942, 73.2034")
  const rawMatch = cleaned.match(/(-?\d+\.\d+)\s*[,\s]\s*(-?\d+\.\d+)/);
  if (rawMatch) {
    const lat = parseFloat(rawMatch[1]);
    const lng = parseFloat(rawMatch[2]);
    if (lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
      return { lat, lng };
    }
  }

  return null;
}

// Calculate Earth distance in kilometers using the Haversine formula
function getDistance(c1: Coords, c2: Coords): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = ((c2.lat - c1.lat) * Math.PI) / 180;
  const dLng = ((c2.lng - c1.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((c1.lat * Math.PI) / 180) *
      Math.cos((c2.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in km
}

// Generate an official multi-point Google Maps Directions link
function getMultiStopMapLink(startCoords: Coords | null, sortedCusts: Customer[]): string | null {
  const waypointCusts = sortedCusts
    .map(c => {
      const coords = extractCoords(c.mapLink);
      return coords ? { name: c.name, coords } : null;
    })
    .filter((x): x is { name: string; coords: Coords } => x !== null);

  if (waypointCusts.length === 0) return null;

  let originStr = "";
  let startIdx = 0;

  if (startCoords) {
    originStr = `${startCoords.lat},${startCoords.lng}`;
    startIdx = 0;
  } else {
    originStr = `${waypointCusts[0].coords.lat},${waypointCusts[0].coords.lng}`;
    startIdx = 1;
  }

  // Destination is the last customer coordinate
  const destCust = waypointCusts[waypointCusts.length - 1];
  const destinationStr = `${destCust.coords.lat},${destCust.coords.lng}`;

  // Waypoints are intermediate stops
  const waypoints = waypointCusts.slice(startIdx, waypointCusts.length - 1);
  const waypointsStr = waypoints.map(w => `${w.coords.lat},${w.coords.lng}`).join('|');

  const baseUrl = "https://www.google.com/maps/dir/?api=1";
  let url = `${baseUrl}&origin=${encodeURIComponent(originStr)}&destination=${encodeURIComponent(destinationStr)}`;
  if (waypointsStr) {
    url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
  }
  return url;
}

export default function DeliveryBoySection({ customers, onOpenDeliver }: DeliveryBoySectionProps) {
  const [optimizeMode, setOptimizeMode] = useState<'time' | 'distance'>('time');
  const [gpsCoords, setGpsCoords] = useState<Coords | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const visibleCustomers = customers.filter(c => {
    if (c.status !== 'closed') {
      return true; // Active customer
    }
    // Closed customer only if they have pending jars > 0
    return (c.jarsAtCustomer || 0) > 0;
  });

  if (visibleCustomers.length === 0) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-slate-400 text-center">
        <HelpCircle className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
        <p className="font-bold text-sm">Abhi koi customer nahi hai.</p>
        <p className="text-xs text-slate-400 mt-1">Sabhi orders completed hain ya koi active/pending-jar customer nahi hai.</p>
      </div>
    );
  }

  // Get current Live Location of delivery boy
  const getGpsLocation = () => {
    if (!navigator.geolocation) {
      setGpsError("Aapke phone/browser mein GPS available nahi hai.");
      return;
    }
    setGpsLoading(true);
    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGpsLoading(false);
      },
      (error) => {
        setGpsError("GPS permission nahi mili. Pehle phone location/permission check karein.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // 1. Sort by timing (Default)
  const timeSortedCustomers = [...visibleCustomers].sort(
    (a, b) => getTimingOrder(a.deliveryTime) - getTimingOrder(b.deliveryTime)
  );

  // 2. Parse coordinates and split into lists
  const withCoords: { customer: Customer; coords: Coords }[] = [];
  const withoutCoords: Customer[] = [];

  visibleCustomers.forEach(c => {
    const coords = extractCoords(c.mapLink);
    if (coords) {
      withCoords.push({ customer: c, coords });
    } else {
      withoutCoords.push(c);
    }
  });

  const withCoordsCount = withCoords.length;

  // 3. Optimize sequence by distance (Nearest Neighbor Routing)
  let sortedCustomers = timeSortedCustomers;
  if (optimizeMode === 'distance') {
    const optimizedWithCoords: Customer[] = [];
    const unvisited = [...withCoords];

    let currentPos: Coords | null = null;
    if (gpsCoords) {
      currentPos = gpsCoords;
    } else if (unvisited.length > 0) {
      // Fallback: use first customer as starting point
      const first = unvisited.shift()!;
      optimizedWithCoords.push(first.customer);
      currentPos = first.coords;
    }

    while (unvisited.length > 0 && currentPos) {
      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < unvisited.length; i++) {
        const dist = getDistance(currentPos, unvisited[i].coords);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }
      const nextNode = unvisited.splice(nearestIdx, 1)[0];
      optimizedWithCoords.push(nextNode.customer);
      currentPos = nextNode.coords;
    }

    sortedCustomers = [...optimizedWithCoords, ...withoutCoords];
  }

  // Calculate step-by-step distances and total route distance for the current sequence
  let totalKmOfRoute = 0;
  const stopDistancesFromPrev: { [customerId: string]: number } = {};
  let currentPosForDistance: Coords | null = gpsCoords;

  sortedCustomers.forEach((c) => {
    const coords = extractCoords(c.mapLink);
    if (coords) {
      if (currentPosForDistance) {
        const dist = getDistance(currentPosForDistance, coords);
        stopDistancesFromPrev[c.id] = dist;
        totalKmOfRoute += dist;
      } else {
        stopDistancesFromPrev[c.id] = 0;
      }
      currentPosForDistance = coords;
    }
  });

  // Determine start point for Multi-Stop Google Maps Route
  const startCoordsForMap = gpsCoords || (withCoords.length > 0 ? withCoords[0].coords : null);
  const multiStopUrl = getMultiStopMapLink(startCoordsForMap, sortedCustomers);

  return (
    <div className="px-4 py-4 pb-24 space-y-4">
      {/* Route Optimizer Control Center */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-5 text-white shadow-md border border-slate-700/50 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="w-6 h-6 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
            <div>
              <h4 className="font-extrabold text-sm tracking-tight text-emerald-300">Auto-Route Optimizer</h4>
              <p className="text-[10px] text-slate-300">Petrol aur time bachane ke liye optimal rasta</p>
            </div>
          </div>
          <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
            GPS Tool
          </span>
        </div>

        {/* Mode Toggles */}
        <div className="grid grid-cols-2 gap-2 bg-slate-800/80 p-1.5 rounded-2xl border border-slate-700/60">
          <button
            onClick={() => setOptimizeMode('time')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
              optimizeMode === 'time'
                ? 'bg-gradient-to-r from-blue-600 to-sky-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>⏰ Time Schedule</span>
          </button>
          <button
            onClick={() => {
              setOptimizeMode('distance');
              if (!gpsCoords) getGpsLocation(); // Auto-fetch GPS
            }}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none ${
              optimizeMode === 'distance'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white bg-transparent'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>🗺️ Shortest Route</span>
          </button>
        </div>

        {/* GPS Control and Status (when shortest route is active) */}
        {optimizeMode === 'distance' && (
          <div className="bg-slate-800/40 border border-slate-700/40 rounded-2xl p-3.5 space-y-3">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-bold">Start Location:</span>
              {gpsLoading ? (
                <span className="text-amber-400 animate-pulse flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                  GPS dhoondh raha hai...
                </span>
              ) : gpsCoords ? (
                <span className="text-emerald-400 font-extrabold flex items-center gap-1">
                  🟢 Live GPS Location Active
                </span>
              ) : (
                <span className="text-slate-400">Pehle Customer ke point se</span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              {!gpsCoords && !gpsLoading && (
                <button
                  onClick={getGpsLocation}
                  className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 font-bold text-xs py-2 px-4 rounded-xl hover:bg-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>📍 Live Location Se Map Karo</span>
                </button>
              )}
              {gpsError && (
                <p className="text-[10px] text-rose-300 font-semibold bg-rose-500/10 border border-rose-500/25 p-2 rounded-lg">
                  ⚠️ {gpsError}
                </p>
              )}
              {gpsCoords && (
                <p className="text-[10px] text-slate-300 leading-normal">
                  📍 Start point active hai: <code className="font-mono text-emerald-300 bg-slate-800 px-1 py-0.5 rounded">{gpsCoords.lat.toFixed(4)}, {gpsCoords.lng.toFixed(4)}</code>
                </p>
              )}
            </div>

            <div className="border-t border-slate-700/50 pt-2.5 flex justify-between items-center text-[10px] text-slate-300">
              <span className="flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>GPS Coords Waale: <b>{withCoordsCount} / {visibleCustomers.length}</b></span>
              </span>
              {withCoordsCount < visibleCustomers.length && (
                <span className="text-slate-400">
                  ({visibleCustomers.length - withCoordsCount} bina maps ke aakhiri mein hain)
                </span>
              )}
            </div>
            
            {/* Total Route Distance Box with Petrol & Savings Estimation */}
            {withCoordsCount > 0 && (
              <div className="space-y-2.5">
                {/* Distance Badge */}
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">🏁</span>
                    <div>
                      <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">KUL DOOR (Total Route Distance)</p>
                      <p className="text-base font-black text-white">
                        ~{totalKmOfRoute.toFixed(2)} km <span className="text-[10px] font-normal text-slate-300">({withCoordsCount} customer points)</span>
                      </p>
                    </div>
                  </div>
                  <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl px-2.5 py-1 text-center">
                    <p className="text-[9px] text-emerald-200 font-bold uppercase">Stops</p>
                    <p className="text-xs font-black text-white">{withCoordsCount}</p>
                  </div>
                </div>

                {/* Petrol & Money Saved Widget */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-3.5 grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-[9px] text-blue-300 font-bold uppercase tracking-wider">⛽ Petrol Kharcha (approx)</p>
                    <p className="text-sm font-extrabold text-white">
                      ~{((totalKmOfRoute / 40) * 100).toFixed(0)} Rs.
                    </p>
                    <p className="text-[9px] text-slate-400">At 40km/L & ₹100/L</p>
                  </div>
                  <div className="border-l border-slate-700/50 pl-3">
                    <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-wider">🎉 Petrol Bachat (Saved)</p>
                    <p className="text-sm font-extrabold text-emerald-400">
                      ~{((totalKmOfRoute * 0.25) * 2.5).toFixed(0)} Rs. Bachaye!
                    </p>
                    <p className="text-[9px] text-slate-400">~25% petrol bacha optimized raste se</p>
                  </div>
                </div>

                {/* Today's Live Delivery Progress Bar */}
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-2xl p-3.5 space-y-2">
                  <div className="flex justify-between items-center text-[10px] text-slate-300">
                    <span className="font-bold uppercase tracking-wider text-slate-400">📊 Delivery Progress Tracker</span>
                    <span className="font-black text-white bg-slate-700 px-2 py-0.5 rounded-full">
                      {visibleCustomers.filter(c => c.status === 'closed').length} / {visibleCustomers.length} Completed
                    </span>
                  </div>
                  <div className="w-full bg-slate-900 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${Math.round((visibleCustomers.filter(c => c.status === 'closed').length / visibleCustomers.length) * 100)}%` 
                      }}
                    ></div>
                  </div>
                  <p className="text-[9px] text-slate-400 text-right italic">
                    {Math.round((visibleCustomers.filter(c => c.status === 'closed').length / visibleCustomers.length) * 100)}% aaj ka kaam poora hua
                  </p>
                </div>
              </div>
            )}

            {/* All-in-One Route Button */}
            {multiStopUrl ? (
              <a
                href={multiStopUrl}
                target="_blank"
                rel="noreferrer"
                className="block text-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-105 active:scale-[0.99] text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-md transition-all border border-blue-500"
              >
                🗺️ POORA ROUTE Ek Saath Maps Par Chalao →
              </a>
            ) : (
              <p className="text-[10px] text-slate-400 text-center leading-normal">
                💡 Customers ke page par unka maps link/coordinates daalein taaki direct multi-stop navigation active ho sake!
              </p>
            )}
          </div>
        )}
      </div>

      <div className="text-xs uppercase tracking-wider text-slate-400 font-extrabold pl-1 flex items-center justify-between">
        <span>📋 {sortedCustomers.length} Customer Aaj ke liye</span>
        <span className="text-[10px] font-bold bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
          Sorted: {optimizeMode === 'distance' ? 'Shortest Route 🗺️' : 'Time Scheduled ⏰'}
        </span>
      </div>

      <div className="space-y-4">
        {sortedCustomers.map((c, i) => {
          const isClosed = c.status === 'closed';
          const hasCoords = extractCoords(c.mapLink) !== null;
          
          // Find if this is the very first customer in the list that has coords
          const isFirstWithCoords = i === sortedCustomers.findIndex(sc => extractCoords(sc.mapLink) !== null);
          const distFromPrev = stopDistancesFromPrev[c.id];
          const showDistString = distFromPrev !== undefined && distFromPrev > 0
            ? (isFirstWithCoords && gpsCoords
                ? `📍 Live GPS se: ${distFromPrev.toFixed(2)} km`
                : `🚗 Pichle Stop se: ${distFromPrev.toFixed(2)} km`)
            : (isFirstWithCoords && hasCoords ? `📍 Start Point` : null);

          return (
            <div
              key={c.id}
              className={`rounded-2xl shadow-sm border overflow-hidden transition-all duration-300 ${
                isClosed
                  ? 'border-slate-300 bg-slate-50/50 opacity-95 hover:border-slate-400'
                  : 'border-slate-100 hover:border-emerald-200 bg-white'
              }`}
            >
              {/* Top Info line */}
              <div className={`text-white px-4 py-3 flex justify-between items-center transition-all ${
                isClosed
                  ? 'bg-gradient-to-r from-slate-600 to-slate-400'
                  : 'bg-gradient-to-r from-emerald-700 to-emerald-500'
              }`}>
                <span className="font-extrabold text-sm flex items-center gap-2 flex-wrap">
                  {optimizeMode === 'distance' ? (
                    <span className="bg-white/20 border border-white/30 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                      📍 STOP #{i + 1}
                    </span>
                  ) : (
                    <span className="bg-white/15 border border-white/25 text-white text-[11px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider">
                      #{i + 1}
                    </span>
                  )}
                  <span className="font-extrabold text-sm ml-1">{c.name}</span>
                  {isClosed && (
                    <span className="bg-red-500/30 border border-red-400 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      Closed (Pending Jars)
                    </span>
                  )}
                  {hasCoords ? (
                    <span className="bg-emerald-400/20 border border-emerald-400/30 text-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      📍 GPS OK
                    </span>
                  ) : (
                    <span className="bg-white/10 border border-white/20 text-white/55 text-[9px] font-black px-2 py-0.5 rounded-full uppercase">
                      ❓ No GPS
                    </span>
                  )}
                  {showDistString && (
                    <span className="bg-blue-400/30 border border-blue-400/40 text-blue-100 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                      {showDistString}
                    </span>
                  )}
                </span>
                {c.phone && (
                  <a
                    href={`tel:${c.phone}`}
                    className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-bold hover:bg-white/30 transition-all"
                  >
                    📞 Call: {c.phone}
                  </a>
                )}
              </div>

              {/* Alert for closed customers */}
              {isClosed && (
                <div className="bg-amber-50 border-b border-amber-100 px-4 py-2.5 text-xs font-bold text-amber-800 flex items-center gap-1.5">
                  <span>⚠️ Yeh customer closed hai, lekin inke paas {c.jarsAtCustomer} empty jars pending hain!</span>
                </div>
              )}

              {/* Address Row */}
              {c.address && (
                <div className="px-4 py-3 border-b border-slate-50 text-xs text-slate-600 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="leading-relaxed">{c.address}</span>
                </div>
              )}

              {/* Maps redirection link */}
              {c.mapLink && (
                <div className="px-4 py-2 border-b border-slate-50 text-xs">
                  <a
                    href={c.mapLink}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-extrabold flex items-center gap-1 w-max"
                  >
                    <Map className="w-3.5 h-3.5" />
                    <span>Google Maps mein dekho →</span>
                  </a>
                </div>
              )}

              {/* Selected Timing Display */}
              {c.deliveryTime && (
                <div className="px-4 py-2 bg-amber-50/40 border-b border-slate-50 text-xs text-amber-900 flex items-center gap-1.5 font-bold">
                  <Clock className="w-4 h-4 text-amber-600" />
                  <span>⏰ Time: {c.deliveryTime}</span>
                </div>
              )}

              {/* Simple Distributed Jar Status badges */}
              <div className="px-4 py-2.5 bg-slate-50/50 border-b border-slate-50 flex gap-2 flex-wrap">
                <span className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Dene hain (Current Stock): 0</span>
                </span>
                <span className="bg-orange-50 border border-orange-100 text-orange-700 text-xs font-bold rounded-full px-3 py-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" />
                  <span>Lene hain (Out Jars): {c.jarsAtCustomer}</span>
                </span>
              </div>

              {/* Delivery insertion action */}
              <div className="p-3">
                <button
                  onClick={() => onOpenDeliver(c.id)}
                  className={`w-full hover:brightness-105 active:scale-[0.99] rounded-xl py-3 text-sm font-extrabold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                    isClosed
                      ? 'bg-gradient-to-r from-slate-600 to-slate-500 border-slate-600 text-white'
                      : 'bg-gradient-to-r from-blue-600 to-sky-500 border-blue-500 text-white'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  <span>{isClosed ? '📦 Empty Jars Waapis Le Lo' : '📦 Delivery Dalo'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
