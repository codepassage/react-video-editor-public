#!/bin/bash

# Database restoration script
# Extracts and restores specific tables from backup

BACKUP_FILE="backups/youtube_generator_backup_20250703_143811.sql"
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')

echo "Starting database restoration process..."
echo "Database URL: $DB_URL"

# Create a clean restoration script by extracting specific tables
cat > /tmp/restore_tables.sql << 'EOF'
-- Database restoration script
BEGIN;

-- Disable foreign key checks
SET session_replication_role = 'replica';

EOF

# Function to extract COPY command and its data
extract_table_copy() {
    local table_name=$1
    local backup_file=$2
    
    # Find COPY command and extract until \. marker
    awk -v table="$table_name" '
        /^COPY public\."'$table_name'"/ { 
            found = 1
            print
            next
        }
        found && /^\\.$/ {
            print
            found = 0
            next
        }
        found {
            print
        }
    ' "$backup_file"
}

# Extract tables in dependency order
echo "Extracting TemplateType..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- TemplateType data" >> /tmp/restore_tables.sql
extract_table_copy "TemplateType" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting Template..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- Template data" >> /tmp/restore_tables.sql
extract_table_copy "Template" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting TemplateVersion..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- TemplateVersion data" >> /tmp/restore_tables.sql
extract_table_copy "TemplateVersion" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting TemplateGroup..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- TemplateGroup data" >> /tmp/restore_tables.sql
extract_table_copy "TemplateGroup" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting Bundle..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- Bundle data" >> /tmp/restore_tables.sql
extract_table_copy "Bundle" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting ResourceTemplate..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- ResourceTemplate data" >> /tmp/restore_tables.sql
extract_table_copy "ResourceTemplate" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting ResourceTemplateVersion..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- ResourceTemplateVersion data" >> /tmp/restore_tables.sql
extract_table_copy "ResourceTemplateVersion" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting CsvColumnMap..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- CsvColumnMap data" >> /tmp/restore_tables.sql
extract_table_copy "CsvColumnMap" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting CsvColumnMapVersion..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- CsvColumnMapVersion data" >> /tmp/restore_tables.sql
extract_table_copy "CsvColumnMapVersion" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting ResourceData..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- ResourceData data" >> /tmp/restore_tables.sql
extract_table_copy "ResourceData" "$BACKUP_FILE" >> /tmp/restore_tables.sql

echo "Extracting MediaFile..." >&2
echo "" >> /tmp/restore_tables.sql
echo "-- MediaFile data" >> /tmp/restore_tables.sql
extract_table_copy "MediaFile" "$BACKUP_FILE" >> /tmp/restore_tables.sql

# Add footer
cat >> /tmp/restore_tables.sql << 'EOF'

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

COMMIT;
EOF

echo "Restoration script created at: /tmp/restore_tables.sql"
echo ""
echo "Executing restoration..."

# Execute the restoration
psql "$DB_URL" < /tmp/restore_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Restoration completed successfully!"
    
    # Verify the restoration
    echo ""
    echo "Verifying restored data:"
    psql "$DB_URL" -c "
        SELECT 'TemplateType' as table_name, COUNT(*) as count FROM \"TemplateType\"
        UNION ALL
        SELECT 'Template', COUNT(*) FROM \"Template\"
        UNION ALL
        SELECT 'TemplateVersion', COUNT(*) FROM \"TemplateVersion\"
        UNION ALL
        SELECT 'TemplateGroup', COUNT(*) FROM \"TemplateGroup\"
        UNION ALL
        SELECT 'Bundle', COUNT(*) FROM \"Bundle\"
        UNION ALL
        SELECT 'ResourceTemplate', COUNT(*) FROM \"ResourceTemplate\"
        UNION ALL
        SELECT 'ResourceTemplateVersion', COUNT(*) FROM \"ResourceTemplateVersion\"
        UNION ALL
        SELECT 'ResourceData', COUNT(*) FROM \"ResourceData\"
        UNION ALL
        SELECT 'CsvColumnMap', COUNT(*) FROM \"CsvColumnMap\"
        UNION ALL
        SELECT 'CsvColumnMapVersion', COUNT(*) FROM \"CsvColumnMapVersion\"
        UNION ALL
        SELECT 'MediaFile', COUNT(*) FROM \"MediaFile\";
    "
else
    echo "❌ Restoration failed. Please check the error messages above."
    exit 1
fi