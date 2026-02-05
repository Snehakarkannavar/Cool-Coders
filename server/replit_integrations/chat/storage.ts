import { db } from "../../db";
import { conversations, messages } from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IChatStorage {
  getConversation(id: number): Promise<typeof conversations.$inferSelect | undefined>;
  getAllConversations(): Promise<(typeof conversations.$inferSelect)[]>;
  createConversation(title: string): Promise<typeof conversations.$inferSelect>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<(typeof messages.$inferSelect)[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<typeof messages.$inferSelect>;
}

type Conversation = typeof conversations.$inferSelect;
type Message = typeof messages.$inferSelect;

let memConversationId = 1;
let memMessageId = 1;
const memConversations: Conversation[] = [];
const memMessages: Message[] = [];

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    if (!db) {
      return memConversations.find((c) => c.id === id);
    }

    const [conversation] = await db
      .select()
      .from(conversations)
      .where(eq(conversations.id, id));
    return conversation;
  },

  async getAllConversations() {
    if (!db) {
      return [...memConversations].sort((a, b) =>
        (b.createdAt?.getTime?.() ?? 0) - (a.createdAt?.getTime?.() ?? 0),
      );
    }

    return db.select().from(conversations).orderBy(desc(conversations.createdAt));
  },

  async createConversation(title: string) {
    if (!db) {
      const conversation: Conversation = {
        id: memConversationId++,
        title,
        createdAt: new Date(),
      } as Conversation;
      memConversations.push(conversation);
      return conversation;
    }

    const [conversation] = await db
      .insert(conversations)
      .values({ title })
      .returning();
    return conversation;
  },

  async deleteConversation(id: number) {
    if (!db) {
      for (let i = memMessages.length - 1; i >= 0; i--) {
        if (memMessages[i].conversationId === id) memMessages.splice(i, 1);
      }
      const idx = memConversations.findIndex((c) => c.id === id);
      if (idx >= 0) memConversations.splice(idx, 1);
      return;
    }

    await db.delete(messages).where(eq(messages.conversationId, id));
    await db.delete(conversations).where(eq(conversations.id, id));
  },

  async getMessagesByConversation(conversationId: number) {
    if (!db) {
      return memMessages
        .filter((m) => m.conversationId === conversationId)
        .sort((a, b) =>
          (a.createdAt?.getTime?.() ?? 0) - (b.createdAt?.getTime?.() ?? 0),
        );
    }

    return db
      .select()
      .from(messages)
      .where(eq(messages.conversationId, conversationId))
      .orderBy(messages.createdAt);
  },

  async createMessage(conversationId: number, role: string, content: string) {
    if (!db) {
      const message: Message = {
        id: memMessageId++,
        conversationId,
        role,
        content,
        createdAt: new Date(),
      } as Message;
      memMessages.push(message);
      return message;
    }

    const [message] = await db
      .insert(messages)
      .values({ conversationId, role, content })
      .returning();
    return message;
  },
};

