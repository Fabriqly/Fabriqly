import pool from '@/lib/mysql';

export class MySQLService {
  // Get single row
  static async getOne(query: string, params: any[] = []) {
    const [rows] = await pool.execute(query, params);
    return (rows as any[])[0] || null;
  }

  // Get multiple rows
  static async getMany(query: string, params: any[] = []) {
    const [rows] = await pool.execute(query, params);
    return rows as any[];
  }

  // Insert
  static async insert(query: string, params: any[]) {
    const [result] = await pool.execute(query, params);
    return result as any;
  }

  // Update
  static async update(query: string, params: any[]) {
    const [result] = await pool.execute(query, params);
    return result as any;
  }

  // Delete
  static async delete(query: string, params: any[]) {
    const [result] = await pool.execute(query, params);
    return result as any;
  }

  // Transaction
  static async transaction(callback: (connection: any) => Promise<any>) {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(connection);
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

