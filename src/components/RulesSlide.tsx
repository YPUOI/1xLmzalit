import React, { useState } from 'react';
import { 
  Trophy, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  Target, 
  Award, 
  ShieldCheck, 
  Zap, 
  ChevronRight, 
  ChevronLeft,
  Flame,
  HelpCircle,
  Users
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface RulesSlideProps {
  onStartPredicting?: () => void;
}

export const RulesSlide: React.FC<RulesSlideProps> = ({ onStartPredicting }) => {
  const { t, isRtl, language } = useLanguage();
  const [currentSlide, setCurrentSlide] = useState(0);

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft;
  const NextIcon = isRtl ? ChevronLeft : ChevronRight;

  const slides = [
    {
      id: 'points',
      title: language === 'fr' ? 'Système de calcul des points' : language === 'en' ? 'Points Calculation System' : 'نظام احتساب وتوزيع النقاط',
      subtitle: language === 'fr' ? 'Comment marquer le maximum de points par match ?' : language === 'en' ? 'How to earn maximum points in each match?' : 'كيف تجمع أكبر قدر من النقاط في كل مباراة؟',
      icon: Trophy,
      badge: language === 'fr' ? 'Points Officiels' : language === 'en' ? 'Official Points' : 'النقاط الرسمية',
      color: 'from-amber-500/20 to-yellow-500/5',
      borderColor: 'border-yellow-500/30',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Exact Score */}
            <div className="bg-[#080C19]/80 border border-yellow-500/40 rounded-2xl p-4 relative overflow-hidden group hover:border-yellow-400 transition">
              <div className="absolute top-0 left-0 w-24 h-24 bg-yellow-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-yellow-400">
                  <Target className="w-4 h-4 text-yellow-400" />
                  {language === 'fr' ? 'Score Exact' : language === 'en' ? 'Exact Score' : 'النتيجة الدقيقة'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-yellow-400/20 border border-yellow-400/40 text-yellow-300 text-xs font-black">
                  +5 {language === 'fr' ? 'points' : language === 'en' ? 'pts' : 'نقاط'}
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">
                {language === 'fr'
                  ? 'Devinez le score final exact du match (ex: pronostic 2 - 1 et le match se termine 2 - 1).'
                  : language === 'en'
                  ? 'Predict the exact full-time score (e.g. predicted 2 - 1 and match finishes 2 - 1).'
                  : 'توقع النتيجة الصحيحة التامة للمباراة (مثال: توقع 2 - 1 وانتهت المباراة فعلياً 2 - 1).'}
              </p>
            </div>

            {/* MVP / Best Player */}
            <div className="bg-[#080C19]/80 border border-purple-500/40 rounded-2xl p-4 relative overflow-hidden group hover:border-purple-400 transition">
              <div className="absolute top-0 left-0 w-24 h-24 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-purple-300">
                  <Award className="w-4 h-4 text-purple-400" />
                  {language === 'fr' ? 'Homme du Match (MVP)' : language === 'en' ? 'Man of the Match (MVP)' : 'رجل المباراة (MVP)'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-purple-400/20 border border-purple-400/40 text-purple-200 text-xs font-black">
                  +3 {language === 'fr' ? 'points' : language === 'en' ? 'pts' : 'نقاط'}
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">
                {language === 'fr'
                  ? 'Pronostiquez avec succès l\'homme du match officiel désigné par l\'UEFA.'
                  : language === 'en'
                  ? 'Correctly guess the official Man of the Match awarded by UEFA.'
                  : 'توقع صحيح لنجم اللقاء المعتمد رسمياً من الاتحاد الأوروبي لكرة القدم UEFA.'}
              </p>
            </div>

            {/* Goal Scorer */}
            <div className="bg-[#080C19]/80 border border-emerald-500/40 rounded-2xl p-4 relative overflow-hidden group hover:border-emerald-400 transition">
              <div className="absolute top-0 left-0 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  {language === 'fr' ? 'Buteurs du Match' : language === 'en' ? 'Goal Scorers' : 'توقع مسجلي الأهداف'}
                </span>
                <span className="px-2.5 py-1 rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                  {language === 'fr' ? '+1 pt / but' : language === 'en' ? '+1 pt / goal' : '+1 نقطة / هدف'}
                </span>
              </div>
              <p className="text-xs text-[#E2E8F0] leading-relaxed">
                {language === 'fr'
                  ? 'Un point supplémentaire pour chaque joueur sélectionné qui marque un but pendant le match.'
                  : language === 'en'
                  ? 'One extra point for each selected player who scores a goal during the match.'
                  : 'نقطة واحدة لكل لاعب اخترته ونجح في تسجيل هدف حقيقي في المباراة (الوقت الأصلي والإضافي).'}
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-gradient-to-r from-yellow-500/10 via-amber-500/10 to-transparent rounded-2xl border border-yellow-500/20 flex items-center gap-3">
            <Sparkles className="w-5 h-5 text-yellow-400 shrink-0" />
            <p className="text-xs text-[#E2E8F0] font-medium leading-relaxed">
              {language === 'fr' ? (
                <><strong>Exemple parfait pour 10 points :</strong> Score 2-1 avec 2 buteurs exacts et le MVP réussi = <strong>5 (score) + 1 + 1 (buteurs) + 3 (MVP) = 10 points maximum !</strong></>
              ) : language === 'en' ? (
                <><strong>Perfect 10-Point Example:</strong> 2-1 exact score with 2 correct scorers and correct MVP = <strong>5 (score) + 1 + 1 (scorers) + 3 (MVP) = 10 maximum points!</strong></>
              ) : (
                <><strong>مثال كامل لحصد 10 نقاط:</strong> إذا توقعت فوز الريال 2-1 بهدفي مبابي وفينيسيوس مع فينيسيوس كرجل المباراة (MVP)، وتحققت جميعها: <strong>5 (نتيجة دقيقة) + 1 (مبابي) + 1 (فينيسيوس) + 3 (رجل المباراة) = 10 نقاط كاملة!</strong></>
              )}
            </p>
          </div>
        </div>
      )
    },
    {
      id: 'deadlines',
      title: language === 'fr' ? 'Horaires et Verrouillage' : language === 'en' ? 'Deadlines & Lockdown' : 'مواعيد وإغلاق باب التوقعات',
      subtitle: language === 'fr' ? 'Gestion précise du temps avant le coup d\'envoi' : language === 'en' ? 'Strict deadline timing before kickoff' : 'التوقيت الدقيق لإرسال وتعديل التوقعات',
      icon: Clock,
      badge: language === 'fr' ? 'Transparence & Intégrité' : language === 'en' ? 'Transparency & Integrity' : 'الشفافية والنزاهة',
      color: 'from-blue-500/20 to-cyan-500/5',
      borderColor: 'border-cyan-500/30',
      content: (
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="bg-[#080C19]/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-[#00E5FF] shrink-0 mt-0.5">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'fr' ? 'Fermeture automatique stricte (Deadline)' : language === 'en' ? 'Strict Automatic Lockdown (Deadline)' : 'الإغلاق التلقائي الصارم (Deadline)'}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {language === 'fr'
                    ? 'Le dépôt et la modification des pronostics se ferment automatiquement à la minute exacte du coup d\'envoi du match. Aucun retard n\'est toléré.'
                    : language === 'en'
                    ? 'Predictions submission and edits automatically lock down at the exact match kickoff time. No late entries accepted.'
                    : 'يُقفل باب تسجيل وتعديل التوقعات تلقائياً مع حلول الدقيقة المحددة لانطلاق صافرة بداية المباراة. لا يمكن قبول أي توقع بعد انتهاء المهلة.'}
                </p>
              </div>
            </div>

            <div className="bg-[#080C19]/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'fr' ? 'Modifications illimitées avant le coup d\'envoi' : language === 'en' ? 'Unlimited Edits Before Kickoff' : 'حرية التعديل قبل الموعد'}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {language === 'fr'
                    ? 'Chaque participant peut modifier ses pronostics en illimité tant que le statut du match est OPEN et avant la date limite.'
                    : language === 'en'
                    ? 'Every member can freely update their prediction as many times as desired while the match is OPEN.'
                    : 'يحق لكل متسابق تعديل توقعه عدة مرات بحرية تامة طالما أن المباراة ما زالت مفتوحة (حالة OPEN) وقبل حلول موعد الإغلاق.'}
                </p>
              </div>
            </div>

            <div className="bg-[#080C19]/80 border border-slate-800 rounded-2xl p-4 flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0 mt-0.5">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white mb-1">
                  {language === 'fr' ? 'Transparence totale et révélation publique' : language === 'en' ? 'Complete Transparency & Public Reveal' : 'الشفافية وكشف التوقعات'}
                </h4>
                <p className="text-xs text-[#94A3B8] leading-relaxed">
                  {language === 'fr'
                    ? 'Dès le coup d\'envoi, les pronostics de tous les participants deviennent visibles publiquement afin de garantir une intégrité parfaite.'
                    : language === 'en'
                    ? 'As soon as the match begins, all participants\' predictions are revealed to ensure 100% fair play.'
                    : 'بمجرد إغلاق المباراة وبدء اللقاء، تصبح توقعات جميع الأصدقاء ظاهرة للعيان لضمان العدالة وتفادي أي شبهة تعديل أثناء سير المباراة.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'tiebreak',
      title: language === 'fr' ? 'Critères de départage du classement' : language === 'en' ? 'Tie-Breaking Criteria' : 'معايير كسر التعادل في الترتيب',
      subtitle: language === 'fr' ? 'Comment départager les joueurs à égalité de points ?' : language === 'en' ? 'How is the winner decided when points are equal?' : 'كيف يُحسم الفائز بالمركز الأول عند تساوي النقاط؟',
      icon: Award,
      badge: language === 'fr' ? 'Règles du Classement' : language === 'en' ? 'Leaderboard Rules' : 'قواعد الترتيب',
      color: 'from-amber-500/20 to-rose-500/5',
      borderColor: 'border-amber-500/30',
      content: (
        <div className="space-y-3.5">
          <p className="text-xs text-[#94A3B8]">
            {language === 'fr'
              ? 'En cas d\'égalité de points totaux entre deux ou plusieurs membres, l\'ordre de priorité suivant s\'applique :'
              : language === 'en'
              ? 'If two or more participants are tied on points, the following tie-breaker criteria apply in order:'
              : 'في حال تساوى متسابقان أو أكثر في رصيد النقاط الإجمالي، يتم اللجوء للمعايير التالية بالتسلسل:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-[#080C19]/80 border border-amber-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black text-xs flex items-center justify-center mx-auto mb-2">
                1
              </span>
              <h5 className="text-xs font-black text-white mb-1">
                {language === 'fr' ? 'Scores Exacts' : language === 'en' ? 'Exact Scores' : 'النتائج الدقيقة'}
              </h5>
              <p className="text-[11px] text-[#94A3B8]">
                {language === 'fr' ? 'Plus grand nombre de scores exacts réussis (+5).' : language === 'en' ? 'Most exact scores (+5) achieved.' : 'الأفضلية لصاحب أكبر عدد من النتائج الدقيقة المكتملة (+5).'}
              </p>
            </div>

            <div className="bg-[#080C19]/80 border border-purple-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-300 font-black text-xs flex items-center justify-center mx-auto mb-2">
                2
              </span>
              <h5 className="text-xs font-black text-white mb-1">
                {language === 'fr' ? 'Homme du Match (MVP)' : language === 'en' ? 'Man of the Match (MVP)' : 'توقع رجل المباراة (MVP)'}
              </h5>
              <p className="text-[11px] text-[#94A3B8]">
                {language === 'fr' ? 'Plus grand nombre de MVP devinés (+3).' : language === 'en' ? 'Most correct MVP selections (+3).' : 'الأفضلية للمتسابق الأكثر نجاحاً في توقع نجوم المباريات (+3).'}
              </p>
            </div>

            <div className="bg-[#080C19]/80 border border-cyan-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-cyan-500/20 text-[#00E5FF] font-black text-xs flex items-center justify-center mx-auto mb-2">
                3
              </span>
              <h5 className="text-xs font-black text-white mb-1">
                {language === 'fr' ? 'Buteurs Réussis' : language === 'en' ? 'Correct Scorers' : 'توقع مسجلي الأهداف'}
              </h5>
              <p className="text-[11px] text-[#94A3B8]">
                {language === 'fr' ? 'Plus grand nombre de buteurs trouvés.' : language === 'en' ? 'Most correct goal scorers selected.' : 'الأفضلية للمتسابق الذي أصاب أكبر عدد من مسجلي الأهداف الصحيحة.'}
              </p>
            </div>

            <div className="bg-[#080C19]/80 border border-emerald-500/30 rounded-2xl p-4 text-center">
              <span className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center mx-auto mb-2">
                4
              </span>
              <h5 className="text-xs font-black text-white mb-1">
                {language === 'fr' ? 'Ancienneté' : language === 'en' ? 'Account Seniority' : 'أسبقية تاريخ إنشاء الحساب'}
              </h5>
              <p className="text-[11px] text-[#94A3B8]">
                {language === 'fr' ? 'Date de création de compte la plus ancienne.' : language === 'en' ? 'Earliest registered account date on 1xlmzalit.' : 'في حال استمرار التعادل، يتم اعتماد أسبقية تاريخ تسجيل الحساب على المنصة.'}
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'fairplay',
      title: language === 'fr' ? 'Charte d\'Honneur et Fair-Play' : language === 'en' ? 'Code of Honor & Fair Play' : 'ميثاق الشرف وروح المزاليط',
      subtitle: language === 'fr' ? 'Règles de respect entre amis et sécurité' : language === 'en' ? 'Friendly competition rules and platform safety' : 'قواعد المشاركة بين الأصدقاء وحماية المنصة',
      icon: ShieldCheck,
      badge: language === 'fr' ? 'Charte des Amis' : language === 'en' ? 'Friends Charter' : 'ميثاق الأصدقاء',
      color: 'from-emerald-500/20 to-teal-500/5',
      borderColor: 'border-emerald-500/30',
      content: (
        <div className="space-y-4">
          <div className="bg-[#080C19]/80 border border-emerald-500/30 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-emerald-400 font-black text-sm mb-2">
              <Users className="w-4 h-4" />
              <span>{language === 'fr' ? 'Cercle Privé d\'Amis uniquement' : language === 'en' ? 'Private Circle of Friends Only' : 'مجتمع الأصدقاء فقط (Private Circle)'}</span>
            </div>
            <p className="text-xs text-[#E2E8F0] leading-relaxed mb-3">
              {language === 'fr'
                ? 'Cette plateforme est réservée exclusivement au cercle d\'amis. Il est strictement interdit de partager le mot de passe sans autorisation de l\'administration de 1xlmzalit.'
                : language === 'en'
                ? 'This platform is exclusively for verified friends. Sharing the access password with unauthorized individuals is strictly prohibited by 1xlmzalit admins.'
                : 'المنصة مخصصة للأصدقاء المقربين فقط؛ يُمنع مشاركة كلمة مرور الدخول مع أي شخص غير معتمد من إدارة 1xlmzalit.'}
            </p>
            <ul className="text-xs text-[#94A3B8] space-y-2 list-disc list-inside">
              <li>{language === 'fr' ? 'Un seul compte par appareil pour garantir l\'égalité des chances.' : language === 'en' ? 'One account per device policy to guarantee fair competition.' : 'سياسة الحساب الواحد: حساب واحد فقط لكل جهاز لضمان تكافؤ الفرص.'}</li>
              <li>{language === 'fr' ? 'Respect mutuel et esprit sportif tout au long de UEFA CHAMPIONS LEAGUE 2026/2027.' : language === 'en' ? 'Mutual respect and sportsmanship throughout UEFA CHAMPIONS LEAGUE 2026/2027.' : 'الاحترام المتبادل والروح الرياضية العالية طيلة أطوار UEFA CHAMPIONS LEAGUE 2026/2027.'}</li>
              <li>{language === 'fr' ? 'Les résultats et statistiques officielles de l\'UEFA font foi.' : language === 'en' ? 'Official UEFA match reports are the final authority for all points.' : 'القرار النهائي في حسم النقاط يعتمد على تقارير المباريات الرسمية الصادرة من الاتحاد الأوروبي لكرة القدم UEFA.'}</li>
            </ul>
          </div>
        </div>
      )
    }
  ];

  const current = slides[currentSlide];
  const Icon = current.icon;

  const handleNext = () => {
    setCurrentSlide(prev => (prev + 1) % slides.length);
  };

  const handlePrev = () => {
    setCurrentSlide(prev => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Slide Navigation Tabs / Pills */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2 scrollbar-none select-none">
        {slides.map((slide, idx) => {
          const SlideIcon = slide.icon;
          const isActive = idx === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`py-2 px-3.5 sm:px-4 rounded-xl text-xs font-bold transition flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#00E5FF] text-slate-950 shadow-lg shadow-cyan-500/20 scale-[1.02]'
                  : 'bg-[#10172A] text-[#94A3B8] hover:text-white border border-slate-800'
              }`}
            >
              <SlideIcon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-[#00E5FF]'}`} />
              <span>{slide.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Main Active Slide Card */}
      <div className={`bg-[#10172A] border ${current.borderColor} rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-2xl transition-all duration-300`}>
        
        {/* Background glow orb */}
        <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${current.color} rounded-full blur-3xl pointer-events-none`} />

        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#080C19] border border-slate-800 text-[11px] font-black text-[#00E5FF] mb-2">
              <Icon className="w-3.5 h-3.5" />
              <span>
                {language === 'fr' 
                  ? `Diapositive ${currentSlide + 1} sur ${slides.length}` 
                  : language === 'en' 
                  ? `Slide ${currentSlide + 1} of ${slides.length}` 
                  : `الشريحة ${currentSlide + 1} من ${slides.length}`}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white">{current.title}</h2>
            <p className="text-xs text-[#94A3B8] mt-1">{current.subtitle}</p>
          </div>

          {/* Next / Previous arrows */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              aria-label={language === 'fr' ? 'Précédent' : language === 'en' ? 'Previous' : 'الشريحة السابقة'}
              className="w-10 h-10 rounded-xl bg-[#080C19] border border-slate-800 hover:border-slate-700 text-[#94A3B8] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <PrevIcon className="w-5 h-5" />
            </button>
            <button
              onClick={handleNext}
              aria-label={language === 'fr' ? 'Suivant' : language === 'en' ? 'Next' : 'الشريحة التالية'}
              className="w-10 h-10 rounded-xl bg-[#080C19] border border-slate-800 hover:border-slate-700 text-[#94A3B8] hover:text-white flex items-center justify-center transition cursor-pointer"
            >
              <NextIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="relative z-10">
          {current.content}
        </div>

        {/* Footer Slide Stepper & Action */}
        <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-8 bg-[#00E5FF]' : 'w-2 bg-slate-800 hover:bg-slate-700'
                }`}
                title={language === 'fr' ? `Aller à la diapositive ${idx + 1}` : language === 'en' ? `Go to slide ${idx + 1}` : `الانتقال للشريحة ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {currentSlide < slides.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition flex items-center gap-2 cursor-pointer"
              >
                <span>{language === 'fr' ? 'Diapositive suivante' : language === 'en' ? 'Next Slide' : 'الشريحة التالية'}</span>
                <NextIcon className="w-4 h-4" />
              </button>
            ) : null}

            {onStartPredicting && (
              <button
                onClick={onStartPredicting}
                className="px-5 py-2.5 rounded-xl bg-[#00E5FF] hover:bg-cyan-400 text-slate-950 font-black text-xs transition shadow-lg shadow-cyan-500/20 flex items-center gap-2 cursor-pointer"
              >
                <Trophy className="w-4 h-4" />
                <span>{language === 'fr' ? 'Commencer à pronostiquer' : language === 'en' ? 'Start Predicting Now' : 'ابدأ التوقع الآن'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
