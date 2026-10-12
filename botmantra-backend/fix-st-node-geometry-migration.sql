-- Migration: Fix st_node function geometry issues
-- This addresses the "Noding geometries of dimension != 1 is unsupported" error
-- Run this in your Supabase SQL editor or database console

-- First, check if PostGIS is available
SELECT name, default_version, installed_version
FROM pg_available_extensions
WHERE name = 'postgis';

-- Enable PostGIS if available
CREATE EXTENSION IF NOT EXISTS postgis;

-- Fix the st_node function to handle different geometry types
CREATE OR REPLACE FUNCTION st_node(g geometry)
RETURNS geometry
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check geometry type and handle appropriately
  CASE ST_GeometryType(g)
    WHEN 'ST_LineString' THEN
      -- For linestrings, use ST_Node
      RETURN ST_Node(g);
    WHEN 'ST_MultiLineString' THEN
      -- For multilinestrings, node each component
      RETURN ST_Union(ST_Node(ST_GeometryN(g, generate_series(1, ST_NumGeometries(g)))));
    WHEN 'ST_Point' THEN
      -- Points don't need noding
      RETURN g;
    WHEN 'ST_MultiPoint' THEN
      -- MultiPoints don't need noding
      RETURN g;
    WHEN 'ST_Polygon' THEN
      -- For polygons, return the boundary as a linestring and node it
      RETURN ST_Node(ST_Boundary(g));
    WHEN 'ST_MultiPolygon' THEN
      -- For multipolygons, node the boundaries
      RETURN ST_Node(ST_Boundary(g));
    ELSE
      -- For other types, try to convert to linestring or return as-is
      BEGIN
        RETURN ST_Node(ST_GeomFromText(ST_AsText(g), ST_SRID(g)));
      EXCEPTION
        WHEN OTHERS THEN
          -- If conversion fails, return original geometry
          RETURN g;
      END;
  END CASE;
END;
$$;

-- Alternative: Create a safer version that checks geometry type first
CREATE OR REPLACE FUNCTION st_node_safe(g geometry)
RETURNS geometry
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  geom_type TEXT;
BEGIN
  -- Get geometry type
  geom_type := ST_GeometryType(g);

  -- Only process 1-dimensional geometries (linestrings)
  IF geom_type IN ('ST_LineString', 'ST_MultiLineString') THEN
    RETURN ST_Node(g);
  ELSE
    -- For other geometry types, return unchanged or boundary
    RAISE NOTICE 'st_node_safe: Skipping geometry type % (dimension != 1)', geom_type;
    RETURN g;
  END IF;
END;
$$;

-- Test the functions with sample data
-- SELECT ST_GeometryType(geom), ST_AsText(st_node_safe(geom)) as noded
-- FROM (SELECT 'SRID=4326;LINESTRING(0 0, 1 1, 2 2)'::geometry as geom) as test;

-- If you want to replace the original function (be careful!)
-- ALTER FUNCTION st_node(geometry) RENAME TO st_node_original;
-- ALTER FUNCTION st_node_safe(geometry) RENAME TO st_node;