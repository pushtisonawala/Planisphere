export interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  timezone: string;
  theme_preference: 'dark' | 'light';
}
