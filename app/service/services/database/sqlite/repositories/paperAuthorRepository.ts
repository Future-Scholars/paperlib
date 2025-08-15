import sqlite3 from 'sqlite3';
import { RelationshipRepository } from '../relationship-repository';

export class PaperAuthorRepository extends RelationshipRepository {
  constructor(db: sqlite3.Database) {
    super(db, 'paper_authors');
  }

  // Get all authors for a paper
  async getAuthorsForPaper(paperId: string): Promise<string[]> {
    return this.getActiveRelationships(paperId);
  }

  // Get all papers for an author
  async getPapersForAuthor(authorId: string): Promise<string[]> {
    // We need to swap the entity and related ID fields for this query
    const rows = await this.dbAll(
      `SELECT paperId, op, timestamp, deviceId
       FROM paper_authors
       WHERE authorId = ?
       ORDER BY timestamp ASC`,
      [authorId]
    );

    const relationships = new Map<string, { op: string; timestamp: Date; deviceId: string }>();
    
    for (const row of rows) {
      const paperId = row.paperId;
      const existing = relationships.get(paperId);
      
      if (!existing || row.timestamp > existing.timestamp) {
        relationships.set(paperId, {
          op: row.op,
          timestamp: new Date(row.timestamp),
          deviceId: row.deviceId
        });
      }
    }

    // Return only active (add) relationships
    return Array.from(relationships.entries())
      .filter(([_, info]) => info.op === 'add')
      .map(([paperId, _]) => paperId);
  }

  // Add author to paper
  async addAuthorToPaper(paperId: string, authorId: string, deviceId: string): Promise<void> {
    await this.addRelationship(paperId, authorId, deviceId);
  }

  // Remove author from paper
  async removeAuthorFromPaper(paperId: string, authorId: string, deviceId: string): Promise<void> {
    await this.removeRelationship(paperId, authorId, deviceId);
  }

  // Check if author is assigned to paper
  async isAuthorAssignedToPaper(paperId: string, authorId: string): Promise<boolean> {
    const authors = await this.getAuthorsForPaper(paperId);
    return authors.includes(authorId);
  }

  // Get author count for paper
  async getAuthorCountForPaper(paperId: string): Promise<number> {
    const authors = await this.getAuthorsForPaper(paperId);
    return authors.length;
  }

  // Get papers with author count
  async getPapersWithAuthorCount(libraryId?: string): Promise<{ paperId: string; authorCount: number }[]> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'JOIN papers p ON pa.paperId = p.id WHERE p.libraryId = ?';
      params.push(libraryId);
    }
    
    const rows = await this.dbAll(
      `SELECT pa.paperId, COUNT(CASE WHEN pa.op = 'add' THEN 1 END) - COUNT(CASE WHEN pa.op = 'remove' THEN 1 END) as authorCount
       FROM paper_authors pa
       ${whereClause}
       GROUP BY pa.paperId
       HAVING authorCount > 0`,
      params
    );
    
    return rows.map(row => ({
      paperId: row.paperId,
      authorCount: row.authorCount
    }));
  }

  // Get author statistics
  async getAuthorStatistics(libraryId?: string): Promise<{
    totalAuthors: number;
    papersWithAuthors: number;
    averageAuthorsPerPaper: number;
    mostCollaborativeAuthors: { authorId: string; paperCount: number }[];
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'JOIN papers p ON pa.paperId = p.id WHERE p.libraryId = ?';
      params.push(libraryId);
    }
    
    // Total unique authors
    const totalAuthorsRow = await this.dbGet(
      `SELECT COUNT(DISTINCT pa.authorId) as total
       FROM paper_authors pa
       ${whereClause}`,
      params
    );
    const totalAuthors = totalAuthorsRow.total;
    
    // Papers with authors
    const papersWithAuthorsRow = await this.dbGet(
      `SELECT COUNT(DISTINCT pa.paperId) as total
       FROM paper_authors pa
       ${whereClause}
       GROUP BY pa.paperId
       HAVING COUNT(CASE WHEN pa.op = 'add' THEN 1 END) - COUNT(CASE WHEN pa.op = 'remove' THEN 1 END) > 0`,
      params
    );
    const papersWithAuthors = papersWithAuthorsRow ? papersWithAuthorsRow.total : 0;
    
    // Average authors per paper
    const avgAuthorsRow = await this.dbGet(
      `SELECT AVG(authorCount) as average
       FROM (
         SELECT pa.paperId, COUNT(CASE WHEN pa.op = 'add' THEN 1 END) - COUNT(CASE WHEN pa.op = 'remove' THEN 1 END) as authorCount
         FROM paper_authors pa
         ${whereClause}
         GROUP BY pa.paperId
         HAVING authorCount > 0
       )`,
      params
    );
    const averageAuthorsPerPaper = avgAuthorsRow.average || 0;
    
    // Most collaborative authors
    const mostCollaborativeRows = await this.dbAll(
      `SELECT pa.authorId, COUNT(DISTINCT pa.paperId) as paperCount
       FROM paper_authors pa
       ${whereClause}
       GROUP BY pa.authorId
       ORDER BY paperCount DESC
       LIMIT 10`,
      params
    );
    
    const mostCollaborativeAuthors = mostCollaborativeRows.map(row => ({
      authorId: row.authorId,
      paperCount: row.paperCount
    }));
    
    return {
      totalAuthors,
      papersWithAuthors,
      averageAuthorsPerPaper,
      mostCollaborativeAuthors
    };
  }

  // Implementation of abstract methods
  protected getEntityIdField(): string {
    return 'paperId';
  }

  protected getRelatedIdField(): string {
    return 'authorId';
  }
}

