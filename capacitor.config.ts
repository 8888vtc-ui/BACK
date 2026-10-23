import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.backgammontour.app',
    appName: 'Backgammon Tour',
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
