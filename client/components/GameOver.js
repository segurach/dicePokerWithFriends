import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function GameOver({ t, players, resetGame, playAgain, currentTheme, myId }) {
    const sortedPlayers = players.sort((a, b) => b.score - a.score);

    // Dynamic button text color for high contrast
    const buttonTextColor = currentTheme === 'highContrast' ? '#000000' : '#FFFFFF';

    // Find my player details to show XP
    const myPlayer = players.find(p => p.id === myId);
    const xpDetails = myPlayer?.xpDetails || [];
    const xpGained = myPlayer?.xpGained || 0;

    return (
        <View style={styles.centerContent}>
            <Text
                style={styles.title}
                accessible={true}
                accessibilityRole="header"
            >
                {t('gameOver')}
            </Text>

            {/* XP Summary Section */}
            {xpGained > 0 && (
                <View style={styles.xpSummaryContainer}>
                    <Text style={styles.xpTitle}>XP GAINED</Text>
                    {xpDetails.map((detail, index) => (
                        <Text key={index} style={styles.xpDetailText}>{detail}</Text>
                    ))}
                    <View style={styles.xpTotalContainer}>
                        <Text style={styles.xpTotalText}>+{xpGained} XP</Text>
                    </View>
                </View>
            )}

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
                <Text style={[styles.buttonText, { color: buttonTextColor }]}>{t('playAgain')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
                style={styles.primaryButton}
                onPress={resetGame}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={t('backToLobby')}
                accessibilityHint="Returns to the lobby"
            >
                <Text style={[styles.buttonText, { color: buttonTextColor }]}>{t('backToLobby')}</Text>
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
    xpSummaryContainer: {
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 15,
        borderRadius: 12,
        marginBottom: 20,
        width: '80%',
        alignItems: 'center',
    },
    xpTitle: {
        color: '#ffb74d', // Orange accent
        fontWeight: 'bold',
        fontSize: 16,
        marginBottom: 8,
        letterSpacing: 1,
    },
    xpDetailText: {
        color: '#e0e0e0',
        fontSize: 14,
        marginBottom: 4,
    },
    xpTotalContainer: {
        marginTop: 10,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
        paddingTop: 8,
        width: '100%',
        alignItems: 'center',
    },
    xpTotalText: {
        color: '#69f0ae', // Green accent
        fontSize: 24,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
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
