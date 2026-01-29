-- Enable required PostgreSQL extensions
-- Run this first in Supabase SQL Editor

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
