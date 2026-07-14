import React from 'react';
import type { UserProfile } from '../../shared/types';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

interface Props {
  profile: UserProfile;
}

const COLORS = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

const CUSTOM_TOOLTIP_STYLE = {
  background: 'rgba(15,15,25,0.97)',
  border: '1px solid rgba(99,102,241,0.3)',
  borderRadius: 8,
  padding: '8px 12px',
  color: '#e2e8f0',
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
};

export default function AnalyticsPage({ profile }: Props) {
  const { analytics } = profile;

  // Last 7 days of sessions
  const last7Days = getLast7Days();
  const sessionData = last7Days.map(date => {
    const sessions = analytics.sessionHistory.filter(s => s.date === date);
    return {
      date: formatDateLabel(date),
      posts: sessions.reduce((s, r) => s + r.postsRanked, 0),
      highValue: sessions.reduce((s, r) => s + r.highValueSeen, 0),
      hidden: sessions.reduce((s, r) => s + r.lowValueHidden, 0),
    };
  });

  // Topics breakdown for pie chart
  const topicsData = Object.entries(analytics.topicsBreakdown)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 6)
    .map(([name, value]) => ({ name, value }));

  const totalSessions = analytics.sessionHistory.length;
  const avgHighValue = totalSessions > 0
    ? Math.round(analytics.goalAlignedPostsConsumed / totalSessions)
    : 0;

  return (
    <>
      {/* Summary Stats */}
      <div>
        <p className="ff-section-title">Overview</p>
        <div className="ff-stats-grid" style={{ marginTop: 8 }}>
          <div className="ff-stat-card">
            <div className="ff-stat-value">{analytics.totalPostsRanked.toLocaleString()}</div>
            <div className="ff-stat-label">Posts Ranked</div>
          </div>
          <div className="ff-stat-card">
            <div className="ff-stat-value">{analytics.goalAlignedPostsConsumed}</div>
            <div className="ff-stat-label">Goal-Aligned</div>
          </div>
          <div className="ff-stat-card">
            <div className="ff-stat-value">{analytics.lowValuePostsHidden}</div>
            <div className="ff-stat-label">Hidden</div>
          </div>
          <div className="ff-stat-card">
            <div className="ff-stat-value" style={{ fontSize: 18 }}>
              {totalSessions > 0
                ? `${Math.round((analytics.goalAlignedPostsConsumed / Math.max(analytics.totalPostsRanked, 1)) * 100)}%`
                : '—'}
            </div>
            <div className="ff-stat-label">Goal Ratio</div>
          </div>
        </div>
      </div>

      {/* 7-Day Activity Chart */}
      <div className="ff-chart-wrap">
        <p className="ff-chart-title">📈 Last 7 Days</p>
        {analytics.sessionHistory.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--ff-text-muted)', fontSize: 12, padding: '16px 0' }}>
            No data yet — browse your feeds to see activity
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={sessionData} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#475569' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={CUSTOM_TOOLTIP_STYLE}
                cursor={{ fill: 'rgba(99,102,241,0.1)' }}
              />
              <Bar dataKey="posts" fill="#6366f1" radius={[3, 3, 0, 0]} name="Total" />
              <Bar dataKey="highValue" fill="#10b981" radius={[3, 3, 0, 0]} name="High Value" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Topics Breakdown */}
      {topicsData.length > 0 && (
        <div className="ff-chart-wrap">
          <p className="ff-chart-title">🏷 Topics Consumed</p>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={topicsData}
                cx="50%"
                cy="50%"
                innerRadius={35}
                outerRadius={55}
                paddingAngle={3}
                dataKey="value"
              >
                {topicsData.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={CUSTOM_TOOLTIP_STYLE} />
              <Legend
                iconSize={8}
                wrapperStyle={{ fontSize: 10, color: '#94a3b8' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Goals Contribution */}
      {profile.goals.filter(g => g.isActive).length > 0 && (
        <div>
          <p className="ff-section-title">Goal Weights</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
            {profile.goals.filter(g => g.isActive).map(goal => (
              <div key={goal.id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--ff-text-secondary)', width: 100, flexShrink: 0 }}>
                  {goal.name}
                </span>
                <div style={{ flex: 1, background: 'var(--ff-bg-glass)', borderRadius: 4, height: 6 }}>
                  <div
                    style={{
                      width: `${goal.weight}%`,
                      height: '100%',
                      background: 'var(--ff-grad-brand)',
                      borderRadius: 4,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span style={{ fontSize: 11, color: 'var(--ff-text-muted)', width: 30, textAlign: 'right' }}>
                  {goal.weight}%
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {analytics.totalPostsRanked === 0 && (
        <div className="ff-empty">
          <div className="ff-empty-icon">📊</div>
          <p className="ff-empty-text">Your analytics will appear here after you browse your feeds.</p>
        </div>
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function getLast7Days(): string[] {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en', { weekday: 'short' }).slice(0, 3);
}
