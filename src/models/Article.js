// Model untuk tabel articles
const { query } = require('../config/database');

class Article {
  // Find article by ID
  static async findById(id) {
    const sql = `
      SELECT a.*, u.nama as author_name
      FROM articles a
      JOIN admin ad ON a.author_id = ad.id
      JOIN users u ON ad.user_id = u.id
      WHERE a.id = ?
    `;
    const results = await query(sql, [id]);
    return results[0] || null;
  }

  // Find article by slug
  static async findBySlug(slug) {
    const sql = `
      SELECT a.*, u.nama as author_name
      FROM articles a
      JOIN admin ad ON a.author_id = ad.id
      JOIN users u ON ad.user_id = u.id
      WHERE a.slug = ?
    `;
    const results = await query(sql, [slug]);
    return results[0] || null;
  }

  // Create new article
  static async create(articleData) {
    const { title, slug, content, excerpt, featured_image, author_id, status } = articleData;
    
    const sql = `
      INSERT INTO articles (title, slug, content, excerpt, featured_image, author_id, status, published_at) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const publishedAt = status === 'published' ? new Date() : null;
    const result = await query(sql, [title, slug, content, excerpt || null, featured_image || null, author_id, status || 'draft', publishedAt]);
    
    return {
      id: result.insertId,
      title,
      slug,
      content,
      excerpt,
      featured_image,
      author_id,
      status: status || 'draft',
      published_at: publishedAt
    };
  }

  // Update article
  static async update(id, articleData) {
    const { title, slug, content, excerpt, featured_image, status } = articleData;
    
    // Check if publishing for first time
    const article = await this.findById(id);
    let publishedAt = article.published_at;
    if (status === 'published' && !article.published_at) {
      publishedAt = new Date();
    }
    
    const sql = `
      UPDATE articles 
      SET title = ?, slug = ?, content = ?, excerpt = ?, featured_image = ?, status = ?, published_at = ?
      WHERE id = ?
    `;
    await query(sql, [title, slug, content, excerpt || null, featured_image || null, status, publishedAt, id]);
    
    return this.findById(id);
  }

  // Get all published articles
  static async findPublished(limit = 10) {
    const sql = `
      SELECT a.*, u.nama as author_name
      FROM articles a
      JOIN admin ad ON a.author_id = ad.id
      JOIN users u ON ad.user_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT ${parseInt(limit)}
    `;
    return query(sql);
  }

  // Get published articles with pagination
  static async findPublishedWithPagination(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const sql = `
      SELECT a.*, u.nama as author_name
      FROM articles a
      JOIN admin ad ON a.author_id = ad.id
      JOIN users u ON ad.user_id = u.id
      WHERE a.status = 'published'
      ORDER BY a.published_at DESC
      LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}
    `;
    return query(sql);
  }

  // Get all articles (for admin)
  static async findAll() {
    const sql = `
      SELECT a.*, u.nama as author_name
      FROM articles a
      JOIN admin ad ON a.author_id = ad.id
      JOIN users u ON ad.user_id = u.id
      ORDER BY a.created_at DESC
    `;
    return query(sql);
  }

  // Count articles
  static async count(status = null) {
    let sql = 'SELECT COUNT(*) as count FROM articles';
    const params = [];
    
    if (status) {
      sql += ' WHERE status = ?';
      params.push(status);
    }
    
    const results = await query(sql, params);
    return results[0].count;
  }

  // Delete article
  static async delete(id) {
    const sql = 'DELETE FROM articles WHERE id = ?';
    await query(sql, [id]);
    return true;
  }

  // Generate slug from title
  static generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  // Check if slug exists
  static async slugExists(slug, excludeId = null) {
    let sql = 'SELECT id FROM articles WHERE slug = ?';
    const params = [slug];
    
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    
    const results = await query(sql, params);
    return results.length > 0;
  }
}

module.exports = Article;
