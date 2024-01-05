import { ObjectId } from 'bson';

declare class Categorizer {
    static schema: Record<string, any>;
    _id: OID;
    _partition: string;
    name: string;
    count: number;
    color?: string;
    constructor(object: ICategorizerDraft, initObjectId?: boolean);
    initialize(object: ICategorizerDraft): this;
}

export declare class Feed {
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

export declare class FeedEntity {
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

declare interface ICategorizerDraft {
    _id?: OID;
    _partition?: string;
    name?: string;
    count?: number;
    color?: string;
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

declare interface IPaperSmartFilterDraft {
    _id?: OID;
    _partition?: string;
    name?: string;
    filter?: string;
    color?: string;
}

declare type OID = ObjectId | string;

export declare class PaperEntity {
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

export declare class PaperFolder extends Categorizer {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            _id: string;
            _partition: string;
            name: string;
            count: string;
            color: string;
        };
    };
    constructor(object: ICategorizerDraft, initObjectId?: boolean);
}

export declare class PaperSmartFilter {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            _id: string;
            _partition: string;
            name: string;
            filter: string;
            color: string;
        };
    };
    _id: OID;
    _partition: string;
    name: string;
    filter: string;
    color?: string;
    constructor(object?: IPaperSmartFilterDraft, initObjectId?: boolean);
    initialize(object: IPaperSmartFilterDraft): this;
}

export declare class PaperTag extends Categorizer {
    static schema: {
        name: string;
        primaryKey: string;
        properties: {
            _id: string;
            _partition: string;
            name: string;
            count: string;
            color: string;
        };
    };
    constructor(object: ICategorizerDraft, initObjectId?: boolean);
}

export { }
