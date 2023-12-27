import { BrowserWindow } from 'electron';
import Cite from 'citation-js';
import { CookieJar } from 'tough-cookie';
import { List } from 'realm';
import { ObjectID } from 'bson';
import { ObjectId } from 'bson';
import { ObjectIdLike } from 'bson';
import { OpenDialogReturnValue } from 'electron';
import { default as Realm_2 } from 'realm';
import { Response as Response_2 } from 'got';
import { Results } from 'realm';
import { Store } from 'pinia';
import { XMLParser } from 'fast-xml-parser';

declare enum APPTheme {
    System = "system",
    Light = "light",
    Dark = "dark"
}

declare interface AtomItem {
    author: {
        name: string;
    }[] | {
        name: string;
    };
    link: {
        "@_href": string;
        "@_type": string;
    }[] | {
        "@_href": string;
        "@_type": string;
    };
    id: string;
    published: string;
    summary: string;
    title: string;
    updated: string;
}

declare class CacheDatabaseCore extends Eventable<ICacheDatabaseCoreState> {
    private readonly _preferenceService;
    private readonly _logService;
    private _realm?;
    private _app?;
    constructor(_preferenceService: PreferenceService, _logService: LogService);
    realm(): Promise<Realm_2>;
    /**
     *  Initialize realm database
     * @param reinit - if true, will reinit database
     * @returns - Realm instance
     */
    initRealm(reinit?: boolean): Promise<Realm_2>;
    /**
     * Get realm configuration for the local/cloud database
     * @returns - Realm configuration
     */
    getConfig(): Promise<{
        config: Realm_2.Configuration;
        type: ConfigType;
    }>;
    /**
     * Get realm configuration for the local database
     * @param logout - if true, will logout from cloud
     * @returns - Realm configuration
     */
    private _getLocalConfig;
}

declare class CacheService {
    private readonly _cacheDatabaseCore;
    private readonly _fileService;
    private readonly _preferenceService;
    private readonly _logService;
    constructor(_cacheDatabaseCore: CacheDatabaseCore, _fileService: FileService, _preferenceService: PreferenceService, _logService: LogService);
    /**
     * Initialize the database.
     * @param reinit - Whether to reinitialize the database. */
    initialize(reinit?: boolean): Promise<void>;
    /**
     * Filter the fulltext cache of the provided papers by the given query.
     * @param query - The query to filter the fulltext cache by.
     * @param paperEntities - The paper entities to filter.
     * @returns The filtered paper entities. */
    fullTextFilter(query: string, paperEntities: IPaperEntityCollection): Promise<Results<IPaperEntityObject>>;
    /**
     * Get the thumbnail of the paper entity.
     * @param paperEntity - The paper entity to get the thumbnail of.
     * @returns The thumbnail of the paper entity. */
    loadThumbnail(paperEntity: PaperEntity): Promise<ThumbnailCache | null>;
    private _createFullText;
    private _getPDFText;
    /**
     * Update the fulltext cache of the provided paper entities.
     * @param paperEntities - The paper entities to update the fulltext cache of.
     */
    updateFullTextCache(paperEntities: IPaperEntityCollection): Promise<void>;
    /**
     * Update the thumbnail cache
     * @param paperEntity - PaperEntity
     * @param thumbnailCache - Cache of thumbnail
     */
    updateThumbnailCache(paperEntity: PaperEntity, thumbnailCache: ThumbnailCache): Promise<void>;
    /**
     * Update the cache of the provided paper entities.
     * @param paperEntities - The paper entities.
     * @returns
     */
    updateCache(paperEntities: IPaperEntityCollection): Promise<void>;
    delete(ids: OID[]): Promise<void>;
}

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

declare class CategorizerRepository extends Eventable<ICategorizerRepositoryState> {
    constructor();
    /**
     * Transform categorizer to realm object if exists in database. Otherwise, return undefined.
     * @param realm - Realm instance
     * @param type - Categorizer type
     * @param categorizer - Categorizer
     * @returns Realm object or undefined
     */
    toRealmObject(realm: Realm_2, type: CategorizerType, categorizer: ICategorizerObject): ICategorizerRealmObject | undefined;
    /**
     * Load all categorizers.
     * @param realm - Realm instance
     * @param type - Categorizer type
     * @param sortBy - Sort by field
     * @param sortOrder - Sort order
     * @returns Results of categorizer
     */
    load(realm: Realm_2, type: CategorizerType, sortBy: string, sortOrder: string): ICategorizerCollection;
    /**
     * Load categorizer by ids.
     * @param realm - Realm instance
     * @param ids - Categorizers id
     * @returns Categorizers
     */
    loadByIds(realm: Realm_2, type: CategorizerType, ids: OID[]): ICategorizerCollection;
    /**
     * Delete categorizer.
     * @param realm - Realm instance.
     * @param deleteAll - Delete all categorizers.
     * @param type - Categorizer type.
     * @param id - Id of categorizer to delete.
     * @param categorizer - Categorizer to delete.
     */
    delete(realm: Realm_2, deleteAll: boolean | undefined, type: CategorizerType, ids?: OID[], categorizers?: ICategorizerCollection): boolean;
    /**
     * Colorize categorizer.
     * @param realm - Realm instance
     * @param color - Color
     * @param type - Categorizer type
     * @param categorizer - Categorizer
     * @param name - Name of categorizer
     * @returns True if success
     */
    colorize(realm: Realm_2, color: Colors, type: CategorizerType, id?: OID, categorizer?: ICategorizerObject): void;
    /**
     * Rename categorizer.
     * @param realm - Realm instance
     * @param oldName - Old name
     * @param newName - New name
     * @param type - Categorizer type
     * @returns True if success
     */
    rename(realm: Realm_2, oldName: string, newName: string, type: CategorizerType): boolean;
    /**
     * Update/Insert categorizer.
     * @param realm - Realm instance
     * @param type - Categorizer type
     * @param categorizer - Categorizer
     * @param partition - Partition
     * @returns Categorizer
     */
    update(realm: Realm_2, type: CategorizerType, categorizer: ICategorizerObject, partition: string): ICategorizerRealmObject | (Categorizer & Realm_2.Object<unknown, never>);
    updateCount(realm: Realm_2, type: CategorizerType, categorizers: ICategorizerCollection): void;
}

declare class CategorizerService extends Eventable<ICategorizerServiceState> {
    private readonly _databaseCore;
    private readonly _categorizerRepository;
    private readonly _logService;
    private readonly _preferenceService;
    constructor(_databaseCore: DatabaseCore, _categorizerRepository: CategorizerRepository, _logService: LogService, _preferenceService: PreferenceService);
    /**
     * Load categorizers.
     * @param type The type of the categorizer.
     * @param sortBy Sort: by
     * @param sortOrder Sort: order
     * @returns
     */
    load(type: CategorizerType, sortBy: string, sortOrder: string): Promise<ICategorizerCollection>;
    /**
     * Update a categorizer.
     * @param type - The type of categorizer.
     * @param categorizer - The categorizer.
     * @returns
     */
    create(type: CategorizerType, categorizer: Categorizer): Promise<ICategorizerRealmObject | (Categorizer & Realm.Object<unknown, never>)>;
    /**
     * Delete a categorizer.
     * @param type - The type of categorizer.
     * @param name - The name of categorizer.
     * @param categorizer - The categorizer.
     * @returns
     */
    delete(type: CategorizerType, ids?: OID[], categorizers?: ICategorizerCollection): Promise<void>;
    /**
     * Colorize a categorizer.
     * @param color - The color.
     * @param type - The type of the categorizer.
     * @param name - The name of the categorizer.
     * @param categorizer - The categorizer.
     * @returns
     */
    colorize(color: Colors, type: CategorizerType, id?: OID, categorizer?: ICategorizerObject): Promise<void>;
    /**
     * Rename a categorizer.
     * @param oldName - The old name.
     * @param newName - The new name.
     * @param type - The type of the categorizer.
     * @returns
     */
    rename(oldName: string, newName: string, type: CategorizerType): Promise<void>;
}

declare enum CategorizerType {
    PaperTag = "PaperTag",
    PaperFolder = "PaperFolder"
}

export declare const chunkRun: <S, T, Q>(argsList: Iterable<S>, process: (arg: S) => Promise<T>, errorProcess?: ((arg: S) => Promise<Q>) | undefined, chunkSize?: number) => Promise<{
    results: Q extends null ? (T | null)[] : (T | Q)[];
    errors: Error[];
}>;

declare enum Colors {
    red = "red",
    green = "green",
    blue = "blue",
    yellow = "yellow",
    orange = "orange",
    cyan = "cyan",
    purple = "purple",
    pink = "pink"
}

declare class CommandService extends Eventable<{}> {
    private readonly _uiStateService;
    private readonly _logService;
    private readonly _registeredCommands;
    constructor(_uiStateService: UIStateService, _logService: LogService);
    getRegisteredCommands(filter?: string): ICommand[];
    private _registerInnerCommands;
    register(command: ICommand): void;
    run(id: string, ...args: any[]): void;
    registerExternel(command: IExternelCommand): () => void;
}

declare enum ConfigType {
    Local = 0
}

declare enum ConfigType_2 {
    Cloud = 0,
    Local = 1
}

declare function constructFileURL(url: string, joined: boolean, withProtocol?: boolean, root?: string, protocol?: string): string;

declare class ContextMenuService extends Eventable<IContextMenuServiceState> {
    private readonly _preferenceService;
    private readonly _locales;
    private readonly _registedScraperExtensions;
    constructor(_preferenceService: PreferenceService);
    registerScraperExtension(extID: string, scrapers: {
        [id: string]: string;
    }): void;
    unregisterScraperExtension(extID: string): void;
    /**
     * Shows the context menu for paper data.
     * @param {boolean} allowEdit - Whether editing is allowed.
     */
    showPaperDataMenu(allowEdit: boolean): void;
    /**
     * Shows the context menu for feed data.
     */
    showFeedDataMenu(): void;
    /**
     * Shows the context menu for sidebar.
     * @param {string} data - The data of the clicked item.
     * @param {string} type - The type of the clicked item.
     */
    showSidebarMenu(data: string, type: string): void;
    /**
     * Shows the context menu for the supplementary files.
     * @param {string} fileURL - The URL of the file.
     */
    showSupMenu(fileURL: string): void;
    /**
     * Shows the context menu for the thumbnail.
     * @param {string} fileURL - The URL of the file.
     */
    showThumbnailMenu(fileURL: string): void;
    /**
     * Shows the context menu for the quickpaste folder linking.
     * @param {string[]} folderNames - The names of the folders.
     */
    showQuickpasteLinkMenu(folderNames: {
        id: string;
        name: string;
    }[]): void;
}

declare class DatabaseCore extends Eventable<IDatabaseCoreState> {
    private readonly _fileService;
    private readonly _preferenceService;
    private readonly _logService;
    private _realm?;
    private _app?;
    private _syncSession?;
    private _partition?;
    constructor(_fileService: FileService, _preferenceService: PreferenceService, _logService: LogService);
    realm(): Promise<Realm_2>;
    /**
     *  Initialize realm database
     * @param reinit - if true, will reinit database
     * @returns - Realm instance
     */
    initRealm(reinit?: boolean): Promise<Realm_2>;
    /**
     * Get realm configuration for the local/cloud database
     * @returns - Realm configuration
     */
    getConfig(): Promise<{
        config: Realm_2.Configuration;
        type: ConfigType_2;
    }>;
    /**
     * Get realm configuration for the local database
     * @param logout - if true, will logout from cloud
     * @returns - Realm configuration
     */
    getLocalConfig(logout?: boolean): Promise<Realm_2.Configuration>;
    /**
     * Get realm configuration for the cloud database
     * @returns - Realm configuration
     */
    getCloudConfig(): Promise<Realm_2.Configuration>;
    /**
     * Login to cloud database
     * @returns - Realm user
     */
    private _loginCloud;
    /**
     * Logout from cloud database
     * @returns
     */
    private _logoutCloud;
    /**
     * Get partition value
     * @returns - Partition value
     */
    getPartition(): string;
    /**
     * Pause cloud database sync
     * @returns
     */
    pauseSync(): void;
    /**
     * Resume cloud database sync
     * @returns
     */
    resumeSync(): void;
}

/**
 * Service for database operations except data access and modification.
 */
declare class DatabaseService extends Eventable<IDatabaseServiceState> {
    private readonly _databaseCore;
    constructor(_databaseCore: DatabaseCore);
    /**
     * Initialize the database.
     * @param reinit - Whether to reinitialize the database. */
    initialize(reinit?: boolean): Promise<void>;
    /**
     * Pause the synchronization of the database. */
    pauseSync(): void;
    /**
     * Resume the synchronization of the database. */
    resumeSync(): void;
}

/**
 * Erase the protocol of the URL.
 * @param url
 * @returns
 */
declare function eraseProtocol(url: string): string;

/**
 * A eventable base class.
 * There is two ways to fire a event:
 *   1. Fire a single event by calling `fire(event: string)` / Fire multiple events by calling `fire(events: { [key in keyof T]?: any })`
 *   2. Directly modify the state by calling `useState().key = value`
 */
declare class Eventable<T extends IEventState> implements IDisposable {
    private readonly _useStateFunc;
    protected readonly _state: Store<string, T>;
    private _stateProxy?;
    protected readonly _listeners: Partial<Record<keyof T, {
        [callbackId: string]: (value: any) => void;
    }>>;
    protected readonly _eventGroupId: string;
    protected readonly _eventDefaultState: T;
    constructor(eventGroupId: string, eventDefaultState?: T);
    useState(proxied?: boolean): Store<string, T>;
    getState(key: keyof T): any;
    /**
     * Fire an event
     * @param event - event name or object of events
     * @returns
     */
    fire(event: {
        [key in keyof T]?: any;
    } | keyof T, onlyIfChanged?: boolean): void;
    /**
     * Add a listener
     * @param key - key(s) of the event
     * @param callback - callback function
     * @returns
     */
    onChanged(key: keyof T | (keyof T)[], callback: (newValues: {
        key: keyof T;
        value: any;
    }) => void): () => void;
    /**
     * Add a listener
     * @param key - key(s) of the event
     * @param callback - callback function
     * @returns
     */
    on: (key: keyof T | (keyof T)[], callback: (newValues: {
        key: keyof T;
        value: any;
    }) => void) => () => void;
    already(key: keyof T | (keyof T)[], callback: (newValues: {
        key: keyof T;
        value: any;
    }) => void): () => void;
    dispose(): void;
}

declare class ExtensionManagementService {
    private readonly _extStore;
    private readonly _extManager;
    private readonly _extensionPreferenceService;
    private readonly _installedExtensions;
    private readonly _installedExtensionInfos;
    constructor(extensionPreferenceService: ExtensionPreferenceService);
    loadInstalledExtensions(): Promise<void>;
    install(extensionIDorPath: string, notify?: boolean): Promise<void>;
    uninstall(extensionID: string): Promise<void>;
    reload(extensionID: string): Promise<void>;
    reloadAll(): Promise<void>;
    installedExtensions(): {
        [key: string]: IExtensionInfo;
    };
    listExtensionMarketplace(query: string): Promise<{
        [id: string]: {
            id: string;
            name: string;
            version: string;
            author: string;
            verified: boolean;
            description: string;
        };
    }>;
    callExtensionMethod(extensionID: string, methodName: string, ...args: any): Promise<any>;
}

/**
 * Extension preference service.
 * It is a wrapper of ElectronStore with responsive states.
 */
declare class ExtensionPreferenceService {
    private readonly _stores;
    constructor();
    /**
     * Register a preference store.
     * @param extensionID - extension ID
     * @param defaultPreference - default preference
     */
    register<T extends {
        [key: string]: any;
    }>(extensionID: string, defaultPreference: T): Promise<void>;
    /**
     * Unregister a preference store.
     * @param extensionID - extension ID
     */
    unregister(extensionID: string): void;
    /**
     * Get the value of the preference
     * @param extensionID - extension ID
     * @param key - key of the preference
     * @returns value of the preference or null
     */
    get(extensionID: string, key: any): any;
    /**
     * Get the value of all preferences
     * @param extensionID - extension ID
     * @returns value of all preferences
     */
    getAll(extensionID: string): {};
    /**
     * Get the metadata of the preference
     * @param extensionID - extension ID
     * @param key - key of the preference
     * @returns metadata of the preference or null
     */
    getMetadata(extensionID: string, key: any): any;
    /**
     * Get the metadata of all preferences
     * @param extensionID - extension ID
     * @returns metadata of all preferences
     */
    getAllMetadata(extensionID: string): any;
    /**
     * Set the value of the preference
     * @param extensionID - extension ID
     * @param patch - patch object
     * @returns
     */
    set(extensionID: string, patch: any): void;
    /**
     * Get the password
     * @param extensionID - extension ID
     * @param key - key of the password
     * @returns - password
     */
    getPassword(extensionID: string, key: string): Promise<string | null>;
    /**
     * Set the password
     * @param extensionID - extension ID
     * @param key - key of the password
     * @param pwd - password
     */
    setPassword(extensionID: string, key: string, pwd: string): Promise<void>;
    onChanged<T>(extensionID: string, key: keyof T | (keyof T)[], callback: (newValues: {
        key: any;
        value: any;
    }) => void): () => void;
    on: <T>(extensionID: string, key: keyof T | (keyof T)[], callback: (newValues: {
        key: any;
        value: any;
    }) => void) => () => void;
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

declare class FeedEntityFilterOptions implements IFeedEntityFilterOptions {
    filters: string[];
    placeholders: string[];
    search?: string;
    searchMode?: "general" | "fulltext" | "advanced";
    feedNames?: string[];
    unread?: boolean;
    title?: string;
    authors?: string;
    constructor(options?: Partial<IFeedEntityFilterOptions>);
    update(options: Partial<IFeedEntityFilterOptions>): void;
    toString(): string;
}

declare class FeedEntityRepository extends Eventable<IFeedEntityRepositoryState> {
    private readonly _feedRepository;
    constructor(_feedRepository: FeedRepository);
    /**
     * Transform feed entity to realm object if exists in database. Otherwise, return undefined.
     * @param realm - Realm instance
     * @param feedEntity - FeedEntity
     * @returns Realm object
     */
    toRealmObject(realm: Realm_2, feedEntity: IFeedEntityObject): IFeedEntityRealmObject | undefined;
    /**
     * Load all filtered feed entities.
     * @param realm - Realm instance.
     * @param filter - Filter string.
     * @param sortBy - Sort by field.
     * @param sortOrder - Sort order.
     * @returns - Results of feed entities.
     */
    load(realm: Realm_2, filter: string, filterPlaceholders: any[], sortBy: string, sortOrder: "asce" | "desc"): IFeedEntityCollection;
    /**
     * Load feed entity by id.
     * @param realm - Realm instance.
     * @param ids - Paper ids.
     * @returns - Results of feed entities.
     */
    loadByIds(realm: Realm_2, ids: OID[]): IFeedEntityCollection;
    /**
     * Update feed entity.
     * @param realm - Realm instance.
     * @param feedEntity - Feed entity.
     * @param ignoreReadState - Ignore read state.
     * @param partition - Partition.
     * @returns FeedEntity
     */
    update(realm: Realm_2, feedEntity: FeedEntity, partition: string, ignoreReadState: boolean): (FeedEntity & Realm_2.Object<unknown, never>) | IFeedEntityRealmObject;
    /**
     * Delete outdate feed entities.
     * @param realm - Realm instance.
     * @returns - Feed count.
     */
    deleteOutdate(realm: Realm_2): Record<string, number>;
    /**
     * Delete feed entities.
     * @param realm - Realm instance.
     * @param ids - Paper ids.
     * @param feedEntity - Feed entity.
     * @returns - True if success.
     */
    delete(realm: Realm_2, ids?: OID[], feedEntities?: IFeedEntityCollection): boolean;
}

declare class FeedRepository extends Eventable<IFeedRepositoryState> {
    constructor();
    /**
     * Transform feed to realm object if exists in database. Otherwise, return undefined.
     * @param realm - Realm instance
     * @param feed - Feed
     * @returns Realm object
     */
    toRealmObject(realm: Realm_2, feed: IFeedObject): IFeedRealmObject | undefined;
    /**
     * Load all feeds.
     * @param realm - Realm instance
     * @param sortBy - Sort by field
     * @param sortOrder - Sort order
     * @returns Results of feed
     */
    load(realm: Realm_2, sortBy: string, sortOrder: string): IFeedCollection;
    /**
     * Load feed by id.
     * @param realm - Realm instance
     * @param ids - Feed ids
     * @returns Feed
     */
    loadByIds(realm: Realm_2, ids: OID[]): IFeedCollection;
    /**
     * Delete feed.
     * @param realm - Realm instance
     * @param ids - Feed ids
     * @param feeds - Feeds
     */
    delete(realm: Realm_2, ids?: OID[], feeds?: IFeedCollection): boolean;
    /**
     * Colorize feed.
     * @param realm - Realm instance
     * @param color - Color
     * @param id - Feed Id
     * @param feed - Feed
     */
    colorize(realm: Realm_2, color: Colors, id?: OID, feed?: Feed): void;
    /**
     * Rename feed.
     * @param realm - Realm instance
     * @param oldName - Old name
     * @param newName - New name
     */
    rename(realm: Realm_2, oldName: string, newName: string): void;
    /**
     * Update feed.
     * @param realm - Realm instance
     * @param feed - Feed
     * @param partition - Partition
     * @returns Feed
     */
    update(realm: Realm_2, feed: Feed, partition: string): (Feed & Realm_2.Object<unknown, never>) | IFeedRealmObject;
    updateCount(realm: Realm_2, feeds: IFeedCollection): void;
}

declare class FeedService extends Eventable<IFeedServiceState> {
    private readonly _databaseCore;
    private readonly _feedEntityRepository;
    private readonly _feedRepository;
    private readonly _rssRepository;
    private readonly _scrapeService;
    private readonly _paperService;
    private readonly _schedulerService;
    private readonly _logService;
    constructor(_databaseCore: DatabaseCore, _feedEntityRepository: FeedEntityRepository, _feedRepository: FeedRepository, _rssRepository: RSSRepository, _scrapeService: ScrapeService, _paperService: PaperService, _schedulerService: SchedulerService, _logService: LogService);
    /**
     * Load feeds.
     * @param sortBy Sort by.
     * @param sortOrder Sort order.
     */
    load(sortBy: string, sortOrder: string): Promise<IFeedCollection>;
    /**
     * Load feed entities from the database.
     * @param search Search string.
     * @param feed Feed name.
     * @param unread Whether to load only unread entities.
     * @param sortBy Sort by.
     * @param sortOrder Sort order.
     * @returns Feed entities.
     */
    loadEntities(filter: FeedEntityFilterOptions, sortBy: string, sortOrder: "asce" | "desc"): Promise<IFeedEntityCollection>;
    /**
     * Update a feed.
     * @param feed Feed.
     * returns
     */
    update(feeds: IFeedCollection): Promise<IFeedObject[]>;
    /**
     * Update feed entities.
     * @param feedEntities - Feed entities
     * @returns
     */
    updateEntities(feedEntities: IFeedEntityCollection, ignoreReadState?: boolean): Promise<IFeedEntityObject[] | undefined>;
    /**
     * Create a feed.
     * @param feed Feed.
     * @returns
     */
    create(feeds: Feed[]): Promise<void>;
    /**
     * Refresh feeds.
     * @param feed Feed.
     * @returns
     */
    refresh(ids?: OID[], feeds?: IFeedCollection): Promise<void>;
    /**
     * Colorize a feed.
     * @param color Color.
     * @param name Feed name.
     * @param feed Feed.
     * @returns
     */
    colorize(color: Colors, id?: OID, feed?: IFeedObject): Promise<void>;
    /**
     * Delete a feed.
     * @param name Feed name.
     * @param feed Feed.
     * @returns
     */
    delete(ids?: OID[], feeds?: IFeedCollection): Promise<void>;
    /**
     * Add feed entities to library.
     * @param feedEntities
     * @returns
     */
    addToLib(feedEntities: IFeedEntityCollection): Promise<void>;
    private _routineRefresh;
    /**
     * Migrate the local database to the cloud database. */
    migrateLocaltoCloud(): Promise<void>;
}

declare class FileService extends Eventable<IFileServiceState> {
    private readonly _hookService;
    private readonly _logService;
    private readonly _preferenceService;
    private _backend;
    constructor(_hookService: HookService, _logService: LogService, _preferenceService: PreferenceService);
    initialize(): void;
    private _initBackend;
    startWatch(): Promise<void>;
    stopWatch(): Promise<void>;
    check(): Promise<boolean>;
    /**
     * Move files of a paper entity to the library folder
     * @param paperEntity - paper entity to move
     * @param fourceDelete - force delete the source file
     * @param forceNotLink - force not to link the source file
     * @returns
     */
    move(paperEntity: PaperEntity, fourceDelete?: boolean, forceNotLink?: boolean): Promise<PaperEntity>;
    /**
     * Move a file
     * @param sourceURL - source file URL
     * @param targetURL - target file URL
     * @param fourceDelete - force delete the source file
     * @param forceNotLink - force not to link the source file
     * @returns
     */
    moveFile(sourceURL: string, targetURL: string, fourceDelete?: boolean, forceNotLink?: boolean): Promise<string>;
    /**
     * Remove files of a paper entity
     * @param paperEntity - paper entity to remove
     * @returns
     */
    remove(paperEntity: PaperEntity): Promise<void>;
    /**
     * Remove files
     * @param url - url of the file to remove
     * @returns
     */
    removeFile(url: string): Promise<void>;
    /**
     * List all files in a folder
     * @param folderURL - url of the folder
     * @returns
     */
    listAllFiles(folderURL: string): Promise<string[]>;
    /**
     * Locate the main file of a paper entity.
     * @param paperEntities - The paper entities.
     * @returns
     */
    locateFileOnWeb(paperEntities: PaperEntity[]): Promise<PaperEntity[]>;
    /**
     * Return the real and accessable path of the URL.
     * @param url
     * @param download
     * @returns
     * @description
     * If the URL is a local file, return the path of the file.
     * If the URL is a remote file and `download` is `true`, download the file and return the path of the downloaded file.
     * If the URL is a web URL, return the URL.
     */
    access(url: string, download: boolean): Promise<string>;
    /**
     * Open the URL.
     * @param url
     */
    open(url: string): Promise<void>;
    /**
     * Show the URL in Finder.
     * @param url - URL to show
     */
    showInFinder(url: string): Promise<void>;
    /**
     * Preview the URL only for MacOS.
     * @param url - URL to preview
     */
    preview(url: string): Promise<void>;
}

declare class FileSystemService {
    constructor();
    /**
     * Get the path of the given key.
     * @param {string} key The key to get the path of.
     * @returns {string} The path of the given key.
     */
    getSystemPath(key: "home" | "appData" | "userData" | "sessionData" | "temp" | "exe" | "module" | "desktop" | "documents" | "downloads" | "music" | "pictures" | "videos" | "recent" | "logs" | "crashDumps", windowId: string): string;
    /**
     * Show a file picker.
     * @returns {Promise<OpenDialogReturnValue>} The result of the file picker.
     */
    showFilePicker(): Promise<OpenDialogReturnValue>;
    /**
     * Show a folder picker.
     * @returns {Promise<OpenDialogReturnValue>} The result of the folder picker.
     */
    showFolderPicker(): Promise<OpenDialogReturnValue>;
    /**
     * Preview a file.
     * @param {string} fileURL The URL of the file to preview.
     */
    preview(fileURL: string): void;
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

/**
 * HookService is a service inject some hook points in the Paperlib app. Extensions can use these hook points to extend the functionality of Paperlib.
 *
 */
declare class HookService {
    private readonly _logService;
    private readonly _modifyHookPoints;
    private readonly _transformHookPoints;
    constructor(_logService: LogService);
    hasHook(hookName: string): false | "modify" | "transform";
    modifyHookPoint<T extends any[]>(hookName: string, ...args: T): Promise<T>;
    transformhookPoint<T extends any[], O extends any[]>(hookName: string, ...args: T): Promise<T | (O extends readonly (infer InnerArr)[] ? InnerArr extends readonly (infer InnerArr)[] ? InnerArr : InnerArr : O)[]>;
    hookModify(hookName: string, extensionID: string, callbackName: string): () => void;
    hookTransform(hookName: string, extensionID: string, callbackName: string): () => void;
    recoverClass<T>(originalObj: T, obj: any): T;
}

declare interface ICacheDatabaseCoreState {
    dbInitializing: number;
    dbInitialized: number;
}

declare type ICategorizerCollection = Results<ICategorizerObject> | List<ICategorizerObject> | Array<ICategorizerObject>;

declare interface ICategorizerDraft {
    _id?: OID;
    _partition?: string;
    name?: string;
    count?: number;
    color?: string;
}

declare type ICategorizerObject = Categorizer | ICategorizerRealmObject;

declare type ICategorizerRealmObject = Categorizer & Realm_2.Object<Categorizer, "_id" | "name" | "count">;

declare interface ICategorizerRepositoryState {
    tagsUpdated: number;
    foldersUpdated: number;
}

declare interface ICategorizerServiceState {
    tagsUpdated: number;
    foldersUpdated: number;
}

declare interface ICommand {
    id: string;
    description: string;
    priority: number;
    handler?: (...args: any[]) => void;
    event?: string;
}

declare interface IContextMenuServiceState {
    dataContextMenuScrapeFromClicked: string;
    dataContextMenuOpenClicked: number;
    dataContextMenuShowInFinderClicked: number;
    dataContextMenuEditClicked: number;
    dataContextMenuScrapeClicked: number;
    dataContextMenuDeleteClicked: number;
    dataContextMenuFlagClicked: number;
    dataContextMenuExportBibTexClicked: number;
    dataContextMenuExportBibTexKeyClicked: number;
    dataContextMenuExportPlainTextClicked: number;
    feedContextMenuAddToLibraryClicked: number;
    feedContextMenuToggleReadClicked: number;
    sidebarContextMenuFeedRefreshClicked: {
        data: string;
        type: string;
    };
    sidebarContextMenuEditClicked: {
        data: string;
        type: string;
    };
    sidebarContextMenuColorClicked: {
        data: string;
        type: string;
        color: string;
    };
    sidebarContextMenuDeleteClicked: {
        data: string;
        type: string;
    };
    supContextMenuDeleteClicked: string;
    thumbnailContextMenuReplaceClicked: number;
    thumbnailContextMenuRefreshClicked: number;
    linkToFolderClicked: string;
}

declare interface IDatabaseCoreState {
    dbInitializing: boolean;
    dbInitialized: boolean;
}

declare interface IDatabaseServiceState {
    dbInitializing: number;
    dbInitialized: number;
}

declare interface IDisposable {
    dispose: () => void;
}

declare interface IDownloaderPreference {
    name: string;
    description: string;
    enable: boolean;
    custom: boolean;
    args: string;
    priority: number;
    preProcessCode: string;
    queryProcessCode: string;
    downloadImplCode: string;
}

declare interface IEventState {
    [key: string]: any;
}

declare interface IExtensionInfo {
    id: string;
    name: string;
    version: string;
    author: string;
    verified: boolean;
    description: string;
    preference: {
        [key: string]: any;
    };
    location: string;
    originLocation?: string;
}

declare interface IExternelCommand {
    id: string;
    description: string;
    event?: string;
}

declare type IFeedCollection = Results<IFeedObject> | List<IFeedObject> | Array<IFeedObject>;

declare interface IFeedDraft {
    _id?: OID;
    id?: OID;
    _partition?: string;
    name?: string;
    count?: number;
    color?: string;
    url?: string;
}

declare type IFeedEntityCollection = Results<IFeedEntityObject> | List<IFeedEntityObject> | Array<IFeedEntityObject>;

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

declare interface IFeedEntityFilterOptions {
    search?: string;
    searchMode?: "general" | "fulltext" | "advanced";
    feedNames?: string[];
    unread?: boolean;
    title?: string;
    authors?: string;
}

declare type IFeedEntityObject = FeedEntity | IFeedEntityRealmObject;

declare type IFeedEntityRealmObject = FeedEntity & Realm_2.Object<FeedEntity, "_id" | "addTime" | "feed" | "feedTime" | "title" | "abstract" | "authors" | "publication" | "pubTime" | "pubType" | "doi" | "arxiv" | "mainURL" | "pages" | "volume" | "number" | "publisher" | "read">;

declare interface IFeedEntityRepositoryState {
    count: number;
    updated: number;
}

declare type IFeedObject = Feed | IFeedRealmObject;

declare type IFeedRealmObject = Feed & Realm_2.Object<Feed, "_id" | "name" | "count" | "url">;

declare interface IFeedRepositoryState {
    updated: number;
}

declare interface IFeedServiceState {
    updated: number;
    entitiesCount: number;
    entitiesUpdated: number;
}

declare interface IFileServiceState {
    backend: string;
    available: boolean;
}

declare interface ILogEventState {
    infoLogMessage: {
        id: string;
        msg: string;
        additional?: string;
    };
    warnLogMessage: {
        id: string;
        msg: string;
        additional?: string;
    };
    errorLogMessage: {
        id: string;
        msg: string;
        additional?: string;
    };
    progressLogMessage: {
        id: string;
        msg: string;
        value: number;
    };
}

declare interface ILogMessage {
    level: "info" | "warn" | "error";
    msg: string;
    additional?: string;
}

declare interface IMenuServiceState {
    preference: number;
    "File-enter": number;
    "File-copyBibTex": number;
    "File-copyBibTexKey": number;
    "Edit-rescrape": number;
    "Edit-edit": number;
    "Edit-flag": number;
    "View-preview": number;
    "View-next": number;
    "View-previous": number;
}

declare type IPaperEntityCollection = Results<IPaperEntityObject> | List<IPaperEntityObject> | Array<IPaperEntityObject>;

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

declare type IPaperEntityObject = PaperEntity | IPaperEntityRealmObject;

declare type IPaperEntityRealmObject = PaperEntity & Realm_2.Object<PaperEntity, "_id" | "title" | "authors" | "publication" | "pubTime" | "pubType" | "doi" | "arxiv" | "mainURL" | "supURLs" | "rating" | "flag" | "note" | "codes" | "volume" | "number" | "pages" | "publisher" | "tags" | "folders">;

declare interface IPaperEntityRepositoryState {
    count: number;
    updated: number;
}

declare interface IPaperFilterOptions {
    search?: string;
    searchMode?: string;
    flaged?: boolean;
    tag?: string;
    folder?: string;
    limit?: number;
}

declare interface IPaperServiceState {
    count: number;
    updated: number;
}

declare type IPaperSmartFilterCollection = Results<IPaperSmartFilterObject> | List<IPaperSmartFilterObject> | Array<IPaperSmartFilterObject>;

declare interface IPaperSmartFilterDraft {
    _id?: OID;
    _partition?: string;
    name?: string;
    filter?: string;
    color?: string;
}

declare type IPaperSmartFilterObject = PaperSmartFilter | IPaperSmartFilterRealmObject;

declare type IPaperSmartFilterRealmObject = PaperSmartFilter & Realm_2.Object<PaperSmartFilter, "_id" | "name" | "filter">;

declare interface IPreferenceStore {
    preferenceVersion: number;
    windowSize: {
        height: number;
        width: number;
    };
    appLibFolder: string;
    deleteSourceFile: boolean;
    sourceFileOperation: "cut" | "copy" | "link";
    showSidebarCount: boolean;
    isSidebarCompact: boolean;
    showMainYear: boolean;
    showMainPublication: boolean;
    showMainPubType: boolean;
    showMainRating: boolean;
    showMainFlag: boolean;
    showMainTags: boolean;
    showMainFolders: boolean;
    showMainNote: boolean;
    showMainAddTime: boolean;
    mainTitleWidth: number;
    mainAuthorsWidth: number;
    mainYearWidth: number;
    mainPublicationWidth: number;
    mainPubTypeWidth: number;
    mainRatingWidth: number;
    mainFlagWidth: number;
    mainTagsWidth: number;
    mainFoldersWidth: number;
    mainNoteWidth: number;
    mainAddTimeWidth: number;
    feedTitleWidth: number;
    feedAuthorsWidth: number;
    feedYearWidth: number;
    feedPublicationWidth: number;
    feedPubTypeWidth: number;
    feedAddTimeWidth: number;
    preferedTheme: "light" | "dark" | "system";
    invertColor: boolean;
    sidebarSortBy: "name" | "count" | "color";
    sidebarSortOrder: "asce" | "desc";
    renamingFormat: "full" | "short" | "authortitle" | "custom";
    customRenamingFormat: string;
    language: string;
    enableExportReplacement: boolean;
    exportReplacement: Array<{
        from: string;
        to: string;
    }>;
    useSync: boolean;
    syncCloudBackend: string;
    isFlexibleSync: boolean;
    syncAPPID: "";
    syncAPIKey: string;
    syncEmail: string;
    syncFileStorage: string;
    webdavURL: string;
    webdavUsername: string;
    webdavPassword: string;
    allowRoutineMatch: boolean;
    lastRematchTime: number;
    lastFeedRefreshTime: number;
    scrapers: Record<string, IScraperPreference>;
    downloaders: Array<IDownloaderPreference>;
    allowproxy: boolean;
    httpproxy: string;
    httpsproxy: string;
    lastVersion: string;
    lastDBVersion: number;
    shortcutPlugin: string;
    shortcutPreview: string;
    shortcutOpen: string;
    shortcutCopy: string;
    shortcutScrape: string;
    shortcutEdit: string;
    shortcutFlag: string;
    shortcutCopyKey: string;
    sidebarWidth: number;
    detailPanelWidth: number;
    mainviewSortBy: string;
    mainviewSortOrder: "desc" | "asce";
    mainviewType: string;
    pluginLinkedFolder: string;
    selectedPDFViewer: string;
    selectedPDFViewerPath: string;
    selectedCSLStyle: string;
    importedCSLStylesPath: string;
    showPresettingLang: boolean;
    showPresettingDB: boolean;
    showPresettingScraper: boolean;
}

declare interface IProcessingState {
    general: number;
}

declare interface IScraperPreference {
    name: string;
    category: string;
    description: string;
    enable: boolean;
    custom: boolean;
    args: string;
    priority: number;
    preProcessCode: string;
    parsingProcessCode: string;
    scrapeImplCode: string;
}

declare function isLocalPath(string: string): boolean;

declare interface ISmartFilterServiceState {
    updated: number;
}

declare function isMetadataCompleted(paperEntityDraft: PaperEntity): boolean;

declare function isPreprint(paperEntityDraft: PaperEntity): boolean;

declare interface IUISlotState {
    paperDetailsPanelSlot1: {
        [id: string]: {
            title: string;
            content: string;
        };
    };
    paperDetailsPanelSlot2: {
        [id: string]: {
            title: string;
            content: string;
        };
    };
    paperDetailsPanelSlot3: {
        [id: string]: {
            title: string;
            content: string;
        };
    };
}

declare interface IUIStateServiceState {
    contentType: string;
    mainViewFocused: boolean;
    editViewShown: boolean;
    feedEditViewShown: boolean;
    paperSmartFilterEditViewShown: boolean;
    preferenceViewShown: boolean;
    deleteConfirmShown: boolean;
    renderRequired: number;
    feedEntityAddingStatus: number;
    entitiesReloaded: number;
    selectedIndex: Array<number>;
    selectedIds: Array<string>;
    selectedPaperEntities: Array<PaperEntity>;
    selectedFeedEntities: Array<FeedEntity>;
    selectedCategorizer: string;
    selectedFeed: string;
    dragingIds: Array<string>;
    commandBarText: string;
    commandBarSearchMode: string;
    isDevMode: boolean;
    os: string;
    "processingState.general": number;
}

declare interface IUpgradeServiceState {
    checking: number;
    available: number;
    notAvailable: number;
    error: any;
    downloaded: number;
    downloading: number;
}

declare interface IWindowProcessManagementServiceState {
    serviceReady: string;
    requestPort: string;
    rendererProcess: string;
}

declare function listAllFiles(folderURL: string, arrayOfFiles?: string[] | null): string[];

declare class LogService extends Eventable<ILogEventState> {
    private logGroups;
    constructor(name?: string);
    /**
     * Log info to the console and the log file.
     * @param {string} level - Log level
     * @param {string} msg - Message to log
     * @param {string} additional - Additional message to log
     * @param {boolean} notify - Show notification
     * @param {string?} id - ID of the log */
    log(level: "info" | "warn" | "error", msg: string, additional?: string, notify?: boolean, id?: string): void;
    /**
     * Show log in the notification bar.
     * @param {LogMessage} logMessage - Log message
     * @param {string} id - ID of the log */
    _notifiy(logMessage: ILogMessage, id: string): void;
    /**
     * Log info to the console and the log file.
     * @param {string} msg - Message to log
     * @param {string} additional - Additional message to log
     * @param {boolean} notify - Show notification
     * @param {string?} id - ID of the log */
    info(msg: string, additional?: string, notify?: boolean, id?: string): void;
    /**
     * Log warning to the console and the log file.
     * @param {string} msg - Message to log
     * @param {string} additional - Additional message to log
     * @param {boolean} notify - Show notification
     * @param {string?} id - ID of the log */
    warn(msg: string, additional?: string, notify?: boolean, id?: string): void;
    /**
     * Log error to the console and the log file.
     * @param {string} msg - Message to log
     * @param {string} additional - Additional message to log
     * @param {boolean} notify - Show notification
     * @param {string?} id - ID of the log */
    error(msg: string, additional?: string | Error, notify?: boolean, id?: string): void;
    /**
     * Log progress to the console and the log file.
     * @param {string} msg - Message to log
     * @param {number} value - Progress value
     * @param {boolean} notify - Show notification
     * @param {string?} id - ID of the log */
    progress(msg: string, value: number, notify?: boolean, id?: string): void;
    /**
     * Get log file path.
     * @returns {string} Log file path */
    getLogFilePath(): string;
}

declare class MenuService extends Eventable<IMenuServiceState> {
    private readonly _preferenceService;
    private readonly _upgradeService;
    private readonly _locales;
    private _isDisabled;
    constructor(_preferenceService: PreferenceService, _upgradeService: UpgradeService);
    onClick: (key: keyof IMenuServiceState | (keyof IMenuServiceState)[], callback: (newValues: {
        key: keyof IMenuServiceState;
        value: any;
    }) => void) => () => void;
    enableAll(): void;
    disableAll(): void;
}

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

declare class NetworkTool {
    private readonly _preferenceService;
    private readonly _logService;
    private _agent;
    constructor(_preferenceService: PreferenceService, _logService: LogService);
    setProxyAgent(proxy?: string): void;
    checkSystemProxy(): void;
    get(url: string, headers?: Record<string, string>, retry?: number, timeout?: number, cache?: boolean): Promise<Response_2<string>>;
    post(url: string, data: Record<string, any> | string, headers?: Record<string, string>, retry?: number, timeout?: number, compress?: boolean): Promise<Response_2<string>>;
    postForm(url: string, data: FormData, headers?: Record<string, string>, retry?: number, timeout?: number): Promise<Response_2<string>>;
    download(url: string, targetPath: string, cookies?: CookieJar): Promise<string>;
    downloadPDFs(urlList: string[], cookies?: CookieJar): Promise<string[]>;
    connected(): Promise<boolean>;
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

declare class PaperEntityRepository extends Eventable<IPaperEntityRepositoryState> {
    private readonly _categorizerRepository;
    constructor(_categorizerRepository: CategorizerRepository);
    /**
     * Transform paper entity to realm object if exists in database. Otherwise, return undefined.
     * @param realm - Realm instance
     * @param paperEntity - Paper entity
     * @returns Realm object
     */
    toRealmObject(realm: Realm_2, paperEntity: IPaperEntityObject): IPaperEntityRealmObject | undefined;
    /**
     * Load all filtered paper entities.
     * @param realm - Realm instance.
     * @param filter - Filter string.
     * @param sortBy - Sort by field.
     * @param sortOrder - Sort order.
     * @returns - Results of paper entities.
     */
    load(realm: Realm_2, filter: string, sortBy: string, sortOrder: "asce" | "desc"): Realm_2.Results<PaperEntity & Realm_2.Object<unknown, never>>;
    /**
     * Load paper entity by id.
     * @param realm - Realm instance.
     * @param ids - Paper ids.
     * @returns - Results of paper entities.
     */
    loadByIds(realm: Realm_2, ids: OID[]): Realm_2.Results<PaperEntity & Realm_2.Object<unknown, never>>;
    /**
     * Update paper entity.
     * @param realm - Realm instance.
     * @param paperEntity - Paper entity.
     * @param paperTag - Paper tags.
     * @param paperFolder - Paper folders.
     * @param existingPaperEntity - Existing paper entity.
     * @param partition - Partition.
     * @returns - Updated boolean flag.
     */
    update(realm: Realm_2, paperEntity: PaperEntity, partition: string): boolean;
    /**
     * Delete paper entity.
     * @param realm - Realm instance.
     * @param ids - OR Paper ids.
     * @param paperEntity - Paper entity.
     * @returns - Deleted boolean flags.
     */
    delete(realm: Realm_2, ids?: OID[], paperEntitys?: PaperEntity[]): string[];
}

declare class PaperFilterOptions implements IPaperFilterOptions {
    filters: string[];
    search?: string;
    searchMode?: string;
    flaged?: boolean;
    tag?: string;
    folder?: string;
    limit?: number;
    constructor(options?: Partial<IPaperFilterOptions>);
    update(options: Partial<IPaperFilterOptions>): void;
    toString(): string;
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

/**
 * Service for paper entity operations.
 */
declare class PaperService extends Eventable<IPaperServiceState> {
    private readonly _databaseCore;
    private readonly _paperEntityRepository;
    private readonly _scrapeService;
    private readonly _cacheService;
    private readonly _schedulerService;
    private readonly _fileService;
    private readonly _preferenceService;
    private readonly _logService;
    constructor(_databaseCore: DatabaseCore, _paperEntityRepository: PaperEntityRepository, _scrapeService: ScrapeService, _cacheService: CacheService, _schedulerService: SchedulerService, _fileService: FileService, _preferenceService: PreferenceService, _logService: LogService);
    /**
     * Load paper entities with filter and sort.
     * @param filter - filter object
     * @param sortBy - Sort: by
     * @param sortOrder - Sort: order
     * @returns - paper entities
     */
    load(filterOptions: PaperFilterOptions, sortBy: string, sortOrder: "asce" | "desc"): Promise<never[] | Realm.Results<IPaperEntityObject>>;
    /**
     * Load paper entities by ids.
     * @param ids - paper entity ids
     * @returns - paper entities
     */
    loadByIds(ids: OID[]): Promise<never[] | Realm.Results<PaperEntity & Realm.Object<unknown, never>>>;
    /**
     * Update paper entities.
     * @param paperEntityDrafts - paper entity drafts
     * @returns
     */
    update(paperEntityDrafts: IPaperEntityCollection): Promise<IPaperEntityCollection>;
    /**
     * Update paper entities with a categorizer.
     * @param ids - The list of paper IDs.
     * @param categorizer - The categorizer.
     * @param type - The type of the categorizer.
     * @returns
     */
    updateWithCategorizer(ids: OID[], categorizer: Categorizer, type: CategorizerType): Promise<void>;
    /**
     * Delete paper entity.
     * @param ids - paper entity ids
     * @param paperEntity - paper entity
     * @returns - flag
     */
    delete(ids?: OID[], paperEntities?: PaperEntity[]): Promise<void>;
    /**
     * Delete a suplementary file.
     * @param paperEntity - The paper entity.
     * @param url - The URL of the supplementary file.
     * @returns
     */
    deleteSup(paperEntity: PaperEntity, url: string): Promise<void>;
    /**
     * Create paper entity from URLs.
     * @param urlList - The list of URLs.
     * @returns
     */
    create(urlList: string[]): Promise<IPaperEntityCollection>;
    /**
     * Create paper entity from a URL with a given categorizer.
     * @param urlList - The list of URLs.
     * @param categorizer - The categorizer.
     * @param type - The type of categorizer.
     * @returns
     */
    createIntoCategorizer(urlList: string[], categorizer: Categorizer, type: CategorizerType): Promise<IPaperEntityCollection | undefined>;
    /**
     * Scrape paper entities.
     * @param paperEntities - The list of paper entities.
     * @returns
     */
    scrape(paperEntities: IPaperEntityCollection, specificScrapers?: string[]): Promise<void>;
    /**
     * Scrape preprint paper entities.
     * @param paperEntities - The list of paper entities.
     * @returns
     */
    scrapePreprint(): Promise<void>;
    /**
     * Rename all paper entities.
     * @returns
     */
    renameAll(): Promise<void>;
    /**
     * Migrate the local database to the cloud database. */
    migrateLocaltoCloud(): Promise<void>;
    addDummyData(): void;
    removeAll(): void;
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

declare class PaperSmartFilterRepository extends Eventable<ISmartFilterServiceState> {
    constructor();
    /**
     * Transform smartfilter to realm object if exists in database. Otherwise, return undefined.
     * @param realm - Realm instance
     * @param paperSmartFilter - PaperSmartFilter
     * @returns Realm object or undefined
     */
    toRealmObject(realm: Realm_2, paperSmartFilter: IPaperSmartFilterObject): PaperSmartFilter | undefined;
    /**
     *
     * @param realm - Realm instance
     * @param type - SmartFilter type
     * @param sortBy - Sort by field
     * @param sortOrder - Sort order
     * @returns Results of smartfilter
     */
    load(realm: Realm_2, type: PaperSmartFilterType, sortBy: string, sortOrder: string): Realm_2.Results<PaperSmartFilter & Realm_2.Object>;
    /**
     * Load smartfilter by ids
     * @param realm - Realm instance
     * @param type - SmartFilter type
     * @param ids - SmartFilter ids
     * @returns Results of smartfilter
     */
    loadByIds(realm: Realm_2, type: PaperSmartFilterType, ids: OID[]): IPaperSmartFilterCollection;
    /**
     * Delete smartfilter
     * @param realm - Realm instance
     * @param type - SmartFilter type
     * @param ids - SmartFilter ids
     * @param smartfilters - SmartFilters
     * @returns True if success
     */
    delete(realm: Realm_2, type: PaperSmartFilterType, ids?: OID[], smartfilters?: IPaperSmartFilterCollection): boolean;
    /**
     * Colorize smartfilter
     * @param realm - Realm instance
     * @param color - Color
     * @param type - SmartFilter type
     * @param smartfilter - SmartFilter
     * @param name - SmartFilter name
     * @returns True if success
     */
    colorize(realm: Realm_2, color: Colors, type: PaperSmartFilterType, id?: OID, smartfilter?: PaperSmartFilter): Promise<void>;
    /**
     * Update smartfilter
     * @param realm - Realm instance
     * @param smartfilter - SmartFilter
     * @param type - SmartFilter type
     * @param partition - Partition
     * @returns Updated smartfilter
     */
    insert(realm: Realm_2, smartfilter: IPaperSmartFilterObject, type: PaperSmartFilterType, partition: string): Realm_2.Object<unknown, never>;
}

declare type PaperSmartFilterType = "PaperPaperSmartFilter";

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

declare namespace PLAPI_2 {
    const logService: LogService;
    const cacheService: CacheService;
    const categorizerService: CategorizerService;
    const commandService: CommandService;
    const databaseService: DatabaseService;
    const feedService: FeedService;
    const fileService: FileService;
    const hookService: HookService;
    const paperService: PaperService;
    const referenceService: ReferenceService;
    const renderService: RenderService;
    const schedulerService: SchedulerService;
    const scrapeService: ScrapeService;
    const shortcutService: ShortcutService;
    const smartFilterService: SmartFilterService;
    const uiStateService: UIStateService;
    const preferenceService: PreferenceService;
    const uiSlotService: UISlotService;
    const networkTool: NetworkTool;
}
export { PLAPI_2 as PLAPI }

declare namespace PLExtAPI_2 {
    const extensionManagementService: ExtensionManagementService;
    const extensionPreferenceService: ExtensionPreferenceService;
}
export { PLExtAPI_2 as PLExtAPI }

export declare abstract class PLExtension {
    id: string;
    defaultPreference: {
        [key: string]: any;
    };
    constructor({ id, defaultPreference, }: {
        id: string;
        defaultPreference: {
            [key: string]: any;
        };
    });
    abstract initialize(): Promise<void>;
    checkPreference(preference: {
        [key: string]: any;
    }): void;
}

declare namespace PLMainAPI_2 {
    const contextMenuService: ContextMenuService;
    const fileSystemService: FileSystemService;
    const menuService: MenuService;
    const proxyService: ProxyService;
    const upgradeService: UpgradeService;
    const windowProcessManagementService: WindowProcessManagementService;
}
export { PLMainAPI_2 as PLMainAPI }

/**
 * Preference service.
 * It is a wrapper of ElectronStore with responsive states.
 */
declare class PreferenceService extends Eventable<IPreferenceStore> {
    private readonly _store;
    constructor();
    /**
     * Get the value of the preference
     * @param key - key of the preference
     * @returns value of the preference
     */
    get(key: keyof IPreferenceStore): string | number | boolean | {
        height: number;
        width: number;
    } | {
        from: string;
        to: string;
    }[] | Record<string, IScraperPreference> | IDownloaderPreference[];
    /**
     * Set the value of the preference
     * @param patch - patch object
     * @returns
     */
    set(patch: Partial<IPreferenceStore>): void;
    getPassword(key: string): Promise<string | null>;
    setPassword(key: string, pwd: string): Promise<void>;
}

declare class ProxyService {
    constructor();
    getSystemProxy(): Promise<string>;
}

declare class ReferenceService {
    private readonly _preferenceService;
    private readonly _logService;
    constructor(_preferenceService: PreferenceService, _logService: LogService);
    private _setupCitePlugin;
    /**
     * Abbreviate the publication name.
     * @param source - The source paper entity.
     * @returns - The paper entity with publication name abbreviated.
     */
    replacePublication(source: PaperEntity): PaperEntity;
    /**
     * Convert paper entity to cite object.
     * @param source - The source paper entity.
     * @returns - The cite object.
     */
    toCite(source: PaperEntity | PaperEntity[] | string): any;
    /**
     * Export BibTex key.
     * @param cite - The cite object.
     * @returns - The BibTex key.
     */
    exportBibTexKey(cite: Cite): string;
    /**
     * Export BibTex body string.
     * @param cite - The cite object.
     * @returns - The BibTex body string.
     */
    exportBibTexBody(cite: Cite): string;
    exportPlainText(cite: Cite): Promise<string>;
    /**
     * Export paper entities.
     * @param paperEntities - The paper entities.
     * @param format - The export format.
     */
    export(paperEntities: PaperEntity[], format: string): Promise<void>;
    /**
     * Load CSL styles.
     * @returns - The CSL styles.
     */
    loadCSLStyles(): Promise<{
        key: string;
        name: string;
    }[]>;
}

declare class RenderService {
    private _preferenceService;
    private _pdfWorker?;
    private _renderingPage?;
    private _renderingPDF?;
    private _markdownIt;
    constructor(_preferenceService: PreferenceService);
    private _createPDFWorker;
    /**
     * Render PDF file to canvas
     * @param fileURL - file url
     * @param canvasId - canvas id
     * @returns - {blob: ArrayBuffer | null, width: number, height: number}
     */
    renderPDF(fileURL: string, canvasId: string): Promise<{
        blob: ArrayBuffer | null;
        width: number;
        height: number;
    }>;
    /**
     * Render PDF cache to canvas
     * @param cachedThumbnail - cached thumbnail
     * @param canvasId - canvas id
     */
    renderPDFCache(cachedThumbnail: ThumbnailCache, canvasId: string): Promise<void>;
    /**
     * Render Markdown to HTML
     * @param content - markdown content
     * @param renderFull - render full content or not
     * @returns - {renderedStr: string, overflow: boolean}
     */
    renderMarkdown(content: string, renderFull?: boolean): Promise<{
        renderedStr: string;
        overflow: boolean;
    }>;
    /**
     * Render Markdown file to HTML
     * @param url - file url
     * @param renderFull - render full content or not
     * @returns - {renderedStr: string, overflow: boolean}
     */
    renderMarkdownFile(url: string, renderFull?: boolean): Promise<{
        renderedStr: string;
        overflow: boolean;
    }>;
    /**
     * Render Math to HTML
     * @param content - math content
     * @returns - rendered HTML string
     */
    renderMath(content: string): Promise<string>;
}

declare interface RSSItem {
    "dc:creator"?: string | string[];
    "dc:date"?: string;
    "dc:type"?: string;
    "dc:description"?: string;
    description?: string | {
        "#text": string;
        "@_rdf:parseType": string;
    };
    link?: string;
    "prism:coverDate"?: string;
    "prism:doi"?: string;
    "prism:number"?: number;
    "prism:publicationName"?: string;
    "prism:url"?: string;
    "prism:volume"?: number;
    title?: string;
    pubDate?: string;
    authors?: string;
}

declare class RSSRepository {
    private _networkTool;
    xmlParser: XMLParser;
    constructor(_networkTool: NetworkTool);
    fetch(feed: Feed): Promise<FeedEntity[]>;
    parse(rawResponse: Response_2<string>): FeedEntity[];
    parseRSSItems(items: RSSItem[]): FeedEntity[];
    parseAtomItems(items: AtomItem[]): FeedEntity[];
}

declare class SchedulerService {
    private readonly _logService;
    private readonly _scheduler;
    constructor(_logService: LogService);
    /**
     * Create a task.
     * @param taskId The id of the task.
     * @param taskImpl The implementation of the task.
     * @param interval The interval of the task.
     * @param errorImpl The implementation of the error handler.
     * @param runImmediately Whether to run the task immediately.
     * @param runOnce Whether to run the task only once. */
    createTask(taskId: string, taskImpl: () => void, interval: number, errorImpl?: (error: Error) => void, runImmediately?: boolean, runOnce?: boolean): void;
    /**
     * Remove a task.
     * @param taskId The id of the task. */
    removeTask(taskId: string): void;
    /**
     * Start a task.
     * @param taskId The id of the task. */
    startTask(taskId: string): void;
    /**
     * Stop a task.
     * @param taskId The id of the task. */
    stopTask(taskId: string): void;
}

/**
 * ScrapeService transforms a data source, such as a local file, web page, etc., into a PaperEntity with fullfilled metadata.
 *
 * Scrapers can be categorized into two types:
 *   1. Entry scraper: transforms a data source into a PaperEntity
 *   2. Metadata scraper: fullfill the metadata of a PaperEntity into
 *
 * Scraping pipeline:
 * | ----------------
 * | 1. Entry scraper transforms a data source, such as the following object, into a PaperEntity.
 * |     payload { // processed by different entry scrapers
 * |     . url: string  // an example payload consists of a url
 * |     }
 * |     NOTE: Entry scrapers also support type of "PaperEntity", which is a bypass for extensions
 * |           to parse a data source in themselve and get the metadata from here.
 * | ----------------
 * | 2. Metadata scraper fullfills the metadata of a PaperEntity.
 * | ----------------
 */
declare class ScrapeService extends Eventable<{}> {
    private readonly _hookService;
    private readonly _logService;
    constructor(_hookService: HookService, _logService: LogService);
    /**
     * Scrape a data source's metadata.
     * @param payloads - data source payloads.
     * @param specificScrapers - list of metadata scrapers.
     * @param force - force scraping metadata.
     * @returns - list of paper entities. */
    scrape(payloads: any[], specificScrapers: string[], force?: boolean): Promise<PaperEntity[]>;
    /**
     * Scrape all entry scrapers to transform data source payloads into a PaperEntity list.
     * @param payloads - data source payloads.
     * @returns - list of paper entities. */
    scrapeEntry(payloads: any[]): Promise<PaperEntity[]>;
    /**
     * Scrape all metadata scrapers to fullfill the metadata of PaperEntitys.
     * @param paperEntityDrafts - list of paper entities.
     * @param scrapers - list of metadata scrapers.
     * @param force - force scraping metadata.
     * @returns - list of paper entities. */
    scrapeMetadata(paperEntityDrafts: PaperEntity[], scrapers: string[], force?: boolean): Promise<PaperEntity[]>;
}

declare class ShortcutService {
    private readonly _registeredShortcuts;
    private readonly _registeredShortcutsInInputField;
    constructor();
    register(code: string, handler: (...args: any[]) => void, preventDefault?: boolean, stopPropagation?: boolean): () => void;
    registerInInputField(code: string, handler: (...args: any[]) => void, preventDefault?: boolean, stopPropagation?: boolean): () => void;
}

declare class SmartFilterService extends Eventable<ISmartFilterServiceState> {
    private readonly _databaseCore;
    private readonly _paperSmartFilterRepository;
    private readonly _logService;
    constructor(_databaseCore: DatabaseCore, _paperSmartFilterRepository: PaperSmartFilterRepository, _logService: LogService);
    /**
     * Load smartfilters.
     * @param type The type of the smartfilter.
     * @param sortBy Sort: by
     * @param sortOrder Sort: order
     * @returns
     */
    load(type: PaperSmartFilterType, sortBy: string, sortOrder: string): Promise<Realm.Results<PaperSmartFilter & Realm.Object<unknown, never>>>;
    /**
     * Delete a smartfilter.
     * @param type - The type of the smartfilter.
     * @param ids - The ids of the smartfilters.
     * @param smartfilters - The smartfilters.
     * @returns
     */
    delete(type: PaperSmartFilterType, ids?: OID[], smartfilters?: IPaperSmartFilterCollection): Promise<void>;
    /**
     * Colorize a smartfilter.
     * @param color - The color.
     * @param type - The type of the smartfilter.
     * @param name - The name of the smartfilter.
     * @param smartfilter - The smartfilter.
     * @returns
     */
    colorize(color: Colors, type: PaperSmartFilterType, id?: OID, smartfilter?: PaperSmartFilter): Promise<void>;
    /**
     * Insert a smartfilter.
     * @param smartfilter - The smartfilter.
     * @param type - The type of the smartfilter.
     * @returns
     */
    insert(smartfilter: PaperSmartFilter, type: PaperSmartFilterType): Promise<void>;
    /**
     * Migrate the local database to the cloud database. */
    migrateLocaltoCloud(): Promise<void>;
}

export declare const stringUtils: {
    formatString: ({ str, removeNewline, removeWhite, removeSymbol, removeStr, lowercased, trimWhite, whiteSymbol, }: formatStringParams) => string;
};

declare class SubStateGroup<T extends IEventState> extends Eventable<T> {
    constructor(stateID: string, defaultState: T);
    setState(patch: Partial<T>): void;
    getState(stateKey: keyof T): any;
}

declare interface ThumbnailCache {
    blob: ArrayBuffer;
    width: number;
    height: number;
}

declare class UISlotService extends Eventable<IUISlotState> {
    private readonly _logService;
    constructor(_logService: LogService);
    updateSlot(slotID: keyof IUISlotState, patch: {
        [id: string]: any;
    }): void;
}

/**
 * UI service is responsible for managing the UI state.*/
declare class UIStateService extends Eventable<IUIStateServiceState> {
    readonly processingState: SubStateGroup<IProcessingState>;
    constructor();
    setState(patch: Partial<IUIStateServiceState>): void;
    getState(stateKey: keyof IUIStateServiceState): string | number | boolean | string[] | number[] | {
        _id: string | {
            _bsontype: "ObjectID";
            id: {
                [x: number]: number;
                write: {
                    (string: string, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                };
                toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                toJSON: () => {
                    type: "Buffer";
                    data: number[];
                };
                equals: (otherBuffer: Uint8Array) => boolean;
                compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                writeUintLE: (value: number, offset: number, byteLength: number) => number;
                writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                writeUintBE: (value: number, offset: number, byteLength: number) => number;
                writeIntLE: (value: number, offset: number, byteLength: number) => number;
                writeIntBE: (value: number, offset: number, byteLength: number) => number;
                readBigUInt64BE: (offset?: number | undefined) => bigint;
                readBigUint64BE: (offset?: number | undefined) => bigint;
                readBigUInt64LE: (offset?: number | undefined) => bigint;
                readBigUint64LE: (offset?: number | undefined) => bigint;
                readBigInt64BE: (offset?: number | undefined) => bigint;
                readBigInt64LE: (offset?: number | undefined) => bigint;
                readUIntLE: (offset: number, byteLength: number) => number;
                readUintLE: (offset: number, byteLength: number) => number;
                readUIntBE: (offset: number, byteLength: number) => number;
                readUintBE: (offset: number, byteLength: number) => number;
                readIntLE: (offset: number, byteLength: number) => number;
                readIntBE: (offset: number, byteLength: number) => number;
                readUInt8: (offset?: number | undefined) => number;
                readUint8: (offset?: number | undefined) => number;
                readUInt16LE: (offset?: number | undefined) => number;
                readUint16LE: (offset?: number | undefined) => number;
                readUInt16BE: (offset?: number | undefined) => number;
                readUint16BE: (offset?: number | undefined) => number;
                readUInt32LE: (offset?: number | undefined) => number;
                readUint32LE: (offset?: number | undefined) => number;
                readUInt32BE: (offset?: number | undefined) => number;
                readUint32BE: (offset?: number | undefined) => number;
                readInt8: (offset?: number | undefined) => number;
                readInt16LE: (offset?: number | undefined) => number;
                readInt16BE: (offset?: number | undefined) => number;
                readInt32LE: (offset?: number | undefined) => number;
                readInt32BE: (offset?: number | undefined) => number;
                readFloatLE: (offset?: number | undefined) => number;
                readFloatBE: (offset?: number | undefined) => number;
                readDoubleLE: (offset?: number | undefined) => number;
                readDoubleBE: (offset?: number | undefined) => number;
                reverse: () => Buffer;
                swap16: () => Buffer;
                swap32: () => Buffer;
                swap64: () => Buffer;
                writeUInt8: (value: number, offset?: number | undefined) => number;
                writeUint8: (value: number, offset?: number | undefined) => number;
                writeUInt16LE: (value: number, offset?: number | undefined) => number;
                writeUint16LE: (value: number, offset?: number | undefined) => number;
                writeUInt16BE: (value: number, offset?: number | undefined) => number;
                writeUint16BE: (value: number, offset?: number | undefined) => number;
                writeUInt32LE: (value: number, offset?: number | undefined) => number;
                writeUint32LE: (value: number, offset?: number | undefined) => number;
                writeUInt32BE: (value: number, offset?: number | undefined) => number;
                writeUint32BE: (value: number, offset?: number | undefined) => number;
                writeInt8: (value: number, offset?: number | undefined) => number;
                writeInt16LE: (value: number, offset?: number | undefined) => number;
                writeInt16BE: (value: number, offset?: number | undefined) => number;
                writeInt32LE: (value: number, offset?: number | undefined) => number;
                writeInt32BE: (value: number, offset?: number | undefined) => number;
                writeFloatLE: (value: number, offset?: number | undefined) => number;
                writeFloatBE: (value: number, offset?: number | undefined) => number;
                writeDoubleLE: (value: number, offset?: number | undefined) => number;
                writeDoubleBE: (value: number, offset?: number | undefined) => number;
                fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                entries: () => IterableIterator<[number, number]>;
                includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                keys: () => IterableIterator<number>;
                values: () => IterableIterator<number>;
                readonly BYTES_PER_ELEMENT: number;
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: string;
                } | {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                    readonly [Symbol.species]: SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                join: (separator?: string | undefined) => string;
                readonly length: number;
                map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                reduce: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                };
                reduceRight: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                };
                set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                toLocaleString: () => string;
                valueOf: () => Uint8Array;
                at: (index: number) => number | undefined;
                findLast: {
                    <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                    (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                };
                findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                [Symbol.iterator]: () => IterableIterator<number>;
                readonly [Symbol.toStringTag]: "Uint8Array";
            };
            generationTime: number;
            toHexString: () => string;
            toString: (format?: string | undefined) => string;
            toJSON: () => string;
            equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
            getTimestamp: () => Date;
            inspect: () => string;
        };
        id: string | {
            _bsontype: "ObjectID";
            id: {
                [x: number]: number;
                write: {
                    (string: string, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                };
                toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                toJSON: () => {
                    type: "Buffer";
                    data: number[];
                };
                equals: (otherBuffer: Uint8Array) => boolean;
                compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                writeUintLE: (value: number, offset: number, byteLength: number) => number;
                writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                writeUintBE: (value: number, offset: number, byteLength: number) => number;
                writeIntLE: (value: number, offset: number, byteLength: number) => number;
                writeIntBE: (value: number, offset: number, byteLength: number) => number;
                readBigUInt64BE: (offset?: number | undefined) => bigint;
                readBigUint64BE: (offset?: number | undefined) => bigint;
                readBigUInt64LE: (offset?: number | undefined) => bigint;
                readBigUint64LE: (offset?: number | undefined) => bigint;
                readBigInt64BE: (offset?: number | undefined) => bigint;
                readBigInt64LE: (offset?: number | undefined) => bigint;
                readUIntLE: (offset: number, byteLength: number) => number;
                readUintLE: (offset: number, byteLength: number) => number;
                readUIntBE: (offset: number, byteLength: number) => number;
                readUintBE: (offset: number, byteLength: number) => number;
                readIntLE: (offset: number, byteLength: number) => number;
                readIntBE: (offset: number, byteLength: number) => number;
                readUInt8: (offset?: number | undefined) => number;
                readUint8: (offset?: number | undefined) => number;
                readUInt16LE: (offset?: number | undefined) => number;
                readUint16LE: (offset?: number | undefined) => number;
                readUInt16BE: (offset?: number | undefined) => number;
                readUint16BE: (offset?: number | undefined) => number;
                readUInt32LE: (offset?: number | undefined) => number;
                readUint32LE: (offset?: number | undefined) => number;
                readUInt32BE: (offset?: number | undefined) => number;
                readUint32BE: (offset?: number | undefined) => number;
                readInt8: (offset?: number | undefined) => number;
                readInt16LE: (offset?: number | undefined) => number;
                readInt16BE: (offset?: number | undefined) => number;
                readInt32LE: (offset?: number | undefined) => number;
                readInt32BE: (offset?: number | undefined) => number;
                readFloatLE: (offset?: number | undefined) => number;
                readFloatBE: (offset?: number | undefined) => number;
                readDoubleLE: (offset?: number | undefined) => number;
                readDoubleBE: (offset?: number | undefined) => number;
                reverse: () => Buffer;
                swap16: () => Buffer;
                swap32: () => Buffer;
                swap64: () => Buffer;
                writeUInt8: (value: number, offset?: number | undefined) => number;
                writeUint8: (value: number, offset?: number | undefined) => number;
                writeUInt16LE: (value: number, offset?: number | undefined) => number;
                writeUint16LE: (value: number, offset?: number | undefined) => number;
                writeUInt16BE: (value: number, offset?: number | undefined) => number;
                writeUint16BE: (value: number, offset?: number | undefined) => number;
                writeUInt32LE: (value: number, offset?: number | undefined) => number;
                writeUint32LE: (value: number, offset?: number | undefined) => number;
                writeUInt32BE: (value: number, offset?: number | undefined) => number;
                writeUint32BE: (value: number, offset?: number | undefined) => number;
                writeInt8: (value: number, offset?: number | undefined) => number;
                writeInt16LE: (value: number, offset?: number | undefined) => number;
                writeInt16BE: (value: number, offset?: number | undefined) => number;
                writeInt32LE: (value: number, offset?: number | undefined) => number;
                writeInt32BE: (value: number, offset?: number | undefined) => number;
                writeFloatLE: (value: number, offset?: number | undefined) => number;
                writeFloatBE: (value: number, offset?: number | undefined) => number;
                writeDoubleLE: (value: number, offset?: number | undefined) => number;
                writeDoubleBE: (value: number, offset?: number | undefined) => number;
                fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                entries: () => IterableIterator<[number, number]>;
                includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                keys: () => IterableIterator<number>;
                values: () => IterableIterator<number>;
                readonly BYTES_PER_ELEMENT: number;
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: string;
                } | {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                    readonly [Symbol.species]: SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                join: (separator?: string | undefined) => string;
                readonly length: number;
                map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                reduce: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                };
                reduceRight: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                };
                set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                toLocaleString: () => string;
                valueOf: () => Uint8Array;
                at: (index: number) => number | undefined;
                findLast: {
                    <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                    (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                };
                findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                [Symbol.iterator]: () => IterableIterator<number>;
                readonly [Symbol.toStringTag]: "Uint8Array";
            };
            generationTime: number;
            toHexString: () => string;
            toString: (format?: string | undefined) => string;
            toJSON: () => string;
            equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
            getTimestamp: () => Date;
            inspect: () => string;
        };
        _partition: string;
        addTime: {
            toString: () => string;
            toDateString: () => string;
            toTimeString: () => string;
            toLocaleString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            toLocaleDateString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            toLocaleTimeString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            valueOf: () => number;
            getTime: () => number;
            getFullYear: () => number;
            getUTCFullYear: () => number;
            getMonth: () => number;
            getUTCMonth: () => number;
            getDate: () => number;
            getUTCDate: () => number;
            getDay: () => number;
            getUTCDay: () => number;
            getHours: () => number;
            getUTCHours: () => number;
            getMinutes: () => number;
            getUTCMinutes: () => number;
            getSeconds: () => number;
            getUTCSeconds: () => number;
            getMilliseconds: () => number;
            getUTCMilliseconds: () => number;
            getTimezoneOffset: () => number;
            setTime: (time: number) => number;
            setMilliseconds: (ms: number) => number;
            setUTCMilliseconds: (ms: number) => number;
            setSeconds: (sec: number, ms?: number | undefined) => number;
            setUTCSeconds: (sec: number, ms?: number | undefined) => number;
            setMinutes: (min: number, sec?: number | undefined, ms?: number | undefined) => number;
            setUTCMinutes: (min: number, sec?: number | undefined, ms?: number | undefined) => number;
            setHours: (hours: number, min?: number | undefined, sec?: number | undefined, ms?: number | undefined) => number;
            setUTCHours: (hours: number, min?: number | undefined, sec?: number | undefined, ms?: number | undefined) => number;
            setDate: (date: number) => number;
            setUTCDate: (date: number) => number;
            setMonth: (month: number, date?: number | undefined) => number;
            setUTCMonth: (month: number, date?: number | undefined) => number;
            setFullYear: (year: number, month?: number | undefined, date?: number | undefined) => number;
            setUTCFullYear: (year: number, month?: number | undefined, date?: number | undefined) => number;
            toUTCString: () => string;
            toISOString: () => string;
            toJSON: (key?: any) => string;
            getVarDate: () => VarDate;
            [Symbol.toPrimitive]: {
                (hint: "default"): string;
                (hint: "string"): string;
                (hint: "number"): number;
                (hint: string): string | number;
            };
        };
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
        tags: {
            _id: string | {
                _bsontype: "ObjectID";
                id: {
                    [x: number]: number;
                    write: {
                        (string: string, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                    };
                    toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                    toJSON: () => {
                        type: "Buffer";
                        data: number[];
                    };
                    equals: (otherBuffer: Uint8Array) => boolean;
                    compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                    copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                    slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                    subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                    writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                    writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeUintLE: (value: number, offset: number, byteLength: number) => number;
                    writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                    writeUintBE: (value: number, offset: number, byteLength: number) => number;
                    writeIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeIntBE: (value: number, offset: number, byteLength: number) => number;
                    readBigUInt64BE: (offset?: number | undefined) => bigint;
                    readBigUint64BE: (offset?: number | undefined) => bigint;
                    readBigUInt64LE: (offset?: number | undefined) => bigint;
                    readBigUint64LE: (offset?: number | undefined) => bigint;
                    readBigInt64BE: (offset?: number | undefined) => bigint;
                    readBigInt64LE: (offset?: number | undefined) => bigint;
                    readUIntLE: (offset: number, byteLength: number) => number;
                    readUintLE: (offset: number, byteLength: number) => number;
                    readUIntBE: (offset: number, byteLength: number) => number;
                    readUintBE: (offset: number, byteLength: number) => number;
                    readIntLE: (offset: number, byteLength: number) => number;
                    readIntBE: (offset: number, byteLength: number) => number;
                    readUInt8: (offset?: number | undefined) => number;
                    readUint8: (offset?: number | undefined) => number;
                    readUInt16LE: (offset?: number | undefined) => number;
                    readUint16LE: (offset?: number | undefined) => number;
                    readUInt16BE: (offset?: number | undefined) => number;
                    readUint16BE: (offset?: number | undefined) => number;
                    readUInt32LE: (offset?: number | undefined) => number;
                    readUint32LE: (offset?: number | undefined) => number;
                    readUInt32BE: (offset?: number | undefined) => number;
                    readUint32BE: (offset?: number | undefined) => number;
                    readInt8: (offset?: number | undefined) => number;
                    readInt16LE: (offset?: number | undefined) => number;
                    readInt16BE: (offset?: number | undefined) => number;
                    readInt32LE: (offset?: number | undefined) => number;
                    readInt32BE: (offset?: number | undefined) => number;
                    readFloatLE: (offset?: number | undefined) => number;
                    readFloatBE: (offset?: number | undefined) => number;
                    readDoubleLE: (offset?: number | undefined) => number;
                    readDoubleBE: (offset?: number | undefined) => number;
                    reverse: () => Buffer;
                    swap16: () => Buffer;
                    swap32: () => Buffer;
                    swap64: () => Buffer;
                    writeUInt8: (value: number, offset?: number | undefined) => number;
                    writeUint8: (value: number, offset?: number | undefined) => number;
                    writeUInt16LE: (value: number, offset?: number | undefined) => number;
                    writeUint16LE: (value: number, offset?: number | undefined) => number;
                    writeUInt16BE: (value: number, offset?: number | undefined) => number;
                    writeUint16BE: (value: number, offset?: number | undefined) => number;
                    writeUInt32LE: (value: number, offset?: number | undefined) => number;
                    writeUint32LE: (value: number, offset?: number | undefined) => number;
                    writeUInt32BE: (value: number, offset?: number | undefined) => number;
                    writeUint32BE: (value: number, offset?: number | undefined) => number;
                    writeInt8: (value: number, offset?: number | undefined) => number;
                    writeInt16LE: (value: number, offset?: number | undefined) => number;
                    writeInt16BE: (value: number, offset?: number | undefined) => number;
                    writeInt32LE: (value: number, offset?: number | undefined) => number;
                    writeInt32BE: (value: number, offset?: number | undefined) => number;
                    writeFloatLE: (value: number, offset?: number | undefined) => number;
                    writeFloatBE: (value: number, offset?: number | undefined) => number;
                    writeDoubleLE: (value: number, offset?: number | undefined) => number;
                    writeDoubleBE: (value: number, offset?: number | undefined) => number;
                    fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                    indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    entries: () => IterableIterator<[number, number]>;
                    includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                    keys: () => IterableIterator<number>;
                    values: () => IterableIterator<number>;
                    readonly BYTES_PER_ELEMENT: number;
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: string;
                    } | {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                        readonly [Symbol.species]: SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                    every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                    find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                    findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                    forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                    join: (separator?: string | undefined) => string;
                    readonly length: number;
                    map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                    reduce: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                    };
                    reduceRight: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                    };
                    set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                    some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                    toLocaleString: () => string;
                    valueOf: () => Uint8Array;
                    at: (index: number) => number | undefined;
                    findLast: {
                        <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                        (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                    };
                    findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                    [Symbol.iterator]: () => IterableIterator<number>;
                    readonly [Symbol.toStringTag]: "Uint8Array";
                };
                generationTime: number;
                toHexString: () => string;
                toString: (format?: string | undefined) => string;
                toJSON: () => string;
                equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
                getTimestamp: () => Date;
                inspect: () => string;
            };
            _partition: string;
            name: string;
            count: number;
            color?: string | undefined;
            initialize: (object: ICategorizerDraft) => PaperTag;
        }[];
        folders: {
            _id: string | {
                _bsontype: "ObjectID";
                id: {
                    [x: number]: number;
                    write: {
                        (string: string, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                    };
                    toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                    toJSON: () => {
                        type: "Buffer";
                        data: number[];
                    };
                    equals: (otherBuffer: Uint8Array) => boolean;
                    compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                    copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                    slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                    subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                    writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                    writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeUintLE: (value: number, offset: number, byteLength: number) => number;
                    writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                    writeUintBE: (value: number, offset: number, byteLength: number) => number;
                    writeIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeIntBE: (value: number, offset: number, byteLength: number) => number;
                    readBigUInt64BE: (offset?: number | undefined) => bigint;
                    readBigUint64BE: (offset?: number | undefined) => bigint;
                    readBigUInt64LE: (offset?: number | undefined) => bigint;
                    readBigUint64LE: (offset?: number | undefined) => bigint;
                    readBigInt64BE: (offset?: number | undefined) => bigint;
                    readBigInt64LE: (offset?: number | undefined) => bigint;
                    readUIntLE: (offset: number, byteLength: number) => number;
                    readUintLE: (offset: number, byteLength: number) => number;
                    readUIntBE: (offset: number, byteLength: number) => number;
                    readUintBE: (offset: number, byteLength: number) => number;
                    readIntLE: (offset: number, byteLength: number) => number;
                    readIntBE: (offset: number, byteLength: number) => number;
                    readUInt8: (offset?: number | undefined) => number;
                    readUint8: (offset?: number | undefined) => number;
                    readUInt16LE: (offset?: number | undefined) => number;
                    readUint16LE: (offset?: number | undefined) => number;
                    readUInt16BE: (offset?: number | undefined) => number;
                    readUint16BE: (offset?: number | undefined) => number;
                    readUInt32LE: (offset?: number | undefined) => number;
                    readUint32LE: (offset?: number | undefined) => number;
                    readUInt32BE: (offset?: number | undefined) => number;
                    readUint32BE: (offset?: number | undefined) => number;
                    readInt8: (offset?: number | undefined) => number;
                    readInt16LE: (offset?: number | undefined) => number;
                    readInt16BE: (offset?: number | undefined) => number;
                    readInt32LE: (offset?: number | undefined) => number;
                    readInt32BE: (offset?: number | undefined) => number;
                    readFloatLE: (offset?: number | undefined) => number;
                    readFloatBE: (offset?: number | undefined) => number;
                    readDoubleLE: (offset?: number | undefined) => number;
                    readDoubleBE: (offset?: number | undefined) => number;
                    reverse: () => Buffer;
                    swap16: () => Buffer;
                    swap32: () => Buffer;
                    swap64: () => Buffer;
                    writeUInt8: (value: number, offset?: number | undefined) => number;
                    writeUint8: (value: number, offset?: number | undefined) => number;
                    writeUInt16LE: (value: number, offset?: number | undefined) => number;
                    writeUint16LE: (value: number, offset?: number | undefined) => number;
                    writeUInt16BE: (value: number, offset?: number | undefined) => number;
                    writeUint16BE: (value: number, offset?: number | undefined) => number;
                    writeUInt32LE: (value: number, offset?: number | undefined) => number;
                    writeUint32LE: (value: number, offset?: number | undefined) => number;
                    writeUInt32BE: (value: number, offset?: number | undefined) => number;
                    writeUint32BE: (value: number, offset?: number | undefined) => number;
                    writeInt8: (value: number, offset?: number | undefined) => number;
                    writeInt16LE: (value: number, offset?: number | undefined) => number;
                    writeInt16BE: (value: number, offset?: number | undefined) => number;
                    writeInt32LE: (value: number, offset?: number | undefined) => number;
                    writeInt32BE: (value: number, offset?: number | undefined) => number;
                    writeFloatLE: (value: number, offset?: number | undefined) => number;
                    writeFloatBE: (value: number, offset?: number | undefined) => number;
                    writeDoubleLE: (value: number, offset?: number | undefined) => number;
                    writeDoubleBE: (value: number, offset?: number | undefined) => number;
                    fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                    indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    entries: () => IterableIterator<[number, number]>;
                    includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                    keys: () => IterableIterator<number>;
                    values: () => IterableIterator<number>;
                    readonly BYTES_PER_ELEMENT: number;
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: string;
                    } | {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                        readonly [Symbol.species]: SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                    every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                    find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                    findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                    forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                    join: (separator?: string | undefined) => string;
                    readonly length: number;
                    map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                    reduce: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                    };
                    reduceRight: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                    };
                    set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                    some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                    toLocaleString: () => string;
                    valueOf: () => Uint8Array;
                    at: (index: number) => number | undefined;
                    findLast: {
                        <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                        (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                    };
                    findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                    [Symbol.iterator]: () => IterableIterator<number>;
                    readonly [Symbol.toStringTag]: "Uint8Array";
                };
                generationTime: number;
                toHexString: () => string;
                toString: (format?: string | undefined) => string;
                toJSON: () => string;
                equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
                getTimestamp: () => Date;
                inspect: () => string;
            };
            _partition: string;
            name: string;
            count: number;
            color?: string | undefined;
            initialize: (object: ICategorizerDraft) => PaperFolder;
        }[];
        flag: boolean;
        note: string;
        codes: string[];
        pages: string;
        volume: string;
        number: string;
        publisher: string;
        setValue: (key: keyof PaperEntity, value: unknown, format?: boolean) => void;
        initialize: (object: IPaperEntityDraft) => PaperEntity;
        fromFeed: (feedEntity: FeedEntity) => PaperEntity;
    }[] | {
        _id: string | {
            _bsontype: "ObjectID";
            id: {
                [x: number]: number;
                write: {
                    (string: string, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                };
                toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                toJSON: () => {
                    type: "Buffer";
                    data: number[];
                };
                equals: (otherBuffer: Uint8Array) => boolean;
                compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                writeUintLE: (value: number, offset: number, byteLength: number) => number;
                writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                writeUintBE: (value: number, offset: number, byteLength: number) => number;
                writeIntLE: (value: number, offset: number, byteLength: number) => number;
                writeIntBE: (value: number, offset: number, byteLength: number) => number;
                readBigUInt64BE: (offset?: number | undefined) => bigint;
                readBigUint64BE: (offset?: number | undefined) => bigint;
                readBigUInt64LE: (offset?: number | undefined) => bigint;
                readBigUint64LE: (offset?: number | undefined) => bigint;
                readBigInt64BE: (offset?: number | undefined) => bigint;
                readBigInt64LE: (offset?: number | undefined) => bigint;
                readUIntLE: (offset: number, byteLength: number) => number;
                readUintLE: (offset: number, byteLength: number) => number;
                readUIntBE: (offset: number, byteLength: number) => number;
                readUintBE: (offset: number, byteLength: number) => number;
                readIntLE: (offset: number, byteLength: number) => number;
                readIntBE: (offset: number, byteLength: number) => number;
                readUInt8: (offset?: number | undefined) => number;
                readUint8: (offset?: number | undefined) => number;
                readUInt16LE: (offset?: number | undefined) => number;
                readUint16LE: (offset?: number | undefined) => number;
                readUInt16BE: (offset?: number | undefined) => number;
                readUint16BE: (offset?: number | undefined) => number;
                readUInt32LE: (offset?: number | undefined) => number;
                readUint32LE: (offset?: number | undefined) => number;
                readUInt32BE: (offset?: number | undefined) => number;
                readUint32BE: (offset?: number | undefined) => number;
                readInt8: (offset?: number | undefined) => number;
                readInt16LE: (offset?: number | undefined) => number;
                readInt16BE: (offset?: number | undefined) => number;
                readInt32LE: (offset?: number | undefined) => number;
                readInt32BE: (offset?: number | undefined) => number;
                readFloatLE: (offset?: number | undefined) => number;
                readFloatBE: (offset?: number | undefined) => number;
                readDoubleLE: (offset?: number | undefined) => number;
                readDoubleBE: (offset?: number | undefined) => number;
                reverse: () => Buffer;
                swap16: () => Buffer;
                swap32: () => Buffer;
                swap64: () => Buffer;
                writeUInt8: (value: number, offset?: number | undefined) => number;
                writeUint8: (value: number, offset?: number | undefined) => number;
                writeUInt16LE: (value: number, offset?: number | undefined) => number;
                writeUint16LE: (value: number, offset?: number | undefined) => number;
                writeUInt16BE: (value: number, offset?: number | undefined) => number;
                writeUint16BE: (value: number, offset?: number | undefined) => number;
                writeUInt32LE: (value: number, offset?: number | undefined) => number;
                writeUint32LE: (value: number, offset?: number | undefined) => number;
                writeUInt32BE: (value: number, offset?: number | undefined) => number;
                writeUint32BE: (value: number, offset?: number | undefined) => number;
                writeInt8: (value: number, offset?: number | undefined) => number;
                writeInt16LE: (value: number, offset?: number | undefined) => number;
                writeInt16BE: (value: number, offset?: number | undefined) => number;
                writeInt32LE: (value: number, offset?: number | undefined) => number;
                writeInt32BE: (value: number, offset?: number | undefined) => number;
                writeFloatLE: (value: number, offset?: number | undefined) => number;
                writeFloatBE: (value: number, offset?: number | undefined) => number;
                writeDoubleLE: (value: number, offset?: number | undefined) => number;
                writeDoubleBE: (value: number, offset?: number | undefined) => number;
                fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                entries: () => IterableIterator<[number, number]>;
                includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                keys: () => IterableIterator<number>;
                values: () => IterableIterator<number>;
                readonly BYTES_PER_ELEMENT: number;
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: string;
                } | {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                    readonly [Symbol.species]: SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                join: (separator?: string | undefined) => string;
                readonly length: number;
                map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                reduce: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                };
                reduceRight: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                };
                set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                toLocaleString: () => string;
                valueOf: () => Uint8Array;
                at: (index: number) => number | undefined;
                findLast: {
                    <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                    (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                };
                findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                [Symbol.iterator]: () => IterableIterator<number>;
                readonly [Symbol.toStringTag]: "Uint8Array";
            };
            generationTime: number;
            toHexString: () => string;
            toString: (format?: string | undefined) => string;
            toJSON: () => string;
            equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
            getTimestamp: () => Date;
            inspect: () => string;
        };
        id: string | {
            _bsontype: "ObjectID";
            id: {
                [x: number]: number;
                write: {
                    (string: string, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                    (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                };
                toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                toJSON: () => {
                    type: "Buffer";
                    data: number[];
                };
                equals: (otherBuffer: Uint8Array) => boolean;
                compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                writeUintLE: (value: number, offset: number, byteLength: number) => number;
                writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                writeUintBE: (value: number, offset: number, byteLength: number) => number;
                writeIntLE: (value: number, offset: number, byteLength: number) => number;
                writeIntBE: (value: number, offset: number, byteLength: number) => number;
                readBigUInt64BE: (offset?: number | undefined) => bigint;
                readBigUint64BE: (offset?: number | undefined) => bigint;
                readBigUInt64LE: (offset?: number | undefined) => bigint;
                readBigUint64LE: (offset?: number | undefined) => bigint;
                readBigInt64BE: (offset?: number | undefined) => bigint;
                readBigInt64LE: (offset?: number | undefined) => bigint;
                readUIntLE: (offset: number, byteLength: number) => number;
                readUintLE: (offset: number, byteLength: number) => number;
                readUIntBE: (offset: number, byteLength: number) => number;
                readUintBE: (offset: number, byteLength: number) => number;
                readIntLE: (offset: number, byteLength: number) => number;
                readIntBE: (offset: number, byteLength: number) => number;
                readUInt8: (offset?: number | undefined) => number;
                readUint8: (offset?: number | undefined) => number;
                readUInt16LE: (offset?: number | undefined) => number;
                readUint16LE: (offset?: number | undefined) => number;
                readUInt16BE: (offset?: number | undefined) => number;
                readUint16BE: (offset?: number | undefined) => number;
                readUInt32LE: (offset?: number | undefined) => number;
                readUint32LE: (offset?: number | undefined) => number;
                readUInt32BE: (offset?: number | undefined) => number;
                readUint32BE: (offset?: number | undefined) => number;
                readInt8: (offset?: number | undefined) => number;
                readInt16LE: (offset?: number | undefined) => number;
                readInt16BE: (offset?: number | undefined) => number;
                readInt32LE: (offset?: number | undefined) => number;
                readInt32BE: (offset?: number | undefined) => number;
                readFloatLE: (offset?: number | undefined) => number;
                readFloatBE: (offset?: number | undefined) => number;
                readDoubleLE: (offset?: number | undefined) => number;
                readDoubleBE: (offset?: number | undefined) => number;
                reverse: () => Buffer;
                swap16: () => Buffer;
                swap32: () => Buffer;
                swap64: () => Buffer;
                writeUInt8: (value: number, offset?: number | undefined) => number;
                writeUint8: (value: number, offset?: number | undefined) => number;
                writeUInt16LE: (value: number, offset?: number | undefined) => number;
                writeUint16LE: (value: number, offset?: number | undefined) => number;
                writeUInt16BE: (value: number, offset?: number | undefined) => number;
                writeUint16BE: (value: number, offset?: number | undefined) => number;
                writeUInt32LE: (value: number, offset?: number | undefined) => number;
                writeUint32LE: (value: number, offset?: number | undefined) => number;
                writeUInt32BE: (value: number, offset?: number | undefined) => number;
                writeUint32BE: (value: number, offset?: number | undefined) => number;
                writeInt8: (value: number, offset?: number | undefined) => number;
                writeInt16LE: (value: number, offset?: number | undefined) => number;
                writeInt16BE: (value: number, offset?: number | undefined) => number;
                writeInt32LE: (value: number, offset?: number | undefined) => number;
                writeInt32BE: (value: number, offset?: number | undefined) => number;
                writeFloatLE: (value: number, offset?: number | undefined) => number;
                writeFloatBE: (value: number, offset?: number | undefined) => number;
                writeDoubleLE: (value: number, offset?: number | undefined) => number;
                writeDoubleBE: (value: number, offset?: number | undefined) => number;
                fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                entries: () => IterableIterator<[number, number]>;
                includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                keys: () => IterableIterator<number>;
                values: () => IterableIterator<number>;
                readonly BYTES_PER_ELEMENT: number;
                readonly buffer: {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                    readonly [Symbol.toStringTag]: string;
                } | {
                    readonly byteLength: number;
                    slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                    readonly [Symbol.species]: SharedArrayBuffer;
                    readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                };
                readonly byteLength: number;
                readonly byteOffset: number;
                copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                join: (separator?: string | undefined) => string;
                readonly length: number;
                map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                reduce: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                };
                reduceRight: {
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                    (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                    <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                };
                set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                toLocaleString: () => string;
                valueOf: () => Uint8Array;
                at: (index: number) => number | undefined;
                findLast: {
                    <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                    (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                };
                findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                [Symbol.iterator]: () => IterableIterator<number>;
                readonly [Symbol.toStringTag]: "Uint8Array";
            };
            generationTime: number;
            toHexString: () => string;
            toString: (format?: string | undefined) => string;
            toJSON: () => string;
            equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
            getTimestamp: () => Date;
            inspect: () => string;
        };
        _partition: string;
        addTime: {
            toString: () => string;
            toDateString: () => string;
            toTimeString: () => string;
            toLocaleString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            toLocaleDateString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            toLocaleTimeString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            valueOf: () => number;
            getTime: () => number;
            getFullYear: () => number;
            getUTCFullYear: () => number;
            getMonth: () => number;
            getUTCMonth: () => number;
            getDate: () => number;
            getUTCDate: () => number;
            getDay: () => number;
            getUTCDay: () => number;
            getHours: () => number;
            getUTCHours: () => number;
            getMinutes: () => number;
            getUTCMinutes: () => number;
            getSeconds: () => number;
            getUTCSeconds: () => number;
            getMilliseconds: () => number;
            getUTCMilliseconds: () => number;
            getTimezoneOffset: () => number;
            setTime: (time: number) => number;
            setMilliseconds: (ms: number) => number;
            setUTCMilliseconds: (ms: number) => number;
            setSeconds: (sec: number, ms?: number | undefined) => number;
            setUTCSeconds: (sec: number, ms?: number | undefined) => number;
            setMinutes: (min: number, sec?: number | undefined, ms?: number | undefined) => number;
            setUTCMinutes: (min: number, sec?: number | undefined, ms?: number | undefined) => number;
            setHours: (hours: number, min?: number | undefined, sec?: number | undefined, ms?: number | undefined) => number;
            setUTCHours: (hours: number, min?: number | undefined, sec?: number | undefined, ms?: number | undefined) => number;
            setDate: (date: number) => number;
            setUTCDate: (date: number) => number;
            setMonth: (month: number, date?: number | undefined) => number;
            setUTCMonth: (month: number, date?: number | undefined) => number;
            setFullYear: (year: number, month?: number | undefined, date?: number | undefined) => number;
            setUTCFullYear: (year: number, month?: number | undefined, date?: number | undefined) => number;
            toUTCString: () => string;
            toISOString: () => string;
            toJSON: (key?: any) => string;
            getVarDate: () => VarDate;
            [Symbol.toPrimitive]: {
                (hint: "default"): string;
                (hint: "string"): string;
                (hint: "number"): number;
                (hint: string): string | number;
            };
        };
        feed: {
            _id: string | {
                _bsontype: "ObjectID";
                id: {
                    [x: number]: number;
                    write: {
                        (string: string, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                    };
                    toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                    toJSON: () => {
                        type: "Buffer";
                        data: number[];
                    };
                    equals: (otherBuffer: Uint8Array) => boolean;
                    compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                    copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                    slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                    subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                    writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                    writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeUintLE: (value: number, offset: number, byteLength: number) => number;
                    writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                    writeUintBE: (value: number, offset: number, byteLength: number) => number;
                    writeIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeIntBE: (value: number, offset: number, byteLength: number) => number;
                    readBigUInt64BE: (offset?: number | undefined) => bigint;
                    readBigUint64BE: (offset?: number | undefined) => bigint;
                    readBigUInt64LE: (offset?: number | undefined) => bigint;
                    readBigUint64LE: (offset?: number | undefined) => bigint;
                    readBigInt64BE: (offset?: number | undefined) => bigint;
                    readBigInt64LE: (offset?: number | undefined) => bigint;
                    readUIntLE: (offset: number, byteLength: number) => number;
                    readUintLE: (offset: number, byteLength: number) => number;
                    readUIntBE: (offset: number, byteLength: number) => number;
                    readUintBE: (offset: number, byteLength: number) => number;
                    readIntLE: (offset: number, byteLength: number) => number;
                    readIntBE: (offset: number, byteLength: number) => number;
                    readUInt8: (offset?: number | undefined) => number;
                    readUint8: (offset?: number | undefined) => number;
                    readUInt16LE: (offset?: number | undefined) => number;
                    readUint16LE: (offset?: number | undefined) => number;
                    readUInt16BE: (offset?: number | undefined) => number;
                    readUint16BE: (offset?: number | undefined) => number;
                    readUInt32LE: (offset?: number | undefined) => number;
                    readUint32LE: (offset?: number | undefined) => number;
                    readUInt32BE: (offset?: number | undefined) => number;
                    readUint32BE: (offset?: number | undefined) => number;
                    readInt8: (offset?: number | undefined) => number;
                    readInt16LE: (offset?: number | undefined) => number;
                    readInt16BE: (offset?: number | undefined) => number;
                    readInt32LE: (offset?: number | undefined) => number;
                    readInt32BE: (offset?: number | undefined) => number;
                    readFloatLE: (offset?: number | undefined) => number;
                    readFloatBE: (offset?: number | undefined) => number;
                    readDoubleLE: (offset?: number | undefined) => number;
                    readDoubleBE: (offset?: number | undefined) => number;
                    reverse: () => Buffer;
                    swap16: () => Buffer;
                    swap32: () => Buffer;
                    swap64: () => Buffer;
                    writeUInt8: (value: number, offset?: number | undefined) => number;
                    writeUint8: (value: number, offset?: number | undefined) => number;
                    writeUInt16LE: (value: number, offset?: number | undefined) => number;
                    writeUint16LE: (value: number, offset?: number | undefined) => number;
                    writeUInt16BE: (value: number, offset?: number | undefined) => number;
                    writeUint16BE: (value: number, offset?: number | undefined) => number;
                    writeUInt32LE: (value: number, offset?: number | undefined) => number;
                    writeUint32LE: (value: number, offset?: number | undefined) => number;
                    writeUInt32BE: (value: number, offset?: number | undefined) => number;
                    writeUint32BE: (value: number, offset?: number | undefined) => number;
                    writeInt8: (value: number, offset?: number | undefined) => number;
                    writeInt16LE: (value: number, offset?: number | undefined) => number;
                    writeInt16BE: (value: number, offset?: number | undefined) => number;
                    writeInt32LE: (value: number, offset?: number | undefined) => number;
                    writeInt32BE: (value: number, offset?: number | undefined) => number;
                    writeFloatLE: (value: number, offset?: number | undefined) => number;
                    writeFloatBE: (value: number, offset?: number | undefined) => number;
                    writeDoubleLE: (value: number, offset?: number | undefined) => number;
                    writeDoubleBE: (value: number, offset?: number | undefined) => number;
                    fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                    indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    entries: () => IterableIterator<[number, number]>;
                    includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                    keys: () => IterableIterator<number>;
                    values: () => IterableIterator<number>;
                    readonly BYTES_PER_ELEMENT: number;
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: string;
                    } | {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                        readonly [Symbol.species]: SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                    every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                    find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                    findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                    forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                    join: (separator?: string | undefined) => string;
                    readonly length: number;
                    map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                    reduce: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                    };
                    reduceRight: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                    };
                    set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                    some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                    toLocaleString: () => string;
                    valueOf: () => Uint8Array;
                    at: (index: number) => number | undefined;
                    findLast: {
                        <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                        (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                    };
                    findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                    [Symbol.iterator]: () => IterableIterator<number>;
                    readonly [Symbol.toStringTag]: "Uint8Array";
                };
                generationTime: number;
                toHexString: () => string;
                toString: (format?: string | undefined) => string;
                toJSON: () => string;
                equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
                getTimestamp: () => Date;
                inspect: () => string;
            };
            id: string | {
                _bsontype: "ObjectID";
                id: {
                    [x: number]: number;
                    write: {
                        (string: string, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, encoding?: BufferEncoding | undefined): number;
                        (string: string, offset: number, length: number, encoding?: BufferEncoding | undefined): number;
                    };
                    toString: (encoding?: BufferEncoding | undefined, start?: number | undefined, end?: number | undefined) => string;
                    toJSON: () => {
                        type: "Buffer";
                        data: number[];
                    };
                    equals: (otherBuffer: Uint8Array) => boolean;
                    compare: (target: Uint8Array, targetStart?: number | undefined, targetEnd?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => 0 | 1 | -1;
                    copy: (target: Uint8Array, targetStart?: number | undefined, sourceStart?: number | undefined, sourceEnd?: number | undefined) => number;
                    slice: (start?: number | undefined, end?: number | undefined) => Buffer;
                    subarray: (start?: number | undefined, end?: number | undefined) => Buffer;
                    writeBigInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64BE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUInt64LE: (value: bigint, offset?: number | undefined) => number;
                    writeBigUint64LE: (value: bigint, offset?: number | undefined) => number;
                    writeUIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeUintLE: (value: number, offset: number, byteLength: number) => number;
                    writeUIntBE: (value: number, offset: number, byteLength: number) => number;
                    writeUintBE: (value: number, offset: number, byteLength: number) => number;
                    writeIntLE: (value: number, offset: number, byteLength: number) => number;
                    writeIntBE: (value: number, offset: number, byteLength: number) => number;
                    readBigUInt64BE: (offset?: number | undefined) => bigint;
                    readBigUint64BE: (offset?: number | undefined) => bigint;
                    readBigUInt64LE: (offset?: number | undefined) => bigint;
                    readBigUint64LE: (offset?: number | undefined) => bigint;
                    readBigInt64BE: (offset?: number | undefined) => bigint;
                    readBigInt64LE: (offset?: number | undefined) => bigint;
                    readUIntLE: (offset: number, byteLength: number) => number;
                    readUintLE: (offset: number, byteLength: number) => number;
                    readUIntBE: (offset: number, byteLength: number) => number;
                    readUintBE: (offset: number, byteLength: number) => number;
                    readIntLE: (offset: number, byteLength: number) => number;
                    readIntBE: (offset: number, byteLength: number) => number;
                    readUInt8: (offset?: number | undefined) => number;
                    readUint8: (offset?: number | undefined) => number;
                    readUInt16LE: (offset?: number | undefined) => number;
                    readUint16LE: (offset?: number | undefined) => number;
                    readUInt16BE: (offset?: number | undefined) => number;
                    readUint16BE: (offset?: number | undefined) => number;
                    readUInt32LE: (offset?: number | undefined) => number;
                    readUint32LE: (offset?: number | undefined) => number;
                    readUInt32BE: (offset?: number | undefined) => number;
                    readUint32BE: (offset?: number | undefined) => number;
                    readInt8: (offset?: number | undefined) => number;
                    readInt16LE: (offset?: number | undefined) => number;
                    readInt16BE: (offset?: number | undefined) => number;
                    readInt32LE: (offset?: number | undefined) => number;
                    readInt32BE: (offset?: number | undefined) => number;
                    readFloatLE: (offset?: number | undefined) => number;
                    readFloatBE: (offset?: number | undefined) => number;
                    readDoubleLE: (offset?: number | undefined) => number;
                    readDoubleBE: (offset?: number | undefined) => number;
                    reverse: () => Buffer;
                    swap16: () => Buffer;
                    swap32: () => Buffer;
                    swap64: () => Buffer;
                    writeUInt8: (value: number, offset?: number | undefined) => number;
                    writeUint8: (value: number, offset?: number | undefined) => number;
                    writeUInt16LE: (value: number, offset?: number | undefined) => number;
                    writeUint16LE: (value: number, offset?: number | undefined) => number;
                    writeUInt16BE: (value: number, offset?: number | undefined) => number;
                    writeUint16BE: (value: number, offset?: number | undefined) => number;
                    writeUInt32LE: (value: number, offset?: number | undefined) => number;
                    writeUint32LE: (value: number, offset?: number | undefined) => number;
                    writeUInt32BE: (value: number, offset?: number | undefined) => number;
                    writeUint32BE: (value: number, offset?: number | undefined) => number;
                    writeInt8: (value: number, offset?: number | undefined) => number;
                    writeInt16LE: (value: number, offset?: number | undefined) => number;
                    writeInt16BE: (value: number, offset?: number | undefined) => number;
                    writeInt32LE: (value: number, offset?: number | undefined) => number;
                    writeInt32BE: (value: number, offset?: number | undefined) => number;
                    writeFloatLE: (value: number, offset?: number | undefined) => number;
                    writeFloatBE: (value: number, offset?: number | undefined) => number;
                    writeDoubleLE: (value: number, offset?: number | undefined) => number;
                    writeDoubleBE: (value: number, offset?: number | undefined) => number;
                    fill: (value: string | number | Uint8Array, offset?: number | undefined, end?: number | undefined, encoding?: BufferEncoding | undefined) => Buffer;
                    indexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    lastIndexOf: (value: string | number | Uint8Array, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => number;
                    entries: () => IterableIterator<[number, number]>;
                    includes: (value: string | number | Buffer, byteOffset?: number | undefined, encoding?: BufferEncoding | undefined) => boolean;
                    keys: () => IterableIterator<number>;
                    values: () => IterableIterator<number>;
                    readonly BYTES_PER_ELEMENT: number;
                    readonly buffer: {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => ArrayBuffer;
                        readonly [Symbol.toStringTag]: string;
                    } | {
                        readonly byteLength: number;
                        slice: (begin: number, end?: number | undefined) => SharedArrayBuffer;
                        readonly [Symbol.species]: SharedArrayBuffer;
                        readonly [Symbol.toStringTag]: "SharedArrayBuffer";
                    };
                    readonly byteLength: number;
                    readonly byteOffset: number;
                    copyWithin: (target: number, start?: number | undefined, end?: number | undefined) => Buffer;
                    every: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    filter: (predicate: (value: number, index: number, array: Uint8Array) => any, thisArg?: any) => Uint8Array;
                    find: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number | undefined;
                    findIndex: (predicate: (value: number, index: number, obj: Uint8Array) => boolean, thisArg?: any) => number;
                    forEach: (callbackfn: (value: number, index: number, array: Uint8Array) => void, thisArg?: any) => void;
                    join: (separator?: string | undefined) => string;
                    readonly length: number;
                    map: (callbackfn: (value: number, index: number, array: Uint8Array) => number, thisArg?: any) => Uint8Array;
                    reduce: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Uint8Array) => U, initialValue: U): U;
                    };
                    reduceRight: {
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number): number;
                        (callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Uint8Array) => number, initialValue: number): number;
                        <U_1>(callbackfn: (previousValue: U_1, currentValue: number, currentIndex: number, array: Uint8Array) => U_1, initialValue: U_1): U_1;
                    };
                    set: (array: ArrayLike<number>, offset?: number | undefined) => void;
                    some: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => boolean;
                    sort: (compareFn?: ((a: number, b: number) => number) | undefined) => Buffer;
                    toLocaleString: () => string;
                    valueOf: () => Uint8Array;
                    at: (index: number) => number | undefined;
                    findLast: {
                        <S extends number>(predicate: (value: number, index: number, array: Uint8Array) => value is S, thisArg?: any): S | undefined;
                        (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any): number | undefined;
                    };
                    findLastIndex: (predicate: (value: number, index: number, array: Uint8Array) => unknown, thisArg?: any) => number;
                    [Symbol.iterator]: () => IterableIterator<number>;
                    readonly [Symbol.toStringTag]: "Uint8Array";
                };
                generationTime: number;
                toHexString: () => string;
                toString: (format?: string | undefined) => string;
                toJSON: () => string;
                equals: (otherId: string | ObjectID | ObjectIdLike) => boolean;
                getTimestamp: () => Date;
                inspect: () => string;
            };
            _partition: string;
            name: string;
            count: number;
            color?: string | undefined;
            url: string;
            initialize: (object: IFeedDraft) => Feed;
        };
        feedTime: {
            toString: () => string;
            toDateString: () => string;
            toTimeString: () => string;
            toLocaleString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            toLocaleDateString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            toLocaleTimeString: {
                (): string;
                (locales?: string | string[] | undefined, options?: Intl.DateTimeFormatOptions | undefined): string;
                (locales?: Intl.LocalesArgument, options?: Intl.DateTimeFormatOptions | undefined): string;
            };
            valueOf: () => number;
            getTime: () => number;
            getFullYear: () => number;
            getUTCFullYear: () => number;
            getMonth: () => number;
            getUTCMonth: () => number;
            getDate: () => number;
            getUTCDate: () => number;
            getDay: () => number;
            getUTCDay: () => number;
            getHours: () => number;
            getUTCHours: () => number;
            getMinutes: () => number;
            getUTCMinutes: () => number;
            getSeconds: () => number;
            getUTCSeconds: () => number;
            getMilliseconds: () => number;
            getUTCMilliseconds: () => number;
            getTimezoneOffset: () => number;
            setTime: (time: number) => number;
            setMilliseconds: (ms: number) => number;
            setUTCMilliseconds: (ms: number) => number;
            setSeconds: (sec: number, ms?: number | undefined) => number;
            setUTCSeconds: (sec: number, ms?: number | undefined) => number;
            setMinutes: (min: number, sec?: number | undefined, ms?: number | undefined) => number;
            setUTCMinutes: (min: number, sec?: number | undefined, ms?: number | undefined) => number;
            setHours: (hours: number, min?: number | undefined, sec?: number | undefined, ms?: number | undefined) => number;
            setUTCHours: (hours: number, min?: number | undefined, sec?: number | undefined, ms?: number | undefined) => number;
            setDate: (date: number) => number;
            setUTCDate: (date: number) => number;
            setMonth: (month: number, date?: number | undefined) => number;
            setUTCMonth: (month: number, date?: number | undefined) => number;
            setFullYear: (year: number, month?: number | undefined, date?: number | undefined) => number;
            setUTCFullYear: (year: number, month?: number | undefined, date?: number | undefined) => number;
            toUTCString: () => string;
            toISOString: () => string;
            toJSON: (key?: any) => string;
            getVarDate: () => VarDate;
            [Symbol.toPrimitive]: {
                (hint: "default"): string;
                (hint: "string"): string;
                (hint: "number"): number;
                (hint: string): string | number;
            };
        };
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
        initialize: (object: IFeedEntityDraft) => FeedEntity;
        fromPaper: (paperEntity: PaperEntity) => void;
    }[];
    getStates(): Store<string, IUIStateServiceState>;
    resetStates(): void;
}

declare class UpgradeService extends Eventable<IUpgradeServiceState> {
    constructor();
    checkForUpdates(): void;
    currentVersion(): string;
}

declare const urlUtils_2: {
    getProtocol: typeof getProtocol;
    hasProtocol: typeof hasProtocol;
    eraseProtocol: typeof eraseProtocol;
    getFileType: typeof getFileType;
    constructFileURL: typeof constructFileURL;
    listAllFiles: typeof listAllFiles;
    isLocalPath: typeof isLocalPath;
};
export { urlUtils_2 as urlUtils }

declare interface WindowOptions extends Electron.BrowserWindowConstructorOptions {
    entry: string;
}

declare class WindowProcessManagementService extends Eventable<IWindowProcessManagementServiceState> {
    private readonly _preferenceService;
    browserWindows: WindowStorage;
    constructor(_preferenceService: PreferenceService);
    /**
     * Create Process with a BrowserWindow
     * @param id - window id
     * @param options - window options
     * @param eventCallbacks - callbacks for events
     */
    create(id: string, options: WindowOptions, eventCallbacks?: Record<string, (win: BrowserWindow) => void>): void;
    createMainRenderer(): void;
    createQuickpasteRenderer(): void;
    /**
     * Fire the serviceReady event. This event is fired when the service of the window is ready to be used by other processes.
     * @param windowId - The id of the window that fires the event
     */
    fireServiceReady(windowId: string): void;
    /**
     * Show the window with the given id.
     * @param windowId - The id of the window to be shown
     */
    show(windowId: string): void;
    /**
     * Hide the window with the given id.
     * @param windowId - The id of the window to be hidden
     */
    hide(windowId: string): void;
    /**
     * Minimize the window with the given id.
     */
    minimize(windowId: string): void;
    /**
     * Maximize the window with the given id.
     */
    maximize(windowId: string): void;
    /**
     * Close the window with the given id.
     */
    close(windowId: string): void;
    /**
     * Force close the window with the given id.
     */
    forceClose(windowId: string): void;
    /**
     * Change the theme of the app.
     * @param theme - The theme to be changed to
     */
    changeTheme(theme: APPTheme): void;
    /**
     * Check if the app is in dark mode.
     * @returns - Whether the app is in dark mode
     */
    isDarkMode(): boolean;
    /**
     * Resize the window with the given id.
     */
    resize(windowId: string, width: number, height: number): void;
    /**
     * Get the size of the screen.
     * @returns - The size of the screen
     */
    getScreenSize(): {
        width: number;
        height: number;
    };
    private _constructEntryURL;
    private _setNonMacSpecificStyles;
}

declare class WindowStorage {
    private readonly _windows;
    private readonly _wId2Id;
    constructor();
    get(id: string | number): BrowserWindow;
    getRealId(id: string | number): string;
    all(): Record<string, BrowserWindow>;
    set(id: string, window: BrowserWindow): void;
    destroy(id: string | number): void;
    has(id: string | number): boolean;
}

export { }
