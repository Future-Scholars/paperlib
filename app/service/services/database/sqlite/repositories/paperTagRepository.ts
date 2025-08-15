import sqlite3 from 'sqlite3';
import { RelationshipRepository } from '../relationship-repository';

export class PaperTagRepository extends RelationshipRepository {
  constructor(db: sqlite3.Database) {
    super(db, 'paper_tags');
  }

  // Get all tags for a paper
  async getTagsForPaper(paperId: string): Promise<string[]> {
    return this.getActiveRelationships(paperId);
  }

  // Get all papers for a tag
  async getPapersForTag(tagId: string): Promise<string[]> {
    // We need to swap the entity and related ID fields for this query
    const rows = await this.dbAll(
      `SELECT paperId, op, timestamp, deviceId
       FROM paper_tags
       WHERE tagId = ?
       ORDER BY timestamp ASC`,
      [tagId]
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

  // Add tag to paper
  async addTagToPaper(paperId: string, tagId: string, deviceId: string): Promise<void> {
    await this.addRelationship(paperId, tagId, deviceId);
  }

  // Remove tag from paper
  async removeTagFromPaper(paperId: string, tagId: string, deviceId: string): Promise<void> {
    await this.removeRelationship(paperId, tagId, deviceId);
  }

  // Check if tag is assigned to paper
  async isTagAssignedToPaper(paperId: string, tagId: string): Promise<boolean> {
    const tags = await this.getTagsForPaper(paperId);
    return tags.includes(tagId);
  }

  // Get tag count for paper
  async getTagCountForPaper(paperId: string): Promise<number> {
    const tags = await this.getTagsForPaper(paperId);
    return tags.length;
  }

  // Get papers with tag count
  async getPapersWithTagCount(libraryId?: string): Promise<{ paperId: string; tagCount: number }[]> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'JOIN papers p ON pt.paperId = p.id WHERE p.libraryId = ?';
      params.push(libraryId);
    }
    
    const rows = await this.dbAll(
      `SELECT pt.paperId, COUNT(CASE WHEN pt.op = 'add' THEN 1 END) - COUNT(CASE WHEN pt.op = 'remove' THEN 1 END) as tagCount
       FROM paper_tags pt
       ${whereClause}
       GROUP BY pt.paperId
       HAVING tagCount > 0`,
      params
    );
    
    return rows.map(row => ({
      paperId: row.paperId,
      tagCount: row.tagCount
    }));
  }

  // Get tag statistics
  async getTagStatistics(libraryId?: string): Promise<{
    totalTags: number;
    papersWithTags: number;
    averageTagsPerPaper: number;
    mostUsedTags: { tagId: string; paperCount: number }[];
  }> {
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'JOIN papers p ON pt.paperId = p.id WHERE p.libraryId = ?';
      params.push(libraryId);
    }
    
    // Total unique tags
    const totalTagsRow = await this.dbGet(
      `SELECT COUNT(DISTINCT pt.tagId) as total
       FROM paper_tags pt
       ${whereClause}`,
      params
    );
    const totalTags = totalTagsRow.total;
    
    // Papers with tags
    const papersWithTagsRow = await this.dbGet(
      `SELECT COUNT(DISTINCT pt.paperId) as total
       FROM paper_tags pt
       ${whereClause}
       GROUP BY pt.paperId
       HAVING COUNT(CASE WHEN pt.op = 'add' THEN 1 END) - COUNT(CASE WHEN pt.op = 'remove' THEN 1 END) > 0`,
      params
    );
    const papersWithTags = papersWithTagsRow ? papersWithTagsRow.total : 0;
    
    // Average tags per paper
    const avgTagsRow = await this.dbGet(
      `SELECT AVG(tagCount) as average
       FROM (
         SELECT pt.paperId, COUNT(CASE WHEN pt.op = 'add' THEN 1 END) - COUNT(CASE WHEN pt.op = 'remove' THEN 1 END) as tagCount
         FROM paper_tags pt
         ${whereClause}
         GROUP BY pt.paperId
         HAVING tagCount > 0
       )`,
      params
    );
    const averageTagsPerPaper = avgTagsRow.average || 0;
    
    // Most used tags
    const mostUsedTagsRows = await this.dbAll(
      `SELECT pt.tagId, COUNT(DISTINCT pt.paperId) as paperCount
       FROM paper_tags pt
       ${whereClause}
       GROUP BY pt.tagId
       ORDER BY paperCount DESC
       LIMIT 10`,
      params
    );
    
    const mostUsedTags = mostUsedTagsRows.map(row => ({
      tagId: row.tagId,
      paperCount: row.paperCount
    }));
    
    return {
      totalTags,
      papersWithTags,
      averageTagsPerPaper,
      mostUsedTags
    };
  }

  // Get papers by multiple tags (AND logic)
  async getPapersByTags(tagIds: string[], libraryId?: string): Promise<string[]> {
    if (tagIds.length === 0) return [];
    
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'JOIN papers p ON pt.paperId = p.id WHERE p.libraryId = ?';
      params.push(libraryId);
    }
    
    const tagConditions = tagIds.map(() => 'pt.tagId = ?').join(' AND ');
    whereClause += whereClause ? ` AND (${tagConditions})` : `WHERE (${tagConditions})`;
    params.push(...tagIds);
    
    const rows = await this.dbAll(
      `SELECT pt.paperId, COUNT(DISTINCT pt.tagId) as matchedTags
       FROM paper_tags pt
       ${whereClause}
       GROUP BY pt.paperId
       HAVING matchedTags = ?`,
      [...params, tagIds.length]
    );
    
    return rows.map(row => row.paperId);
  }

  // Get papers by any of the tags (OR logic)
  async getPapersByAnyTags(tagIds: string[], libraryId?: string): Promise<string[]> {
    if (tagIds.length === 0) return [];
    
    let whereClause = '';
    const params: any[] = [];
    
    if (libraryId) {
      whereClause = 'JOIN papers p ON pt.paperId = p.id WHERE p.libraryId = ?';
      params.push(libraryId);
    }
    
    const tagConditions = tagIds.map(() => 'pt.tagId = ?').join(' OR ');
    whereClause += whereClause ? ` AND (${tagConditions})` : `WHERE (${tagConditions})`;
    params.push(...tagIds);
    
    const rows = await this.dbAll(
      `SELECT DISTINCT pt.paperId
       FROM paper_tags pt
       ${whereClause}`,
      params
    );
    
    return rows.map(row => row.paperId);
  }

  // Implementation of abstract methods
  protected getEntityIdField(): string {
    return 'paperId';
  }

  protected getRelatedIdField(): string {
    return 'tagId';
  }
}

