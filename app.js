// ═══════════════════════════════════════════════
//  SUPABASE CONFIG — replace with your project keys
// ═══════════════════════════════════════════════
const SUPABASE_URL = 'https://qqjyljbykxtrbzwedgda.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_7SmvIGf22KtBWqHF4Lq7eA_krx0hRPt';

// Initialize Supabase client
const { createClient } = window.supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ═══════════════════════════════════════════════
//  AUTH HELPERS
// ═══════════════════════════════════════════════
const Auth = {
  async signUp(email, password, name) {
    const { data, error } = await db.auth.signUp({
      email,
      password,
      options: { data: { full_name: name } }
    });
    if (error) throw error;
    return data;
  },

  async signIn(email, password) {
    const { data, error } = await db.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await db.auth.signOut();
    if (error) throw error;
  },

  async getUser() {
    const { data: { user } } = await db.auth.getUser();
    return user;
  },

  async requireAuth() {
    const user = await Auth.getUser();
    if (!user) {
      window.location.href = '../index.html';
      return null;
    }
    return user;
  }
};

// ═══════════════════════════════════════════════
//  HISTORY HELPERS
// ═══════════════════════════════════════════════
const History = {
  async save(userId, sentence) {
    const { error } = await db.from('detection_history').insert({
      user_id: userId,
      sentence,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  },

  async getAll(userId) {
    const { data, error } = await db
      .from('detection_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async delete(id) {
    const { error } = await db
      .from('detection_history')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async clearAll(userId) {
    const { error } = await db
      .from('detection_history')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  }
};

// ═══════════════════════════════════════════════
//  SETTINGS HELPERS (localStorage)
// ═══════════════════════════════════════════════
const Settings = {
  defaults: {
    voiceOutput: true,
    voiceRate: 1.0,
    voicePitch: 1.0,
    darkMode: true,
    language: 'en-US',
    confidence: 0.70
  },

  get() {
    try {
      const saved = localStorage.getItem('sld_settings');
      return saved ? { ...this.defaults, ...JSON.parse(saved) } : { ...this.defaults };
    } catch {
      return { ...this.defaults };
    }
  },

  save(settings) {
    localStorage.setItem('sld_settings', JSON.stringify(settings));
  },

  update(key, value) {
    const s = this.get();
    s[key] = value;
    this.save(s);
  }
};

// ═══════════════════════════════════════════════
//  TOAST UTILITY
// ═══════════════════════════════════════════════
function showToast(msg, duration = 2500) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), duration);
}

// ═══════════════════════════════════════════════
//  SPEECH UTILITY
// ═══════════════════════════════════════════════
function speak(text) {
  const s = Settings.get();
  if (!s.voiceOutput || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/_/g, ' '));
  u.lang = s.language || 'en-US';
  u.rate = parseFloat(s.voiceRate) || 1.0;
  u.pitch = parseFloat(s.voicePitch) || 1.0;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find(v => v.lang.startsWith(u.lang.split('-')[0]) && v.localService);
  if (preferred) u.voice = preferred;
  window.speechSynthesis.speak(u);
}
