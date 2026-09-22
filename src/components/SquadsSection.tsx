import React, { useState } from 'react';
import { Users, Search } from 'lucide-react';
import { Team } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

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
      <div className="ucl-card p-8 sm:p-12 rounded-3xl border border-slate-800 text-center space-y-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-700/60 mx-auto flex items-center justify-center text-slate-400 shadow-xl">
          <Users className="w-8 h-8 text-yellow-400" />
        </div>
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            {language === 'fr' ? 'Toutes les équipes ont été réinitialisées' : language === 'en' ? 'All teams have been cleared' : 'تم حذف وإفراغ جميع الفرق واللاعبين'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
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
    <div className="ucl-card p-6 rounded-3xl border border-slate-800 space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-yellow-400 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-blue-400" />
            <span>{language === 'fr' ? 'Effectifs UEFA Champions League' : language === 'en' ? 'UEFA Champions League Squads' : 'مستعرض تشكيلات دوري أبطال أوروبا'}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {language === 'fr' ? 'Liste complète des équipes et joueurs participants' : language === 'en' ? 'Complete list of participating teams and players' : 'يضم كافة الفرق المشاركة وقوائم نجومها'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-bold text-slate-300 shrink-0">
            {language === 'fr' ? 'Sélectionner l\'équipe :' : language === 'en' ? 'Select team:' : 'اختر الفريق:'}
          </label>
          <select
            value={selectedTeamKey}
            onChange={(e) => setSelectedTeamKey(e.target.value)}
            className="w-full md:w-72 bg-slate-900 border border-slate-700 rounded-xl p-3 text-white font-bold focus:border-yellow-400 outline-none transition cursor-pointer text-xs sm:text-sm"
          >
            {teamKeys.map(tKey => (
              <option key={tKey} value={tKey}>{tKey}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Selected Team Hero Card */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-slate-950 p-2 rounded-2xl border border-slate-800 flex items-center justify-center">
            <img 
              src={currentTeam.logo} 
              alt={currentTeam.name} 
              className="max-h-14 max-w-14 sm:max-h-16 sm:max-w-16 object-contain"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/1e293b/ffffff?text=Logo'; }}
            />
          </div>
          <div>
            <h3 className="text-lg sm:text-xl font-black text-white">{currentTeam.name}</h3>
            <span className="text-xs text-blue-400 font-bold">
              {currentTeam.squad?.length || 0} {language === 'fr' ? 'joueurs enregistrés' : language === 'en' ? 'players registered' : 'لاعباً في القائمة'}
            </span>
          </div>
        </div>

        {/* Quick Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder={language === 'fr' ? 'Rechercher un joueur...' : language === 'en' ? 'Search player...' : 'البحث عن لاعب في الفريق...'}
            className={`w-full bg-slate-950 border border-slate-700 rounded-xl py-2 text-xs text-white outline-none focus:border-yellow-400 ${
              isRtl ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? 'right-3' : 'left-3'}`} />
        </div>
      </div>

      {/* Squad Grid */}
      {filteredPlayers.length === 0 ? (
        <div className="p-8 text-center text-xs text-slate-500 bg-slate-900/30 rounded-2xl border border-slate-800">
          {language === 'fr' ? 'Aucun joueur ne correspond à la recherche.' : language === 'en' ? 'No player matches your search.' : 'لا يوجد لاعب مطابق لعملية البحث.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {filteredPlayers.map((player, idx) => (
            <div
              key={`${player}_${idx}`}
              className="bg-slate-900/80 hover:bg-slate-800/80 p-3.5 rounded-2xl border border-slate-800/90 flex items-center gap-3 transition hover:border-blue-500/40 group"
            >
              <div className="w-8 h-8 rounded-xl bg-blue-600/20 group-hover:bg-blue-600/30 text-blue-400 font-black text-xs flex items-center justify-center shrink-0 border border-blue-500/20">
                {idx + 1}
              </div>
              <span className="text-xs font-bold text-white truncate group-hover:text-yellow-300 transition">
                {player}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
