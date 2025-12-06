import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';

export default function Lobby({
    language,
    setLanguage,
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
    players
}) {
    return (
        <View style={styles.centerContent}>
            <TouchableOpacity
                style={styles.langButton}
                onPress={() => setLanguage(l => l === 'fr' ? 'en' : 'fr')}
            >
                <Text style={styles.langButtonText}>{language === 'fr' ? '🇬🇧 EN' : '🇫🇷 FR'}</Text>
            </TouchableOpacity>

            <Text style={styles.title}>{t('title')}</Text>
            <Text style={{ color: isConnected ? '#4caf50' : '#f44336', marginBottom: 20, fontWeight: 'bold' }}>
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
                    />
                    <TouchableOpacity style={styles.primaryButton} onPress={createRoom}>
                        <Text style={styles.buttonText}>{t('createRoom')}</Text>
                    </TouchableOpacity>

                    <View style={styles.separator} />

                    <TextInput
                        style={styles.input}
                        placeholder={t('roomCode')}
                        placeholderTextColor="#999"
                        value={roomCode}
                        onChangeText={setRoomCode}
                        autoCapitalize="characters"
                    />
                    <TouchableOpacity style={styles.secondaryButton} onPress={joinRoom}>
                        <Text style={styles.buttonText}>{t('joinRoom')}</Text>
                    </TouchableOpacity>
                </View>
            ) : (
                <View style={{ width: '100%', alignItems: 'center' }}>
                    <Text style={styles.roomCode}>{t('room')}: {currentRoom}</Text>
                    <Text style={styles.subtitle}>{t('players')}</Text>
                    {players.map((p, i) => (
                        <Text key={i} style={styles.player}>{p.name}</Text>
                    ))}
                    <View style={styles.separator} />
                    <TouchableOpacity style={styles.primaryButton} onPress={startGame}>
                        <Text style={styles.buttonText}>{t('startGame')}</Text>
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
});
