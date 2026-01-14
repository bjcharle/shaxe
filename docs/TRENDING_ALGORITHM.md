# Shaxe Trending Algorithm

## Overview
Posts trend based on verified user engagement with time decay, filtered by unique engager count to prevent low-engagement spam bans.

## Scoring Formula

```
base_engagement = (likes + shares) - (dislikes + shames)
unique_engager_count = COUNT(DISTINCT user_id in engagement table)
engagement_ratio = dislikes + shames / total_engagement

hours_old = EXTRACT(EPOCH FROM (NOW() - post.created_at)) / 3600
time_decay = e^(-hours_old / 24) -- exponential decay over 24 hours

trending_score = base_engagement * time_decay * log(1 + unique_engager_count)
```

## Ban Threshold
- Only applies if: `engagement_ratio >= 0.7` AND `unique_engager_count >= 10`
- This prevents 1-2 haters from getting someone banned
- Ban triggers 24-hour posting restriction
- Subsequent bans within same 24-hour window extend: 24hr → 72hr → 1wk → 2wk → 1mo → 6mo → 1yr

## Auto-Shield (Daily)
- Post with highest trending_score in a 24-hour period receives auto 24-hour shield
- Shield prevents negative engagement from affecting post trending
- User gets 24hr of positive engagement boost

## Shielding by User
- Verified users can use shaxe_points to manually shield posts
- Shielded posts ignore negative engagement for trending calculations during shield period
- Cost: configurable points per shield (default: 10 points)

## Unverified User Impact
- Unverified users: "shaxe_view" engagement only (no trending impact)
- Does not count toward unique_engager_count
- Cannot trigger bans

## Age-Gated Content
- Users under 18 cannot like/dislike/share/shame posts marked `is_adult_content`
- Can still see post in feed if no adult filter applied

## Hall of Fame/Shame Calculation
- Recalculated hourly
- Separate rankings for day/week/month/year/all_time periods
- Uses highest trending_score snapshot for each post
- Top 10 each period displayed
