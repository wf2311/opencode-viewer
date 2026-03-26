use rusqlite::{params_from_iter, Connection};
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
    pub input_tokens: i64,
    pub output_tokens: i64,
    pub cache_read_tokens: i64,
    pub cache_write_tokens: i64,
}

fn open_db(db_path: &str) -> Result<Connection, String> {
    Connection::open(db_path).map_err(|e| format!("Failed to open database: {}", e))
}

fn append_project_filter(query: &mut String, project_count: usize) {
    if project_count == 0 {
        return;
    }
    query.push_str(" AND s.project_id IN (");
    query.push_str(&vec!["?"; project_count].join(","));
    query.push(')');
}

#[tauri::command]
pub async fn list_projects(db_path: String) -> Result<Vec<Project>, String> {
    let conn = open_db(&db_path)?;
    let mut stmt = conn
        .prepare("SELECT id, worktree, name, icon_color, time_created FROM project ORDER BY time_created DESC")
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
        .prepare("SELECT id, project_id, parent_id, slug, directory, title, time_created, time_archived FROM session ORDER BY time_created DESC")
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

    // Single JOIN query to fetch messages and parts together, avoiding N+1 queries
    let mut stmt = conn
        .prepare(r#"
            SELECT m.id, m.session_id, m.time_created, m.data,
                   p.id AS part_id, p.data AS part_data
            FROM message m
            LEFT JOIN part p ON p.message_id = m.id
            WHERE m.session_id = ?1
            ORDER BY m.time_created ASC, p.time_created ASC
        "#)
        .map_err(|e| e.to_string())?;

    let rows: Vec<(String, String, Option<i64>, String, Option<String>, Option<String>)> = stmt
        .query_map([&session_id], |row| {
            Ok((
                row.get::<_, String>(0)?,
                row.get::<_, String>(1)?,
                row.get::<_, Option<i64>>(2)?,
                row.get::<_, String>(3)?,
                row.get::<_, Option<String>>(4)?,
                row.get::<_, Option<String>>(5)?,
            ))
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    // Group rows by message id, preserving order
    let mut result: Vec<MessageWithParts> = Vec::new();
    let mut last_msg_id: Option<String> = None;

    for (msg_id, sid, tc, msg_data_str, part_id, part_data_str) in rows {
        // Start a new message group when message id changes
        if last_msg_id.as_deref() != Some(&msg_id) {
            let data = match serde_json::from_str(&msg_data_str) {
                Ok(d) => d,
                Err(_) => continue, // skip messages with invalid JSON
            };
            result.push(MessageWithParts {
                id: msg_id.clone(),
                session_id: sid,
                time_created: tc,
                data,
                parts: Vec::new(),
            });
            last_msg_id = Some(msg_id);
        }

        // Append part to the current message (if the LEFT JOIN produced a part row)
        if let (Some(pid), Some(pds)) = (part_id, part_data_str) {
            if let Ok(part_data) = serde_json::from_str(&pds) {
                if let Some(msg) = result.last_mut() {
                    msg.parts.push(PartRow { id: pid, data: part_data });
                }
            }
        }
    }

    Ok(result)
}

#[tauri::command]
pub async fn get_usage_stats(db_path: String, days: i64, project_ids: Option<Vec<String>>) -> Result<Vec<DailyUsage>, String> {
    let conn = open_db(&db_path)?;
    let cutoff = days_cutoff(days);
    let project_ids = match project_ids {
        Some(ids) if ids.is_empty() => return Ok(Vec::new()),
        Some(ids) => Some(ids),
        None => None,
    };
    let mut query = String::from(r#"
        SELECT date(m.time_created/1000,'unixepoch') as day,
            SUM(CAST(json_extract(data,'$.cost') AS REAL)),
            SUM(CAST(json_extract(data,'$.tokens.input') AS INTEGER)),
            SUM(CAST(json_extract(data,'$.tokens.output') AS INTEGER))
        FROM message m
        JOIN session s ON s.id = m.session_id
        WHERE json_extract(data,'$.role')='assistant' AND m.time_created>=?1
          AND json_extract(data,'$.cost') IS NOT NULL
    "#);
    if let Some(project_ids) = &project_ids {
        append_project_filter(&mut query, project_ids.len());
    }
    query.push_str(" GROUP BY day ORDER BY day ASC");
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let mut params = vec![rusqlite::types::Value::from(cutoff)];
    if let Some(project_ids) = project_ids {
        params.extend(project_ids.into_iter().map(rusqlite::types::Value::from));
    }
    let rows = stmt.query_map(params_from_iter(params), |row| Ok(DailyUsage {
        date: row.get::<_,String>(0).unwrap_or_default(),
        total_cost: row.get::<_,f64>(1).unwrap_or(0.0),
        input_tokens: row.get::<_,i64>(2).unwrap_or(0),
        output_tokens: row.get::<_,i64>(3).unwrap_or(0),
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub async fn get_model_stats(db_path: String, days: i64, project_ids: Option<Vec<String>>) -> Result<Vec<ModelUsage>, String> {
    let conn = open_db(&db_path)?;
    let cutoff = days_cutoff(days);
    let project_ids = match project_ids {
        Some(ids) if ids.is_empty() => return Ok(Vec::new()),
        Some(ids) => Some(ids),
        None => None,
    };
    let mut query = String::from(r#"
        SELECT COALESCE(json_extract(data,'$.providerID'),'unknown'),
            COALESCE(json_extract(data,'$.modelID'),'unknown'),
            SUM(CAST(json_extract(data,'$.cost') AS REAL)),
            SUM(CAST(json_extract(data,'$.tokens.input') AS INTEGER)+CAST(json_extract(data,'$.tokens.output') AS INTEGER)),
            COUNT(*),
            SUM(CAST(json_extract(data,'$.tokens.input') AS INTEGER)),
            SUM(CAST(json_extract(data,'$.tokens.output') AS INTEGER)),
            SUM(COALESCE(CAST(json_extract(data,'$.tokens.cache.read') AS INTEGER),0)),
            SUM(COALESCE(CAST(json_extract(data,'$.tokens.cache.write') AS INTEGER),0))
        FROM message m
        JOIN session s ON s.id = m.session_id
        WHERE json_extract(data,'$.role')='assistant' AND m.time_created>=?1
    "#);
    if let Some(project_ids) = &project_ids {
        append_project_filter(&mut query, project_ids.len());
    }
    query.push_str(" GROUP BY 1,2 ORDER BY 3 DESC");
    let mut stmt = conn.prepare(&query).map_err(|e| e.to_string())?;
    let mut params = vec![rusqlite::types::Value::from(cutoff)];
    if let Some(project_ids) = project_ids {
        params.extend(project_ids.into_iter().map(rusqlite::types::Value::from));
    }
    let rows = stmt.query_map(params_from_iter(params), |row| Ok(ModelUsage {
        provider_id: row.get::<_,String>(0).unwrap_or_else(|_| "unknown".into()),
        model_id: row.get::<_,String>(1).unwrap_or_else(|_| "unknown".into()),
        total_cost: row.get::<_,f64>(2).unwrap_or(0.0),
        total_tokens: row.get::<_,i64>(3).unwrap_or(0),
        message_count: row.get::<_,i64>(4).unwrap_or(0),
        input_tokens: row.get::<_,i64>(5).unwrap_or(0),
        output_tokens: row.get::<_,i64>(6).unwrap_or(0),
        cache_read_tokens: row.get::<_,i64>(7).unwrap_or(0),
        cache_write_tokens: row.get::<_,i64>(8).unwrap_or(0),
    })).map_err(|e| e.to_string())?.filter_map(|r| r.ok()).collect();
    Ok(rows)
}

#[tauri::command]
pub fn get_default_db_path() -> Option<String> {
    let base = dirs::data_dir()?;
    let path: PathBuf = base.join("opencode").join("opencode.db");
    if path.exists() { Some(path.to_string_lossy().to_string()) } else { None }
}

#[tauri::command]
pub fn get_default_db_path_suggestion() -> Option<String> {
    let base = dirs::data_dir()?;
    let path: PathBuf = base.join("opencode").join("opencode.db");
    Some(path.to_string_lossy().to_string())
}

fn days_cutoff(days: i64) -> i64 {
    use std::time::{SystemTime, UNIX_EPOCH};
    let now = SystemTime::now().duration_since(UNIX_EPOCH).unwrap_or_default().as_millis() as i64;
    now - days * 24 * 60 * 60 * 1000
}
