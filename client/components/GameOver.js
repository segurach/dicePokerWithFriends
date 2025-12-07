import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function GameOver({ t, players, resetGame, playAgain }) {
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

    return (
        <View style={styles.centerContent}>
            <Text
                style={styles.title}
                accessible={true}
                accessibilityRole="header"
            >
                {t('gameOver')}
            </Text>
            <Text
                style={styles.subtitle}
                accessible={true}
                accessibilityRole="header"
            >
                {t('finalScores')}
            </Text>
            {sortedPlayers.map((p, i) => (
                <View key={i} style={{ marginBottom: 10, alignItems: 'center' }}>
                    <Text
                        style={{ fontSize: 24, color: i === 0 ? '#ffeb3b' : '#fff', fontWeight: 'bold' }}
                        accessible={true}
                        accessibilityRole="text"
                        accessibilityLabel={i === 0 ? `Winner: ${p.name} with ${p.score} points` : `${p.name}: ${p.score} points`}
                    >
                        {i === 0 ? '👑 ' : ''}{p.name}: {p.score}
                    </Text>
                </View>
            ))}
            <View style={styles.separator} />
            <TouchableOpacity
                style={styles.secondaryButton}
                onPress={playAgain}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('playAgain')}
                accessibilityHint="Starts a new game with the same players"
            >
                <Text style={styles.buttonText}>{t('playAgain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.primaryButton}
                onPress={resetGame}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('backToLobby')}
                accessibilityHint="Returns to the lobby"
            >
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
        backgroundColor: '#ff6f00',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
        elevation: 3,
    },
    secondaryButton: {
        backgroundColor: '#5c6bc0',
        padding: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginBottom: 10,
    },
    buttonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
