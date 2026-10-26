import { FactTrailSummary, FactTrail } from '../../server/services/types.ts';
import { safeFetchJson } from '../utils/api.ts';

export interface FollowedStoryRecord {
  trailId: string;
  slug: string;
  title: string;
  category: string;
  followedAt: string;
  lastViewedAt: string;
  latestKnownUpdate: string;
  hasUnreadUpdate?: boolean;
}

const STORAGE_KEY = 'factinfolive_followed_trails';

export const factTrailStorage = {
  // Get all followed stories from browser localStorage
  getFollowedStories(): FollowedStoryRecord[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  // Check if a specific trail is currently followed
  isFollowed(trailId: string): boolean {
    const list = this.getFollowedStories();
    return list.some((item) => item.trailId === trailId);
  },

  // Follow / Bookmark a story
  followStory(trail: FactTrailSummary | FactTrail): void {
    const list = this.getFollowedStories();
    if (list.some((item) => item.trailId === trail.id)) {
      return;
    }

    const now = new Date().toISOString();
    const newRecord: FollowedStoryRecord = {
      trailId: trail.id,
      slug: trail.slug,
      title: trail.title,
      category: trail.category,
      followedAt: now,
      lastViewedAt: now,
      latestKnownUpdate: trail.latestUpdateAt,
      hasUnreadUpdate: false,
    };

    list.unshift(newRecord);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      window.dispatchEvent(new Event('facttrail-followed-changed'));
    } catch {
      // Storage full or private mode quota reached
    }
  },

  // Unfollow / remove bookmark
  unfollowStory(trailId: string): void {
    const list = this.getFollowedStories();
    const filtered = list.filter((item) => item.trailId !== trailId);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      window.dispatchEvent(new Event('facttrail-followed-changed'));
    } catch {
      // Quota
    }
  },

  // Mark a story as read/viewed up to the latest known timestamp
  markViewed(trailId: string, latestUpdateAt: string): void {
    const list = this.getFollowedStories();
    const updated = list.map((item) => {
      if (item.trailId === trailId) {
        return {
          ...item,
          lastViewedAt: new Date().toISOString(),
          latestKnownUpdate: latestUpdateAt,
          hasUnreadUpdate: false,
        };
      }
      return item;
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new Event('facttrail-followed-changed'));
    } catch {
      // Quota
    }
  },

  // Sync with backend /api/facttrail/check-updates to mark unread updates
  async checkBackgroundUpdates(): Promise<number> {
    const list = this.getFollowedStories();
    if (list.length === 0) return 0;

    try {
      const payload = list.map((item) => ({
        trailId: item.trailId,
        lastSeenTimestamp: item.lastViewedAt || item.followedAt,
      }));

      const res = await safeFetchJson<{ updates: { trailId: string; hasNewUpdates: boolean }[] }>(
        '/api/facttrail/check-updates',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ followed: payload }),
        }
      );

      if (!res.ok || !res.data) return 0;
      const data = res.data;
      const updatesMap = new Map<string, boolean>(
        (data.updates || []).map((u: any) => [u.trailId, u.hasNewUpdates])
      );

      let unreadCount = 0;
      const updatedList = list.map((item) => {
        const hasNew = updatesMap.get(item.trailId) || false;
        if (hasNew) unreadCount++;
        return {
          ...item,
          hasUnreadUpdate: hasNew,
        };
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
      window.dispatchEvent(new Event('facttrail-followed-changed'));
      return unreadCount;
    } catch {
      return 0;
    }
  },

  // Count unread updates across all followed stories
  getUnreadCount(): number {
    const list = this.getFollowedStories();
    return list.filter((item) => item.hasUnreadUpdate).length;
  },
};
