import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function GameOver({ t, players, resetGame }) {
    return (
        <View style={styles.centerContent}>
            <Text style={styles.title}>{t('gameOver')}</Text>
            <Text style={styles.subtitle}>{t('finalScores')}</Text>
            {players
                .sort((a, b) => b.score - a.score)
                .map((p, i) => (
                    <View key={i} style={{ marginBottom: 10, alignItems: 'center' }}>
                        <Text style={{ fontSize: 24, color: i === 0 ? '#ffeb3b' : '#fff', fontWeight: 'bold' }}>
                            {i === 0 ? '👑 ' : ''}{p.name}: {p.score}
                        </Text>
                    </View>
                ))}
            <View style={styles.separator} />
            <TouchableOpacity style={styles.primaryButton} onPress={resetGame}>
                <Text style={styles.buttonText}>{t('backToLobby')}</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    centerContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 20,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e8eaf6',
        marginBottom: 10,
        textAlign: 'center',
    },
    separator: {
        height: 30,
    },
    primaryButton: {
        backgroundColor: '#ff6f00', // Amber/Orange
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
        elevation: 3,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
