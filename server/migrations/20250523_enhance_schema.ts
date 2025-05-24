import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import * as enhancedSchema from "../../shared/enhancedSchema";
import * as baseSchema from "../../shared/schema";
import * as dotenv from 'dotenv';

dotenv.config();

// This migration script creates all the enhanced schema tables
// without disrupting existing data

async function runMigration() {
  console.log("Starting enhanced schema migration...");

  // Get database connection string from environment variables
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error("DATABASE_URL environment variable not set!");
    process.exit(1);
  }

  // Connect to the database
  const sql = postgres(connectionString);
  const db = drizzle(sql);

  try {
    // Execute the migration
    console.log("Creating enhanced concepts table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enhanced_concepts (
        id SERIAL PRIMARY KEY,
        concept_id INTEGER NOT NULL REFERENCES concepts(id),
        importance INTEGER DEFAULT 5,
        mastery_difficulty INTEGER DEFAULT 5,
        estimated_learning_time INTEGER DEFAULT 30,
        visualization_size REAL DEFAULT 1.0,
        visualization_color TEXT,
        domain_area TEXT,
        prerequisite_ids INTEGER[],
        application_ids INTEGER[],
        keywords TEXT[],
        popularity_score INTEGER DEFAULT 50,
        depth_level INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating enhanced concept relationships table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enhanced_concept_relationships (
        id SERIAL PRIMARY KEY,
        source_id INTEGER NOT NULL,
        target_id INTEGER NOT NULL,
        relationship_type TEXT NOT NULL,
        strength INTEGER DEFAULT 50,
        description TEXT,
        bidirectional BOOLEAN DEFAULT FALSE,
        confidence INTEGER DEFAULT 100,
        created_by TEXT DEFAULT 'system',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating enhanced resources table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enhanced_resources (
        id SERIAL PRIMARY KEY,
        resource_id INTEGER NOT NULL REFERENCES learning_resources(id),
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        type TEXT NOT NULL,
        quality TEXT DEFAULT 'medium',
        visual_richness INTEGER DEFAULT 50,
        interactivity_level INTEGER DEFAULT 0,
        engagement_score INTEGER DEFAULT 50,
        authority_score INTEGER DEFAULT 50,
        accuracy_score INTEGER DEFAULT 50,
        completeness_score INTEGER DEFAULT 50,
        freshness_score INTEGER DEFAULT 50,
        difficulty_level TEXT DEFAULT 'beginner',
        prerequisite_resource_ids INTEGER[],
        estimated_time_minutes INTEGER DEFAULT 15,
        readability_score INTEGER DEFAULT 50,
        visual_learning_fit INTEGER DEFAULT 50,
        auditory_learning_fit INTEGER DEFAULT 50,
        reading_learning_fit INTEGER DEFAULT 50,
        kinesthetic_learning_fit INTEGER DEFAULT 50,
        source TEXT,
        image_url TEXT,
        author TEXT,
        publication_date TIMESTAMP,
        tags TEXT[],
        language TEXT DEFAULT 'en',
        date_added TIMESTAMP DEFAULT NOW(),
        last_checked TIMESTAMP DEFAULT NOW(),
        is_active BOOLEAN DEFAULT TRUE,
        average_rating REAL DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        completion_count INTEGER DEFAULT 0,
        last_modified TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating enhanced concept resources table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enhanced_concept_resources (
        id SERIAL,
        concept_id INTEGER NOT NULL,
        resource_id INTEGER NOT NULL,
        relevance_score INTEGER DEFAULT 70,
        importance_for_concept INTEGER DEFAULT 5,
        learning_path_order INTEGER,
        is_core_material BOOLEAN DEFAULT FALSE,
        is_supplementary BOOLEAN DEFAULT FALSE,
        notes TEXT,
        coverage_percentage INTEGER DEFAULT 100,
        target_audience TEXT[],
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        PRIMARY KEY (concept_id, resource_id)
      );
    `);

    console.log("Creating learning paths table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS learning_paths (
        id SERIAL PRIMARY KEY,
        user_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        difficulty_level TEXT DEFAULT 'beginner',
        estimated_total_time INTEGER DEFAULT 0,
        concept_ids INTEGER[] NOT NULL,
        resource_ids INTEGER[] NOT NULL,
        prerequisites TEXT,
        is_public BOOLEAN DEFAULT FALSE,
        creator_id INTEGER,
        is_system_generated BOOLEAN DEFAULT FALSE,
        tags TEXT[],
        average_rating REAL DEFAULT 0,
        completion_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating learning path items table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS learning_path_items (
        id SERIAL PRIMARY KEY,
        path_id INTEGER NOT NULL,
        sequence_number INTEGER NOT NULL,
        item_type TEXT NOT NULL,
        concept_id INTEGER,
        resource_id INTEGER,
        name TEXT NOT NULL,
        description TEXT,
        estimated_time_minutes INTEGER DEFAULT 15,
        is_checkpoint BOOLEAN DEFAULT FALSE,
        is_optional BOOLEAN DEFAULT FALSE,
        completion_criteria TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating learning path progress table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS learning_path_progress (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        path_id INTEGER NOT NULL,
        current_item_id INTEGER,
        percent_complete INTEGER DEFAULT 0,
        last_item_completed_id INTEGER,
        completed_item_ids INTEGER[],
        started_at TIMESTAMP DEFAULT NOW(),
        last_activity_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP,
        average_completion_time INTEGER DEFAULT 0,
        total_time_spent INTEGER DEFAULT 0
      );
    `);

    console.log("Creating knowledge gaps table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS knowledge_gaps (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        concept_id INTEGER NOT NULL,
        confidence_score INTEGER DEFAULT 0,
        identified_at TIMESTAMP DEFAULT NOW(),
        source TEXT NOT NULL,
        quiz_item_id INTEGER,
        status TEXT DEFAULT 'active',
        recommended_resource_ids INTEGER[],
        last_reviewed_at TIMESTAMP,
        resolved BOOLEAN DEFAULT FALSE,
        resolution_notes TEXT,
        priority_score INTEGER DEFAULT 50
      );
    `);

    console.log("Creating study sessions table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS study_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_minutes INTEGER,
        concept_ids INTEGER[],
        resource_ids INTEGER[],
        path_id INTEGER,
        learning_goals TEXT,
        outcomes TEXT,
        productivity_score INTEGER,
        focus_level INTEGER,
        notes TEXT,
        location TEXT,
        device TEXT,
        environmental_factors TEXT
      );
    `);

    console.log("Creating visualization settings table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS visualization_settings (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL UNIQUE,
        node_size TEXT DEFAULT 'importance',
        node_color TEXT DEFAULT 'domain',
        edge_thickness TEXT DEFAULT 'strength',
        layout TEXT DEFAULT 'force',
        show_labels BOOLEAN DEFAULT TRUE,
        grouping_enabled BOOLEAN DEFAULT TRUE,
        filter_level INTEGER DEFAULT 0,
        highlight_related BOOLEAN DEFAULT TRUE,
        show_resource_previews BOOLEAN DEFAULT TRUE,
        animation_speed INTEGER DEFAULT 5,
        interaction_mode TEXT DEFAULT 'default',
        custom_color_palette TEXT[],
        last_modified TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating resource discovery sources table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS resource_discovery_sources (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        base_url TEXT NOT NULL,
        enabled BOOLEAN DEFAULT TRUE,
        priority INTEGER DEFAULT 5,
        api_key TEXT,
        query_params JSONB,
        result_selector TEXT,
        quality_indicators TEXT[],
        content_types TEXT[],
        rate_limit_per_minute INTEGER,
        last_successful_use TIMESTAMP,
        success_rate INTEGER DEFAULT 100,
        average_result_quality INTEGER DEFAULT 70,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    console.log("Creating resource discovery logs table...");
    await db.execute(`
      CREATE TABLE IF NOT EXISTS resource_discovery_logs (
        id SERIAL PRIMARY KEY,
        source_id INTEGER NOT NULL,
        concept_id INTEGER NOT NULL,
        query TEXT NOT NULL,
        result_count INTEGER DEFAULT 0,
        successful_count INTEGER DEFAULT 0,
        failed_count INTEGER DEFAULT 0,
        timestamp TIMESTAMP DEFAULT NOW(),
        duration INTEGER,
        error TEXT,
        status TEXT DEFAULT 'completed'
      );
    `);

    // Seed initial discovery sources
    console.log("Seeding initial resource discovery sources...");
    await db.execute(`
      INSERT INTO resource_discovery_sources 
        (name, type, base_url, priority, result_selector, content_types) 
      VALUES 
        ('Google Scholar', 'academic', 'https://scholar.google.com/scholar', 8, '.gs_ri', ARRAY['article', 'documentation']),
        ('YouTube Educational', 'api', 'https://www.googleapis.com/youtube/v3/search', 7, NULL, ARRAY['video']),
        ('MIT OpenCourseWare', 'search', 'https://ocw.mit.edu/search/', 9, '.product-list-item', ARRAY['course']),
        ('Khan Academy', 'search', 'https://www.khanacademy.org/search', 8, '.result-container', ARRAY['video', 'interactive'])
      ON CONFLICT (name) DO NOTHING;
    `);

    console.log("Enhanced schema migration completed successfully!");
  } catch (error) {
    console.error("Migration failed:", error);
    throw error;
  } finally {
    // Close the database connection
    await sql.end();
  }
}

// Run the migration if this script is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration completed successfully");
      process.exit(0);
    })
    .catch((err) => {
      console.error("Migration failed:", err);
      process.exit(1);
    });
}

export default runMigration;
