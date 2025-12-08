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
    totalXP = 0,
    currentDiceSkin,
    setCurrentDiceSkin
}) {
    const themeNames = {
        darkBlue: 'themeDarkBlue',
        darkPurple: 'themePurple',
        forestGreen: 'themeGreen',
        sunsetOrange: 'themeSunset',
        highContrast: 'themeHighContrast',
        legendary: 'themeLegendary',
    };

    // XP calculation
    const currentLevelXP = totalXP % 1000;
    const xpProgress = (currentLevelXP / 1000) * 100;

    // Title Logic
    const getTitle = (lvl) => {
        if (lvl >= 50) return t('titleLegend');
        if (lvl >= 20) return t('titleMaster');
        if (lvl >= 10) return t('titleHighRoller');
        if (lvl >= 5) return t('titleRoller');
        return t('titleNovice');
    };

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
                {themeKeys.map((themeKey) => {
                    const themeObj = themes[themeKey];
                    const isLocked = (themeObj.requiredLevel || 1) > level;

                    return (
                        <TouchableOpacity
                            key={themeKey}
                            style={[
                                styles.themeCircle,
                                { backgroundColor: themeObj.primary },
                                currentTheme === themeKey && styles.selectedTheme,
                                isLocked && styles.lockedTheme
                            ]}
                            onPress={() => {
                                if (isLocked) {
                                    alert(t('locked').replace('{level}', themeObj.requiredLevel));
                                } else {
                                    setCurrentTheme(themeKey);
                                }
                            }}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={t(themeNames[themeKey]) + (isLocked ? ` (${t('locked').replace('{level}', themeObj.requiredLevel)})` : '')}
                            accessibilityHint={isLocked ? "Theme locked" : "Changes the app color theme"}
                            accessibilityState={{ selected: currentTheme === themeKey, disabled: isLocked }}
                        >
                            {currentTheme === themeKey && !isLocked && (
                                <Text style={styles.checkmark} importantForAccessibility="no">✓</Text>
                            )}
                            {isLocked && (
                                <Text style={styles.lockIcon} importantForAccessibility="no">🔒</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
            </View>

            <View
                style={styles.skinSelector}
                accessible={false}
                accessibilityLabel="Dice skin selector"
            >
                <Text style={[styles.sectionLabel, { color: '#fff' }]}>{t('diceStyle')}:</Text>
                {['standard', 'golden'].map((skin) => {
                    const isLocked = skin === 'golden' && level < 10;
                    const skinColor = skin === 'golden' ? '#ffd700' : '#ffffff';

                    return (
                        <TouchableOpacity
                            key={skin}
                            style={[
                                styles.themeCircle,
                                { backgroundColor: skinColor },
                                currentDiceSkin === skin && styles.selectedTheme,
                                isLocked && styles.lockedTheme
                            ]}
                            onPress={() => {
                                if (isLocked) {
                                    alert(t('locked').replace('{level}', 10));
                                } else {
                                    setCurrentDiceSkin(skin);
                                }
                            }}
                            accessible={true}
                            accessibilityRole="button"
                            accessibilityLabel={t(skin === 'standard' ? 'skinStandard' : 'skinGolden')}
                        >
                            {currentDiceSkin === skin && !isLocked && (
                                <Text style={[styles.checkmark, { color: skin === 'standard' ? '#000' : '#fff' }]} importantForAccessibility="no">✓</Text>
                            )}
                            {isLocked && (
                                <Text style={styles.lockIcon} importantForAccessibility="no">🔒</Text>
                            )}
                        </TouchableOpacity>
                    );
                })}
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
                <View style={{ alignItems: 'center', marginRight: 15 }}>
                    <Text style={styles.levelBadge}>LVL {level}</Text>
                    <Text style={styles.playerTitle}>{getTitle(level)}</Text>
                </View>
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

            {
                !currentRoom ? (
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
                )
            }
        </View >
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
        // marginRight: 10, // Removed as it's now in a container with margin
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 10,
    },
    playerTitle: {
        fontSize: 10,
        color: '#ffd700',
        fontWeight: 'bold',
        marginTop: 2,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 1,
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
        alignItems: 'center',
    },
    skinSelector: {
        position: 'absolute',
        top: 90,
        left: 20,
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center',
    },
    sectionLabel: {
        fontSize: 14,
        fontWeight: 'bold',
        marginRight: 5,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    themeCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginHorizontal: 5,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
    },
    lockedTheme: {
        opacity: 0.5,
        borderStyle: 'dashed',
    },
    selectedTheme: {
        borderColor: '#ffff00', // Yellow selection border
        borderWidth: 3,
        transform: [{ scale: 1.2 }],
    },
    lockIcon: {
        fontSize: 16,
    },
    checkmark: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
});
