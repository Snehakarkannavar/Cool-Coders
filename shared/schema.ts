import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export * from "./models/chat";

// We can store analysis results if we want, or just keep it ephemeral
// For now, let's just stick to the chat models being the primary persistence
