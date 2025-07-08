import { db } from "./db";
import { users, projects, prompts, apiKeys, promptVersions, type User, type InsertUser, type Project, type InsertProject, type Prompt, type InsertPrompt, type ApiKey, type InsertApiKey, type PromptVersion } from "@shared/schema";
import { eq, and, exists } from "drizzle-orm";
import * as bcrypt from "bcrypt";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  verifyPassword(email: string, password: string): Promise<User | null>;
  
  // Project methods
  getProjectsByUserId(userId: string): Promise<Project[]>;
  getProject(id: string, userId: string): Promise<Project | undefined>;
  createProject(project: InsertProject & { user_id: string }): Promise<Project>;
  updateProject(id: string, userId: string, updates: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: string, userId: string): Promise<boolean>;
  
  // Prompt methods
  getPromptsByProjectId(projectId: string, userId: string): Promise<Prompt[]>;
  getPrompt(id: string, userId: string): Promise<Prompt | undefined>;
  createPrompt(prompt: InsertPrompt & { project_id: string }): Promise<Prompt>;
  updatePrompt(id: string, userId: string, updates: Partial<InsertPrompt>): Promise<Prompt | undefined>;
  deletePrompt(id: string, userId: string): Promise<boolean>;
  
  // API Key methods
  getApiKeysByProjectId(projectId: string, userId: string): Promise<ApiKey[]>;
  createApiKey(apiKey: InsertApiKey & { project_id: string }): Promise<ApiKey>;
  deleteApiKey(id: string, userId: string): Promise<boolean>;
  verifyApiKey(keyHash: string): Promise<{ projectId: string } | null>;
  updateApiKeyLastUsed(keyHash: string): Promise<void>;
  
  // Prompt Version methods
  getPromptVersions(promptId: string, userId: string): Promise<PromptVersion[]>;
  createPromptVersion(promptId: string, content: string, variables: string[], versionNumber: number): Promise<PromptVersion>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(user: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    const result = await db.insert(users).values({
      ...user,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async verifyPassword(email: string, password: string): Promise<User | null> {
    const user = await this.getUserByEmail(email);
    if (!user) return null;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : null;
  }

  // Project methods
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return await db.select().from(projects).where(eq(projects.user_id, userId));
  }

  async getProject(id: string, userId: string): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(
      and(eq(projects.id, id), eq(projects.user_id, userId))
    ).limit(1);
    return result[0];
  }

  async createProject(project: InsertProject & { user_id: string }): Promise<Project> {
    const result = await db.insert(projects).values(project).returning();
    return result[0];
  }

  async updateProject(id: string, userId: string, updates: Partial<InsertProject>): Promise<Project | undefined> {
    const result = await db.update(projects)
      .set({ ...updates, updated_at: new Date() })
      .where(and(eq(projects.id, id), eq(projects.user_id, userId)))
      .returning();
    return result[0];
  }

  async deleteProject(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(projects).where(
      and(eq(projects.id, id), eq(projects.user_id, userId))
    ).returning();
    return result.length > 0;
  }

  // Prompt methods
  async getPromptsByProjectId(projectId: string, userId: string): Promise<Prompt[]> {
    return await db.select({
      id: prompts.id,
      project_id: prompts.project_id,
      name: prompts.name,
      content: prompts.content,
      variables: prompts.variables,
      created_at: prompts.created_at,
      updated_at: prompts.updated_at,
    }).from(prompts)
      .innerJoin(projects, eq(prompts.project_id, projects.id))
      .where(and(eq(prompts.project_id, projectId), eq(projects.user_id, userId)));
  }

  async getPrompt(id: string, userId: string): Promise<Prompt | undefined> {
    const result = await db.select({
      id: prompts.id,
      project_id: prompts.project_id,
      name: prompts.name,
      content: prompts.content,
      variables: prompts.variables,
      created_at: prompts.created_at,
      updated_at: prompts.updated_at,
    }).from(prompts)
      .innerJoin(projects, eq(prompts.project_id, projects.id))
      .where(and(eq(prompts.id, id), eq(projects.user_id, userId)))
      .limit(1);
    return result[0];
  }

  async createPrompt(prompt: InsertPrompt & { project_id: string }): Promise<Prompt> {
    const result = await db.insert(prompts).values(prompt).returning();
    return result[0];
  }

  async updatePrompt(id: string, userId: string, updates: Partial<InsertPrompt>): Promise<Prompt | undefined> {
    const result = await db.update(prompts)
      .set({ ...updates, updated_at: new Date() })
      .where(and(
        eq(prompts.id, id),
        exists(db.select().from(projects).where(and(eq(projects.id, prompts.project_id), eq(projects.user_id, userId))))
      ))
      .returning();
    return result[0];
  }

  async deletePrompt(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(prompts).where(
      and(
        eq(prompts.id, id),
        exists(db.select().from(projects).where(and(eq(projects.id, prompts.project_id), eq(projects.user_id, userId))))
      )
    ).returning();
    return result.length > 0;
  }

  // API Key methods
  async getApiKeysByProjectId(projectId: string, userId: string): Promise<ApiKey[]> {
    return await db.select({
      id: apiKeys.id,
      project_id: apiKeys.project_id,
      name: apiKeys.name,
      key_hash: apiKeys.key_hash,
      key_prefix: apiKeys.key_prefix,
      last_used: apiKeys.last_used,
      created_at: apiKeys.created_at,
    }).from(apiKeys)
      .innerJoin(projects, eq(apiKeys.project_id, projects.id))
      .where(and(eq(apiKeys.project_id, projectId), eq(projects.user_id, userId)));
  }

  async createApiKey(apiKey: InsertApiKey & { project_id: string }): Promise<ApiKey> {
    const result = await db.insert(apiKeys).values(apiKey).returning();
    return result[0];
  }

  async deleteApiKey(id: string, userId: string): Promise<boolean> {
    const result = await db.delete(apiKeys).where(
      and(
        eq(apiKeys.id, id),
        exists(db.select().from(projects).where(and(eq(projects.id, apiKeys.project_id), eq(projects.user_id, userId))))
      )
    ).returning();
    return result.length > 0;
  }

  async verifyApiKey(keyHash: string): Promise<{ projectId: string } | null> {
    const result = await db.select({ project_id: apiKeys.project_id }).from(apiKeys).where(eq(apiKeys.key_hash, keyHash)).limit(1);
    return result[0] ? { projectId: result[0].project_id } : null;
  }

  async updateApiKeyLastUsed(keyHash: string): Promise<void> {
    await db.update(apiKeys).set({ last_used: new Date() }).where(eq(apiKeys.key_hash, keyHash));
  }

  // Prompt Version methods
  async getPromptVersions(promptId: string, userId: string): Promise<PromptVersion[]> {
    return await db.select({
      id: promptVersions.id,
      prompt_id: promptVersions.prompt_id,
      content: promptVersions.content,
      variables: promptVersions.variables,
      version_number: promptVersions.version_number,
      created_at: promptVersions.created_at,
    }).from(promptVersions)
      .innerJoin(prompts, eq(promptVersions.prompt_id, prompts.id))
      .innerJoin(projects, eq(prompts.project_id, projects.id))
      .where(and(eq(promptVersions.prompt_id, promptId), eq(projects.user_id, userId)));
  }

  async createPromptVersion(promptId: string, content: string, variables: string[], versionNumber: number): Promise<PromptVersion> {
    const result = await db.insert(promptVersions).values({
      prompt_id: promptId,
      content,
      variables,
      version_number: versionNumber,
    }).returning();
    return result[0];
  }
}

export const storage = new DatabaseStorage();
