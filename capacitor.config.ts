import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.backgammon.coach',
    appName: 'Backgammon Pro & Coach',
    webDir: 'out',
    server: {
        androidScheme: 'https',
    },
    plugins: {
        CapacitorSQLite: {
            iosDatabaseLocation: 'Library/CapacitorDatabase',
            iosIsEncryption: false,
            iosKeychainPrefix: 'backgammon-sqlite',
            androidIsEncryption: false,
        },
        Haptics: {},
        Share: {},
    },
};

export default config;
