export interface Team {
  name: string;
  logo: string;
  squad: string[];
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
  homeScorers: string[];
  awayScorers: string[];
  mvp: string;
}

export interface Match {
  id: string;
  homeTeam: string;
  awayTeam: string;
  deadline: string;
  status: 'OPEN' | 'SETTLED';
  result?: MatchResult | null;
}

export interface Prediction {
  matchId: string;
  username: string;
  homeScore: number;
  awayScore: number;
  homeScorers: string[];
  awayScorers: string[];
  mvp: string;
  updatedAt?: string;
}

export interface AppUser {
  username: string;
  role: 'user' | 'admin';
  points: number;
  status: 'pending' | 'approved';
  password?: string;
}

export interface SecurityConfig {
  friendPassword: string; // The password friends use to enter
  requireBiometric: boolean; // Whether biometric is mandatory or optional
  biometricEnrolled: boolean;
  biometricCredentialId?: string;
  biometricUserLabel?: string;
}
