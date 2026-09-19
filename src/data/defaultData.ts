import { Team, Match } from '../types';

export const DEFAULT_TEAMS: Record<string, Team> = {};

export const INITIAL_MATCHES: Match[] = [];

export const DEFAULT_SECURITY_CONFIG = {
  friendPassword: "1xlmzalit-official",
  requireBiometric: false,
  biometricEnrolled: false,
  biometricUserLabel: "الصديق المعتمد"
};
