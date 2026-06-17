#!/bin/bash

# Database restoration script for specific tables using COPY format
# This script extracts and restores data from the backup file

BACKUP_FILE="backups/youtube_generator_backup_20250703_143811.sql"
OUTPUT_DIR="backups/restore_temp"
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2-)

# Create temporary directory for extraction
mkdir -p $OUTPUT_DIR

echo "Starting data restoration process..."

# Function to extract COPY data for a table
extract_copy_data() {
    local table_name=$1
    local output_file="$OUTPUT_DIR/${table_name}_copy.sql"
    
    echo "Extracting COPY data for table: $table_name"
    
    # Extract COPY commands and data for specific table
    awk -v table="$table_name" '
        /^COPY public\."'$table_name'"/ { 
            in_copy = 1
            print "-- Data for " table
            print
        }
        in_copy { print }
        /^\\\\.$/ && in_copy { 
            in_copy = 0
            print
        }
    ' $BACKUP_FILE > $output_file
    
    # Check if we found data
    if grep -q "^COPY" $output_file; then
        echo "Found COPY data for $table_name"
    else
        echo "No COPY data found for $table_name"
    fi
}

# Extract data for each table
echo "Extracting table data..."
extract_copy_data "TemplateType"
extract_copy_data "Template"
extract_copy_data "TemplateVersion"
extract_copy_data "TemplateGroup"
extract_copy_data "Bundle"
extract_copy_data "ResourceTemplate"
extract_copy_data "ResourceTemplateVersion"
extract_copy_data "ResourceData"
extract_copy_data "CsvColumnMap"
extract_copy_data "CsvColumnMapVersion"
extract_copy_data "MediaFile"

# Create restoration SQL script
cat > $OUTPUT_DIR/restore_data_final.sql << 'EOF'
-- Data restoration script using COPY format
-- This script restores data while maintaining referential integrity

BEGIN;

-- Disable foreign key checks temporarily
SET session_replication_role = 'replica';

-- Note: Uncomment the following lines if you want to clear existing data
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

EOF

# Function to append COPY data if it exists
append_copy_data() {
    local table_name=$1
    local file_path="$OUTPUT_DIR/${table_name}_copy.sql"
    
    if [ -f "$file_path" ] && grep -q "^COPY" "$file_path"; then
        echo -e "\n-- Restoring $table_name data" >> $OUTPUT_DIR/restore_data_final.sql
        cat "$file_path" >> $OUTPUT_DIR/restore_data_final.sql
    else
        echo -e "\n-- No data found for $table_name" >> $OUTPUT_DIR/restore_data_final.sql
    fi
}

# Append data in dependency order
append_copy_data "TemplateType"
append_copy_data "Template"
append_copy_data "TemplateVersion"
append_copy_data "TemplateGroup"
append_copy_data "Bundle"
append_copy_data "ResourceTemplate"
append_copy_data "ResourceTemplateVersion"
append_copy_data "CsvColumnMap"
append_copy_data "CsvColumnMapVersion"
append_copy_data "ResourceData"
append_copy_data "MediaFile"

# Finalize SQL script
cat >> $OUTPUT_DIR/restore_data_final.sql << 'EOF'

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

COMMIT;
EOF

echo "Restoration script created at: $OUTPUT_DIR/restore_data_final.sql"
echo ""
echo "To review the restoration script:"
echo "  cat $OUTPUT_DIR/restore_data_final.sql"
echo ""
echo "To execute the restoration:"
echo "  psql $DB_URL < $OUTPUT_DIR/restore_data_final.sql"