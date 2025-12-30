import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Props type
type ProductFiltersProps = {
    categories: string[];
    activeCategory: string;
    onCategoryChange: (cat: string) => void;
    sortOrder: "asc" | "desc" | null;
    onSortToggle: () => void;
    resultCount: number;
};

export default function ProductFilters({
    categories,
    activeCategory,
    onCategoryChange,
    sortOrder,
    onSortToggle,
    resultCount,
}: ProductFiltersProps) {
    return (
        <View style={styles.filterWrapper}>
            {/* Category Scroll */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.categoryContainer}
            >
                {categories.map((cat) => (
                    <TouchableOpacity
                        key={cat}
                        style={[
                            styles.categoryBtn,
                            activeCategory === cat && styles.categoryBtnActive,
                        ]}
                        onPress={() => onCategoryChange(cat)}
                    >
                        <Text
                            style={[
                                styles.categoryText,
                                activeCategory === cat && styles.categoryTextActive,
                            ]}
                        >
                            {cat}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Sort Bar */}
            <View style={styles.sortBar}>
                <Text style={styles.resultText}>Found {resultCount} items</Text>

                <TouchableOpacity style={styles.sortBtn} onPress={onSortToggle}>
                    <Text style={styles.sortBtnText}>
                        Sort:{" "}
                        {sortOrder === "asc"
                            ? "Low to High"
                            : sortOrder === "desc"
                                ? "High to Low"
                                : "Default"}
                    </Text>
                    <Ionicons
                        name={
                            sortOrder === "asc"
                                ? "arrow-up"
                                : sortOrder === "desc"
                                    ? "arrow-down"
                                    : "filter"
                        }
                        size={14}
                        color="#5B9EE1"
                    />
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    filterWrapper: {
        backgroundColor: "#F8FAFC",
        marginBottom: 8,
    },
    categoryContainer: {
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 8,
    },
    categoryBtn: {
        paddingHorizontal: 18,
        paddingVertical: 8,
        borderRadius: 20,
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    categoryBtnActive: {
        backgroundColor: "#5B9EE1",
        borderColor: "#5B9EE1",
    },
    categoryText: {
        fontSize: 13,
        fontWeight: "600",
        color: "#64748B",
    },
    categoryTextActive: {
        color: "#FFFFFF",
    },
    sortBar: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 8,
    },
    resultText: {
        fontSize: 13,
        color: "#64748B",
        fontWeight: "500",
    },
    sortBtn: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
        paddingVertical: 6,
        paddingHorizontal: 10,
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    sortBtnText: {
        fontSize: 11,
        fontWeight: "600",
        color: "#5B9EE1",
    },
});