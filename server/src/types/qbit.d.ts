export type InstanceConfig = {
    name: string;
    baseUrl: string;
};

export type TorrentInfo = {
    hash: string;
    name: string;
    save_path?: string;
    state?: string;
    private?: boolean | 0 | 1;
    progress?: number;
};

export type SyncOptions = {
    username: string;
    password: string;
    main: InstanceConfig;
    targets: InstanceConfig[];
    preserveSavePath: boolean;
    skipChecking: boolean;
    paused: boolean;
    dryRun: boolean;
    defaultCategory: string;
};

export type TargetSyncStats = {
    targetName: string;
    added: number;
    stopped: number;
    removed: number;
    skippedExisting: number;
    errors: string[];
};