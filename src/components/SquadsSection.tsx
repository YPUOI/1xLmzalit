import React, { useState } from 'react';
import { Users, Search, Globe } from 'lucide-react';
import { Team } from '../types';
import { useLanguage } from '../i18n/LanguageContext';
import { getTeamEnglishName } from '../data/clubPresets';
import { getUclTeamPreset } from '../data/uclTeams36';

interface SquadsSectionProps {
  teams: Record<string, Team>;
}

export const SquadsSection: React.FC<SquadsSectionProps> = ({ teams }) => {
  const { t, isRtl, language } = useLanguage();
  const teamKeys = Object.keys(teams).sort();
  const [selectedTeamKey, setSelectedTeamKey] = useState<string>(teamKeys[0] || '');
  const [searchFilter, setSearchFilter] = useState('');

  // Synchronize selected team if current one was removed
  React.useEffect(() => {
    if (!teamKeys.includes(selectedTeamKey)) {
      setSelectedTeamKey(teamKeys[0] || '');
    }
  }, [teams, teamKeys, selectedTeamKey]);

  if (teamKeys.length === 0) {
    return (
      <div className="bg-[#11212D] p-8 sm:p-12 rounded-2xl border border-[#253745] text-center space-y-3" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-12 h-12 rounded-xl bg-[#06141B] border border-[#253745] mx-auto flex items-center justify-center text-[#CCD0CF]">
          <Users className="w-6 h-6 text-[#CCD0CF]" />
        </div>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-[#CCD0CF] mb-1">
            {language === 'fr' ? 'Toutes les équipes ont été réinitialisées' : language === 'en' ? 'All teams have been cleared' : 'تم حذف وإفراغ جميع الفرق واللاعبين'}
          </h2>
          <p className="text-xs text-[#9BA8AB] max-w-md mx-auto leading-relaxed">
            {language === 'fr'
              ? 'Aucune équipe ou liste de joueurs n\'est enregistrée actuellement. Vous pouvez ajouter des équipes depuis le Panneau Admin.'
              : language === 'en'
              ? 'No teams or squad lists currently recorded. You can add new teams from the Admin Control Panel.'
              : 'لا توجد أي فرق أو قوائم لاعبين مسجلة في التطبيق حالياً. يمكنك التوجه إلى لوحة التحكم لتسجيل فرق جديدة.'}
          </p>
        </div>
      </div>
    );
  }

  const currentTeam = teams[selectedTeamKey] || {
    name: selectedTeamKey,
    logo: 'https://placehold.co/100x100?text=Logo',
    squad: []
  };

  const filteredPlayers = (currentTeam.squad || []).filter(player =>
    player.toLowerCase().includes(searchFilter.toLowerCase().trim())
  );

  return (
    <div className="bg-[#11212D] p-5 sm:p-6 rounded-2xl border border-[#253745] space-y-5 shadow-xl" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-[#253745]">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF] flex items-center gap-2">
            <Users className="w-5 h-5 text-[#CCD0CF]" />
            <span>{language === 'fr' ? 'Effectifs UEFA Champions League' : language === 'en' ? 'UEFA Champions League Squads' : 'مستعرض تشكيلات دوري أبطال أوروبا'}</span>
          </h2>
          <p className="text-xs text-[#9BA8AB] mt-0.5">
            {language === 'fr' ? 'Liste complète des équipes et joueurs participants' : language === 'en' ? 'Complete list of participating teams and players' : 'يضم كافة الفرق المشاركة وقوائم نجومها'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <label className="text-xs font-semibold text-[#9BA8AB] shrink-0">
            {language === 'fr' ? 'Sélectionner l\'équipe :' : language === 'en' ? 'Select team:' : 'اختر الفريق:'}
          </label>
          <select
            value={selectedTeamKey}
            onChange={(e) => setSelectedTeamKey(e.target.value)}
            className="w-full md:w-72 bg-[#06141B] border border-[#253745] rounded-xl p-2.5 text-[#CCD0CF] font-semibold focus:border-[#4A5C6A] outline-none transition-all duration-200 cursor-pointer text-xs sm:text-sm"
          >
            {teamKeys.map(tKey => {
              const uclMatch = getUclTeamPreset(tKey);
              const enName = uclMatch?.enName || getTeamEnglishName(tKey);
              const label = language === 'en' 
                ? (enName || tKey) 
                : (enName && enName !== tKey ? `${tKey} • ${enName}` : tKey);
              return (
                <option key={tKey} value={tKey}>
                  {uclMatch?.country ? `[${uclMatch.country}] ` : ''}{label}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Selected Team Hero Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#06141B] p-4 rounded-xl border border-[#253745]">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-[#11212D] p-2 rounded-xl border border-[#253745] flex items-center justify-center">
            <img 
              src={currentTeam.logo} 
              alt={currentTeam.name} 
              className="max-h-12 max-w-12 sm:max-h-14 sm:max-w-14 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/ffffff?text=Logo'; }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-bold text-[#CCD0CF]">
                {language === 'en' ? (getUclTeamPreset(currentTeam.name)?.enName || getTeamEnglishName(currentTeam.name) || currentTeam.name) : currentTeam.name}
              </h3>
              {getUclTeamPreset(currentTeam.name)?.country && (
                <span className="text-[10px] bg-[#253745] text-sky-300 border border-sky-500/30 px-2 py-0.5 rounded font-mono font-bold">
                  {getUclTeamPreset(currentTeam.name)?.country}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-[#9BA8AB] font-medium mt-0.5">
              <span>
                {language === 'en' ? currentTeam.name : (getUclTeamPreset(currentTeam.name)?.enName || getTeamEnglishName(currentTeam.name))}
              </span>
              <span>•</span>
              <span className="text-[#CCD0CF] font-bold">
                {currentTeam.squad?.length || 0} {language === 'fr' ? 'joueurs enregistrés' : language === 'en' ? 'players registered' : 'لاعباً في القائمة الرسمية'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-60">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher un joueur...' : language === 'en' ? 'Search player...' : 'البحث عن لاعب في الفريق...'}
            className={`w-full bg-[#11212D] border border-[#253745] rounded-xl py-2 text-xs text-[#CCD0CF] placeholder-[#9BA8AB] outline-none focus:border-[#4A5C6A] ${
              isRtl ? 'pr-8 pl-3' : 'pl-8 pr-3'
            }`}
          />
          <Search className={`w-3.5 h-3.5 text-[#9BA8AB] absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-2.5' : 'left-2.5'}`} />
        </div>
      </div>

      {/* Squad Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="p-8 text-center text-xs text-[#9BA8AB] bg-[#06141B] rounded-xl border border-[#253745]">
          {language === 'fr' ? 'Aucun joueur ne correspond à la recherche.' : language === 'en' ? 'No player matches your search.' : 'لا يوجد لاعب مطابق لعملية البحث.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {filteredPlayers.map((player, idx) => (
            <div
              key={`${player}_${idx}`}
              className="bg-[#06141B] hover:bg-[#253745]/40 p-3 rounded-xl border border-[#253745] flex items-center gap-2.5 transition-all duration-200 hover:border-[#4A5C6A] group"
            >
              <div className="w-6 h-6 rounded-md bg-[#253745] text-[#CCD0CF] font-mono font-bold text-xs flex items-center justify-center shrink-0 border border-[#4A5C6A]">
                {idx + 1}
              </div>
              <span className="text-xs font-semibold text-[#CCD0CF] truncate group-hover:text-white transition">
                {player}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
