pub mod commands;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            commands::list_projects,
            commands::list_sessions,
            commands::list_messages,
            commands::get_usage_stats,
            commands::get_model_stats,
            commands::get_default_db_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
