import { Platform } from 'react-native';

// Use a flag to switch between real and simulated ads
// For now, we force simulation if we are in Expo Go (which doesn't support the native module)
let mobileAds = null;
let RewardedAd = null;
let RewardedAdEventType = null;
let TestIds = null;

const isExpoGo = Constants.appOwnership === 'expo';
// You can also use a manual flag here to force simulation during development of native builds
const USE_REAL_ADS = !isExpoGo && !__DEV__;

try {
    if (!isExpoGo) {
        const ads = require('react-native-google-mobile-ads');
        mobileAds = ads.default;
        RewardedAd = ads.RewardedAd;
        RewardedAdEventType = ads.RewardedAdEventType;
        TestIds = ads.TestIds;
    }
} catch (e) {
    console.warn("AdMob module not found or failed to load. Falling back to simulation.", e);
}

import Constants from 'expo-constants';

export const AdService = {
    initialize: async () => {
        if (mobileAds) {
            await mobileAds().initialize();
        }
    },

    createRewardedAd: (adUnitId = null) => {
        // If simulated or module not loaded
        if (!RewardedAd || !USE_REAL_ADS) {
            return {
                load: () => {
                    // Simulation handled by UI component mostly, but we could emit events here if we wanted a non-UI service
                    // For now, we return a dummy object that component checks against
                },
                show: () => { },
                addAdEventListener: (event, handler) => {
                    // Simulate load immediately
                    if (event === 'loaded') {
                        setTimeout(handler, 100);
                    }
                    // Simulate earned reward NOT here (needs user interaction), 
                    // so we rely on the AdModal for the simulation part.
                    return () => { };
                },
                isSimulated: true
            };
        }

        // Real Ad logic
        const unitId = adUnitId || TestIds.REWARDED;
        return RewardedAd.createForAdRequest(unitId, {
            keywords: ['game', 'poker', 'dice'],
        });
    },

    events: RewardedAdEventType || {
        LOADED: 'loaded',
        EARNED_REWARD: 'earned_reward',
    },

    isReady: () => !!mobileAds && USE_REAL_ADS
};
