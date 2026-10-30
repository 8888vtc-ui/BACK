/**
 * Types et définitions pour le système d'internationalisation (i18n) multilingue (FR/EN/ES/PT/DE/AR/JA).
 */

export type Locale = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar' | 'ja';

export type PrimaryLocale = 'fr' | 'en' | 'es' | 'pt' | 'de' | 'ar';

export interface LocaleMetadata {
    readonly code: Locale;
    readonly label: string;
    readonly nativeLabel: string;
    readonly shortLabel: string;
    readonly flag: string;
    readonly dir: 'ltr' | 'rtl';
    readonly hreflang: string;
}

export const LOCALE_METADATA: Record<Locale, LocaleMetadata> = {
    fr: { code: 'fr', label: 'Français', nativeLabel: 'Français', shortLabel: 'FR', flag: 'FR', dir: 'ltr', hreflang: 'fr-FR' },
    en: { code: 'en', label: 'English', nativeLabel: 'English', shortLabel: 'EN', flag: 'EN', dir: 'ltr', hreflang: 'en-US' },
    es: { code: 'es', label: 'Español', nativeLabel: 'Español', shortLabel: 'ES', flag: 'ES', dir: 'ltr', hreflang: 'es-ES' },
    pt: { code: 'pt', label: 'Português', nativeLabel: 'Português', shortLabel: 'PT', flag: 'PT', dir: 'ltr', hreflang: 'pt-BR' },
    de: { code: 'de', label: 'Deutsch', nativeLabel: 'Deutsch', shortLabel: 'DE', flag: 'DE', dir: 'ltr', hreflang: 'de-DE' },
    ar: { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', shortLabel: 'AR', flag: 'AR', dir: 'rtl', hreflang: 'ar-SA' },
    ja: { code: 'ja', label: 'Japanese', nativeLabel: '日本語', shortLabel: 'JA', flag: 'JA', dir: 'ltr', hreflang: 'ja-JP' },
};

export const PRIMARY_LOCALES: readonly PrimaryLocale[] = ['fr', 'en', 'es', 'pt', 'de', 'ar'] as const;

export function isRtlLocale(locale: string): boolean {
    return locale === 'ar';
}

export interface TranslationDictionary {
    common: {
        appName: string;
        close: string;
        cancel: string;
        retry: string;
        confirm: string;
        save: string;
        loading: string;
        error: string;
        success: string;
        warning: string;
        info: string;
        online: string;
        offline: string;
        offlineMode: string;
        onlineMode: string;
        player: string;
        opponent: string;
        points: string;
    };
    hud: {
        title: string;
        tournament: string;
        moneyPlay: string;
        matchTo: string;
        score: string;
        turn: string;
        dice: string;
        rollDice: string;
        doubleCube: string;
        resetMatch: string;
        toggleTheme: string;
        language: string;
        coachTrigger: string;
        openingBook: string;
        exportImport: string;
        multiplayer: string;
        crawfordRound: string;
    };
    board: {
        regionLabel: string;
        pointLabel: string;
        emptyPoint: string;
        checkersCount: string;
        legalTarget: string;
        closedPoint: string;
        blotPoint: string;
        barWhite: string;
        barBlack: string;
        trayWhite: string;
        trayBlack: string;
        bearOffLegal: string;
        dieSelected: string;
        usedDie: string;
        skipToHud: string;
        skipToBoard: string;
        skipToCoach: string;
    };
    coach: {
        title: string;
        subtitle: string;
        blunder: string;
        doubtful: string;
        howler: string;
        equityLoss: string;
        playedMove: string;
        optimalMove: string;
        explainError: string;
        explaining: string;
        keyConcept: string;
        advice: string;
        modeLabel: string;
        modeAuto: string;
        modeManual: string;
        thresholdLabel: string;
        blundersOnly: string;
        doubtfulsAndBlunders: string;
        sourceCache: string;
        sourceRuleBased: string;
        sourceLlm: string;
        matchContext: string;
        gammonPrice: string;
        takePoint: string;
        dmpBadge: string;
        crawfordBadge: string;
        postCrawfordBadge: string;
        cubeBadge: string;
        retryBtn: string;
    };
    rollout: {
        title: string;
        badge: string;
        subtitle: string;
        poolStats: string;
        workersReady: string;
        workersActive: string;
        candidateMoves: string;
        precisionLabel: string;
        trials324: string;
        trials1296: string;
        trials2592: string;
        speedFast: string;
        speedStandard: string;
        speedHigh: string;
        launchBtn: string;
        queued: string;
        running: string;
        completed: string;
        failed: string;
        cancelled: string;
        progressBarLabel: string;
        gamesCount: string;
        gamesLabel: string;
        etaRemaining: string;
        etaLabel: string;
        finalCalculating: string;
        cancelBtn: string;
        verdictConfirmed: string;
        verdictReversed: string;
        confirmedDesc: string;
        tableRank: string;
        tableMove: string;
        tableEquity: string;
        tableWin: string;
        tableGammon: string;
        calculatedIn: string;
        rerunBtn: string;
    };
    engine: {
        noDouble: string;
        doubleTake: string;
        doublePass: string;
        tooGood: string;
        bestMove: string;
        veryGoodMove: string;
        diceRolled: string;
        movePlayed: string;
        doubleOffered: string;
        doubleAccepted: string;
        doubleDropped: string;
        gameWon: string;
        gammonWon: string;
        backgammonWon: string;
        raceTie: string;
        raceLeading: string;
        contactActive: string;
        pureRace: string;
    };
    review: {
        title: string;
        performanceRating: string;
        prScore: string;
        equityCurve: string;
        blundersCount: string;
        doubtfulsCount: string;
        turnByTurn: string;
        nextGame: string;
        closeReview: string;
    };
    game: {
        opponentDiceRolled: string;
        opponentDoubleRolled: string;
        opponentMoveStep: string;
        opponentBlocked: string;
        playerBlocked: string;
        bar: string;
        off: string;
        blackAI: string;
        black: string;
        white: string;
        noMovePossible: string;
    };
}
