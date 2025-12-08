import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

const Die = ({ value, isKept, isEmpty, onPress, disabled, animStyle, skin = 'standard' }) => {
    const isGolden = skin === 'golden';
    const dotStyle = isGolden ? styles.dotWhite : styles.dotBlack;

    const getDots = (v) => {
        switch (v) {
            case 1: return [<View key="c" style={[styles.dotCenter, dotStyle]} />];
            case 2: return [<View key="tl" style={[styles.dotTL, dotStyle]} />, <View key="br" style={[styles.dotBR, dotStyle]} />];
            case 3: return [<View key="tl" style={[styles.dotTL, dotStyle]} />, <View key="c" style={[styles.dotCenter, dotStyle]} />, <View key="br" style={[styles.dotBR, dotStyle]} />];
            case 4: return [<View key="tl" style={[styles.dotTL, dotStyle]} />, <View key="tr" style={[styles.dotTR, dotStyle]} />, <View key="bl" style={[styles.dotBL, dotStyle]} />, <View key="br" style={[styles.dotBR, dotStyle]} />];
            case 5: return [<View key="tl" style={[styles.dotTL, dotStyle]} />, <View key="tr" style={[styles.dotTR, dotStyle]} />, <View key="c" style={[styles.dotCenter, dotStyle]} />, <View key="bl" style={[styles.dotBL, dotStyle]} />, <View key="br" style={[styles.dotBR, dotStyle]} />];
            case 6: return [
                <View key="tl" style={[styles.dotTL, dotStyle]} />, <View key="tr" style={[styles.dotTR, dotStyle]} />,
                <View key="ml" style={[styles.dotML, dotStyle]} />, <View key="mr" style={[styles.dotMR, dotStyle]} />,
                <View key="bl" style={[styles.dotBL, dotStyle]} />, <View key="br" style={[styles.dotBR, dotStyle]} />
            ];
            default: return [];
        }
    };

    const getAccessibilityLabel = () => {
        if (isEmpty) return "Not rolled yet";
        return `Die showing ${value}${isKept ? ', kept' : ''}`;
    };

    const getAccessibilityHint = () => {
        if (disabled || isEmpty) return undefined;
        return isKept ? "Tap to unkeep this die" : "Tap to keep this die";
    };

    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel={getAccessibilityLabel()}
            accessibilityHint={getAccessibilityHint()}
            accessibilityState={{ disabled, selected: isKept }}
        >
            <Animated.View style={[
                styles.die,
                isGolden && styles.dieGolden,
                isKept && styles.dieKept,
                isEmpty && styles.dieEmpty,
                animStyle
            ]}>
                {isEmpty ? (
                    <Text style={styles.dieText} importantForAccessibility="no">?</Text>
                ) : (
                    <View style={styles.dieInner} importantForAccessibility="no">
                        {getDots(value)}
                    </View>
                )}
            </Animated.View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    die: {
        width: 56,
        height: 56,
        backgroundColor: 'white',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#ccc',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    dieGolden: {
        backgroundColor: '#ffd700', // Gold
        borderColor: '#b8860b', // Dark Goldenrod
        borderWidth: 2,
    },
    dieInner: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    dieKept: {
        borderColor: '#00bfa5', // Teal
        borderWidth: 4, // Thicker border for kept
        transform: [{ scale: 0.95 }],
    },
    dieEmpty: {
        backgroundColor: '#cfd8dc', // Blue Grey
        borderColor: '#90a4ae',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dieText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#757575',
    },
    // Dots
    dotBlack: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotWhite: { position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: 'white' },

    // Dot Positions (reused for both colors)
    dotCenter: { top: 23, left: 23 },
    dotTL: { top: 7, left: 7 },
    dotTR: { top: 7, right: 7 },
    dotML: { top: 23, left: 7 },
    dotMR: { top: 23, right: 7 },
    dotBL: { bottom: 7, left: 7 },
    dotBR: { bottom: 7, right: 7 },
});

export default Die;
