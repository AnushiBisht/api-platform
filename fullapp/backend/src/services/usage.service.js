const supabase = require('../config/db');

const logUsage = async ({ userId, apiKeyId = null, endpoint, status, latencyMs }) => {
  await supabase.from('usage_logs').insert({
    user_id: userId,
    api_key_id: apiKeyId,
    endpoint,
    status,
    latency_ms: latencyMs,
  });
};

// Returns daily usage counts for the last 30 days
const getUsageStats = async (userId) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data, error } = await supabase
    .from('usage_logs')
    .select('created_at, status')
    .eq('user_id', userId)
    .gte('created_at', thirtyDaysAgo.toISOString())
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Group by day
  const grouped = {};
  data.forEach((log) => {
    const day = log.created_at.slice(0, 10);
    if (!grouped[day]) grouped[day] = { date: day, total: 0, success: 0, errors: 0 };
    grouped[day].total++;
    if (log.status < 400) grouped[day].success++;
    else grouped[day].errors++;
  });

  return Object.values(grouped);
};

const getTodayCount = async (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  const { count } = await supabase
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', `${today}T00:00:00.000Z`);
  return count || 0;
};

module.exports = { logUsage, getUsageStats, getTodayCount };
