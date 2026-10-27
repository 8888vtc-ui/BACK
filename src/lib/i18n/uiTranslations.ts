/**
 * Traductions officielles pour l'Import/Export Universel (.mat, .sgf, XGID) et la Revue de Match.
 * Conforme à SCALABILITY.md (< 400 lignes, 0 any, 6 langues clés + JA).
 */

import type { Locale } from './types';

export interface MatchImportExportStrings {
    readonly modalTitle: string;
    readonly modalSubtitle: string;
    readonly tabImport: string;
    readonly tabExport: string;
    readonly tabShare: string;
    readonly importPlaceholder: string;
    readonly importDropZone: string;
    readonly importDropActive: string;
    readonly importCta: string;
    readonly pasteCta: string;
    readonly clearCta: string;
    readonly copyXgidCta: string;
    readonly downloadMatCta: string;
    readonly downloadSgfCta: string;
    readonly copiedSuccess: string;
    readonly successXgid: string;
    readonly successMat: string;
    readonly successSgf: string;
    readonly errorInvalid: string;
    readonly detectedTypeXgid: string;
    readonly detectedTypeMat: string;
    readonly detectedTypeSgf: string;
    readonly exportHeading: string;
    readonly exportNotice: string;
    readonly shareHeading: string;
    readonly shareNotice: string;
    readonly copyShareUrl: string;
}

export const MATCH_IMPORT_EXPORT_TRANSLATIONS: Record<Locale, MatchImportExportStrings> = {
    fr: {
        modalTitle: 'Import & Export Horloger',
        modalSubtitle: 'Revue de Match, Fichiers .mat et Positions XGID',
        tabImport: 'Importer (.mat / XGID)',
        tabExport: 'Exporter la Partie',
        tabShare: 'Lien de Partage',
        importPlaceholder: 'Collez une chaîne XGID ou le contenu d’un fichier .mat ici...',
        importDropZone: 'Glissez-déposez un fichier .mat ou .sgf ici, ou cliquez pour parcourir',
        importDropActive: 'Déposez votre fichier pour l’importer...',
        importCta: 'Charger sur le plateau',
        pasteCta: 'Coller depuis le presse-papiers',
        clearCta: 'Effacer',
        copyXgidCta: 'Copier la position XGID',
        downloadMatCta: 'Télécharger le fichier .mat (JellyFish)',
        downloadSgfCta: 'Télécharger le fichier .sgf (GNUbg)',
        copiedSuccess: 'Copié dans le presse-papiers !',
        successXgid: 'Position XGID chargée avec succès sur le plateau !',
        successMat: 'Match .mat chargé avec succès !',
        successSgf: 'Fichier SGF chargé avec succès !',
        errorInvalid: 'Format non reconnu : veuillez coller une chaîne XGID ou un fichier .mat valide.',
        detectedTypeXgid: 'Position XGID détectée',
        detectedTypeMat: 'Fichier Match .mat détecté',
        detectedTypeSgf: 'Fichier SGF détecté',
        exportHeading: 'Formats Standards Mondiaux',
        exportNotice: 'Compatible avec eXtreme Gammon (XG2), GNU Backgammon, JellyFish et Backgammon Galaxy.',
        shareHeading: 'Partage de Position Horlogère',
        shareNotice: 'Générez un lien direct vers cette position exacte pour vos confrères et élèves.',
        copyShareUrl: 'Copier l’URL de partage',
    },
    en: {
        modalTitle: 'Universal Match & Position Review',
        modalSubtitle: 'Import/Export .mat, .sgf and XGID positions',
        tabImport: 'Import (.mat / XGID)',
        tabExport: 'Export Match',
        tabShare: 'Share Link',
        importPlaceholder: 'Paste an XGID string or .mat file content here...',
        importDropZone: 'Drag & drop a .mat or .sgf file here, or click to browse',
        importDropActive: 'Drop your file to import...',
        importCta: 'Load onto board',
        pasteCta: 'Paste from clipboard',
        clearCta: 'Clear',
        copyXgidCta: 'Copy XGID position',
        downloadMatCta: 'Download .mat file (JellyFish)',
        downloadSgfCta: 'Download .sgf file (GNUbg)',
        copiedSuccess: 'Copied to clipboard!',
        successXgid: 'XGID position loaded successfully onto board!',
        successMat: 'Match .mat file loaded successfully!',
        successSgf: 'SGF file loaded successfully!',
        errorInvalid: 'Unrecognized format: please paste a valid XGID string or .mat file.',
        detectedTypeXgid: 'Detected XGID position',
        detectedTypeMat: 'Detected .mat match file',
        detectedTypeSgf: 'Detected SGF match file',
        exportHeading: 'World Standard Formats',
        exportNotice: 'Fully compatible with eXtreme Gammon (XG2), GNU Backgammon, JellyFish and Backgammon Galaxy.',
        shareHeading: 'Master Clockwork Sharing',
        shareNotice: 'Generate an instant deep-link to this exact position for your students and peers.',
        copyShareUrl: 'Copy share URL',
    },
    es: {
        modalTitle: 'Importación y Exportación de Partidas',
        modalSubtitle: 'Revisión de partidas, archivos .mat y posiciones XGID',
        tabImport: 'Importar (.mat / XGID)',
        tabExport: 'Exportar partida',
        tabShare: 'Compartir enlace',
        importPlaceholder: 'Pega una cadena XGID o el contenido de un archivo .mat...',
        importDropZone: 'Arrastra y suelta un archivo .mat o .sgf aquí, o haz clic',
        importDropActive: 'Suelta el archivo para importarlo...',
        importCta: 'Cargar en el tablero',
        pasteCta: 'Pegar del portapapeles',
        clearCta: 'Borrar',
        copyXgidCta: 'Copiar posición XGID',
        downloadMatCta: 'Descargar archivo .mat (JellyFish)',
        downloadSgfCta: 'Descargar archivo .sgf (GNUbg)',
        copiedSuccess: '¡Copiado al portapapeles!',
        successXgid: '¡Posición XGID cargada con éxito en el tablero!',
        successMat: '¡Partida .mat cargada con éxito!',
        successSgf: '¡Archivo SGF cargado con éxito!',
        errorInvalid: 'Formato no reconocido: pega una cadena XGID o archivo .mat válido.',
        detectedTypeXgid: 'Posición XGID detectada',
        detectedTypeMat: 'Archivo de partida .mat detectado',
        detectedTypeSgf: 'Archivo SGF detectado',
        exportHeading: 'Formatos Estándar Mundiales',
        exportNotice: 'Compatible con eXtreme Gammon (XG2), GNU Backgammon, JellyFish y Backgammon Galaxy.',
        shareHeading: 'Compartir Posición Maestra',
        shareNotice: 'Genera un enlace directo a esta posición para tus compañeros y alumnos.',
        copyShareUrl: 'Copiar enlace de partida',
    },
    de: {
        modalTitle: 'Universeller Import & Export',
        modalSubtitle: 'Match-Analyse, .mat-Dateien und XGID-Positionen',
        tabImport: 'Importieren (.mat / XGID)',
        tabExport: 'Partie exportieren',
        tabShare: 'Freigabelink',
        importPlaceholder: 'XGID-Zeichenkette oder .mat-Dateiinhalt hier einfügen...',
        importDropZone: '.mat oder .sgf Datei hier ablegen oder klicken',
        importDropActive: 'Datei ablegen zum Importieren...',
        importCta: 'Auf Spielbrett laden',
        pasteCta: 'Aus Zwischenablage einfügen',
        clearCta: 'Löschen',
        copyXgidCta: 'XGID-Position kopieren',
        downloadMatCta: '.mat-Datei herunterladen (JellyFish)',
        downloadSgfCta: '.sgf-Datei herunterladen (GNUbg)',
        copiedSuccess: 'In die Zwischenablage kopiert!',
        successXgid: 'XGID-Position erfolgreich auf das Spielbrett geladen!',
        successMat: 'Match-.mat-Datei erfolgreich geladen!',
        successSgf: 'SGF-Datei erfolgreich geladen!',
        errorInvalid: 'Ungültiges Format: Bitte gültiges XGID oder .mat einfügen.',
        detectedTypeXgid: 'XGID-Position erkannt',
        detectedTypeMat: '.mat-Matchdatei erkannt',
        detectedTypeSgf: 'SGF-Datei erkannt',
        exportHeading: 'Weltweite Standardformate',
        exportNotice: 'Kompatibel mit eXtreme Gammon (XG2), GNU Backgammon, JellyFish und Galaxy.',
        shareHeading: 'Position freigeben',
        shareNotice: 'Erstelle einen direkten Link zu dieser Spielposition.',
        copyShareUrl: 'Freigabelink kopieren',
    },
    pt: {
        modalTitle: 'Importação e Exportação de Partidas',
        modalSubtitle: 'Revisão de partidas, arquivos .mat e posições XGID',
        tabImport: 'Importar (.mat / XGID)',
        tabExport: 'Exportar partida',
        tabShare: 'Link de partilha',
        importPlaceholder: 'Cole uma string XGID ou conteúdo de arquivo .mat...',
        importDropZone: 'Arraste e solte um arquivo .mat ou .sgf aqui, ou clique',
        importDropActive: 'Solte o arquivo para importar...',
        importCta: 'Carregar no tabuleiro',
        pasteCta: 'Colar da área de transferência',
        clearCta: 'Limpar',
        copyXgidCta: 'Copiar posição XGID',
        downloadMatCta: 'Baixar arquivo .mat (JellyFish)',
        downloadSgfCta: 'Baixar arquivo .sgf (GNUbg)',
        copiedSuccess: 'Copiado para a área de transferência!',
        successXgid: 'Posição XGID carregada com sucesso no tabuleiro!',
        successMat: 'Partida .mat carregada com sucesso!',
        successSgf: 'Arquivo SGF carregado com sucesso!',
        errorInvalid: 'Formato não reconhecido: cole um XGID ou .mat válido.',
        detectedTypeXgid: 'Posição XGID detectada',
        detectedTypeMat: 'Arquivo .mat de partida detectado',
        detectedTypeSgf: 'Arquivo SGF detectado',
        exportHeading: 'Formatos Padrão Globais',
        exportNotice: 'Compatível com eXtreme Gammon (XG2), GNU Backgammon, JellyFish e Galaxy.',
        shareHeading: 'Partilha de Posição',
        shareNotice: 'Gere um link direto para esta posição exata.',
        copyShareUrl: 'Copiar link de partilha',
    },
    ar: {
        modalTitle: 'استيراد وتصدير المباريات',
        modalSubtitle: 'مراجعة المباريات وملفات .mat ومواضع XGID',
        tabImport: 'استيراد (.mat / XGID)',
        tabExport: 'تصدير المباراة',
        tabShare: 'رابط المشاركة',
        importPlaceholder: 'الصق نص XGID أو محتوى ملف .mat هنا...',
        importDropZone: 'اسحب وأفلت ملف .mat أو .sgf هنا، أو اضغط للتصفح',
        importDropActive: 'أفلت الملف هنا للاستيراد...',
        importCta: 'تحميل على الرقعة',
        pasteCta: 'لصق من الحافظة',
        clearCta: 'مسح',
        copyXgidCta: 'نسخ موضع XGID',
        downloadMatCta: 'تحميل ملف .mat (JellyFish)',
        downloadSgfCta: 'تحميل ملف .sgf (GNUbg)',
        copiedSuccess: 'تم النسخ إلى الحافظة!',
        successXgid: 'تم تحميل موضع XGID بنجاح على الرقعة!',
        successMat: 'تم تحميل ملف المباراة بنجاح!',
        successSgf: 'تم تحميل ملف SGF بنجاح!',
        errorInvalid: 'تنسيق غير معروف: يرجى لصق نص XGID أو ملف .mat صالح.',
        detectedTypeXgid: 'تم اكتشاف موضع XGID',
        detectedTypeMat: 'تم اكتشاف ملف مباراة .mat',
        detectedTypeSgf: 'تم اكتشاف ملف مباراة SGF',
        exportHeading: 'التنسيقات القياسية العالمية',
        exportNotice: 'متوافق تماماً مع eXtreme Gammon وGNU Backgammon وJellyFish وGalaxy.',
        shareHeading: 'مشاركة الموضع',
        shareNotice: 'أنشئ رابطاً مباشراً إلى هذا الموضع بدقة للمراجعة والتدريب.',
        copyShareUrl: 'نسخ رابط المشاركة',
    },
    ja: {
        modalTitle: '棋譜と局面の入出力',
        modalSubtitle: '.matファイル、SGF、XGID局面のインポート＆エクスポート',
        tabImport: 'インポート (.mat / XGID)',
        tabExport: '棋譜エクスポート',
        tabShare: '共有リンク',
        importPlaceholder: 'XGID文字列または.matファイルの内容を貼り付けてください...',
        importDropZone: '.matまたは.sgfファイルをドラッグ＆ドロップ、またはクリック',
        importDropActive: 'ファイルをドロップしてインポート...',
        importCta: '盤面に読み込む',
        pasteCta: 'クリップボードから貼り付け',
        clearCta: '消去',
        copyXgidCta: 'XGID局面をコピー',
        downloadMatCta: '.matファイルをダウンロード (JellyFish)',
        downloadSgfCta: '.sgfファイルをダウンロード (GNUbg)',
        copiedSuccess: 'クリップボードにコピーしました！',
        successXgid: 'XGID局面を盤面に読み込みました！',
        successMat: '棋譜ファイル(.mat)を正常に読み込みました！',
        successSgf: 'SGFファイルを正常に読み込みました！',
        errorInvalid: '認識できない形式です。有効なXGIDまたは.matを貼り付けてください。',
        detectedTypeXgid: 'XGID局面を検出',
        detectedTypeMat: '.mat棋譜ファイルを検出',
        detectedTypeSgf: 'SGF棋譜ファイルを検出',
        exportHeading: '世界標準フォーマット',
        exportNotice: 'eXtreme Gammon (XG2), GNU Backgammon, JellyFish, Backgammon Galaxyに完全対応。',
        shareHeading: '局面のダイレクト共有',
        shareNotice: 'この局面へ直接アクセスできる共有リンクを生成します。',
        copyShareUrl: '共有リンクをコピー',
    },
};

export function getImportExportTranslations(locale?: string): MatchImportExportStrings {
    const key = (locale?.toLowerCase().slice(0, 2) as Locale) || 'fr';
    return MATCH_IMPORT_EXPORT_TRANSLATIONS[key] ?? MATCH_IMPORT_EXPORT_TRANSLATIONS.fr;
}
