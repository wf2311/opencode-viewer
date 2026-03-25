use rusqlite::Connection;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Serialize, Deserialize)]
pub struct Project {
    pub id: String,
    pub worktree: String,
    pub name: Option<String>,
    pub icon_color: Option<String>,
    pub time_created: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Session {
    pub id: String,
    pub project_id: String,
    pub parent_id: Option<String>,
    pub slug: String,
    pub directory: String,
    pub title: String,
    pub time_created: Option<i64>,
    pub time_archived: Option<i64>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct PartRow {
    pub id: String,
    pub data: serde_json::Value,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct MessageWithParts {
    pub id: String,
    pub session_id: String,
    pub time_created: Option<i64>,
    pub data: serde_json::Value,
    pub parts: Vec<PartRow>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DailyUsage {
    pub date: String,
    pub total_cost: f64,
    pub input_tokens: i64,
    pub output_tokens: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ModelUsage {
    pub provider_id: String,
    pub model_id: String,
    pub total_cost: f64,
    pub total_tokens: i64,
    pub message_count: i64,
}

fn open_db(db_path: &str) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}

#[tauri::command]
pub async fn list_projects(db_path: String) -> Result<Vec<Project>, String> {
    let conn = open_db(&db_path)?;
    let mut stmt = conn
        .prepare("SELECT id, worktree, name, icon_color, time_created FROM project ORDER BY time_updated DESC")
        .map_err(|e| e.to_string())?;
    let projects = stmt
        .query_map([], |row| Ok(Project {
            id: row.get(0)?, worktree: row.get(1)?, name: row.get(2)?,
            icon_color: row.get(3)?, time_created: row.get(4)?,
        }))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok()).collect();
    Ok(projects)
}

#[tauri::command]
pub async fn list_sessions(db_path: String) -> Result<Vec<Session>, String> {
    let conn = open_db(&db_path)?;
    let mut stmt = conn
        .prepare("SELECT id, project_id, parent_id, slug, directory, title, time_created, time_archived FROM session ORDER BY time_updated DESC")
        .map_err(|e| e.to_string())?;
    let sessions = stmt
        .query_map([], |row| Ok(Session {
            id: row.get(0)?, project_id: row.get(1)?, parent_id: row.get(2)?,
            slug: row.get(3)?, directory: row.get(4)?, title: row.get(5)?,
            time_created: row.get(6)?, time_archived: row.get(7)?,
        }))
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok()).collect();
    Ok(sessions)
}

#[tauri::command]
pub async fn list_messages(db_path: String, session_id: String) -> Result<Vec<MessageWithParts>, String> {
    let conn = open_db(&db_path)?;
    let mut msg_stmt = conn
        .prepare("SELECT id, session_id, time_created, data FROM message WHERE session_id = ?1 ORDER BY time_created ASC")
        .map_err(|e| e.to_string())?;
    let messages: Vec<(String, String, Option<i64>, serde_json::Value)> = msg_stmt
        .query_map([&session_id], |row| {
            let data_str: String = row.get(3)?;
            Ok((row.get::<_, String>(0)?, row.get::<_, String>(1)?, row.get::<_, Option<i64>>(2)?, data_str))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .filter_map(|(id, sid, tc, ds)| serde_json::from_str(&ds).ok().map(|d| (id, sid, tc, d)))
        .collect();
    let mut result = Vec::new();
    for (id, sid, tc, data) in messages {
        let mut part_stmt = conn
            .prepare("SELECT id, data FROM part WHERE message_id = ?1 ORDER BY time_created ASC")
            .map_err(|e| e.to_string())?;
        let parts: Vec<PartRow> = part_stmt
            .query_map([&id], |row| {
                let ds: String = row.get(1)?;
                Ok((row.get::<_, String>(0)?, ds))
            })
            .map_err(|e| e.to_string())?
            .filter_map(|r| r.ok())
            .filter_map(|(pid, ds)| serde_json::from_str(&ds).ok().map(|d| PartRow { id: pid, data: d }))
            .collect();
        result.push(MessageWithParts { id, session_id: sid, time_created: tc, data, parts });
    }
    Ok(result)
}

#[tauri::command]
pub async fn get_usage_stats(db_path: String, days: i64) -> Result<Vec<DailyUsage>, String> {
    let conn = open_db(&db_path)?;
    let cutoff = days_cutoff(days);
    let mut stmt = conn.prepare(r#"
        SELECT date(time_created/1000,'unixepoch') as day,
            SUM(CAST(json_extract(data,'$.cost') AS REAL)),
            SUM(CAST(json_extract(data,'$.tokens.input') AS INTEGER)),
            SUM(CAST(json_extract(data,'$.tokens.output') AS INTEGER))
        FROM message
        WHERE json_extract(data,'$.role')='assistant' AND time_created>=?1
          AND json_extract(data,'$.cost') IS NOT NULL
        GROUP BY day ORDER BY day ASC"#).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([cutoff], |row| Ok(DailyUsage {
        date: row.get::<_,String>(0).unwrap_or_default(),
        total_cost: row.get::<_,f64>(1).unwrap_or(0.0),
        input_tokens: row.get::<_,i64>(2).unwrap_or(0),
        output_tokens: row.get::<_,i64>(3).unwrap_or(0),
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub async fn get_model_stats(db_path: String, days: i64) -> Result<Vec<ModelUsage>, String> {
    let conn = open_db(&db_path)?;
    let cutoff = days_cutoff(days);
    let mut stmt = conn.prepare(r#"
        SELECT COALESCE(json_extract(data,'$.providerID'),'unknown'),
            COALESCE(json_extract(data,'$.modelID'),'unknown'),
            SUM(CAST(json_extract(data,'$.cost') AS REAL)),
            SUM(CAST(json_extract(data,'$.tokens.input') AS INTEGER)+CAST(json_extract(data,'$.tokens.output') AS INTEGER)),
            COUNT(*)
        FROM message
        WHERE json_extract(data,'$.role')='assistant' AND time_created>=?1
        GROUP BY 1,2 ORDER BY 3 DESC"#).map_err(|e| e.to_string())?;
    let rows = stmt.query_map([cutoff], |row| Ok(ModelUsage {
        provider_id: row.get::<_,String>(0).unwrap_or_else(|_| "unknown".into()),
        model_id: row.get::<_,String>(1).unwrap_or_else(|_| "unknown".into()),
        total_cost: row.get::<_,f64>(2).unwrap_or(0.0),
        total_tokens: row.get::<_,i64>(3).unwrap_or(0),
        message_count: row.get::<_,i64>(4).unwrap_or(0),
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn get_default_db_path() -> Option<String> {
    let base = dirs::data_dir()?;
    let path: PathBuf = base.join("opencode").join("opencode.db");
    if path.exists() { Some(path.to_string_lossy().to_string()) } else { None }
}

fn days_cutoff(days: i64) -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as i64;
    now - days * 24 * 60 * 60 * 1000
}
