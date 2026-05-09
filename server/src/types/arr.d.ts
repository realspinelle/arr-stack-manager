export type MediaQueueItem = {
    // =========================
    // IDENTIFIERS
    // =========================

    seriesId?: number;        // 📺 episode only
    episodeId?: number;       // 📺 episode only
    seasonNumber?: number;    // 📺 episode only

    movieId?: number;         // 🎬 movie only

    id: number;               // ✅ both


    // =========================
    // LANGUAGE & QUALITY
    // =========================

    languages: {              // ✅ both
        id: number;
        name: string;
    }[];

    quality: {                // ✅ both
        quality: {
            id: number;
            name: string;
            source: string;
            resolution: number;
            modifier?: string;    // 🎬 movie example only
        };
        revision: {
            version: number;
            real: number;
            isRepack: boolean;
        };
    };


    // =========================
    // CUSTOM FORMATS
    // =========================

    customFormats: {          // ✅ both
        id: number;
        name: string;
    }[];

    customFormatScore: number; // ✅ both


    // =========================
    // FILE INFO
    // =========================

    size: number;             // ✅ both
    sizeleft: number;         // ✅ both
    timeleft?: string;        // 📺 episode only (present in example)

    title: string;            // ✅ both


    // =========================
    // TIMESTAMPS
    // =========================

    added: string;            // ✅ both
    estimatedCompletionTime?: string; // 📺 episode only


    // =========================
    // STATUS
    // =========================

    status: string;               // ✅ both
    trackedDownloadStatus: string; // ✅ both
    trackedDownloadState: string;  // ✅ both
    statusMessages: unknown[];     // ✅ both
    errorMessage?: string;         // 🎬 movie only (in example)


    // =========================
    // DOWNLOAD CLIENT
    // =========================

    downloadId: string;                    // ✅ both
    protocol: string;                      // ✅ both
    downloadClient: string;                // ✅ both
    downloadClientHasPostImportCategory: boolean; // ✅ both
    indexer: string;                       // ✅ both


    // =========================
    // EPISODE SPECIFIC STATE
    // =========================

    episodeHasFile?: boolean; // 📺 episode only
};