import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Animated } from 'react-native';

const Die = ({ value, isKept, isEmpty, onPress, disabled, animStyle }) => {
    const getDots = (v) => {
        switch (v) {
            case 1: return [<View key="c" style={styles.dotCenter} />];
            case 2: return [<View key="tl" style={styles.dotTL} />, <View key="br" style={styles.dotBR} />];
            case 3: return [<View key="tl" style={styles.dotTL} />, <View key="c" style={styles.dotCenter} />, <View key="br" style={styles.dotBR} />];
            case 4: return [<View key="tl" style={styles.dotTL} />, <View key="tr" style={styles.dotTR} />, <View key="bl" style={styles.dotBL} />, <View key="br" style={styles.dotBR} />];
            case 5: return [<View key="tl" style={styles.dotTL} />, <View key="tr" style={styles.dotTR} />, <View key="c" style={styles.dotCenter} />, <View key="bl" style={styles.dotBL} />, <View key="br" style={styles.dotBR} />];
            case 6: return [
                <View key="tl" style={styles.dotTL} />, <View key="tr" style={styles.dotTR} />,
                <View key="ml" style={styles.dotML} />, <View key="mr" style={styles.dotMR} />,
                <View key="bl" style={styles.dotBL} />, <View key="br" style={styles.dotBR} />
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
    dieInner: {
        width: '100%',
        height: '100%',
        position: 'relative',
    },
    dieKept: {
        backgroundColor: '#b2dfdb', // Light Teal
        borderColor: '#00bfa5', // Teal
        borderWidth: 3,
        transform: [{ scale: 0.95 }], // Slight shrink effect
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
    dotCenter: { position: 'absolute', top: 23, left: 23, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotTL: { position: 'absolute', top: 7, left: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotTR: { position: 'absolute', top: 7, right: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotML: { position: 'absolute', top: 23, left: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotMR: { position: 'absolute', top: 23, right: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotBL: { position: 'absolute', bottom: 7, left: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
    dotBR: { position: 'absolute', bottom: 7, right: 7, width: 10, height: 10, borderRadius: 5, backgroundColor: 'black' },
});

export default Die;
