-- Prevent duplicate Instagram Story publishing for the same Briefly story.

create unique index if not exists idx_generated_social_instagram_story_once
on generated_social_content (story_cluster_id)
where platform = 'instagram'
  and format = 'story'
  and status in ('queued', 'published');

create index if not exists idx_publishing_queue_platform_status
on publishing_queue (platform, status, created_at desc);
