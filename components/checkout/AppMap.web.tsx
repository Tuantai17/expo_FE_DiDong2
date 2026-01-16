/**
 * AppMap Component (Web Platform)
 * ================================
 * File này chỉ được sử dụng trên Web
 * Sử dụng Leaflet + OpenStreetMap
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import type { Map as LeafletMap, LatLngExpression } from "leaflet";

// =================== TYPES =====================

export interface AppMapProps {
    center: { lat: number; lng: number };
    onLocationChange: (coords: { lat: number; lng: number }) => void;
    onMapReady?: () => void;
    style?: any;
}

// =================== COMPONENT =====================

export default function AppMap({ center, onLocationChange, onMapReady, style }: AppMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<LeafletMap | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDragging, setIsDragging] = useState(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const lastCenterRef = useRef({ lat: center.lat, lng: center.lng });

    // Debounced location change handler
    const handleLocationChange = useCallback((lat: number, lng: number) => {
        // Clear previous timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Debounce to avoid too many geocoding calls
        debounceTimerRef.current = setTimeout(() => {
            // Only call if location actually changed
            const lastLat = lastCenterRef.current.lat;
            const lastLng = lastCenterRef.current.lng;

            // Check if moved more than ~10 meters
            const moved = Math.abs(lat - lastLat) > 0.0001 || Math.abs(lng - lastLng) > 0.0001;

            if (moved) {
                console.log("📍 [AppMap] Location changed:", lat.toFixed(6), lng.toFixed(6));
                lastCenterRef.current = { lat, lng };
                onLocationChange({ lat, lng });
            }
        }, 300); // 300ms debounce
    }, [onLocationChange]);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const initMap = async () => {
            try {
                const L = (await import("leaflet")).default;

                // Inject Leaflet CSS
                if (!document.getElementById("leaflet-css")) {
                    const link = document.createElement("link");
                    link.id = "leaflet-css";
                    link.rel = "stylesheet";
                    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
                    document.head.appendChild(link);

                    // Wait for CSS to load
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                // Fix default icon
                const DefaultIcon = L.icon({
                    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
                    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
                    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
                    iconSize: [25, 41],
                    iconAnchor: [12, 41],
                });
                L.Marker.prototype.options.icon = DefaultIcon;

                if (!mapContainerRef.current || mapInstanceRef.current) return;

                // Create map
                const map = L.map(mapContainerRef.current, {
                    center: [center.lat, center.lng] as LatLngExpression,
                    zoom: 17, // Higher zoom for better precision
                    zoomControl: true,
                    attributionControl: true,
                });

                // Add OSM tile layer
                L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                    maxZoom: 19,
                }).addTo(map);

                // Handle map drag start
                map.on("dragstart", () => {
                    setIsDragging(true);
                });

                // Handle map drag end
                map.on("dragend", () => {
                    setIsDragging(false);
                    const mapCenter = map.getCenter();
                    handleLocationChange(mapCenter.lat, mapCenter.lng);
                });

                // Handle zoom end
                map.on("zoomend", () => {
                    const mapCenter = map.getCenter();
                    handleLocationChange(mapCenter.lat, mapCenter.lng);
                });

                // Initial location callback
                handleLocationChange(center.lat, center.lng);

                mapInstanceRef.current = map;
                setIsLoading(false);

                // Notify parent that map is ready
                setTimeout(() => {
                    onMapReady?.();
                }, 100);

            } catch (error) {
                console.error("Error initializing map:", error);
                setIsLoading(false);
            }
        };

        // Delay slightly to ensure DOM is ready
        const timer = setTimeout(initMap, 150);

        return () => {
            clearTimeout(timer);
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, []);

    // Update center when props change (e.g., from search or GPS)
    useEffect(() => {
        if (mapInstanceRef.current) {
            const currentCenter = mapInstanceRef.current.getCenter();
            const needsUpdate =
                Math.abs(currentCenter.lat - center.lat) > 0.0001 ||
                Math.abs(currentCenter.lng - center.lng) > 0.0001;

            if (needsUpdate) {
                console.log("📍 [AppMap] Updating center from props:", center.lat.toFixed(6), center.lng.toFixed(6));
                mapInstanceRef.current.setView([center.lat, center.lng], mapInstanceRef.current.getZoom(), {
                    animate: true,
                    duration: 0.5,
                });
                lastCenterRef.current = { lat: center.lat, lng: center.lng };
            }
        }
    }, [center.lat, center.lng]);

    return (
        <View style={[styles.container, style]}>
            {/* Map Container */}
            <div
                ref={mapContainerRef}
                style={{
                    width: "100%",
                    height: "100%",
                    position: "absolute",
                    top: 0,
                    left: 0,
                }}
            />

            {/* Loading Overlay */}
            {isLoading && (
                <View style={styles.loading}>
                    <ActivityIndicator size="large" color="#5B9EE1" />
                    <Text style={styles.loadingText}>Đang tải bản đồ...</Text>
                </View>
            )}

            {/* Center Pin Overlay - Fixed at exact center */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -100%)",
                    zIndex: 1000,
                    pointerEvents: "none",
                    transition: "transform 0.1s ease-out",
                    // Bounce effect when dragging
                    ...(isDragging ? { transform: "translate(-50%, -110%)" } : {}),
                }}
            >
                <svg width="48" height="60" viewBox="0 0 48 60" fill="none">
                    {/* Shadow */}
                    <ellipse cx="24" cy="56" rx="10" ry="4" fill="rgba(0,0,0,0.2)" />
                    {/* Pin body */}
                    <path
                        d="M24 0C10.745 0 0 10.745 0 24c0 13.255 24 36 24 36s24-22.745 24-36C48 10.745 37.255 0 24 0z"
                        fill="#EF4444"
                    />
                    {/* Inner circle */}
                    <circle cx="24" cy="22" r="10" fill="white" />
                    {/* Center dot */}
                    <circle cx="24" cy="22" r="4" fill="#EF4444" />
                </svg>
            </div>

            {/* Crosshair for precision (optional visual aid) */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 2,
                    height: 20,
                    backgroundColor: "rgba(239, 68, 68, 0.3)",
                    zIndex: 999,
                    pointerEvents: "none",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: 20,
                    height: 2,
                    backgroundColor: "rgba(239, 68, 68, 0.3)",
                    zIndex: 999,
                    pointerEvents: "none",
                }}
            />
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
        overflow: "hidden",
        minHeight: 300,
    },
    loading: {
        ...StyleSheet.absoluteFillObject,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#F1F5F9",
        zIndex: 10,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: "#64748B",
    },
});
