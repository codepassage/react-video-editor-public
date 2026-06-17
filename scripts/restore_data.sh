#!/bin/bash

# Database restoration script for specific tables
# This script extracts and restores data from the backup file

BACKUP_FILE="backups/youtube_generator_backup_20250703_143811.sql"
OUTPUT_DIR="backups/restore_temp"
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)

# Create temporary directory for extraction
mkdir -p $OUTPUT_DIR

echo "Starting data restoration process..."

# Function to extract table data
extract_table_data() {
    local table_name=$1
    local output_file="$OUTPUT_DIR/${table_name}.sql"
    
    echo "Extracting data for table: $table_name"
    
    # Extract CREATE TABLE and INSERT statements for specific table
    awk -v table="$table_name" '
        /^CREATE TABLE public\."'$table_name'"/ { in_create = 1 }
        in_create { print }
        /^\);$/ && in_create { in_create = 0; print "" }
        
        /^INSERT INTO public\."'$table_name'"/ { print }
    ' $BACKUP_FILE > $output_file
    
    # Convert to INSERT statements only (remove CREATE TABLE)
    grep "^INSERT INTO" $output_file > "${output_file}.inserts"
    
    echo "Extracted $(wc -l < "${output_file}.inserts") INSERT statements for $table_name"
}

# Extract data for each table
echo "Extracting table data..."
extract_table_data "TemplateType"
extract_table_data "Template"
extract_table_data "TemplateVersion"
extract_table_data "TemplateGroup"
extract_table_data "Bundle"
extract_table_data "ResourceTemplate"
extract_table_data "ResourceTemplateVersion"
extract_table_data "ResourceData"
extract_table_data "CsvColumnMap"
extract_table_data "CsvColumnMapVersion"
extract_table_data "MediaFile"

# Create restoration SQL script
cat > $OUTPUT_DIR/restore_data.sql << 'EOF'
-- Data restoration script
-- This script restores data while maintaining referential integrity

BEGIN;

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM public."TemplateVersion";
-- DELETE FROM public."TemplateGroup";
-- DELETE FROM public."Bundle";
-- DELETE FROM public."Template";
-- DELETE FROM public."TemplateType";
-- DELETE FROM public."ResourceTemplateVersion";
-- DELETE FROM public."ResourceData";
-- DELETE FROM public."ResourceTemplate";
-- DELETE FROM public."CsvColumnMapVersion";
-- DELETE FROM public."CsvColumnMap";
-- DELETE FROM public."MediaFile";

-- Restore data in order of dependencies
EOF

# Append INSERT statements in correct order
echo "-- TemplateType data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/TemplateType.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No TemplateType data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- Template data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/Template.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No Template data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- TemplateVersion data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/TemplateVersion.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No TemplateVersion data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- TemplateGroup data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/TemplateGroup.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No TemplateGroup data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- Bundle data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/Bundle.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No Bundle data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- ResourceTemplate data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/ResourceTemplate.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No ResourceTemplate data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- ResourceTemplateVersion data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/ResourceTemplateVersion.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No ResourceTemplateVersion data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- CsvColumnMap data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/CsvColumnMap.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No CsvColumnMap data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- CsvColumnMapVersion data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/CsvColumnMapVersion.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No CsvColumnMapVersion data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- ResourceData data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/ResourceData.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No ResourceData data found" >> $OUTPUT_DIR/restore_data.sql

echo -e "\n-- MediaFile data" >> $OUTPUT_DIR/restore_data.sql
cat $OUTPUT_DIR/MediaFile.sql.inserts >> $OUTPUT_DIR/restore_data.sql 2>/dev/null || echo "-- No MediaFile data found" >> $OUTPUT_DIR/restore_data.sql

# Finalize SQL script
cat >> $OUTPUT_DIR/restore_data.sql << 'EOF'

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

COMMIT;
EOF

echo "Restoration script created at: $OUTPUT_DIR/restore_data.sql"
echo "To execute the restoration, run: psql $DB_URL < $OUTPUT_DIR/restore_data.sql"