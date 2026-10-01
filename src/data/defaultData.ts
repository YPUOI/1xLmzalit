import { Team, Match } from '../types';
import { UCL_36_TEAMS } from './uclTeams36';

export const DEFAULT_TEAMS: Record<string, Team> = UCL_36_TEAMS;

export const INITIAL_MATCHES: Match[] = [];

export const DEFAULT_SECURITY_CONFIG = {
  friendPassword: "1xlmzalit-official",
  requireBiometric: false,
  biometricEnrolled: false,
  biometricUserLabel: "الصديق المعتمد"
};
