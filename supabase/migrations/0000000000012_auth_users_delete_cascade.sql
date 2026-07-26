-- Fix für das Löschen von Benutzern im Supabase Dashboard.
-- Setzt alle Fremdschlüssel, die auf auth.users zeigen, auf ON DELETE CASCADE,
-- außer tasks.assignee_id, welches auf ON DELETE SET NULL gesetzt wird (damit zugewiesene Aufgaben
-- nicht gelöscht werden, sondern nur die Zuweisung entfernt wird).

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name, 
            tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu 
          ON tc.constraint_name = kcu.constraint_name 
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.constraint_schema = tc.constraint_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_schema = 'auth' 
          AND ccu.table_name = 'users'
          AND tc.table_schema = 'public'
    ) LOOP
        -- Alten Constraint entfernen
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', r.table_schema, r.table_name, r.constraint_name);
        
        -- Neuen Constraint mit Lösch-Regel hinzufügen
        IF r.table_name = 'tasks' AND r.column_name = 'assignee_id' THEN
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE SET NULL', 
                r.table_schema, r.table_name, r.constraint_name, r.column_name);
        ELSE
            EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES auth.users(id) ON DELETE CASCADE', 
                r.table_schema, r.table_name, r.constraint_name, r.column_name);
        END IF;
    END LOOP;
END;
$$;
