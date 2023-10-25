export interface IMusicService {
  searchTrack(artist: string, title: string): Promise<string | null>;
  getTrackInfo(url: string): Promise<{ artist: string; title: string } | null>;
}
