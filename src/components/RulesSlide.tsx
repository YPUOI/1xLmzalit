import React, { useState } from 'react';
import { 
  Trophy, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Target, 
  Award, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft,
  Flame,
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
      color: 'from-amber-500/15 to-transparent',
      borderColor: 'border-white/[0.08]',
      content: (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            
            {/* Exact Score */}
            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:border-[#4A5C6A]">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#CCD0CF]">
                  <Target className="w-4 h-4 text-[#CCD0CF]" />
                  {language === 'fr' ? 'Score Exact' : language === 'en' ? 'Exact Score' : 'النتيجة الدقيقة'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] text-xs font-mono font-bold">
                  +5 {language === 'fr' ? 'pts' : language === 'en' ? 'pts' : 'نقاط'}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                {language === 'fr'
                  ? 'Devinez le score final exact du match (ex: pronostic 2 - 1 et le match se termine 2 - 1).'
                  : language === 'en'
                  ? 'Predict the exact full-time score (e.g. predicted 2 - 1 and match finishes 2 - 1).'
                  : 'توقع النتيجة الصحيحة التامة للمباراة (مثال: توقع 2 - 1 وانتهت المباراة فعلياً 2 - 1).'}
              </p>
            </div>

            {/* MVP / Best Player */}
            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:border-[#4A5C6A]">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#CCD0CF]">
                  <Award className="w-4 h-4 text-[#CCD0CF]" />
                  {language === 'fr' ? 'Homme du Match (MVP)' : language === 'en' ? 'Man of the Match (MVP)' : 'رجل المباراة (MVP)'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] text-xs font-mono font-bold">
                  +3 {language === 'fr' ? 'pts' : language === 'en' ? 'pts' : 'نقاط'}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                {language === 'fr'
                  ? 'Pronostiquez avec succès l\'homme du match officiel désigné par l\'UEFA.'
                  : language === 'en'
                  ? 'Correctly guess the official Man of the Match awarded by UEFA.'
                  : 'توقع صحيح لنجم اللقاء المعتمد رسمياً من الاتحاد الأوروبي لكرة القدم UEFA.'}
              </p>
            </div>

            {/* Goal Scorer */}
            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 relative overflow-hidden transition-all duration-200 hover:border-[#4A5C6A]">
              <div className="flex items-center justify-between mb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-[#CCD0CF]">
                  <Flame className="w-4 h-4 text-[#CCD0CF]" />
                  {language === 'fr' ? 'Buteurs du Match' : language === 'en' ? 'Goal Scorers' : 'توقع مسجلي الأهداف'}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#253745] border border-[#4A5C6A] text-[#CCD0CF] text-xs font-mono font-bold">
                  {language === 'fr' ? '+1 pt / but' : language === 'en' ? '+1 pt / goal' : '+1 نقطة / هدف'}
                </span>
              </div>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                {language === 'fr'
                  ? 'Un point supplémentaire pour chaque joueur sélectionné qui marque un but pendant le match.'
                  : language === 'en'
                  ? 'One extra point for each selected player who scores a goal during the match.'
                  : 'نقطة واحدة لكل لاعب اخترته ونجح في تسجيل هدف حقيقي في المباراة (الوقت الأصلي والإضافي).'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-[#06141B] rounded-xl border border-[#253745] flex items-center gap-2.5">
            <FileText className="w-4 h-4 text-[#CCD0CF] shrink-0" />
            <p className="text-xs text-[#CCD0CF] leading-relaxed">
              {language === 'fr' ? (
                <><strong>Exemple parfait pour 10 points :</strong> Score 2-1 avec 2 buteurs exacts et le MVP réussi = <strong>5 + 1 + 1 + 3 = 10 points maximum !</strong></>
              ) : language === 'en' ? (
                <><strong>Perfect 10-Point Example :</strong> 2-1 exact score with 2 correct scorers and correct MVP = <strong>5 + 1 + 1 + 3 = 10 maximum points!</strong></>
              ) : (
                <><strong>مثال كامل لحصد 10 نقاط :</strong> إذا توقعت 2-1 مع هدفي اللاعبين المحددين ورجل المباراة (MVP): <strong>5 + 1 + 1 + 3 = 10 نقاط كاملة!</strong></>
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
      color: 'from-slate-800 to-transparent',
      borderColor: 'border-[#253745]',
      content: (
        <div className="space-y-3">
          <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0 mt-0.5">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'Fermeture automatique stricte (Deadline)' : language === 'en' ? 'Strict Automatic Lockdown (Deadline)' : 'الإغلاق التلقائي الصارم (Deadline)'}
              </h4>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                {language === 'fr'
                  ? 'Le dépôt et la modification des pronostics se ferment automatiquement à la minute exacte du coup d\'envoi du match. Aucun retard n\'est toléré.'
                  : language === 'en'
                  ? 'Predictions submission and edits automatically lock down at the exact match kickoff time. No late entries accepted.'
                  : 'يُقفل باب تسجيل وتعديل التوقعات تلقائياً مع حلول الدقيقة المحددة لانطلاق صافرة بداية المباراة. لا يمكن قبول أي توقع بعد انتهاء المهلة.'}
              </p>
            </div>
          </div>

          <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0 mt-0.5">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'Modifications illimitées avant le coup d\'envoi' : language === 'en' ? 'Unlimited Edits Before Kickoff' : 'حرية التعديل قبل الموعد'}
              </h4>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                {language === 'fr'
                  ? 'Chaque participant peut modifier ses pronostics en illimité tant que le statut du match est OPEN et avant la date limite.'
                  : language === 'en'
                  ? 'Every member can freely update their prediction as many times as desired while the match is OPEN.'
                  : 'يحق لكل متسابق تعديل توقعه عدة مرات بحرية تامة طالما أن المباراة ما زالت مفتوحة (حالة OPEN) وقبل حلول موعد الإغلاق.'}
              </p>
            </div>
          </div>

          <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 flex items-start gap-3.5">
            <div className="w-8 h-8 rounded-lg bg-[#253745] border border-[#4A5C6A] flex items-center justify-center text-[#CCD0CF] shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'Transparence totale et révélation publique' : language === 'en' ? 'Complete Transparency & Public Reveal' : 'الشفافية وكشف التوقعات'}
              </h4>
              <p className="text-xs text-[#9BA8AB] leading-relaxed">
                {language === 'fr'
                  ? 'Dès le coup d\'envoi, les pronostics de tous les participants deviennent visibles publiquement afin de garantir une intégrité parfaite.'
                  : language === 'en'
                  ? 'As soon as the match begins, all participants\' predictions are revealed to ensure 100% fair play.'
                  : 'بمجرد إغلاق المباراة وبدء اللقاء، تصبح توقعات جميع الأصدقاء ظاهرة للعيان لضمان العدالة وتفادي أي شبهة تعديل أثناء سير المباراة.'}
              </p>
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
      color: 'from-slate-800 to-transparent',
      borderColor: 'border-[#253745]',
      content: (
        <div className="space-y-3.5">
          <p className="text-xs text-[#9BA8AB]">
            {language === 'fr'
              ? 'En cas d\'égalité de points totaux entre deux ou plusieurs membres, l\'ordre de priorité suivant s\'applique :'
              : language === 'en'
              ? 'If two or more participants are tied on points, the following tie-breaker criteria apply in order:'
              : 'في حال تساوى متسابقان أو أكثر في رصيد النقاط الإجمالي، يتم اللجوء للمعايير التالية بالتسلسل:'}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-3.5 text-center">
              <span className="w-6 h-6 rounded-md bg-[#253745] text-[#CCD0CF] font-bold font-mono text-xs flex items-center justify-center mx-auto mb-2 border border-[#4A5C6A]">
                1
              </span>
              <h5 className="text-xs font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'Scores Exacts' : language === 'en' ? 'Exact Scores' : 'النتائج الدقيقة'}
              </h5>
              <p className="text-[11px] text-[#9BA8AB] leading-normal">
                {language === 'fr' ? 'Plus grand nombre de scores exacts réussis (+5).' : language === 'en' ? 'Most exact scores (+5) achieved.' : 'الأفضلية لصاحب أكبر عدد من النتائج الدقيقة (+5).'}
              </p>
            </div>

            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-3.5 text-center">
              <span className="w-6 h-6 rounded-md bg-[#253745] text-[#CCD0CF] font-bold font-mono text-xs flex items-center justify-center mx-auto mb-2 border border-[#4A5C6A]">
                2
              </span>
              <h5 className="text-xs font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'MVP' : language === 'en' ? 'MVP' : 'رجل المباراة (MVP)'}
              </h5>
              <p className="text-[11px] text-[#9BA8AB] leading-normal">
                {language === 'fr' ? 'Plus grand nombre de MVP devinés (+3).' : language === 'en' ? 'Most correct MVP selections (+3).' : 'الأفضلية للمتسابق الأكثر نجاحاً في توقع نجوم اللقاء (+3).'}
              </p>
            </div>

            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-3.5 text-center">
              <span className="w-6 h-6 rounded-md bg-[#253745] text-[#CCD0CF] font-bold font-mono text-xs flex items-center justify-center mx-auto mb-2 border border-[#4A5C6A]">
                3
              </span>
              <h5 className="text-xs font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'Buteurs' : language === 'en' ? 'Scorers' : 'مسجلو الأهداف'}
              </h5>
              <p className="text-[11px] text-[#9BA8AB] leading-normal">
                {language === 'fr' ? 'Plus grand nombre de buteurs trouvés.' : language === 'en' ? 'Most correct goal scorers selected.' : 'الأفضلية للمتسابق الذي أصاب أكبر عدد من الهدافين.'}
              </p>
            </div>

            <div className="bg-[#06141B] border border-[#253745] rounded-xl p-3.5 text-center">
              <span className="w-6 h-6 rounded-md bg-[#253745] text-[#CCD0CF] font-bold font-mono text-xs flex items-center justify-center mx-auto mb-2 border border-[#4A5C6A]">
                4
              </span>
              <h5 className="text-xs font-bold text-[#CCD0CF] mb-1">
                {language === 'fr' ? 'Ancienneté' : language === 'en' ? 'Seniority' : 'أسبقية الحساب'}
              </h5>
              <p className="text-[11px] text-[#9BA8AB] leading-normal">
                {language === 'fr' ? 'Date de création de compte la plus ancienne.' : language === 'en' ? 'Earliest registered account date on 1xlmzalit.' : 'أسبقية تاريخ تسجيل الحساب على المنصة.'}
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
      color: 'from-slate-800 to-transparent',
      borderColor: 'border-[#253745]',
      content: (
        <div className="space-y-4">
          <div className="bg-[#06141B] border border-[#253745] rounded-xl p-4 sm:p-5">
            <div className="flex items-center gap-2 text-[#CCD0CF] font-bold text-xs sm:text-sm mb-2">
              <Users className="w-4 h-4 text-[#CCD0CF]" />
              <span>{language === 'fr' ? 'Cercle Privé d\'Amis uniquement' : language === 'en' ? 'Private Circle of Friends Only' : 'مجتمع الأصدقاء فقط (Private Circle)'}</span>
            </div>
            <p className="text-xs text-[#CCD0CF] leading-relaxed mb-3">
              {language === 'fr'
                ? 'Cette plateforme est réservée exclusivement au cercle d\'amis. Il est strictement interdit de partager le mot de passe sans autorisation de l\'administration de 1xlmzalit.'
                : language === 'en'
                ? 'This platform is exclusively for verified friends. Sharing the access password with unauthorized individuals is strictly prohibited by 1xlmzalit admins.'
                : 'المنصة مخصصة للأصدقاء المقربين فقط؛ يُمنع مشاركة كلمة مرور الدخول مع أي شخص غير معتمد من إدارة 1xlmzalit.'}
            </p>
            <ul className="text-xs text-[#9BA8AB] space-y-2 list-disc list-inside">
              <li>{language === 'fr' ? 'Un seul compte par appareil pour garantir l\'égalité des chances.' : language === 'en' ? 'One account per device policy to guarantee fair competition.' : 'سياسة الحساب الواحد: حساب واحد فقط لكل جهاز لضمان تكافؤ الفرص.'}</li>
              <li>{language === 'fr' ? 'Respect mutuel et esprit sportif tout au long de UEFA CHAMPIONS LEAGUE 2026/2027.' : language === 'en' ? 'Mutual respect and sportsmanship throughout UEFA CHAMPIONS LEAGUE 2026/2027.' : 'الاحترام المتبادل والروح الرياضية العالية طيلة أطوار UEFA CHAMPIONS LEAGUE 2026/2027.'}</li>
              <li>{language === 'fr' ? 'Les résultats et statistiques officielles de l\'UEFA font foi.' : language === 'en' ? 'Official UEFA match reports are the final authority for all points.' : 'القرار النهائي في حسم النقاط يعتمد على تقارير المباريات الرسمية الصادرة من UEFA.'}</li>
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
    <div className="max-w-4xl mx-auto space-y-5" dir={isRtl ? 'rtl' : 'ltr'}>
      
      {/* Slide Navigation Segmented Controls */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none select-none">
        {slides.map((slide, idx) => {
          const SlideIcon = slide.icon;
          const isActive = idx === currentSlide;
          return (
            <button
              key={slide.id}
              onClick={() => setCurrentSlide(idx)}
              className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all duration-200 flex items-center gap-2 shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#4A5C6A] text-[#CCD0CF] border border-[#4A5C6A]'
                  : 'bg-[#11212D] text-[#9BA8AB] hover:text-[#CCD0CF] border border-[#253745]'
              }`}
            >
              <SlideIcon className={`w-3.5 h-3.5 ${isActive ? 'text-[#CCD0CF]' : 'text-[#9BA8AB]'}`} />
              <span>{slide.badge}</span>
            </button>
          );
        })}
      </div>

      {/* Main Active Slide Card */}
      <div className="bg-[#11212D] rounded-2xl p-5 sm:p-7 relative overflow-hidden shadow-xl border border-[#253745]">
        {/* Header Block */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5 relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#9BA8AB] mb-1">
              <Icon className="w-3.5 h-3.5 text-[#CCD0CF]" />
              <span>
                {language === 'fr' 
                  ? `Diapositive ${currentSlide + 1} / ${slides.length}` 
                  : language === 'en' 
                  ? `Slide ${currentSlide + 1} / ${slides.length}` 
                  : `الشريحة ${currentSlide + 1} / ${slides.length}`}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#CCD0CF]">{current.title}</h2>
            <p className="text-xs text-[#9BA8AB] mt-0.5">{current.subtitle}</p>
          </div>

          {/* Next / Previous arrows */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePrev}
              aria-label="Previous"
              className="w-9 h-9 rounded-xl bg-[#253745] border border-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
            >
              <PrevIcon className="w-4 h-4" />
            </button>
            <button
              onClick={handleNext}
              aria-label="Next"
              className="w-9 h-9 rounded-xl bg-[#253745] border border-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white flex items-center justify-center transition-all duration-200 cursor-pointer active:scale-95"
            >
              <NextIcon className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Slide Body */}
        <div className="relative z-10">
          {current.content}
        </div>

        {/* Footer Slide Stepper & Action */}
        <div className="mt-6 pt-4 border-t border-[#253745] flex flex-wrap items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-1.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  idx === currentSlide ? 'w-6 bg-[#CCD0CF]' : 'w-2 bg-[#253745] hover:bg-[#4A5C6A]'
                }`}
                title={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2.5">
            {currentSlide < slides.length - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 rounded-xl bg-[#253745] hover:bg-[#4A5C6A] text-[#CCD0CF] hover:text-white font-semibold text-xs border border-[#253745] transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <span>{language === 'fr' ? 'Suivant' : language === 'en' ? 'Next' : 'التالي'}</span>
                <NextIcon className="w-3.5 h-3.5" />
              </button>
            ) : null}

            {onStartPredicting && (
              <button
                onClick={onStartPredicting}
                className="bg-[#CCD0CF] hover:bg-white text-[#06141B] px-4 py-2 rounded-xl font-bold text-xs transition-all duration-200 flex items-center gap-1.5 cursor-pointer active:scale-[0.98]"
              >
                <Trophy className="w-3.5 h-3.5" />
                <span>{language === 'fr' ? 'Commencer' : language === 'en' ? 'Start Predicting' : 'ابدأ التوقع الآن'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
