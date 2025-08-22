const { run, get, all } = require("../config/database");

class Task {
    static async create(taskData) {
        const { title, description, assigned_to, assigned_by, priority, due_date, status } = taskData;
        
        const sql = `
            INSERT INTO tasks (title, description, assigned_to, assigned_by, priority, due_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        const params = [title, description, assigned_to, assigned_by, priority || 'medium', due_date, status || 'pending'];
        
        try {
            const result = await run(sql, params);
            return { id: result.id, ...taskData };
        } catch (error) {
            throw new Error(`Failed to create task: ${error.message}`);
        }
    }

    static async findById(id) {
        const sql = `
            SELECT t.*, 
                   ua.staff_id as assigned_by_staff,
                   uu.staff_id as assigned_to_staff
            FROM tasks t
            LEFT JOIN users ua ON ua.id = t.assigned_by
            LEFT JOIN users uu ON uu.id = t.assigned_to
            WHERE t.id = ?
        `;
        
        try {
            return await get(sql, [id]);
        } catch (error) {
            throw new Error(`Failed to find task: ${error.message}`);
        }
    }

    static async findByUser(userId) {
        const sql = `
            SELECT t.*, 
                   ua.staff_id as assigned_by_staff,
                   uu.staff_id as assigned_to_staff
            FROM tasks t
            LEFT JOIN users ua ON ua.id = t.assigned_by
            LEFT JOIN users uu ON uu.id = t.assigned_to
            WHERE t.assigned_to = ?
            ORDER BY t.created_at DESC
        `;
        
        try {
            return await all(sql, [userId]);
        } catch (error) {
            throw new Error(`Failed to find user tasks: ${error.message}`);
        }
    }

    static async findAll() {
        const sql = `
            SELECT t.*, 
                   ua.staff_id as assigned_by_staff,
                   uu.staff_id as assigned_to_staff
            FROM tasks t
            LEFT JOIN users ua ON ua.id = t.assigned_by
            LEFT JOIN users uu ON uu.id = t.assigned_to
            ORDER BY t.created_at DESC
        `;
        
        try {
            return await all(sql);
        } catch (error) {
            throw new Error(`Failed to find all tasks: ${error.message}`);
        }
    }

    static async update(id, updateData) {
        const { title, description, priority, due_date, status } = updateData;
        
        const sql = `
            UPDATE tasks 
            SET title = COALESCE(?, title),
                description = COALESCE(?, description),
                priority = COALESCE(?, priority),
                due_date = COALESCE(?, due_date),
                status = COALESCE(?, status),
                updated_at = datetime('now')
            WHERE id = ?
        `;
        
        const params = [title, description, priority, due_date, status, id];
        
        try {
            await run(sql, params);
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Failed to update task: ${error.message}`);
        }
    }

    static async delete(id) {
        const sql = 'DELETE FROM tasks WHERE id = ?';
        
        try {
            await run(sql, [id]);
            return true;
        } catch (error) {
            throw new Error(`Failed to delete task: ${error.message}`);
        }
    }

    static async updateStatus(id, status) {
        const sql = `
            UPDATE tasks 
            SET status = ?, updated_at = datetime('now')
            WHERE id = ?
        `;
        
        try {
            await run(sql, [status, id]);
            return await this.findById(id);
        } catch (error) {
            throw new Error(`Failed to update task status: ${error.message}`);
        }
    }

    static async getTaskCounts(userId) {
        const sql = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
            FROM tasks 
            WHERE assigned_to = ?
        `;
        
        try {
            return await get(sql, [userId]);
        } catch (error) {
            throw new Error(`Failed to get task counts: ${error.message}`);
        }
    }
}

module.exports = Task;
