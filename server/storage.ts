// This file is required by the template but we primarily use
// the chat storage from replit_integrations/chat/storage.ts
import { chatStorage } from "./replit_integrations/chat/storage";

export interface IStorage {
  // Add any other methods here if needed
}

export class MemStorage implements IStorage {
  // Implementation if needed
}

export const storage = new MemStorage();
export { chatStorage };
