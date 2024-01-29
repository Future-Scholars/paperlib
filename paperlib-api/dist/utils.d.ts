import { ObjectId } from 'bson';

declare class Categorizer {
    static schema: Record<string, any>;
    _id: OID;
    _partition: string;
    name: string;
    color: string;
    count: number;
    children: Categorizer[];
    constructor(object?: ICategorizerDraft, initObjectId?: boolean);
    initialize(object: ICategorizerDraft): this;
}

export declare const chunkRun: <S, T, Q>(argsList: Iterable<S>, process: (arg: S) => Promise<T>, errorProcess?: ((arg: S) => Promise<Q>) | undefined, chunkSize?: number) => Promise<{
    results: Q extends null ? (T | null)[] : (T | Q)[];
    errors: Error[];
}>;

declare function constructFileURL(url: string, joined: boolean, withProtocol?: boolean, root?: string, protocol?: string): string;

/**
 * Erase the protocol of the URL.
 * @param url
 * @returns
 */
declare function eraseProtocol(url: string): string;

declare class Feed {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            _id: string;
            id: string;
            _partition: string;
            name: string;
            count: string;
            color: string;
            url: string;
        };
    };
    _id: OID;
    id: OID;
    _partition: string;
    name: string;
    count: number;
    color?: string;
    url: string;
    constructor(object?: IFeedDraft, initObjectId?: boolean);
    initialize(object: IFeedDraft): this;
}

declare class FeedEntity {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            id: string;
            _id: string;
            _partition: string;
            addTime: string;
            feed: string;
            feedTime: string;
            title: string;
            authors: string;
            abstract: string;
            publication: string;
            pubTime: string;
            pubType: string;
            doi: string;
            arxiv: string;
            mainURL: string;
            pages: string;
            volume: string;
            number: string;
            publisher: string;
            read: string;
        };
    };
    _id: OID;
    id: OID;
    _partition: string;
    addTime: Date;
    feed: Feed;
    feedTime: Date;
    title: string;
    authors: string;
    abstract: string;
    publication: string;
    pubTime: string;
    pubType: number;
    doi: string;
    arxiv: string;
    mainURL: string;
    pages: string;
    volume: string;
    number: string;
    publisher: string;
    read: boolean;
    constructor(object?: IFeedEntityDraft, initObjectId?: boolean);
    initialize(object: IFeedEntityDraft): this;
    fromPaper(paperEntity: PaperEntity): void;
}

declare interface formatStringParams {
    str: string | null;
    removeNewline?: boolean;
    removeWhite?: boolean;
    removeSymbol?: boolean;
    removeStr?: string | null;
    lowercased?: boolean;
    trimWhite?: boolean;
    whiteSymbol?: boolean;
}

/**
 * Get the file type of the URL.
 * @param url
 * @returns
 * @description
 */
declare function getFileType(url: string): string;

/**
 * Get the protocol of the URL.
 * @param url
 * @returns
 */
declare function getProtocol(url: string): string;

/**
 * Check if the URL has a protocol.
 * @param url
 * @returns
 */
declare function hasProtocol(url: string): boolean;

declare interface ICategorizerDraft {
    _id?: OID;
    _partition?: string;
    name?: string;
    color?: string;
    children?: ICategorizerDraft[];
}

declare interface IFeedDraft {
    _id?: OID;
    id?: OID;
    _partition?: string;
    name?: string;
    count?: number;
    color?: string;
    url?: string;
}

declare interface IFeedEntityDraft {
    _id?: OID;
    id?: OID;
    _partition?: string;
    addTime?: Date;
    feed?: Feed;
    feedTime?: Date;
    title?: string;
    authors?: string;
    abstract?: string;
    publication?: string;
    pubTime?: string;
    pubType?: number;
    doi?: string;
    arxiv?: string;
    mainURL?: string;
    pages?: string;
    volume?: string;
    number?: string;
    publisher?: string;
    read?: boolean;
}

declare interface IPaperEntityDraft {
    _id?: OID;
    id?: OID;
    _partition?: string;
    addTime?: Date;
    title?: string;
    authors?: string;
    publication?: string;
    pubTime?: string;
    pubType?: number;
    doi?: string;
    arxiv?: string;
    mainURL?: string;
    supURLs?: string[];
    rating?: number;
    tags?: ICategorizerDraft[];
    folders?: ICategorizerDraft[];
    flag?: boolean;
    note?: string;
    codes?: string[];
    pages?: string;
    volume?: string;
    number?: string;
    publisher?: string;
}

declare function isLocalPath(string: string): boolean;

declare function isMetadataCompleted(paperEntityDraft: PaperEntity): boolean;

declare function isPreprint(paperEntityDraft: PaperEntity): boolean;

declare function listAllFiles(folderURL: string, arrayOfFiles?: string[] | null): string[];

declare function mergeMetadata(originPaperEntityDraft: PaperEntity, paperEntityDraft: PaperEntity, scrapedpaperEntity: PaperEntity, mergePriorityLevel: {
    [key: string]: number;
}, scraperIndex: number): {
    paperEntityDraft: PaperEntity;
    mergePriorityLevel: {
        [key: string]: number;
    };
};

export declare const metadataUtils: {
    isMetadataCompleted: typeof isMetadataCompleted;
    isPreprint: typeof isPreprint;
    mergeMetadata: typeof mergeMetadata;
};

declare type OID = ObjectId | string;

declare class PaperEntity {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            id: string;
            _id: string;
            _partition: string;
            addTime: string;
            title: string;
            authors: string;
            publication: string;
            pubTime: string;
            pubType: string;
            doi: string;
            arxiv: string;
            mainURL: string;
            supURLs: {
                type: string;
                objectType: string;
            };
            rating: string;
            tags: {
                type: string;
                objectType: string;
            };
            folders: {
                type: string;
                objectType: string;
            };
            flag: string;
            note: string;
            codes: {
                type: string;
                objectType: string;
            };
            pages: string;
            volume: string;
            number: string;
            publisher: string;
        };
    };
    _id: OID;
    id: OID;
    _partition: string;
    addTime: Date;
    title: string;
    authors: string;
    publication: string;
    pubTime: string;
    pubType: number;
    doi: string;
    arxiv: string;
    mainURL: string;
    supURLs: string[];
    rating: number;
    tags: PaperTag[];
    folders: PaperFolder[];
    flag: boolean;
    note: string;
    codes: string[];
    pages: string;
    volume: string;
    number: string;
    publisher: string;
    constructor(object?: IPaperEntityDraft, initObjectId?: boolean);
    setValue(key: keyof PaperEntity, value: unknown, format?: boolean): void;
    initialize(object: IPaperEntityDraft): this;
    fromFeed(feedEntity: FeedEntity): this;
}

declare class PaperFolder extends Categorizer {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            _id: string;
            _partition: string;
            name: string;
            color: string;
            count: string;
            children: string;
        };
    };
    constructor(object: ICategorizerDraft, initObjectId?: boolean);
}

declare class PaperTag extends Categorizer {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            _id: string;
            _partition: string;
            name: string;
            color: string;
            count: string;
            children: string;
        };
    };
    constructor(object: ICategorizerDraft, initObjectId?: boolean);
}

export declare const stringUtils: {
    formatString: ({ str, removeNewline, removeWhite, removeSymbol, removeStr, lowercased, trimWhite, whiteSymbol, }: formatStringParams) => string;
};

export declare const urlUtils: {
    getProtocol: typeof getProtocol;
    hasProtocol: typeof hasProtocol;
    eraseProtocol: typeof eraseProtocol;
    getFileType: typeof getFileType;
    constructFileURL: typeof constructFileURL;
    listAllFiles: typeof listAllFiles;
    isLocalPath: typeof isLocalPath;
};

export { }
