import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { themes, themeKeys } from '../utils/themes';

export default function Lobby({
    language,
    setLanguage,
    currentTheme,
    setCurrentTheme,
    theme,
    t,
    isConnected,
    currentRoom,
    playerName,
    setPlayerName,
    roomCode,
    setRoomCode,
    createRoom,
    joinRoom,
    startGame,
    players,
    level = 1,
    totalXP = 0
}) {
    const themeNames = {
        darkBlue: 'themeDarkBlue',
        darkPurple: 'themePurple',
        forestGreen: 'themeGreen',
        sunsetOrange: 'themeSunset',
        highContrast: 'themeHighContrast',
    };

    // XP calculation
    const currentLevelXP = totalXP % 1000;
    const xpProgress = (currentLevelXP / 1000) * 100;

    // Dynamic button text color based on theme
    // Use black text for high contrast and bright accent colors
    const getButtonTextColor = (bgColor) => {
        // High contrast always uses black
        if (currentTheme === 'highContrast') return '#000000';

        // For bright/yellow colors, use black text
        const brightColors = ['#FFFF00', '#ffeb3b', '#ffd54f', '#ffa726', '#ffcc80'];
        if (brightColors.includes(bgColor)) return '#000000';

        // Default: white text
        return '#FFFFFF';
    };

    return (
        <View style={styles.centerContent}>
            <TouchableOpacity
                style={styles.langButton}
                onPress={() => setLanguage(l => l === 'fr' ? 'en' : 'fr')}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel={language === 'fr' ? 'Switch to English' : 'Passer en français'}
                accessibilityHint="Changes the app language"
            >
                <Text style={styles.langButtonText}>{language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}</Text>
            </TouchableOpacity>

            <View
                style={styles.themeSelector}
                accessible={false}
                accessibilityLabel="Theme selector"
            >
                {themeKeys.map((themeKey) => (
                    <TouchableOpacity
                        key={themeKey}
                        style={[
                            styles.themeCircle,
                            { backgroundColor: themes[themeKey].primary },
                            currentTheme === themeKey && styles.selectedTheme,
                        ]}
                        onPress={() => setCurrentTheme(themeKey)}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t(themeNames[themeKey])}
                        accessibilityHint="Changes the app color theme"
                        accessibilityState={{ selected: currentTheme === themeKey }}
                    >
                        {currentTheme === themeKey && (
                            <Text style={styles.checkmark} importantForAccessibility="no">✓</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>

            <Text
                style={styles.title}
                accessible={true}
                accessibilityRole="header"
            >
                {t('title')}
            </Text>

            {/* XP Profile Section */}
            <View style={styles.profileContainer}>
                <Text style={styles.levelBadge}>LVL {level}</Text>
                <View style={styles.xpInfo}>
                    <View style={styles.xpBarBg}>
                        <View style={[styles.xpBarFill, { width: `${xpProgress}%`, backgroundColor: theme.accent }]} />
                    </View>
                    <Text style={styles.xpText}>{currentLevelXP} / 1000 XP</Text>
                </View>
            </View>

            <Text
                style={{ color: isConnected ? '#4caf50' : '#f44336', marginBottom: 20, fontWeight: 'bold' }}
                accessible={true}
                accessibilityRole="text"
                accessibilityLiveRegion="polite"
            >
                {isConnected ? t('connectedToServer') : t('disconnected')}
            </Text>

            {!currentRoom ? (
                <View style={styles.inputContainer}>
                    <TextInput
                        style={styles.input}
                        placeholder={t('yourName')}
                        placeholderTextColor="#999"
                        value={playerName}
                        onChangeText={setPlayerName}
                        accessible={true}
                        accessibilityLabel={t('yourName')}
                        accessibilityHint="Enter your player name"
                    />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                        onPress={createRoom}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('createRoom')}
                        accessibilityHint="Creates a new game room"
                    >
                        <Text style={[styles.buttonText, { color: getButtonTextColor(theme.accent) }]}>{t('createRoom')}</Text>
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TextInput
                        style={styles.input}
                        placeholder={t('roomCode')}
                        placeholderTextColor="#999"
                        value={roomCode}
                        onChangeText={setRoomCode}
                        autoCapitalize="characters"
                        accessible={true}
                        accessibilityLabel={t('roomCode')}
                        accessibilityHint="Enter the room code to join"
                    />
                    <TouchableOpacity
                        style={[styles.secondaryButton, { backgroundColor: theme.secondary }]}
                        onPress={joinRoom}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('joinRoom')}
                        accessibilityHint="Joins an existing game room"
                    >
                        <Text style={[styles.buttonText, { color: getButtonTextColor(theme.secondary) }]}>{t('joinRoom')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text
                        style={[styles.roomCode, { color: theme.accentLight }]}
                        accessible={true}
                        accessibilityRole="text"
                        accessibilityLabel={`${t('room')}: ${currentRoom}`}
                    >
                        {t('room')}: {currentRoom}
                    </Text>
                    <Text
                        style={styles.subtitle}
                        accessible={true}
                        accessibilityRole="header"
                    >
                        {t('players')}
                    </Text>
                    {players.map((p, i) => (
                        <Text
                            key={i}
                            style={styles.player}
                            accessible={true}
                            accessibilityRole="text"
                        >
                            {p.name}
                        </Text>
                    ))}
                    <View style={styles.separator} />
                    <TouchableOpacity
                        style={[styles.primaryButton, { backgroundColor: theme.accent }]}
                        onPress={startGame}
                        accessible={true}
                        accessibilityRole="button"
                        accessibilityLabel={t('startGame')}
                        accessibilityHint="Starts the game with current players"
                    >
                        <Text style={[styles.buttonText, { color: getButtonTextColor(theme.accent) }]}>{t('startGame')}</Text>
                    </TouchableOpacity>
                </View>
            )}
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
    profileContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
        padding: 8,
        borderRadius: 20,
        marginBottom: 20,
    },
    levelBadge: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 14,
        marginRight: 10,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    xpInfo: {
        flexDirection: 'column',
    },
    xpBarBg: {
        width: 150,
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.2)',
        borderRadius: 4,
        overflow: 'hidden',
    },
    xpBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    xpText: {
        color: '#ccc',
        fontSize: 10,
        textAlign: 'center',
        marginTop: 2,
    },
    subtitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#e8eaf6',
        marginBottom: 10,
        textAlign: 'center',
    },
    player: {
        fontSize: 18,
        color: '#fff',
        marginBottom: 5,
    },
    roomCode: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#ffeb3b', // Yellow
        marginBottom: 20,
    },
    inputContainer: {
        width: '100%',
        maxWidth: 300,
    },
    input: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 15,
        marginBottom: 15,
        borderRadius: 8,
        fontSize: 16,
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
    secondaryButton: {
        backgroundColor: '#5c6bc0', // Lighter Blue
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
    langButton: {
        position: 'absolute',
        top: 40,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        padding: 8,
        borderRadius: 20,
    },
    langButtonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
    themeSelector: {
        position: 'absolute',
        top: 40,
        left: 20,
        flexDirection: 'row',
        gap: 10,
    },
    themeCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        borderWidth: 2,
        borderColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
    selectedTheme: {
        borderColor: '#fff',
        borderWidth: 3,
    },
    checkmark: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
