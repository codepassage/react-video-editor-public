#!/bin/bash

# Clean and restore database script
DB_URL=$(grep DATABASE_URL .env | cut -d '=' -f2- | tr -d '"')

echo "Starting clean and restore process..."

# First, clear existing data in the affected tables
echo "Clearing existing data..."
psql "$DB_URL" << 'EOF'
BEGIN;

-- Disable foreign key checks
SET session_replication_role = 'replica';

-- Clear data in reverse dependency order
DELETE FROM "MediaFile";
DELETE FROM "ResourceDataVersion";
DELETE FROM "ResourceData";
DELETE FROM "CsvColumnMapVersion";
DELETE FROM "CsvColumnMap";
DELETE FROM "ResourceTemplateVersion";
DELETE FROM "ResourceTemplate";
DELETE FROM "Bundle";
DELETE FROM "TemplateGroup";
DELETE FROM "TemplateVersion";
DELETE FROM "Template";
DELETE FROM "TemplateType";

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

COMMIT;
EOF

if [ $? -ne 0 ]; then
    echo "❌ Failed to clear existing data"
    exit 1
fi

echo "✅ Existing data cleared successfully"

# Now restore the data
echo ""
echo "Restoring data from backup..."
psql "$DB_URL" < /tmp/restore_tables.sql

if [ $? -eq 0 ]; then
    echo "✅ Data restoration completed successfully!"
    
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
    
    echo ""
    echo "Sample data from restored tables:"
    echo ""
    echo "Templates:"
    psql "$DB_URL" -c "SELECT id, name FROM \"Template\" LIMIT 5;"
    
    echo ""
    echo "ResourceData:"
    psql "$DB_URL" -c "SELECT id, name FROM \"ResourceData\" LIMIT 5;"
else
    echo "❌ Data restoration failed. Please check the error messages above."
    exit 1
fi