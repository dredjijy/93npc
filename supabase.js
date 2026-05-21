// ═══════════════════════════════════════════════════════════
//  GDER — Supabase Configuration & Data Layer
//  Replace localStorage with real Supabase backend
// ═══════════════════════════════════════════════════════════
//
//  SETUP (5 min):
//  1. Create a project at https://supabase.com
//  2. Paste your URL and anon key below
//  3. Run the SQL schema in supabase-schema.sql
//  4. Enable Storage bucket "covers" (public)
//  5. Deploy with: npm run build && vercel --prod
//
// ═══════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

// ── YOUR CREDENTIALS (from supabase.com → Project Settings → API) ──
const SUPABASE_URL  = "https://yfrtywzyjlkeldukzxxj.supabase.co";
const SUPABASE_ANON = "sb_publishable_NDlHt0p6LjORkBHMO1nh5g_zvxq7GVc";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ═══════════════════════════════════════════════════════════
//  AUTH
// ═══════════════════════════════════════════════════════════

export const Auth = {
  // Register a new user
  async register({ username, email, password, role }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, role, plan: "free", bio: "" },
      },
    });
    if (error) throw error;

    // Insert into public.profiles
    await supabase.from("profiles").insert({
      id:       data.user.id,
      username,
      email,
      role,
      plan:     "free",
      bio:      "",
    });

    return data.user;
  },

  // Sign in
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const profile = await DB.getProfile(data.user.id);
    return { ...data.user, ...profile };
  },

  // Sign out
  async logout() {
    await supabase.auth.signOut();
  },

  // Get current session on page load
  async getSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return null;
    const profile = await DB.getProfile(session.user.id);
    return { ...session.user, ...profile };
  },

  // Listen for auth changes (auto re-login)
  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        const profile = await DB.getProfile(session.user.id);
        callback({ ...session.user, ...profile });
      } else {
        callback(null);
      }
    });
  },
};

// ═══════════════════════════════════════════════════════════
//  DATABASE
// ═══════════════════════════════════════════════════════════

export const DB = {

  // ── PROFILES ──────────────────────────────────────────────
  async getProfile(userId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  },

  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAllProfiles() {
    const { data } = await supabase.from("profiles").select("*").order("created_at");
    return data || [];
  },

  // ── GAMES ─────────────────────────────────────────────────
  async getGames(filters = {}) {
    let q = supabase.from("games").select("*, profiles(username)");
    if (filters.approvalStatus) q = q.eq("approval_status", filters.approvalStatus);
    if (filters.genre)          q = q.eq("genre", filters.genre);
    if (filters.platform)       q = q.eq("platform", filters.platform);
    if (filters.price)          q = q.eq("price", filters.price);
    const { data } = await q.order("created_at", { ascending: false });
    return (data || []).map(g => ({ ...g, creatorName: g.profiles?.username }));
  },

  async getGame(id) {
    const { data } = await supabase.from("games").select("*, profiles(username)").eq("id", id).single();
    return data ? { ...data, creatorName: data.profiles?.username } : null;
  },

  async createGame(game, userId) {
    const { data, error } = await supabase
      .from("games")
      .insert({ ...game, creator_id: userId, approval_status: "pending" })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateGame(id, updates) {
    const { data, error } = await supabase
      .from("games")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGame(id) {
    const { error } = await supabase.from("games").delete().eq("id", id);
    if (error) throw error;
  },

  async incrementPlays(id) {
    await supabase.rpc("increment_plays", { game_id: id });
  },

  async rateGame(gameId, stars) {
    // Uses a DB function to safely update rolling average
    await supabase.rpc("rate_game", { game_id: gameId, stars });
  },

  // ── FAVORITES ─────────────────────────────────────────────
  async getFavorites(userId) {
    const { data } = await supabase.from("favorites").select("game_id").eq("user_id", userId);
    return (data || []).map(r => r.game_id);
  },

  async toggleFavorite(userId, gameId) {
    const { data: existing } = await supabase.from("favorites")
      .select("id").eq("user_id", userId).eq("game_id", gameId).single();
    if (existing) {
      await supabase.from("favorites").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("favorites").insert({ user_id: userId, game_id: gameId });
      return true;
    }
  },

  // ── PLAYED ────────────────────────────────────────────────
  async getPlayed(userId) {
    const { data } = await supabase.from("played").select("game_id").eq("user_id", userId);
    return (data || []).map(r => r.game_id);
  },

  async markPlayed(userId, gameId) {
    await supabase.from("played")
      .upsert({ user_id: userId, game_id: gameId, played_at: new Date().toISOString() },
               { onConflict: "user_id,game_id" });
  },

  // ── GROUPS ────────────────────────────────────────────────
  async getGroups() {
    const { data } = await supabase.from("groups").select("*, profiles(username)").order("created_at");
    return data || [];
  },

  async createGroup(group, userId) {
    const { data, error } = await supabase
      .from("groups")
      .insert({ ...group, creator_id: userId })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteGroup(id) {
    await supabase.from("groups").delete().eq("id", id);
  },

  async joinGroup(userId, groupId) {
    await supabase.from("group_members")
      .upsert({ user_id: userId, group_id: groupId }, { onConflict: "user_id,group_id" });
  },

  async leaveGroup(userId, groupId) {
    await supabase.from("group_members")
      .delete().eq("user_id", userId).eq("group_id", groupId);
  },

  async getJoinedGroups(userId) {
    const { data } = await supabase.from("group_members").select("group_id").eq("user_id", userId);
    return (data || []).map(r => r.group_id);
  },

  // ── CHAT ──────────────────────────────────────────────────
  async getMessages(groupId) {
    const { data } = await supabase
      .from("messages")
      .select("*, profiles(username)")
      .eq("group_id", groupId)
      .order("created_at", { ascending: true })
      .limit(100);
    return data || [];
  },

  async sendMessage(groupId, userId, text) {
    const { data, error } = await supabase
      .from("messages")
      .insert({ group_id: groupId, user_id: userId, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  // Subscribe to new messages in real-time
  subscribeToMessages(groupId, callback) {
    return supabase
      .channel(`group-${groupId}`)
      .on("postgres_changes", {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `group_id=eq.${groupId}`,
      }, payload => callback(payload.new))
      .subscribe();
  },

  unsubscribe(channel) {
    supabase.removeChannel(channel);
  },

  // ── COMMENTS ──────────────────────────────────────────────
  async getComments(gameId) {
    const { data } = await supabase
      .from("comments")
      .select("*, profiles(username)")
      .eq("game_id", gameId)
      .order("created_at", { ascending: false });
    return data || [];
  },

  async addComment(gameId, userId, text) {
    const { data, error } = await supabase
      .from("comments")
      .insert({ game_id: gameId, user_id: userId, text })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteComment(id) {
    await supabase.from("comments").delete().eq("id", id);
  },

  // ── REPORTS ───────────────────────────────────────────────
  async getReports() {
    const { data } = await supabase.from("reports").select("*").order("created_at", { ascending: false });
    return data || [];
  },

  async createReport(report) {
    const { data, error } = await supabase.from("reports").insert(report).select().single();
    if (error) throw error;
    return data;
  },

  async updateReportStatus(id, status) {
    await supabase.from("reports").update({ status }).eq("id", id);
  },

  // ── STORAGE (cover images) ────────────────────────────────
  async uploadCover(file, gameId) {
    const ext  = file.name.split(".").pop();
    const path = `covers/${gameId}.${ext}`;
    const { error } = await supabase.storage.from("covers").upload(path, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from("covers").getPublicUrl(path);
    return data.publicUrl;  // returns https://... URL
  },

  async deleteCover(gameId) {
    await supabase.storage.from("covers").remove([`covers/${gameId}.jpg`, `covers/${gameId}.png`, `covers/${gameId}.webp`]);
  },

  // ── LFG (Find Players) ────────────────────────────────────
  async getLookups() {
    const cutoff = new Date(Date.now() - 86400000).toISOString();
    const { data } = await supabase
      .from("lookups")
      .select("*, profiles(username)")
      .gt("created_at", cutoff)
      .order("created_at", { ascending: false });
    return data || [];
  },

  async upsertLookup(userId, lookup) {
    await supabase.from("lookups")
      .upsert({ ...lookup, user_id: userId }, { onConflict: "user_id" });
  },
};
