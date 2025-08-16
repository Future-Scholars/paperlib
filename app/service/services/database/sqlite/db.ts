import { Dialect, Kysely, SqliteDialect } from "kysely";
import SQLite from 'better-sqlite3'
import { 
  Paper,
  PaperFieldVersion,
  Author,
  AuthorFieldVersion,
  Tag,
  TagFieldVersion,
  Folder,
  FolderFieldVersion,
  Supplement, 
  SupplementFieldVersion, 
  Library, 
  LibraryFieldVersion, 
  Feed, 
  PaperAuthor, 
  PaperTag, 
  PaperFolder,
  LibraryShare,
  FeedFieldVersion,
} from "./models";

interface Database {
  paper: Paper;
  author: Author;
  tag: Tag;
  folder: Folder;
  supplement: Supplement;
  library: Library;
  feed: Feed;
  libraryShare: LibraryShare;
  paperAuthor: PaperAuthor;
  paperTag: PaperTag;
  paperFolder: PaperFolder;
  authorFieldVersion: AuthorFieldVersion;
  tagFieldVersion: TagFieldVersion;
  folderFieldVersion: FolderFieldVersion;
  supplementFieldVersion: SupplementFieldVersion;
  libraryFieldVersion: LibraryFieldVersion;
  feedFieldVersion: FeedFieldVersion;
  paperFieldVersion: PaperFieldVersion;
}

const dialect: Dialect = new SqliteDialect({
  database: new SQLite("betcat.db")
})

export const db = new Kysely<Database>({
  dialect,
})