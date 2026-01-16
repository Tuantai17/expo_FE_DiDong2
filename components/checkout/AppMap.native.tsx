/**
 * AppMap Component (Native Platform - iOS/Android)
 * =================================================
 * File này chỉ được sử dụng trên Mobile
 * Sử dụng react-native-maps + OpenStreetMap style
 */

import React, { useEffect, useRef, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import MapView, { PROVIDER_DEFAULT, Region } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";

// =================== TYPES =====================

export interface AppMapProps {
    center: { lat: number; lng: number };
    onLocationChange: (coords: { lat: number; lng: number }) => void;
    onMapReady?: () => void;
    style?: any;
}

// =================== COMPONENT =====================

export default function AppMap({ center, onLocationChange, onMapReady, style }: AppMapProps) {
    const mapRef = useRef<MapView>(null);

    // Update map when center changes
    useEffect(() => {
        if (mapRef.current) {
            mapRef.current.animateToRegion(
                {
                    latitude: center.lat,
                    longitude: center.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                },
                500
            );
        }
    }, [center.lat, center.lng]);

    const handleRegionChangeComplete = useCallback((region: Region) => {
        onLocationChange({ lat: region.latitude, lng: region.longitude });
    }, [onLocationChange]);

    return (
        <View style={[styles.container, style]}>
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_DEFAULT}
                initialRegion={{
                    latitude: center.lat,
                    longitude: center.lng,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                }}
                onRegionChangeComplete={handleRegionChangeComplete}
                onMapReady={onMapReady}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass={false}
                mapType="standard"
            />

            {/* Fixed Center Pin */}
            <View style={styles.centerPin} pointerEvents="none">
                <View style={styles.pinShadow} />
                <Ionicons name="location" size={40} color="#EF4444" />
            </View>
        </View>
    );
}

// =================== STYLES =====================

const styles = StyleSheet.create({
    container: {
        flex: 1,
        position: "relative",
    },
    map: {
        ...StyleSheet.absoluteFillObject,
    },
    centerPin: {
        position: "absolute",
        top: "50%",
        left: "50%",
        marginLeft: -20,
        marginTop: -40,
        alignItems: "center",
    },
    pinShadow: {
        position: "absolute",
        bottom: -4,
        width: 20,
        height: 8,
        backgroundColor: "rgba(0,0,0,0.2)",
        borderRadius: 10,
    },
});
