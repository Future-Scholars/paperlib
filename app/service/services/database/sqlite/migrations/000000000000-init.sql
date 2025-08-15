-- Initial migration for Paperlib SQLite database
-- Based on models defined in models.ts

-- DB version table
CREATE TABLE IF NOT EXISTS db_version (
  id TEXT PRIMARY KEY,
  version TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT NOT NULL
);

-- Papers table
CREATE TABLE IF NOT EXISTS papers (
  id TEXT PRIMARY KEY,
  libraryId TEXT NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  abstract TEXT,
  journal TEXT,
  booktitle TEXT,
  year INTEGER,
  month INTEGER,
  volume TEXT,
  number TEXT,
  pages TEXT,
  publisher TEXT,
  series TEXT,
  edition TEXT,
  editor TEXT,
  howPublished TEXT,
  organization TEXT,
  school TEXT,
  institution TEXT,
  address TEXT,
  doi TEXT,
  arxiv TEXT,
  isbn TEXT,
  issn TEXT,
  notes TEXT,
  flag INTEGER,
  read INTEGER,
  feedId TEXT,
  feedItemId TEXT,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Paper field versions table
CREATE TABLE IF NOT EXISTS paper_field_versions (
  id TEXT PRIMARY KEY,
  paperId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  hash TEXT,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  affiliation TEXT,
  email TEXT,
  orcid TEXT,
  firstName TEXT,
  lastName TEXT,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Author field versions table
CREATE TABLE IF NOT EXISTS author_field_versions (
  id TEXT PRIMARY KEY,
  authorId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Paper-Author relationship table
CREATE TABLE IF NOT EXISTS paper_authors (
  id TEXT PRIMARY KEY,
  paperId TEXT NOT NULL,
  authorId TEXT NOT NULL,
  op TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  colour TEXT,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Tag field versions table
CREATE TABLE IF NOT EXISTS tag_field_versions (
  id TEXT PRIMARY KEY,
  tagId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Paper-Tag relationship table
CREATE TABLE IF NOT EXISTS paper_tags (
  id TEXT PRIMARY KEY,
  paperId TEXT NOT NULL,
  tagId TEXT NOT NULL,
  op TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  parentId TEXT,
  libraryId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Folder field versions table
CREATE TABLE IF NOT EXISTS folder_field_versions (
  id TEXT PRIMARY KEY,
  folderId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Paper-Folder relationship table
CREATE TABLE IF NOT EXISTS paper_folders (
  id TEXT PRIMARY KEY,
  paperId TEXT NOT NULL,
  folderId TEXT NOT NULL,
  op TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Supplements table
CREATE TABLE IF NOT EXISTS supplements (
  id TEXT PRIMARY KEY,
  paperId TEXT NOT NULL,
  name TEXT NOT NULL,
  value TEXT NOT NULL,
  type TEXT NOT NULL,
  description TEXT,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Supplement field versions table
CREATE TABLE IF NOT EXISTS supplement_field_versions (
  id TEXT PRIMARY KEY,
  supplementId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Libraries table
CREATE TABLE IF NOT EXISTS libraries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ownedBy TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Library field versions table
CREATE TABLE IF NOT EXISTS library_field_versions (
  id TEXT PRIMARY KEY,
  libraryId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Library shares table
CREATE TABLE IF NOT EXISTS library_shares (
  id TEXT PRIMARY KEY,
  libraryId TEXT NOT NULL,
  userId TEXT NOT NULL,
  permission TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Feeds table
CREATE TABLE IF NOT EXISTS feeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  ownedBy TEXT NOT NULL,
  libraryId TEXT NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  updatedAt TEXT NOT NULL,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Feed field versions table
CREATE TABLE IF NOT EXISTS feed_field_versions (
  id TEXT PRIMARY KEY,
  feedId TEXT NOT NULL,
  field TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  deviceId TEXT NOT NULL,
  hash TEXT,
  createdAt TEXT NOT NULL,
  createdByDeviceId TEXT,
  deletedAt TEXT,
  deletedByDeviceId TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_papers_library_id ON papers(libraryId);
CREATE INDEX IF NOT EXISTS idx_papers_type ON papers(type);
CREATE INDEX IF NOT EXISTS idx_papers_year ON papers(year);
CREATE INDEX IF NOT EXISTS idx_papers_feed_id ON papers(feedId);
CREATE INDEX IF NOT EXISTS idx_papers_deleted_at ON papers(deletedAt);

CREATE INDEX IF NOT EXISTS idx_authors_name ON authors(name);
CREATE INDEX IF NOT EXISTS idx_authors_deleted_at ON authors(deletedAt);

CREATE INDEX IF NOT EXISTS idx_tags_name ON tags(name);
CREATE INDEX IF NOT EXISTS idx_tags_deleted_at ON tags(deletedAt);

CREATE INDEX IF NOT EXISTS idx_folders_library_id ON folders(libraryId);
CREATE INDEX IF NOT EXISTS idx_folders_parent_id ON folders(parentId);
CREATE INDEX IF NOT EXISTS idx_folders_deleted_at ON folders(deletedAt);

CREATE INDEX IF NOT EXISTS idx_supplements_paper_id ON supplements(paperId);
CREATE INDEX IF NOT EXISTS idx_supplements_type ON supplements(type);
CREATE INDEX IF NOT EXISTS idx_supplements_deleted_at ON supplements(deletedAt);

CREATE INDEX IF NOT EXISTS idx_libraries_owned_by ON libraries(ownedBy);
CREATE INDEX IF NOT EXISTS idx_libraries_deleted_at ON libraries(deletedAt);

CREATE INDEX IF NOT EXISTS idx_feeds_library_id ON feeds(libraryId);
CREATE INDEX IF NOT EXISTS idx_feeds_type ON feeds(type);
CREATE INDEX IF NOT EXISTS idx_feeds_deleted_at ON feeds(deletedAt);

CREATE INDEX IF NOT EXISTS idx_paper_authors_paper_id ON paper_authors(paperId);
CREATE INDEX IF NOT EXISTS idx_paper_authors_author_id ON paper_authors(authorId);

CREATE INDEX IF NOT EXISTS idx_paper_tags_paper_id ON paper_tags(paperId);
CREATE INDEX IF NOT EXISTS idx_paper_tags_tag_id ON paper_tags(tagId);

CREATE INDEX IF NOT EXISTS idx_paper_folders_paper_id ON paper_folders(paperId);
CREATE INDEX IF NOT EXISTS idx_paper_folders_folder_id ON paper_folders(folderId);

CREATE INDEX IF NOT EXISTS idx_library_shares_library_id ON library_shares(libraryId);
CREATE INDEX IF NOT EXISTS idx_library_shares_user_id ON library_shares(userId);

-- Additional indexes for field version tables
CREATE INDEX IF NOT EXISTS idx_paper_field_versions_paper_id ON paper_field_versions(paperId);
CREATE INDEX IF NOT EXISTS idx_paper_field_versions_field ON paper_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_paper_field_versions_timestamp ON paper_field_versions(timestamp);

CREATE INDEX IF NOT EXISTS idx_author_field_versions_author_id ON author_field_versions(authorId);
CREATE INDEX IF NOT EXISTS idx_author_field_versions_field ON author_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_author_field_versions_timestamp ON author_field_versions(timestamp);

CREATE INDEX IF NOT EXISTS idx_tag_field_versions_tag_id ON tag_field_versions(tagId);
CREATE INDEX IF NOT EXISTS idx_tag_field_versions_field ON tag_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_tag_field_versions_timestamp ON tag_field_versions(timestamp);

CREATE INDEX IF NOT EXISTS idx_folder_field_versions_folder_id ON folder_field_versions(folderId);
CREATE INDEX IF NOT EXISTS idx_folder_field_versions_field ON folder_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_folder_field_versions_timestamp ON folder_field_versions(timestamp);

CREATE INDEX IF NOT EXISTS idx_supplement_field_versions_supplement_id ON supplement_field_versions(supplementId);
CREATE INDEX IF NOT EXISTS idx_supplement_field_versions_field ON supplement_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_supplement_field_versions_timestamp ON supplement_field_versions(timestamp);

CREATE INDEX IF NOT EXISTS idx_library_field_versions_library_id ON library_field_versions(libraryId);
CREATE INDEX IF NOT EXISTS idx_library_field_versions_field ON library_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_library_field_versions_timestamp ON library_field_versions(timestamp);

CREATE INDEX IF NOT EXISTS idx_feed_field_versions_feed_id ON feed_field_versions(feedId);
CREATE INDEX IF NOT EXISTS idx_feed_field_versions_field ON feed_field_versions(field);
CREATE INDEX IF NOT EXISTS idx_feed_field_versions_timestamp ON feed_field_versions(timestamp);